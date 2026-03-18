<?php

// src/EventSubscriber/EstablishmentDataSubscriber.php

namespace App\EventSubscriber;

use App\Entity\Product;
use App\Entity\Pack;
use App\Entity\Category;
use App\Entity\Menu;
use App\Entity\User;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use ApiPlatform\Core\EventListener\EventPriorities;
use Symfony\Component\Security\Core\Security;

class EstablishmentDataSubscriber implements EventSubscriberInterface
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::VIEW => ['setEstablishment', EventPriorities::PRE_WRITE],
        ];
    }

    public function setEstablishment(ViewEvent $event): void
    {
        $object = $event->getControllerResult();
        $method = $event->getRequest()->getMethod();

        // Uniquement sur POST (création)
        if ($method !== 'POST') {
            return;
        }

        // Uniquement pour les entités concernées
        $supported = [Product::class, Pack::class, Category::class, Menu::class];
        $isSupported = false;
        foreach ($supported as $class) {
            if ($object instanceof $class) {
                $isSupported = true;
                break;
            }
        }
        if (!$isSupported) {
            return;
        }

        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return;
        }

        // SUPER_ADMIN n'a pas d'enseigne propre
        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return;
        }

        // Récupérer l'enseigne directement depuis l'user
        $establishment = $user->getEstablishment();

        if (!$establishment) {
            return;
        }

        // Injecter l'enseigne
        if (method_exists($object, 'setEstablishment')) {
            $object->setEstablishment($establishment);
        }
    }
}