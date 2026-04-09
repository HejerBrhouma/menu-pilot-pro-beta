<?php
// src/Service/InvoiceService.php
namespace App\Service;

use App\Entity\Invoice;
use App\Entity\InvoiceLine;
use App\Entity\Order;
use App\Entity\User;
use App\Helper\InvoiceNumberGenerator;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Crée une Invoice + InvoiceLines à partir d'une commande.
 *
 * Logique TVA :
 *   baseHT    = subtotal − discount
 *   tvaAmount = baseHT × tvaRate / 100
 *   total TTC = baseHT + tvaAmount
 *
 * Le taux est figé au moment du paiement :
 *   • Establishment::tvaRate si configuré
 *   • 19 % par défaut sinon
 */
class InvoiceService
{
    private const DEFAULT_TVA_RATE = 19.0;

    private EntityManagerInterface $em;
    private InvoiceNumberGenerator $numberGenerator;

    public function __construct(
        EntityManagerInterface $em,
        InvoiceNumberGenerator $numberGenerator
    ) {
        $this->em              = $em;
        $this->numberGenerator = $numberGenerator;
    }

    // ─────────────────────────────────────────────────────────────────────────

    public function createFromOrder(
        Order  $order,
        User   $waiter,
        string $paymentMethod = Invoice::PAYMENT_CASH
    ): Invoice {
        $establishment = $order->getEstablishment();
        $tvaRate       = $establishment->getTvaRate() ?? self::DEFAULT_TVA_RATE;

        // 1. Construire les lignes de facturation
        [$lineEntities, $subtotal] = $this->buildLines($order);

        // 2. Calcul TVA
        $discount  = $order->getDiscount();
        $baseHt    = round($subtotal - $discount, 3);
        $tvaAmount = round($baseHt * $tvaRate / 100, 3);
        $total     = round($baseHt + $tvaAmount, 3);

        // 3. Construire la facture
        $invoice = new Invoice();
        $invoice->setInvoiceNumber($this->numberGenerator->generate($establishment));
        $invoice->setOrder($order);
        $invoice->setWaiter($waiter);
        $invoice->setEstablishment($establishment);
        $invoice->setPaymentMethod($paymentMethod);
        $invoice->setStatus(Invoice::STATUS_PAID);
        $invoice->setPaidAt(new \DateTime());
        $invoice->setSubtotal($subtotal);
        $invoice->setDiscount($discount);
        $invoice->setTvaRate($tvaRate);
        $invoice->setTvaAmount($tvaAmount);
        $invoice->setTotal($total);
        $invoice->setItemsSnapshot($this->buildSnapshot($order));

        $this->em->persist($invoice);

        // 4. Attacher les lignes
        foreach ($lineEntities as $line) {
            $invoice->addLine($line);
            $this->em->persist($line);
        }

        $this->em->flush();

        return $invoice;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers privés
    // ─────────────────────────────────────────────────────────────────────────

    private function buildLines(Order $order): array
    {
        $lines    = [];
        $subtotal = 0.0;

        foreach ($order->getItems() as $item) {
            $lineTotal  = round($item->getFinalPrice() * $item->getQuantity(), 3);
            $subtotal  += $lineTotal;

            $line = new InvoiceLine();
            $line->setDescription($item->getItemName());
            $line->setItemType($item->getItemType());
            $line->setItemId($item->getItemId());
            $line->setQuantity($item->getQuantity());
            $line->setUnitPrice($item->getFinalPrice());
            $line->setTotal($lineTotal);

            $lines[] = $line;
        }

        return [$lines, round($subtotal, 3)];
    }

    private function buildSnapshot(Order $order): array
    {
        $snapshot = [];
        foreach ($order->getItems() as $item) {
            $snapshot[] = [
                'name'       => $item->getItemName(),
                'type'       => $item->getItemType(),
                'unitPrice'  => $item->getUnitPrice(),
                'finalPrice' => $item->getFinalPrice(),
                'quantity'   => $item->getQuantity(),
                'total'      => round($item->getFinalPrice() * $item->getQuantity(), 3),
                'notes'      => $item->getNotes(),
                'promotions' => $item->getAppliedPromotions(),
            ];
        }
        return $snapshot;
    }
}
