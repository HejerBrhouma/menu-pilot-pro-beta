<?php
// src/EventSubscriber/TableSubscriber.php
namespace App\EventSubscriber;

use App\Entity\Table;
use App\Entity\User;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use ApiPlatform\Core\EventListener\EventPriorities;
use Symfony\Component\Security\Core\Security;

class TableSubscriber implements EventSubscriberInterface
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::VIEW => ['onTable', EventPriorities::PRE_WRITE],
        ];
    }

    public function onTable(ViewEvent $event): void
    {
        $object = $event->getControllerResult();
        $method = $event->getRequest()->getMethod();

        if (!$object instanceof Table) return;
        if ($method !== 'POST') return;

        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) return;

        $establishment = $user->getEstablishment();
        if ($establishment) {
            $object->setEstablishment($establishment);
        }
    }
}