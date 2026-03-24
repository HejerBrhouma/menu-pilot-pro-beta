<?php
// src/Controller/OrderController.php
namespace App\Controller;

use App\Entity\Order;
use App\Entity\Invoice;
use App\Service\OrderService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Security;

class OrderController extends AbstractController
{
    private EntityManagerInterface $em;
    private OrderService $orderService;
    private Security $security;

    public function __construct(
        EntityManagerInterface $em,
        OrderService $orderService,
        Security $security
    ) {
        $this->em           = $em;
        $this->orderService = $orderService;
        $this->security     = $security;
    }

    /**
     * Changer le statut d'une commande
     * @Route("/api/orders/{id}/status", methods={"POST"})
     */
    public function changeStatus(int $id, Request $request): JsonResponse
    {
        $order = $this->em->getRepository(Order::class)->find($id);
        if (!$order) return $this->json(['error' => 'Commande introuvable'], 404);

        $data      = json_decode($request->getContent(), true);
        $newStatus = $data['status'] ?? null;

        $allowed = [
            Order::STATUS_PENDING   => [Order::STATUS_CONFIRMED, Order::STATUS_CANCELLED],
            Order::STATUS_CONFIRMED => [Order::STATUS_SERVED, Order::STATUS_CANCELLED],
            Order::STATUS_SERVED    => [Order::STATUS_PAID],
            Order::STATUS_PAID      => [],
            Order::STATUS_CANCELLED => [],
        ];

        if (!in_array($newStatus, $allowed[$order->getStatus()] ?? [])) {
            return $this->json(['error' => "Transition $newStatus non autorisée"], 400);
        }

        $order->setStatus($newStatus);
        $this->em->flush();

        // Notifier en temps réel
        $this->orderService->publishOrderEvent($order, 'STATUS_CHANGED');

        return $this->json([
            'id'     => $order->getId(),
            'status' => $order->getStatus(),
        ]);
    }

    /**
     * Générer une facture pour une commande
     * @Route("/api/orders/{id}/invoice", methods={"POST"})
     */
    public function generateInvoice(int $id, Request $request): JsonResponse
    {
        $order = $this->em->getRepository(Order::class)->find($id);
        if (!$order) return $this->json(['error' => 'Commande introuvable'], 404);

        // Vérifier qu'une facture n'existe pas déjà
        $existing = $this->em->getRepository(Invoice::class)->findOneBy(['order' => $order]);
        if ($existing) {
            return $this->json(['invoiceId' => $existing->getId(), 'exists' => true]);
        }

        $data          = json_decode($request->getContent(), true);
        $paymentMethod = $data['paymentMethod'] ?? Invoice::PAYMENT_CASH;

        $user    = $this->security->getUser();
        $invoice = $this->orderService->createInvoice($order, $user);
        $invoice->setPaymentMethod($paymentMethod);

        // Marquer la commande comme payée
        $order->setStatus(Order::STATUS_PAID);
        $this->em->flush();

        $this->orderService->publishOrderEvent($order, 'PAID');

        return $this->json(['invoiceId' => $invoice->getId()]);
    }
}
