<?php
// src/Controller/OrderController.php
namespace App\Controller;

use App\Entity\Invoice;
use App\Entity\Order;
use App\Entity\User;
use App\Event\OrderPaidEvent;
use App\Service\OrderService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Security;

class OrderController extends AbstractController
{
    private EntityManagerInterface   $em;
    private OrderService             $orderService;
    private EventDispatcherInterface $dispatcher;
    private Security                 $security;

    public function __construct(
        EntityManagerInterface   $em,
        OrderService             $orderService,
        EventDispatcherInterface $dispatcher,
        Security                 $security
    ) {
        $this->em           = $em;
        $this->orderService = $orderService;
        $this->dispatcher   = $dispatcher;
        $this->security     = $security;
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Changer le statut d'une commande (hors paiement).
     * La transition SERVED → PAID est intentionnellement absente :
     * le paiement passe obligatoirement par POST /api/orders/{id}/invoice.
     *
     * @Route("/api/orders/{id}/status", methods={"POST"})
     */
    public function changeStatus(int $id, Request $request): JsonResponse
    {
        $order = $this->em->getRepository(Order::class)->find($id);
        if (!$order) {
            return $this->json(['error' => 'Commande introuvable'], 404);
        }

        $data      = json_decode($request->getContent(), true);
        $newStatus = $data['status'] ?? null;

        // PAID retiré volontairement : utiliser POST /invoice pour encaisser
        $allowed = [
            Order::STATUS_PENDING   => [Order::STATUS_CONFIRMED, Order::STATUS_CANCELLED],
            Order::STATUS_CONFIRMED => [Order::STATUS_SERVED,    Order::STATUS_CANCELLED],
            Order::STATUS_SERVED    => [Order::STATUS_CANCELLED],
            Order::STATUS_PAID      => [],
            Order::STATUS_CANCELLED => [],
        ];

        if (!in_array($newStatus, $allowed[$order->getStatus()] ?? [])) {
            return $this->json(['error' => "Transition '$newStatus' non autorisée depuis '{$order->getStatus()}'"], 400);
        }

        $order->setStatus($newStatus);
        $this->em->flush();

        $this->orderService->publishOrderEvent($order, 'STATUS_CHANGED');

        return $this->json(['id' => $order->getId(), 'status' => $order->getStatus()]);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Encaissement : passe la commande à PAID et génère la facture.
     * La création de la facture est déléguée à InvoiceSubscriber via OrderPaidEvent.
     *
     * @Route("/api/orders/{id}/invoice", methods={"POST"})
     */
    public function generateInvoice(int $id, Request $request): JsonResponse
    {
        $order = $this->em->getRepository(Order::class)->find($id);
        if (!$order) {
            return $this->json(['error' => 'Commande introuvable'], 404);
        }

        // Idempotence — facture déjà générée
        $existing = $this->em->getRepository(Invoice::class)->findOneBy(['order' => $order]);
        if ($existing) {
            return $this->json(['invoiceId' => $existing->getId(), 'exists' => true]);
        }

        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié'], 401);
        }

        $data          = json_decode($request->getContent(), true);
        $paymentMethod = $data['paymentMethod'] ?? Invoice::PAYMENT_CASH;

        // 1. Marquer la commande comme payée
        $order->setStatus(Order::STATUS_PAID);
        $this->em->flush();

        // 2. Déclencher la facturation via l'event subscriber
        $event = new OrderPaidEvent($order, $user, $paymentMethod);
        $this->dispatcher->dispatch($event);

        // 3. Notifier les clients temps réel (Mercure)
        $this->orderService->publishOrderEvent($order, 'PAID');

        return $this->json(['invoiceId' => $event->getInvoiceId()]);
    }
}
