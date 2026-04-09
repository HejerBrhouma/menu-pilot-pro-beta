<?php
// src/Entity/Review.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ORM\Entity()
 * @ORM\Table(name="reviews")
 */
class Review
{
    const TARGET_ESTABLISHMENT = 'ESTABLISHMENT';
    const TARGET_PRODUCT       = 'PRODUCT';
    const TARGET_PACK          = 'PACK';

    /**
     * @ORM\Id() @ORM\GeneratedValue() @ORM\Column(type="integer")
     * @Groups({"review:read"})
     */
    private ?int $id = null;

    /**
     * @ORM\ManyToOne(targetEntity=User::class)
     * @ORM\JoinColumn(nullable=true)
     * @Groups({"review:read"})
     */
    private ?User $customer = null;

    /**
     * @ORM\ManyToOne(targetEntity=Order::class)
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"review:read"})
     */
    private Order $order;

    /**
     * @ORM\ManyToOne(targetEntity=Establishment::class)
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"review:read"})
     */
    private Establishment $establishment;

    /**
     * ESTABLISHMENT / PRODUCT / PACK
     * @ORM\Column(type="string", length=20)
     * @Groups({"review:read", "review:write"})
     */
    private string $targetType;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"review:read", "review:write"})
     */
    private int $targetId;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"review:read", "review:write"})
     */
    private int $rating = 5;

    /**
     * @ORM\Column(type="text", nullable=true)
     * @Groups({"review:read", "review:write"})
     */
    private ?string $comment = null;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     * @Groups({"review:read"})
     */
    private ?string $photo = null;

    /**
     * null = pas de like/dislike, true = like, false = dislike
     * @ORM\Column(type="boolean", nullable=true)
     * @Groups({"review:read", "review:write"})
     */
    private ?bool $isLiked = null;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"review:read"})
     */
    private bool $isApproved = false;

    /**
     * Nom du visiteur anonyme (si non connecté)
     * @ORM\Column(type="string", length=100, nullable=true)
     * @Groups({"review:read"})
     */
    private ?string $guestName = null;

    /**
     * @ORM\Column(type="datetime_immutable")
     * @Groups({"review:read"})
     */
    private \DateTimeImmutable $createdAt;

    public function __construct() { $this->createdAt = new \DateTimeImmutable(); }

    public function getId(): ?int { return $this->id; }
    public function getCustomer(): ?User { return $this->customer; }
    public function setCustomer(?User $c): self { $this->customer = $c; return $this; }
    public function getOrder(): Order { return $this->order; }
    public function setOrder(Order $o): self { $this->order = $o; return $this; }
    public function getEstablishment(): Establishment { return $this->establishment; }
    public function setEstablishment(Establishment $e): self { $this->establishment = $e; return $this; }
    public function getTargetType(): string { return $this->targetType; }
    public function setTargetType(string $t): self { $this->targetType = $t; return $this; }
    public function getTargetId(): int { return $this->targetId; }
    public function setTargetId(int $id): self { $this->targetId = $id; return $this; }
    public function getRating(): int { return $this->rating; }
    public function setRating(int $r): self { $this->rating = max(1, min(5, $r)); return $this; }
    public function getComment(): ?string { return $this->comment; }
    public function setComment(?string $c): self { $this->comment = $c; return $this; }
    public function getPhoto(): ?string { return $this->photo; }
    public function setPhoto(?string $p): self { $this->photo = $p; return $this; }
    public function getIsLiked(): ?bool { return $this->isLiked; }
    public function setIsLiked(?bool $l): self { $this->isLiked = $l; return $this; }
    public function getIsApproved(): bool { return $this->isApproved; }
    public function setIsApproved(bool $a): self { $this->isApproved = $a; return $this; }
    public function getGuestName(): ?string { return $this->guestName; }
    public function setGuestName(?string $n): self { $this->guestName = $n; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}