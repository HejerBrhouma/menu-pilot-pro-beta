<?php
// src/Event/OrderPaidEvent.php
namespace App\Event;

use App\Entity\Invoice;
use App\Entity\Order;
use App\Entity\User;

/**
 * Dispatché lorsqu'une commande est marquée PAID.
 * InvoiceSubscriber écoute cet événement et crée la facture.
 */
class OrderPaidEvent
{
    private Order  $order;
    private User   $waiter;
    private string $paymentMethod;
    private ?int   $invoiceId = null;

    public function __construct(Order $order, User $waiter, string $paymentMethod = Invoice::PAYMENT_CASH)
    {
        $this->order         = $order;
        $this->waiter        = $waiter;
        $this->paymentMethod = $paymentMethod;
    }

    public function getOrder(): Order          { return $this->order; }
    public function getWaiter(): User          { return $this->waiter; }
    public function getPaymentMethod(): string { return $this->paymentMethod; }
    public function getInvoiceId(): ?int       { return $this->invoiceId; }
    public function setInvoiceId(int $id): void { $this->invoiceId = $id; }
}
