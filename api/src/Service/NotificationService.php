<?php
// src/Service/NotificationService.php
namespace App\Service;

use App\Entity\Establishment;
use App\Entity\Notification;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class NotificationService
{
    private EntityManagerInterface $em;
    private ?HubInterface $hub;

    public function __construct(EntityManagerInterface $em, ?HubInterface $hub = null)
    {
        $this->em  = $em;
        $this->hub = $hub;
    }

    /**
     * Crée une notification pour tous les admins et managers d'une enseigne
     * et publie l'événement via Mercure.
     */
    public function notifyManagers(
        Establishment $establishment,
        string        $type,
        string        $message,
        ?array        $payload = null
    ): void {
        $recipients = $this->getManagersAndAdmins($establishment);
        if (empty($recipients)) return;

        foreach ($recipients as $recipient) {
            $notif = new Notification($recipient, $type, $message, $payload);
            $this->em->persist($notif);
        }
        $this->em->flush();

        // Mercure — un seul event pour tout l'établissement
        $this->publishMercure($establishment, $type, $message, $payload);
    }

    /**
     * Retourne tous les admins et managers de l'enseigne (hors l'émetteur si fourni)
     */
    private function getManagersAndAdmins(Establishment $establishment, ?User $exclude = null): array
    {
        $users = $this->em->createQueryBuilder()
            ->select('u')
            ->from(User::class, 'u')
            ->where('u.establishment = :est')
            ->setParameter('est', $establishment)
            ->getQuery()
            ->getResult();

        return array_filter($users, function (User $u) use ($exclude) {
            if ($exclude && $u->getId() === $exclude->getId()) return false;
            $roles = $u->getRoles();
            return in_array('ROLE_ADMIN', $roles) || in_array('ROLE_MANAGER', $roles);
        });
    }

    private function publishMercure(Establishment $establishment, string $type, string $message, ?array $payload): void
    {
        if (!$this->hub) return;
        try {
            $topic = sprintf('notifications/%d', $establishment->getId());
            $data  = json_encode([
                'event'   => 'NEW_NOTIFICATION',
                'type'    => $type,
                'message' => $message,
                'payload' => $payload,
                'time'    => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            ]);
            $this->hub->publish(new Update($topic, $data));
        } catch (\Exception $e) {}
    }
}
