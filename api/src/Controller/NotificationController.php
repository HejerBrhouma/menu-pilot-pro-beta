<?php
// src/Controller/NotificationController.php
namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class NotificationController extends AbstractController
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    /**
     * Liste les notifications de l'utilisateur connecté (50 dernières)
     * @Route("/api/notifications", methods={"GET"})
     */
    public function list(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non connecté'], 401);
        }

        $notifications = $this->em->createQueryBuilder()
            ->select('n')
            ->from(Notification::class, 'n')
            ->where('n.recipient = :user')
            ->setParameter('user', $user)
            ->orderBy('n.createdAt', 'DESC')
            ->setMaxResults(50)
            ->getQuery()
            ->getResult();

        return $this->json(array_map(fn(Notification $n) => $n->toArray(), $notifications));
    }

    /**
     * Nombre de notifications non lues
     * @Route("/api/notifications/unread-count", methods={"GET"})
     */
    public function unreadCount(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non connecté'], 401);
        }

        $count = $this->em->createQueryBuilder()
            ->select('COUNT(n.id)')
            ->from(Notification::class, 'n')
            ->where('n.recipient = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        return $this->json(['count' => (int) $count]);
    }

    /**
     * Marquer une notification comme lue
     * @Route("/api/notifications/{id}/read", methods={"POST"})
     */
    public function markRead(int $id): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non connecté'], 401);
        }

        $notif = $this->em->getRepository(Notification::class)->findOneBy([
            'id'        => $id,
            'recipient' => $user,
        ]);

        if (!$notif) {
            return $this->json(['error' => 'Notification introuvable'], 404);
        }

        $notif->markRead();
        $this->em->flush();

        return $this->json(['ok' => true]);
    }

    /**
     * Marquer toutes les notifications comme lues
     * @Route("/api/notifications/read-all", methods={"POST"})
     */
    public function markAllRead(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non connecté'], 401);
        }

        $this->em->createQueryBuilder()
            ->update(Notification::class, 'n')
            ->set('n.isRead', 'true')
            ->where('n.recipient = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();

        return $this->json(['ok' => true]);
    }
}
