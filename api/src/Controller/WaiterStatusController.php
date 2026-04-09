<?php
// src/Controller/WaiterStatusController.php
namespace App\Controller;

use App\Entity\Establishment;
use App\Entity\Notification;
use App\Entity\User;
use App\Entity\UserStatus;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Routing\Annotation\Route;

class WaiterStatusController extends AbstractController
{
    private EntityManagerInterface $em;
    private ?HubInterface $hub;
    private NotificationService $notificationService;

    public function __construct(
        EntityManagerInterface $em,
        NotificationService    $notificationService,
        ?HubInterface          $hub = null
    ) {
        $this->em                  = $em;
        $this->notificationService = $notificationService;
        $this->hub                 = $hub;
    }

    /**
     * Met à jour le statut de l'utilisateur connecté (serveur / manager)
     * @Route("/api/waiter/status", methods={"POST"})
     */
    public function updateStatus(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non connecté'], 401);
        }

        $data   = json_decode($request->getContent(), true);
        $status = strtoupper($data['status'] ?? '');

        $allowed = [
            UserStatus::STATUS_AVAILABLE,
            UserStatus::STATUS_BUSY,
            UserStatus::STATUS_BREAK,
            UserStatus::STATUS_INACTIVE,
            UserStatus::STATUS_OFFLINE,
        ];
        if (!in_array($status, $allowed, true)) {
            return $this->json(['error' => 'Statut invalide'], 400);
        }

        // Upsert UserStatus (1 ligne par user)
        $userStatus = $this->em->getRepository(UserStatus::class)->find($user);
        if (!$userStatus) {
            $userStatus = new UserStatus($user);
        }
        $userStatus->setStatus($status);
        $userStatus->setActivityLabel($data['activityLabel'] ?? null);
        $userStatus->touch();

        $this->em->persist($userStatus);
        $this->em->flush();

        // Publier via Mercure pour mise à jour temps réel chez le manager
        $this->publishStaffEvent($user, $userStatus);

        // Alerte US#4 : notifier les managers si le waiter ne répond pas
        $establishment = $user->getEstablishment();
        if ($establishment && ($data['activityLabel'] ?? null) === 'ALERT_NO_RESPONSE') {
            $waiterName = trim(($user->getFirstName() ?? '') . ' ' . ($user->getLastName() ?? ''));
            $this->notificationService->notifyManagers(
                $establishment,
                Notification::TYPE_ALERT_NO_RESPONSE,
                sprintf('⚠️ %s n\'a pas répondu à la popup d\'inactivité depuis + de 2 min', $waiterName),
                ['waiterId' => $user->getId(), 'waiterName' => $waiterName]
            );
        }

        return $this->json([
            'userId'        => $user->getId(),
            'status'        => $userStatus->getStatus(),
            'activityLabel' => $userStatus->getActivityLabel(),
            'updatedAt'     => $userStatus->getUpdatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Retourne tous les statuts du personnel de l'établissement
     * @Route("/api/staff/status", methods={"GET"})
     */
    public function getAllStatus(): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Non connecté'], 401);
        }

        // Récupère tous les utilisateurs de l'établissement (hors super-admin)
        $establishment = $currentUser->getEstablishment();
        if (!$establishment) {
            return $this->json([]);
        }

        $users = $this->em->createQueryBuilder()
            ->select('u')
            ->from(User::class, 'u')
            ->where('u.establishment = :est')
            ->setParameter('est', $establishment)
            ->getQuery()
            ->getResult();

        $result = [];
        foreach ($users as $u) {
            /** @var User $u */
            $us = $this->em->getRepository(UserStatus::class)->find($u);
            $result[] = [
                'userId'        => $u->getId(),
                'firstName'     => $u->getFirstName(),
                'lastName'      => $u->getLastName(),
                'roles'         => $u->getRoles(),
                'isActive'      => $u->getIsActive(),
                'status'        => $us ? $us->getStatus()        : 'OFFLINE',
                'activityLabel' => $us ? $us->getActivityLabel() : null,
                'updatedAt'     => $us ? $us->getUpdatedAt()->format('Y-m-d H:i:s') : null,
            ];
        }

        return $this->json($result);
    }

    private function publishStaffEvent(User $user, UserStatus $userStatus): void
    {
        if (!$this->hub) return;

        try {
            $establishment = $user->getEstablishment();
            if (!$establishment) return;

            $topic = sprintf('staff/%d', $establishment->getId());

            $data = json_encode([
                'event'         => 'STATUS_UPDATE',
                'userId'        => $user->getId(),
                'firstName'     => $user->getFirstName(),
                'lastName'      => $user->getLastName(),
                'roles'         => $user->getRoles(),
                'status'        => $userStatus->getStatus(),
                'activityLabel' => $userStatus->getActivityLabel(),
                'updatedAt'     => $userStatus->getUpdatedAt()->format('Y-m-d H:i:s'),
            ]);

            $this->hub->publish(new Update($topic, $data));
        } catch (\Exception $e) {
            // Ne pas bloquer si Mercure est indisponible
        }
    }
}
