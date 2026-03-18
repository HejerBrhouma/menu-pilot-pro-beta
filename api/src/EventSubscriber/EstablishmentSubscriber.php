<?php

// src/EventSubscriber/EstablishmentSubscriber.php

namespace App\EventSubscriber;

use App\Entity\Establishment;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Security;
use ApiPlatform\Core\EventListener\EventPriorities;

class EstablishmentSubscriber implements EventSubscriberInterface
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::VIEW => ['setOwner', EventPriorities::PRE_VALIDATE],
        ];
    }

    public function setOwner(ViewEvent $event): void
    {
        $establishment = $event->getControllerResult();
        $method = $event->getRequest()->getMethod();

        if (!$establishment instanceof Establishment || $method !== 'POST') {
            return;
        }

        $user = $this->security->getUser();
        if ($user && !$establishment->getOwner()) {
            $establishment->setOwner($user);
        }
    }
}