<?php
// src/Controller/TableMenuController.php

namespace App\Controller;

use App\Entity\Table;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\User;
use App\Service\OrderService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class TableMenuController extends AbstractController
{
    private EntityManagerInterface $em;
    private OrderService $orderService;

    public function __construct(
        EntityManagerInterface $em,
        OrderService $orderService
    ) {
        $this->em           = $em;
        $this->orderService = $orderService;
    }

    /**
     * Récupère la table + l'enseigne via le token QR
     * Route publique — pas de JWT requis
     *
     * @Route("/api/public/table/{token}", methods={"GET"})
     */
    public function getTableByToken(string $token): JsonResponse
    {
        $table = $this->em->getRepository(Table::class)->findOneBy([
            'qrToken' => $token
        ]);

        if (!$table) {
            return $this->json(['error' => 'Table introuvable'], 404);
        }

        if (!$table->getIsActive()) {
            return $this->json(['error' => 'Table inactive'], 403);
        }

        $establishment = $table->getEstablishment();

        return $this->json([
            'table' => [
                'id'       => $table->getId(),
                'name'     => $table->getName() ?? '',
                'capacity' => $table->getCapacity(),
                'qrToken'  => $table->getQrToken(),
            ],
            'establishment' => [
                'id'          => $establishment->getId(),
                'name'        => $establishment->getName() ?? '',
                'slug'        => method_exists($establishment, 'getSlug') ? ($establishment->getSlug() ?? '') : '',
                'logo'        => method_exists($establishment, 'getLogo') ? $establishment->getLogo() : null,
                'description' => method_exists($establishment, 'getDescription') ? $establishment->getDescription() : null,
            ]
        ]);
    }

    /**
     * Crée une commande publique (client depuis QR)
     * Route publique — pas de JWT requis
     *
     * @Route("/api/public/orders", methods={"POST"})
     */
    public function createPublicOrder(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['error' => 'Données invalides'], 400);
        }

        // Récupérer la table via token
        $tableToken = $data['tableToken'] ?? null;
        if (!$tableToken) {
            return $this->json(['error' => 'Token table requis'], 400);
        }

        $table = $this->em->getRepository(Table::class)->findOneBy([
            'qrToken' => $tableToken
        ]);

        if (!$table || !$table->getIsActive()) {
            return $this->json(['error' => 'Table introuvable ou inactive'], 404);
        }

        $establishment = $table->getEstablishment();
        $items         = $data['items'] ?? [];

        if (empty($items)) {
            return $this->json(['error' => 'Panier vide'], 400);
        }

        // Récupérer un user admin de l'enseigne pour waiter par défaut
        $adminUser = $this->em->createQueryBuilder()
            ->select('u')
            ->from('App\Entity\User', 'u')
            ->where('u.establishment = :est')
            ->setParameter('est', $establishment)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        if (!$adminUser) {
            return $this->json(['error' => 'Enseigne non configurée'], 500);
        }

        // Créer la commande
        $order = new Order();
        $order->setEstablishment($establishment);
        $order->setTable($table);
        $order->setWaiter($adminUser);
        $order->setType(Order::TYPE_TABLE);
        $order->setStatus(Order::STATUS_PENDING);
        $order->setOrderNumber(
            $this->orderService->generateOrderNumber($establishment)
        );
        $order->setIsQrOrder(true);

        $currentUser = $this->getUser();
        if ($currentUser instanceof User && in_array('ROLE_CUSTOMER', $currentUser->getRoles())) {
            $order->setCustomer($currentUser);
        }

        if (!empty($data['notes'])) {
            $order->setNotes($data['notes']);
        }

        if (!empty($data['customerName'])) {
            $order->setCustomerName($data['customerName']);
        }

        // Ajouter les items
        foreach ($items as $itemData) {
            $item = new OrderItem();
            $item->setItemType($itemData['itemType']);
            $item->setItemId($itemData['itemId']);
            $item->setItemName($itemData['itemName']);
            $item->setUnitPrice((float)$itemData['unitPrice']);
            $item->setQuantity((int)$itemData['quantity']);

            if (!empty($itemData['notes'])) {
                $item->setNotes($itemData['notes']);
            }

            // Appliquer les promos
            $result = $this->orderService->applyPromotionsToItem(
                $itemData['itemType'],
                (int)$itemData['itemId'],
                (float)$itemData['unitPrice'],
                $establishment
            );
            $item->setFinalPrice($result['finalPrice']);
            $item->setAppliedPromotions($result['appliedPromotions']);

            $order->addItem($item);
        }

        // Calculer les totaux
        $order->recalculate();

        $this->em->persist($order);
        $this->em->flush();

        // Notifier les serveurs en temps réel via Mercure
        $this->orderService->publishOrderEvent($order, 'NEW_ORDER');

        return $this->json([
            'orderId'     => $order->getId(),
            'orderNumber' => $order->getOrderNumber(),
            'total'       => $order->getTotal(),
            'status'      => $order->getStatus(),
        ], 201);
    }

    /**
     * Récupère le statut d'une commande publique
     *
     * @Route("/api/public/orders/{id}/status", methods={"GET"})
     */
    public function getOrderStatus(int $id): JsonResponse
    {
        $order = $this->em->getRepository(Order::class)->find($id);

        if (!$order) {
            return $this->json(['error' => 'Commande introuvable'], 404);
        }

        return $this->json([
            'orderId'     => $order->getId(),
            'orderNumber' => $order->getOrderNumber(),
            'status'      => $order->getStatus(),
            'total'       => $order->getTotal(),
            'updatedAt'   => $order->getUpdatedAt()
                ? $order->getUpdatedAt()->format('H:i')
                : $order->getCreatedAt()->format('H:i'),
        ]);
    }
}