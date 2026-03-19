<?php

// src/Service/PromotionService.php

namespace App\Service;

use App\Entity\Promotion;
use App\Entity\PromotionConflict;
use App\Entity\Establishment;
use Doctrine\ORM\EntityManagerInterface;

class PromotionService
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    /**
     * Récupère les promos actives pour un scope/targetId donné
     * Cherche dans le JSON targetIds si le targetId est présent
     */
    public function getActivePromotions(string $scope, int $targetId, Establishment $establishment): array
    {
        $now = new \DateTime();

        // Récupérer toutes les promos actives du bon scope
        $promos = $this->em->createQueryBuilder()
            ->select('p')
            ->from(Promotion::class, 'p')
            ->where('p.scope = :scope')
            ->andWhere('p.establishment = :establishment')
            ->andWhere('p.isActive = true')
            ->andWhere('p.startDate <= :now')
            ->andWhere('p.endDate >= :now')
            ->setParameter('scope', $scope)
            ->setParameter('establishment', $establishment)
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult();

        // Filtrer côté PHP celles qui contiennent le targetId
        return array_values(array_filter($promos, function (Promotion $p) use ($targetId) {
            return $p->appliesToTarget($targetId);
        }));
    }

    /**
     * Calcule le prix final
     */
    public function applyPromotions(float $originalPrice, array $promotions, ?string $conflictResolution = null): array
    {
        if (empty($promotions)) {
            return [
                'originalPrice' => $originalPrice,
                'finalPrice'    => $originalPrice,
                'discount'      => 0,
                'promotions'    => [],
                'hasConflict'   => false,
                'resolution'    => null,
            ];
        }

        if (count($promotions) === 1) {
            $promo      = $promotions[0];
            $finalPrice = $promo->applyTo($originalPrice);
            return [
                'originalPrice' => $originalPrice,
                'finalPrice'    => $finalPrice,
                'discount'      => round($originalPrice - $finalPrice, 2),
                'promotions'    => [$this->serializePromo($promo)],
                'hasConflict'   => false,
                'resolution'    => null,
            ];
        }

        $resolution = $conflictResolution ?? 'BEST';

        if ($resolution === 'CUMUL') {
            $price = $originalPrice;
            foreach ($promotions as $promo) {
                $price = $promo->applyTo($price);
            }
            $finalPrice = $price;
        } else {
            $bestPrice = $originalPrice;
            foreach ($promotions as $promo) {
                $reduced = $promo->applyTo($originalPrice);
                if ($reduced < $bestPrice) {
                    $bestPrice = $reduced;
                }
            }
            $finalPrice = $bestPrice;
        }

        return [
            'originalPrice' => $originalPrice,
            'finalPrice'    => round($finalPrice, 2),
            'discount'      => round($originalPrice - $finalPrice, 2),
            'promotions'    => array_map([$this, 'serializePromo'], $promotions),
            'hasConflict'   => true,
            'resolution'    => $resolution,
        ];
    }

    public function checkAndCreateConflict(
        string $targetType,
        int $targetId,
        string $targetName,
        array $promotions,
        Establishment $establishment
    ): ?PromotionConflict {
        if (count($promotions) < 2) return null;

        $existing = $this->em->getRepository(PromotionConflict::class)->findOneBy([
            'targetType'    => $targetType,
            'targetId'      => $targetId,
            'establishment' => $establishment,
            'isResolved'    => false,
        ]);

        if ($existing) return $existing;

        $conflict = new PromotionConflict();
        $conflict->setEstablishment($establishment);
        $conflict->setTargetType($targetType);
        $conflict->setTargetId($targetId);
        $conflict->setTargetName($targetName);
        $conflict->setPromotionIds(array_map(fn($p) => $p->getId(), $promotions));

        $this->em->persist($conflict);
        $this->em->flush();

        return $conflict;
    }

    public function resolveConflict(PromotionConflict $conflict, string $resolution, $user): void
    {
        $conflict->setResolution($resolution);
        $conflict->setIsResolved(true);
        $conflict->setResolvedAt(new \DateTime());
        $conflict->setResolvedBy($user);
        $this->em->flush();
    }

    public function autoResolveExpiredConflicts(): int
    {
        $conflicts = $this->em->getRepository(PromotionConflict::class)->findBy(['isResolved' => false]);
        $count = 0;
        foreach ($conflicts as $conflict) {
            if ($conflict->isAutoResolveExpired()) {
                $conflict->setResolution(PromotionConflict::RESOLUTION_BEST);
                $conflict->setIsResolved(true);
                $conflict->setResolvedAt(new \DateTime());
                $count++;
            }
        }
        if ($count > 0) $this->em->flush();
        return $count;
    }

    private function serializePromo(Promotion $p): array
    {
        return [
            'id'        => $p->getId(),
            'name'      => $p->getName(),
            'type'      => $p->getType(),
            'value'     => $p->getValue(),
            'targetIds' => $p->getTargetIds(),
        ];
    }
}