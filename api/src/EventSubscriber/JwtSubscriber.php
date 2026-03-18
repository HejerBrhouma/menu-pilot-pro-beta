<?php

// src/EventSubscriber/JwtSubscriber.php

namespace App\EventSubscriber;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class JwtSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            Events::JWT_CREATED => 'onJwtCreated',
        ];
    }

    public function onJwtCreated(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        $payload = $event->getData();

        // Ajouter les infos essentielles dans le token
        $payload['id']        = $user->getId();
        $payload['email']     = $user->getEmail();
        $payload['firstName'] = $user->getFirstName();
        $payload['lastName']  = $user->getLastName();
        $payload['roles']     = $user->getRoles();
        $payload['isActive']  = $user->getIsActive();

        $event->setData($payload);
    }
}