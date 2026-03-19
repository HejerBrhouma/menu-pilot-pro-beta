<?php
// src/Entity/Invoice.php
namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiFilter;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Filter\SearchFilter;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 *   normalizationContext={"groups"={"invoice:read"}},
 *   denormalizationContext={"groups"={"invoice:write"}}
 * )
 * @ApiFilter(SearchFilter::class, properties={"status": "exact", "waiter": "exact"})
 * @ORM\Entity()
 * @ORM\Table(name="invoices")
 */
class Invoice
{
    const STATUS_PENDING   = 'PENDING';
    const STATUS_PAID      = 'PAID';
    const STATUS_CANCELLED = 'CANCELLED';

    const PAYMENT_CASH   = 'CASH';
    const PAYMENT_CARD   = 'CARD';
    const PAYMENT_CHEQUE = 'CHEQUE';
    const PAYMENT_OTHER  = 'OTHER';

    /** @ORM\Id() @ORM\GeneratedValue() @ORM\Column(type="integer") @Groups({"invoice:read"}) */
    private ?int $id = null;

    /** @ORM\Column(type="string", length=20, unique=true) @Groups({"invoice:read"}) */
    private string $invoiceNumber;

    /** @ORM\OneToOne(targetEntity=Order::class) @ORM\JoinColumn(nullable=false) @Groups({"invoice:read"}) */
    private Order $order;

    /** @ORM\ManyToOne(targetEntity=User::class) @ORM\JoinColumn(nullable=false) @Groups({"invoice:read"}) */
    private User $waiter;

    /** @ORM\Column(type="json") @Groups({"invoice:read"}) */
    private array $itemsSnapshot = [];

    /** @ORM\Column(type="float") @Groups({"invoice:read"}) */
    private float $subtotal;

    /** @ORM\Column(type="float") @Groups({"invoice:read"}) */
    private float $discount;

    /** @ORM\Column(type="float") @Groups({"invoice:read"}) */
    private float $total;

    /** @ORM\Column(type="string", length=20, nullable=true) @Groups({"invoice:read", "invoice:write"}) */
    private ?string $paymentMethod = null;

    /** @ORM\Column(type="string", length=20) @Groups({"invoice:read", "invoice:write"}) */
    private string $status = self::STATUS_PENDING;

    /** @ORM\Column(type="datetime", nullable=true) @Groups({"invoice:read"}) */
    private ?\DateTime $paidAt = null;

    /** @ORM\Column(type="text", nullable=true) @Groups({"invoice:read", "invoice:write"}) */
    private ?string $notes = null;

    /** @ORM\ManyToOne(targetEntity=Establishment::class) @ORM\JoinColumn(nullable=false) @Groups({"invoice:read"}) */
    private Establishment $establishment;

    /** @ORM\Column(type="datetime_immutable") @Groups({"invoice:read"}) */
    private \DateTimeImmutable $createdAt;

    public function __construct() { $this->createdAt = new \DateTimeImmutable(); }

    public function getId(): ?int { return $this->id; }
    public function getInvoiceNumber(): string { return $this->invoiceNumber; }
    public function setInvoiceNumber(string $n): self { $this->invoiceNumber = $n; return $this; }
    public function getOrder(): Order { return $this->order; }
    public function setOrder(Order $o): self { $this->order = $o; return $this; }
    public function getWaiter(): User { return $this->waiter; }
    public function setWaiter(User $u): self { $this->waiter = $u; return $this; }
    public function getItemsSnapshot(): array { return $this->itemsSnapshot; }
    public function setItemsSnapshot(array $s): self { $this->itemsSnapshot = $s; return $this; }
    public function getSubtotal(): float { return $this->subtotal; }
    public function setSubtotal(float $v): self { $this->subtotal = $v; return $this; }
    public function getDiscount(): float { return $this->discount; }
    public function setDiscount(float $v): self { $this->discount = $v; return $this; }
    public function getTotal(): float { return $this->total; }
    public function setTotal(float $v): self { $this->total = $v; return $this; }
    public function getPaymentMethod(): ?string { return $this->paymentMethod; }
    public function setPaymentMethod(?string $m): self { $this->paymentMethod = $m; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $s): self { $this->status = $s; return $this; }
    public function getPaidAt(): ?\DateTime { return $this->paidAt; }
    public function setPaidAt(?\DateTime $d): self { $this->paidAt = $d; return $this; }
    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $n): self { $this->notes = $n; return $this; }
    public function getEstablishment(): Establishment { return $this->establishment; }
    public function setEstablishment(Establishment $e): self { $this->establishment = $e; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
