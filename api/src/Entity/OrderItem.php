<?php
// src/Entity/OrderItem.php
namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 *   normalizationContext={"groups"={"order_item:read"}},
 *   denormalizationContext={"groups"={"order_item:write"}}
 * )
 * @ORM\Entity()
 * @ORM\Table(name="order_items")
 */
class OrderItem
{
    const TYPE_PRODUCT = 'PRODUCT';
    const TYPE_PACK    = 'PACK';

    /** @ORM\Id() @ORM\GeneratedValue() @ORM\Column(type="integer") @Groups({"order:read"}) */
    private ?int $id = null;

    /** @ORM\ManyToOne(targetEntity=Order::class, inversedBy="items") @ORM\JoinColumn(nullable=true) */
    private ?Order $order = null;

    /** @ORM\Column(type="string", length=10) @Groups({"order:read", "order:write"}) */
    private string $itemType = self::TYPE_PRODUCT;

    /** @ORM\Column(type="integer") @Groups({"order:read", "order:write"}) */
    private int $itemId;

    /** @ORM\Column(type="string", length=255) @Groups({"order:read", "order:write"}) */
    private string $itemName;

    /** @ORM\Column(type="float") @Groups({"order:read", "order:write"}) */
    private float $unitPrice;

    /** @ORM\Column(type="float") @Groups({"order:read", "order:write"}) */
    private float $finalPrice;

    /** @ORM\Column(type="integer") @Groups({"order:read", "order:write"}) */
    private int $quantity = 1;

    /** @ORM\Column(type="text", nullable=true) @Groups({"order:read", "order:write"}) */
    private ?string $notes = null;

    /** @ORM\Column(type="json", nullable=true) @Groups({"order:read"}) */
    private ?array $appliedPromotions = null;

    public function getId(): ?int { return $this->id; }
    public function getOrder(): ?Order { return $this->order; }
    public function setOrder(?Order $o): self { $this->order = $o; return $this; }
    public function getItemType(): string { return $this->itemType; }
    public function setItemType(string $t): self { $this->itemType = $t; return $this; }
    public function getItemId(): int { return $this->itemId; }
    public function setItemId(int $id): self { $this->itemId = $id; return $this; }
    public function getItemName(): string { return $this->itemName; }
    public function setItemName(string $n): self { $this->itemName = $n; return $this; }
    public function getUnitPrice(): float { return $this->unitPrice; }
    public function setUnitPrice(float $p): self { $this->unitPrice = $p; return $this; }
    public function getFinalPrice(): float { return $this->finalPrice; }
    public function setFinalPrice(float $p): self { $this->finalPrice = $p; return $this; }
    public function getQuantity(): int { return $this->quantity; }
    public function setQuantity(int $q): self { $this->quantity = $q; return $this; }
    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $n): self { $this->notes = $n; return $this; }
    public function getAppliedPromotions(): ?array { return $this->appliedPromotions; }
    public function setAppliedPromotions(?array $p): self { $this->appliedPromotions = $p; return $this; }
}
