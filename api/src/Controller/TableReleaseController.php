<?php
// src/Controller/TableReleaseController.php
namespace App\Controller;

use App\Entity\Table;
use App\Entity\Order;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class TableReleaseController extends AbstractController
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    /**
     * Libérer une table : annule les commandes pending QR + régénère le token
     * @Route("/api/tables/{id}/release", methods={"POST"})
     */
    public function release(int $id): JsonResponse
    {
        $table = $this->em->getRepository(Table::class)->find($id);
        if (!$table) {
            return $this->json(['error' => 'Table introuvable'], 404);
        }

        // Annuler les commandes QR PENDING sur cette table
        $qb = $this->em->createQueryBuilder();
        $pendingQrOrders = $qb->select('o')
            ->from(Order::class, 'o')
            ->where('o.table = :table')
            ->andWhere('o.status = :status')
            ->andWhere('o.isQrOrder = :qr')
            ->setParameter('table', $table)
            ->setParameter('status', 'PENDING')
            ->setParameter('qr', true)
            ->getQuery()
            ->getResult();

        foreach ($pendingQrOrders as $order) {
            $order->setStatus('CANCELLED');
        }

        // Régénérer le token QR
        $newToken = bin2hex(random_bytes(16));
        $table->setQrToken($newToken);

        $this->em->flush();

        return $this->json([
            'success'  => true,
            'newToken' => $newToken,
            'qrUrl'    => '/table/' . $newToken,
        ]);
    }
}