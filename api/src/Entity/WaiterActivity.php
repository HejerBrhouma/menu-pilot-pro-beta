<?php
// src/Entity/WaiterActivity.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity()
 * @ORM\Table(name="waiter_activities")
 */
class WaiterActivity
{
    const TYPE_CLEANING = 'CLEANING';
    const TYPE_SETUP    = 'SETUP';
    const TYPE_BREAK    = 'BREAK';
    const TYPE_MEETING  = 'MEETING';
    const TYPE_OTHER    = 'OTHER';

    /**
     * @ORM\Id() @ORM\GeneratedValue() @ORM\Column(type="integer")
     */
    private ?int $id = null;

    /**
     * @ORM\ManyToOne(targetEntity=User::class)
     * @ORM\JoinColumn(nullable=false)
     */
    private User $waiter;

    /**
     * CLEANING | SETUP | BREAK | MEETING | OTHER
     * @ORM\Column(type="string", length=20)
     */
    private string $type;

    /**
     * Libellé lisible (ex: "Nettoyage")
     * @ORM\Column(type="string", length=100)
     */
    private string $label;

    /**
     * Précision libre (optionnel)
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private ?string $note = null;

    /**
     * Durée d'inactivité en minutes avant déclaration
     * @ORM\Column(type="integer")
     */
    private int $inactiveMinutes = 0;

    /**
     * Durée de la pause annoncée par le serveur (BREAK uniquement), en minutes
     * @ORM\Column(type="integer", nullable=true)
     */
    private ?int $durationMinutes = null;

    /**
     * @ORM\Column(type="datetime_immutable")
     */
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getWaiter(): User { return $this->waiter; }
    public function setWaiter(User $w): self { $this->waiter = $w; return $this; }

    public function getType(): string { return $this->type; }
    public function setType(string $t): self { $this->type = $t; return $this; }

    public function getLabel(): string { return $this->label; }
    public function setLabel(string $l): self { $this->label = $l; return $this; }

    public function getNote(): ?string { return $this->note; }
    public function setNote(?string $n): self { $this->note = $n; return $this; }

    public function getInactiveMinutes(): int { return $this->inactiveMinutes; }
    public function setInactiveMinutes(int $m): self { $this->inactiveMinutes = $m; return $this; }

    public function getDurationMinutes(): ?int { return $this->durationMinutes; }
    public function setDurationMinutes(?int $d): self { $this->durationMinutes = $d; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
