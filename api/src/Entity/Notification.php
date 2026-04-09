<?php
// src/Entity/Notification.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity()
 * @ORM\Table(name="notification", indexes={
 *   @ORM\Index(columns={"recipient_id", "is_read"})
 * })
 */
class Notification
{
    const TYPE_ACTIVITY_DECLARED  = 'ACTIVITY_DECLARED';
    const TYPE_ALERT_NO_RESPONSE  = 'ALERT_NO_RESPONSE';
    const TYPE_STATUS_CHANGE      = 'STATUS_CHANGE';

    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private int $id;

    /**
     * Destinataire (admin ou manager de l'enseigne)
     * @ORM\ManyToOne(targetEntity=User::class)
     * @ORM\JoinColumn(nullable=false, onDelete="CASCADE")
     */
    private User $recipient;

    /**
     * @ORM\Column(type="string", length=50)
     */
    private string $type;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private string $message;

    /**
     * Données supplémentaires JSON (nom du waiter, activité, etc.)
     * @ORM\Column(type="json", nullable=true)
     */
    private ?array $payload = null;

    /**
     * @ORM\Column(type="boolean", options={"default": false})
     */
    private bool $isRead = false;

    /**
     * @ORM\Column(type="datetime_immutable")
     */
    private \DateTimeImmutable $createdAt;

    public function __construct(User $recipient, string $type, string $message, ?array $payload = null)
    {
        $this->recipient = $recipient;
        $this->type      = $type;
        $this->message   = $message;
        $this->payload   = $payload;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): int           { return $this->id; }
    public function getRecipient(): User   { return $this->recipient; }
    public function getType(): string      { return $this->type; }
    public function getMessage(): string   { return $this->message; }
    public function getPayload(): ?array   { return $this->payload; }
    public function isRead(): bool         { return $this->isRead; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function markRead(): self       { $this->isRead = true; return $this; }

    public function toArray(): array
    {
        return [
            'id'        => $this->id,
            'type'      => $this->type,
            'message'   => $this->message,
            'payload'   => $this->payload,
            'isRead'    => $this->isRead,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}
