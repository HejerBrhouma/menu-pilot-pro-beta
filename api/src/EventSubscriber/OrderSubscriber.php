<?php
// src/EventSubscriber/OrderSubscriber.php
namespace App\EventSubscriber;

use App\Entity\Order;
use App\Entity\User;
use App\Service\OrderService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use ApiPlatform\Core\EventListener\EventPriorities;
use Symfony\Component\Security\Core\Security;

class OrderSubscriber implements EventSubscriberInterface
{
    private Security $security;
    private EntityManagerInterface $em;
    private OrderService $orderService;

    public function __construct(
        Security $security,
        EntityManagerInterface $em,
        OrderService $orderService
    ) {
        $this->security     = $security;
        $this->em           = $em;
        $this->orderService = $orderService;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::VIEW => ['onOrder', EventPriorities::PRE_WRITE],
        ];
    }

    public function onOrder(ViewEvent $event): void
    {
        $object = $event->getControllerResult();
        $method = $event->getRequest()->getMethod();

        if (!$object instanceof Order) return;

        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) return;

        // Création : injecter waiter, establishment, orderNumber
        if ($method === 'POST') {
            $establishment = $user->getEstablishment();
            if (!$establishment) return;

            $object->setWaiter($user);
            $object->setEstablishment($establishment);
            $object->setOrderNumber($this->orderService->generateOrderNumber($establishment));

            // Appliquer les promos sur chaque item
            foreach ($object->getItems() as $item) {
                $result = $this->orderService->applyPromotionsToItem(
                    $item->getItemType(),
                    $item->getItemId(),
                    $item->getUnitPrice(),
                    $establishment
                );
                $item->setFinalPrice($result['finalPrice']);
                $item->setAppliedPromotions($result['appliedPromotions']);
            }

            $object->recalculate();
        }

        // Modification : recalculer si items changés
        if ($method === 'PATCH' || $method === 'PUT') {
            $object->recalculate();
        }
    }
}
