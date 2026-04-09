<?php
// src/Controller/WaiterActivityController.php
namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use App\Entity\WaiterActivity;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class WaiterActivityController extends AbstractController
{
    private EntityManagerInterface $em;
    private NotificationService $notificationService;

    public function __construct(EntityManagerInterface $em, NotificationService $notificationService)
    {
        $this->em                  = $em;
        $this->notificationService = $notificationService;
    }

    /**
     * Déclarer une activité (serveur connecté)
     * @Route("/api/waiter/activity", methods={"POST"})
     */
    public function declare(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User || !in_array('ROLE_WAITER', $user->getRoles())) {
            return $this->json(['error' => 'Réservé aux serveurs'], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (empty($data['type']) || empty($data['label'])) {
            return $this->json(['error' => 'Type et label requis'], 400);
        }

        $activity = new WaiterActivity();
        $activity->setWaiter($user);
        $activity->setType($data['type']);
        $activity->setLabel($data['label']);
        $activity->setNote($data['note'] ?? null);
        $activity->setInactiveMinutes((int)($data['inactiveMinutes'] ?? 0));
        $activity->setDurationMinutes(isset($data['durationMinutes']) ? (int)$data['durationMinutes'] : null);

        $this->em->persist($activity);
        $this->em->flush();

        // Notifier les admins/managers de l'enseigne
        $establishment = $user->getEstablishment();
        if ($establishment) {
            $waiterName      = trim(($user->getFirstName() ?? '') . ' ' . ($user->getLastName() ?? ''));
            $durationMinutes = isset($data['durationMinutes']) ? (int)$data['durationMinutes'] : null;

            $message = sprintf('%s a déclaré : %s', $waiterName, $data['label']);
            if ($durationMinutes) {
                $message .= sprintf(' (%d min)', $durationMinutes);
            }
            if (!empty($data['note'])) {
                $message .= ' — ' . $data['note'];
            }

            $this->notificationService->notifyManagers(
                $establishment,
                Notification::TYPE_ACTIVITY_DECLARED,
                $message,
                [
                    'waiterId'        => $user->getId(),
                    'waiterName'      => $waiterName,
                    'activityType'    => $data['type'],
                    'activityLabel'   => $data['label'],
                    'note'            => $data['note'] ?? null,
                    'inactiveMinutes' => (int)($data['inactiveMinutes'] ?? 0),
                    'durationMinutes' => $durationMinutes,
                ]
            );
        }

        return $this->json(['id' => $activity->getId()], 201);
    }

    /**
     * Historique des activités (admin/manager)
     * @Route("/api/waiter/activities", methods={"GET"})
     */
    public function list(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non connecté'], 401);
        }

        $qb = $this->em->createQueryBuilder()
            ->select('a')
            ->from(WaiterActivity::class, 'a')
            ->orderBy('a.createdAt', 'DESC')
            ->setMaxResults(100);

        // Un serveur ne voit que ses propres activités
        if (in_array('ROLE_WAITER', $user->getRoles())) {
            $qb->where('a.waiter = :user')->setParameter('user', $user);
        }

        $activities = $qb->getQuery()->getResult();

        return $this->json(array_map(fn(WaiterActivity $a) => [
            'id'             => $a->getId(),
            'type'           => $a->getType(),
            'label'          => $a->getLabel(),
            'note'           => $a->getNote(),
            'inactiveMinutes'=> $a->getInactiveMinutes(),
            'createdAt'      => $a->getCreatedAt()->format('Y-m-d H:i'),
            'waiter'         => [
                'id'        => $a->getWaiter()->getId(),
                'firstName' => $a->getWaiter()->getFirstName(),
                'lastName'  => $a->getWaiter()->getLastName(),
            ],
        ], $activities));
    }
}
