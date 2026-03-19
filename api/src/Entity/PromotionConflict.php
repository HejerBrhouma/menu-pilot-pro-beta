<?php

// src/Entity/PromotionConflict.php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiFilter;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Filter\BooleanFilter;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 *   normalizationContext={"groups"={"conflict:read"}},
 *   denormalizationContext={"groups"={"conflict:write"}},
 *   collectionOperations={
 *     "get"={"security"="is_granted('ROLE_USER')"}
 *   },
 *   itemOperations={
 *     "get"={"security"="is_granted('ROLE_USER')"},
 *     "patch"={
 *       "security"="is_granted('ROLE_ADMIN') or is_granted('ROLE_MANAGER')",
 *       "input_formats"={"json"={"application/merge-patch+json"}}
 *     }
 *   }
 * )
 * @ApiFilter(BooleanFilter::class, properties={"isResolved"})
 * @ORM\Entity()
 * @ORM\Table(name="promotion_conflicts")
 */
class PromotionConflict
{
    const RESOLUTION_CUMUL = 'CUMUL';
    const RESOLUTION_BEST  = 'BEST';

    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     * @Groups({"conflict:read"})
     */
    private ?int $id = null;

    /**
     * @ORM\ManyToOne(targetEntity=Establishment::class)
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"conflict:read"})
     */
    private Establishment $establishment;

    /**
     * PRODUCT | PACK
     * @ORM\Column(type="string", length=20)
     * @Groups({"conflict:read"})
     */
    private string $targetType;

    /**
     * ID du produit ou pack concerné
     * @ORM\Column(type="integer")
     * @Groups({"conflict:read"})
     */
    private int $targetId;

    /**
     * Nom du produit/pack pour affichage
     * @ORM\Column(type="string", length=255)
     * @Groups({"conflict:read"})
     */
    private string $targetName;

    /**
     * IDs des promotions en conflit [1, 2, 3]
     * @ORM\Column(type="json")
     * @Groups({"conflict:read"})
     */
    private array $promotionIds = [];

    /**
     * CUMUL | BEST | null
     * @ORM\Column(type="string", length=10, nullable=true)
     * @Groups({"conflict:read", "conflict:write"})
     */
    private ?string $resolution = null;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"conflict:read"})
     */
    private bool $isResolved = false;

    /**
     * @ORM\Column(type="datetime", nullable=true)
     * @Groups({"conflict:read"})
     */
    private ?\DateTime $resolvedAt = null;

    /**
     * @ORM\ManyToOne(targetEntity=User::class)
     * @ORM\JoinColumn(nullable=true)
     * @Groups({"conflict:read"})
     */
    private ?User $resolvedBy = null;

    /**
     * Délai auto-résolution : 3h après création
     * @ORM\Column(type="datetime")
     * @Groups({"conflict:read"})
     */
    private \DateTime $autoResolveAt;

    /**
     * @ORM\Column(type="datetime_immutable")
     * @Groups({"conflict:read"})
     */
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt    = new \DateTimeImmutable();
        // Auto-résolution dans 3 heures
        $this->autoResolveAt = (new \DateTime())->modify('+3 hours');
    }

    public function getId(): ?int { return $this->id; }

    public function getEstablishment(): Establishment { return $this->establishment; }
    public function setEstablishment(Establishment $e): self { $this->establishment = $e; return $this; }

    public function getTargetType(): string { return $this->targetType; }
    public function setTargetType(string $t): self { $this->targetType = $t; return $this; }

    public function getTargetId(): int { return $this->targetId; }
    public function setTargetId(int $id): self { $this->targetId = $id; return $this; }

    public function getTargetName(): string { return $this->targetName; }
    public function setTargetName(string $n): self { $this->targetName = $n; return $this; }

    public function getPromotionIds(): array { return $this->promotionIds; }
    public function setPromotionIds(array $ids): self { $this->promotionIds = $ids; return $this; }

    public function getResolution(): ?string { return $this->resolution; }
    public function setResolution(?string $r): self { $this->resolution = $r; return $this; }

    public function getIsResolved(): bool { return $this->isResolved; }
    public function setIsResolved(bool $v): self { $this->isResolved = $v; return $this; }

    public function getResolvedAt(): ?\DateTime { return $this->resolvedAt; }
    public function setResolvedAt(?\DateTime $d): self { $this->resolvedAt = $d; return $this; }

    public function getResolvedBy(): ?User { return $this->resolvedBy; }
    public function setResolvedBy(?User $u): self { $this->resolvedBy = $u; return $this; }

    public function getAutoResolveAt(): \DateTime { return $this->autoResolveAt; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    /** Vérifie si le délai de 3h est dépassé */
    public function isAutoResolveExpired(): bool
    {
        return new \DateTime() >= $this->autoResolveAt;
    }
}