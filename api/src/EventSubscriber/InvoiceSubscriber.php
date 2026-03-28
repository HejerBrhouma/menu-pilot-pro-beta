<?php
// src/EventSubscriber/InvoiceSubscriber.php
namespace App\EventSubscriber;

use App\Event\OrderPaidEvent;
use App\Service\InvoiceService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Écoute OrderPaidEvent et crée la facture via InvoiceService.
 * Découplé du Controller : tout chemin qui dispatch cet événement
 * déclenche automatiquement la facturation.
 */
class InvoiceSubscriber implements EventSubscriberInterface
{
    private InvoiceService $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            OrderPaidEvent::class => 'onOrderPaid',
        ];
    }

    public function onOrderPaid(OrderPaidEvent $event): void
    {
        $invoice = $this->invoiceService->createFromOrder(
            $event->getOrder(),
            $event->getWaiter(),
            $event->getPaymentMethod()
        );

        // Transmet l'ID de la facture au controller pour la réponse JSON
        $event->setInvoiceId($invoice->getId());
    }
}
