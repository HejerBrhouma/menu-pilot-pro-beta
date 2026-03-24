<?php
// src/Entity/Order.php
namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiFilter;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Core\Annotation\ApiProperty;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 *   normalizationContext={"groups"={"order:read"}},
 *   denormalizationContext={"groups"={"order:write"}}
 * )
 * @ApiFilter(SearchFilter::class, properties={"status": "exact", "waiter": "exact", "table": "exact"})
 * @ORM\Entity()
 * @ORM\Table(name="orders")
 * @ORM\HasLifecycleCallbacks()
 */
class Order
{
    const STATUS_PENDING   = 'PENDING';
    const STATUS_CONFIRMED = 'CONFIRMED';
    const STATUS_SERVED    = 'SERVED';
    const STATUS_PAID      = 'PAID';
    const STATUS_CANCELLED = 'CANCELLED';

    const TYPE_TABLE    = 'TABLE';
    const TYPE_TAKEAWAY = 'TAKEAWAY';

    /**
     * @ORM\Id() @ORM\GeneratedValue() @ORM\Column(type="integer")
     * @Groups({"order:read"})
     */
    private ?int $id = null;

    /** @ORM\Column(type="string") @Groups({"order:read", "invoice:read"}) */
    private string $orderNumber;



    /**
     * @ORM\ManyToOne(targetEntity=Table::class)
     * @ORM\JoinColumn(nullable=true)
     * @Groups({"order:read", "order:write", "invoice:read"})
     * @ApiProperty(readableLink=true)
     */
    private ?Table $table = null;

    /**
     * @ORM\Column(type="string", length=20)
     * @Groups({"order:read", "order:write", "invoice:read"})
     */
    private string $type = self::TYPE_TABLE;

    /**
     * PENDING | CONFIRMED | SERVED | PAID | CANCELLED
     * @ORM\Column(type="string", length=20)
     * @Groups({"order:read", "order:write"})
     */
    private string $status = self::STATUS_PENDING;

    /**
     * @ORM\ManyToOne(targetEntity=User::class)
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"order:read"})
     */
    private User $waiter;

    /**
     * @ORM\Column(type="float")
     * @Groups({"order:read"})
     */
    private float $subtotal = 0;

    /**
     * @ORM\Column(type="float")
     * @Groups({"order:read"})
     */
    private float $discount = 0;

    /**
     * @ORM\Column(type="float")
     * @Groups({"order:read"})
     */
    private float $total = 0;

    /**
     * @ORM\Column(type="text", nullable=true)
     * @Groups({"order:read", "order:write"})
     */
    private ?string $notes = null;

    /**
     * @ORM\OneToMany(targetEntity=OrderItem::class, mappedBy="order",
     *   cascade={"persist","remove"}, orphanRemoval=true)
     * @Groups({"order:read", "order:write"})
     */
    private Collection $items;

    /**
     * @ORM\ManyToOne(targetEntity=Establishment::class)
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"order:read"})
     */
    private Establishment $establishment;

    /**
     * Prénom du client (commande via QR)
     * @ORM\Column(type="string", length=100, nullable=true)
     * @Groups({"order:read", "order:write"})
     */
    private ?string $customerName = null;

    /**
     * Commande passée via QR Code client
     * @ORM\Column(type="boolean")
     * @Groups({"order:read", "order:write"})
     */
    private bool $isQrOrder = false;

    /**
     * @ORM\Column(type="datetime_immutable")
     * @Groups({"order:read"})
     */
    private \DateTimeImmutable $createdAt;

    /**
     * @ORM\Column(type="datetime", nullable=true)
     * @Groups({"order:read"})
     */
    private ?\DateTime $updatedAt = null;

    public function __construct()
    {
        $this->items     = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    /** @ORM\PreUpdate() */
    public function onPreUpdate(): void { $this->updatedAt = new \DateTime(); }

    public function getId(): ?int { return $this->id; }
    public function getOrderNumber(): string { return $this->orderNumber; }
    public function setOrderNumber(string $n): self { $this->orderNumber = $n; return $this; }
    public function getType(): string { return $this->type; }
    public function setType(string $t): self { $this->type = $t; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $s): self { $this->status = $s; return $this; }
    public function getTable(): ?Table { return $this->table; }
    public function setTable(?Table $t): self { $this->table = $t; return $this; }
    public function getWaiter(): User { return $this->waiter; }
    public function setWaiter(User $u): self { $this->waiter = $u; return $this; }
    public function getSubtotal(): float { return $this->subtotal; }
    public function setSubtotal(float $v): self { $this->subtotal = $v; return $this; }
    public function getDiscount(): float { return $this->discount; }
    public function setDiscount(float $v): self { $this->discount = $v; return $this; }
    public function getTotal(): float { return $this->total; }
    public function setTotal(float $v): self { $this->total = $v; return $this; }
    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $n): self { $this->notes = $n; return $this; }
    public function getItems(): Collection { return $this->items; }
    public function addItem(OrderItem $item): self {
        if (!$this->items->contains($item)) {
            $this->items[] = $item;
            $item->setOrder($this);
        }
        return $this;
    }
    public function removeItem(OrderItem $item): self {
        if ($this->items->removeElement($item) && $item->getOrder() === $this) {
            $item->setOrder(null);
        }
        return $this;
    }
    public function getEstablishment(): Establishment { return $this->establishment; }
    public function setEstablishment(Establishment $e): self { $this->establishment = $e; return $this; }
    public function getCustomerName(): ?string { return $this->customerName; }
    public function setCustomerName(?string $n): self { $this->customerName = $n; return $this; }
    public function getIsQrOrder(): bool { return $this->isQrOrder; }
    public function setIsQrOrder(bool $v): self { $this->isQrOrder = $v; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTime { return $this->updatedAt; }

    public function recalculate(): void
    {
        $subtotal = 0;
        $discount = 0;
        foreach ($this->items as $item) {
            $subtotal += $item->getUnitPrice() * $item->getQuantity();
            $discount += ($item->getUnitPrice() - $item->getFinalPrice()) * $item->getQuantity();
        }
        $this->subtotal = round($subtotal, 2);
        $this->discount = round($discount, 2);
        $this->total    = round($subtotal - $discount, 2);
    }
}
