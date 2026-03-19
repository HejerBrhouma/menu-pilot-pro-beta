<?php

// src/EventSubscriber/PromotionSubscriber.php

namespace App\EventSubscriber;

use App\Entity\Promotion;
use App\Entity\User;
use App\Service\PromotionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use ApiPlatform\Core\EventListener\EventPriorities;
use Symfony\Component\Security\Core\Security;

class PromotionSubscriber implements EventSubscriberInterface
{
    private Security $security;
    private EntityManagerInterface $em;
    private PromotionService $promotionService;

    public function __construct(
        Security $security,
        EntityManagerInterface $em,
        PromotionService $promotionService
    ) {
        $this->security         = $security;
        $this->em               = $em;
        $this->promotionService = $promotionService;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::VIEW => ['onPromotion', EventPriorities::PRE_WRITE],
        ];
    }

    public function onPromotion(ViewEvent $event): void
    {
        $object = $event->getControllerResult();
        $method = $event->getRequest()->getMethod();

        if (!$object instanceof Promotion) {
            return;
        }

        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) return;

        // Injecter l'enseigne à la création
        if ($method === 'POST') {
            $establishment = $user->getEstablishment();
            if ($establishment) {
                $object->setEstablishment($establishment);
            }
        }

        // Détecter les conflits sur chaque cible
        if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
            $this->em->flush();

            foreach ($object->getTargetIds() as $targetId) {
                $promos = $this->promotionService->getActivePromotions(
                    $object->getScope(),
                    (int)$targetId,
                    $object->getEstablishment()
                );

                if (count($promos) >= 2) {
                    $targetName = $this->getTargetName($object->getScope(), (int)$targetId);
                    $this->promotionService->checkAndCreateConflict(
                        $object->getScope(),
                        (int)$targetId,
                        $targetName,
                        $promos,
                        $object->getEstablishment()
                    );
                }
            }
        }
    }

    private function getTargetName(string $scope, int $targetId): string
    {
        $entityMap = [
            'PRODUCT'  => \App\Entity\Product::class,
            'CATEGORY' => \App\Entity\Category::class,
            'PACK'     => \App\Entity\Pack::class,
            'MENU'     => \App\Entity\Menu::class,
        ];

        $class = $entityMap[$scope] ?? null;
        if (!$class) return "Cible #$targetId";

        $entity = $this->em->getRepository($class)->find($targetId);
        return $entity ? $entity->getName() : "Cible #$targetId";
    }
}