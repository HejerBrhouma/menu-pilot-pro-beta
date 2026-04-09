<?php
// src/Entity/UserStatus.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Statut courant d'un serveur (1 ligne par utilisateur, upsert à chaque changement)
 *
 * @ORM\Entity()
 * @ORM\Table(name="user_status")
 */
class UserStatus
{
    const STATUS_AVAILABLE = 'AVAILABLE';
    const STATUS_BUSY      = 'BUSY';
    const STATUS_BREAK     = 'BREAK';
    const STATUS_INACTIVE  = 'INACTIVE';  // popup ouverte, pas de réponse
    const STATUS_OFFLINE   = 'OFFLINE';

    /**
     * @ORM\Id()
     * @ORM\OneToOne(targetEntity=User::class)
     * @ORM\JoinColumn(nullable=false, onDelete="CASCADE")
     */
    private User $user;

    /**
     * AVAILABLE | BUSY | BREAK | INACTIVE | OFFLINE
     * @ORM\Column(type="string", length=20)
     */
    private string $status = self::STATUS_AVAILABLE;

    /**
     * Libellé de l'activité courante (ex: "Nettoyage")
     * @ORM\Column(type="string", length=100, nullable=true)
     */
    private ?string $activityLabel = null;

    /**
     * @ORM\Column(type="datetime_immutable")
     */
    private \DateTimeImmutable $updatedAt;

    public function __construct(User $user)
    {
        $this->user      = $user;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getUser(): User { return $this->user; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $s): self { $this->status = $s; return $this; }

    public function getActivityLabel(): ?string { return $this->activityLabel; }
    public function setActivityLabel(?string $l): self { $this->activityLabel = $l; return $this; }

    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function touch(): self { $this->updatedAt = new \DateTimeImmutable(); return $this; }
}
