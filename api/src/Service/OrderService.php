<?php
// src/Service/OrderService.php
namespace App\Service;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Invoice;
use App\Entity\User;
use App\Entity\Establishment;
use App\Service\PromotionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class OrderService
{
    private EntityManagerInterface $em;
    private PromotionService $promotionService;
    private ?HubInterface $hub;

    public function __construct(
        EntityManagerInterface $em,
        PromotionService $promotionService,
        ?HubInterface $hub = null
    ) {
        $this->em               = $em;
        $this->promotionService = $promotionService;
        $this->hub              = $hub;
    }

    /**
     * Génère un numéro de commande unique
     */
    public function generateOrderNumber(Establishment $establishment): string
    {
        $year  = date('Y');
        $count = $this->em->createQueryBuilder()
            ->select('COUNT(o.id)')
            ->from(Order::class, 'o')
            ->where('o.establishment = :est')
            ->andWhere('o.createdAt >= :start')
            ->setParameter('est', $establishment)
            ->setParameter('start', new \DateTime("$year-01-01"))
            ->getQuery()
            ->getSingleScalarResult();

        return sprintf('CMD-%s-%04d', $year, (int)$count + 1);
    }

    /**
     * Génère un numéro de facture unique
     */
    public function generateInvoiceNumber(Establishment $establishment): string
    {
        $year  = date('Y');
        $count = $this->em->createQueryBuilder()
            ->select('COUNT(i.id)')
            ->from(Invoice::class, 'i')
            ->where('i.establishment = :est')
            ->andWhere('i.createdAt >= :start')
            ->setParameter('est', $establishment)
            ->setParameter('start', new \DateTime("$year-01-01"))
            ->getQuery()
            ->getSingleScalarResult();

        return sprintf('FAC-%s-%04d', $year, (int)$count + 1);
    }

    /**
     * Applique les promotions actives sur un item
     */
    public function applyPromotionsToItem(
        string $itemType,
        int $itemId,
        float $unitPrice,
        Establishment $establishment,
        ?string $conflictResolution = null
    ): array {
        $scope  = $itemType === 'PRODUCT' ? 'PRODUCT' : 'PACK';
        $promos = $this->promotionService->getActivePromotions($scope, $itemId, $establishment);

        $result = $this->promotionService->applyPromotions($unitPrice, $promos, $conflictResolution);

        return [
            'finalPrice'         => $result['finalPrice'],
            'appliedPromotions'  => $result['promotions'],
        ];
    }

    /**
     * Crée une facture à partir d'une commande
     */
    public function createInvoice(Order $order, User $waiter): Invoice
    {
        $invoice = new Invoice();
        $invoice->setInvoiceNumber($this->generateInvoiceNumber($order->getEstablishment()));
        $invoice->setOrder($order);
        $invoice->setWaiter($waiter);
        $invoice->setEstablishment($order->getEstablishment());
        $invoice->setSubtotal($order->getSubtotal());
        $invoice->setDiscount($order->getDiscount());
        $invoice->setTotal($order->getTotal());

        // Snapshot des items
        $snapshot = [];
        foreach ($order->getItems() as $item) {
            $snapshot[] = [
                'name'       => $item->getItemName(),
                'type'       => $item->getItemType(),
                'unitPrice'  => $item->getUnitPrice(),
                'finalPrice' => $item->getFinalPrice(),
                'quantity'   => $item->getQuantity(),
                'total'      => round($item->getFinalPrice() * $item->getQuantity(), 2),
                'notes'      => $item->getNotes(),
                'promotions' => $item->getAppliedPromotions(),
            ];
        }
        $invoice->setItemsSnapshot($snapshot);

        $this->em->persist($invoice);
        $this->em->flush();

        return $invoice;
    }

    /**
     * Publie un événement Mercure pour notifier en temps réel
     */
    public function publishOrderEvent(Order $order, string $event): void
    {
        if (!$this->hub) return;

        try {
            $topic = sprintf('orders/%d', $order->getEstablishment()->getId());

            $waiterName = null;
            if ($order->getWaiter()) {
                $w = $order->getWaiter();
                $waiterName = trim(($w->getFirstName() ?? '') . ' ' . ($w->getLastName() ?? ''));
                if (empty($waiterName)) $waiterName = $w->getEmail();
            }

            $tableName = null;
            if ($order->getTable()) {
                $tableName = $order->getTable()->getName() ?? null;
            }

            $data = json_encode([
                'event'        => $event,
                'orderId'      => $order->getId(),
                'orderNumber'  => $order->getOrderNumber(),
                'status'       => $order->getStatus(),
                'tableName'    => $tableName,
                'type'         => $order->getType(),
                'total'        => $order->getTotal(),
                'waiter'       => $waiterName,
                'customerName' => $order->getCustomerName() ?? null,
                'isQrOrder'    => $order->getIsQrOrder(),
                'createdAt'    => $order->getCreatedAt()
                    ? $order->getCreatedAt()->format('H:i')
                    : null,
            ]);

            $update = new \Symfony\Component\Mercure\Update($topic, $data);
            $this->hub->publish($update);

        } catch (\Exception $e) {
            // Ne pas bloquer l'action si Mercure échoue
        }
    }
}
