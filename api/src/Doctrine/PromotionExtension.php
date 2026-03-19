<?php

// src/Doctrine/PromotionExtension.php

namespace App\Doctrine;

use App\Entity\Promotion;
use App\Entity\PromotionConflict;
use App\Entity\User;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\Security\Core\Security;

class PromotionExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public function applyToCollection(QueryBuilder $qb, $qng, string $resourceClass, string $operationName = null): void
    {
        $this->addWhere($qb, $resourceClass);
    }

    public function applyToItem(QueryBuilder $qb, $qng, string $resourceClass, array $identifiers, string $operationName = null, array $context = []): void
    {
        $this->addWhere($qb, $resourceClass);
    }

    private function addWhere(QueryBuilder $qb, string $resourceClass): void
    {
        if (!in_array($resourceClass, [Promotion::class, PromotionConflict::class])) {
            return;
        }

        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return;
        }

        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) return;

        $establishment = $user->getEstablishment();
        if (!$establishment) {
            $qb->andWhere(sprintf('%s.id IS NULL', $qb->getRootAliases()[0]));
            return;
        }

        $qb->andWhere(sprintf('%s.establishment = :promo_establishment', $qb->getRootAliases()[0]))
            ->setParameter('promo_establishment', $establishment);
    }
}