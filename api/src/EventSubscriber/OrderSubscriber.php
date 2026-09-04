<?php
// src/EventSubscriber/OrderSubscriber.php
namespace App\EventSubscriber;

use App\Entity\Order;
use App\Entity\Pack;
use App\Entity\Product;
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
            KernelEvents::VIEW => [
                ['onPreOrder',  EventPriorities::PRE_WRITE],
                ['onPostOrder', EventPriorities::POST_WRITE],
            ],
        ];
    }

    public function onPreOrder(ViewEvent $event): void
    {
        $object = $event->getControllerResult();
        $method = $event->getRequest()->getMethod();
        if (!$object instanceof Order) return;

        $user = $this->security->getUser();
        if (!$user) return;

        if ($method === 'POST') {
            $establishment = $user->getEstablishment();
            if (!$establishment) return;

            $object->setWaiter($user);
            $object->setEstablishment($establishment);
            $object->setOrderNumber($this->orderService->generateOrderNumber($establishment));

            // Auto-confirmation pour le personnel (admin/manager/waiter)
            $staffRoles = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAITER'];
            if (count(array_intersect($staffRoles, $user->getRoles())) > 0) {
                $object->setStatus(Order::STATUS_CONFIRMED);
                $this->adjustStock($object, -1);
            } else {
                $object->setStatus(Order::STATUS_PENDING);
            }

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

        if ($method === 'PATCH' || $method === 'PUT') {
            $uow            = $this->em->getUnitOfWork();
            $originalData   = $uow->getOriginalEntityData($object);
            $previousStatus = $originalData['status'] ?? null;
            $newStatus      = $object->getStatus();

            if ($previousStatus !== Order::STATUS_CONFIRMED && $newStatus === Order::STATUS_CONFIRMED) {
                $this->adjustStock($object, -1);
            } elseif ($previousStatus === Order::STATUS_CONFIRMED && $newStatus === Order::STATUS_CANCELLED) {
                $this->adjustStock($object, +1);
            }

            $object->recalculate();
        }
    }

    private function adjustStock(Order $order, int $direction): void
    {
        foreach ($order->getItems() as $item) {
            if ($item->getItemType() === 'PRODUCT') {
                $product = $this->em->getRepository(Product::class)->find($item->getItemId());
                if ($product && $product->getTrackStock() && $product->getStock() !== null) {
                    $product->setStock(max(0, $product->getStock() + ($direction * $item->getQuantity())));
                }
            } elseif ($item->getItemType() === 'PACK') {
                $pack = $this->em->getRepository(Pack::class)->find($item->getItemId());
                if ($pack && $pack->getTrackStock() && $pack->getStock() !== null) {
                    $pack->setStock(max(0, $pack->getStock() + ($direction * $item->getQuantity())));
                }
            }
        }
    }

    public function onPostOrder(ViewEvent $event): void
    {
        $object = $event->getControllerResult();
        $method = $event->getRequest()->getMethod();
        if (!$object instanceof Order) return;

        // Publier l'événement Mercure après création ou modification statut
        if ($method === 'POST') {
            $this->orderService->publishOrderEvent($object, 'NEW_ORDER');
        }

        if ($method === 'PATCH' || $method === 'PUT') {
            $this->orderService->publishOrderEvent($object, 'STATUS_CHANGED');
        }
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
