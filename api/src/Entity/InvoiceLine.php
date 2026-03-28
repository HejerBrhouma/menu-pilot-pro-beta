<?php
// src/Entity/InvoiceLine.php
namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 *   normalizationContext={"groups"={"invoice_line:read"}},
 *   collectionOperations={},
 *   itemOperations={"get"}
 * )
 * @ORM\Entity()
 * @ORM\Table(name="invoice_lines")
 */
class InvoiceLine
{
    /**
     * @ORM\Id() @ORM\GeneratedValue() @ORM\Column(type="integer")
     * @Groups({"invoice_line:read", "invoice:read"})
     */
    private ?int $id = null;

    /**
     * @ORM\ManyToOne(targetEntity=Invoice::class, inversedBy="lines")
     * @ORM\JoinColumn(nullable=false, onDelete="CASCADE")
     */
    private Invoice $invoice;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"invoice_line:read", "invoice:read"})
     */
    private string $description;

    /**
     * @ORM\Column(type="string", length=20)
     * @Groups({"invoice_line:read", "invoice:read"})
     */
    private string $itemType;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"invoice_line:read", "invoice:read"})
     */
    private int $itemId;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"invoice_line:read", "invoice:read"})
     */
    private int $quantity;

    /**
     * Prix net unitaire HT (après promotions)
     * @ORM\Column(type="float")
     * @Groups({"invoice_line:read", "invoice:read"})
     */
    private float $unitPrice;

    /**
     * unitPrice × quantity
     * @ORM\Column(type="float")
     * @Groups({"invoice_line:read", "invoice:read"})
     */
    private float $total;

    public function getId(): ?int                  { return $this->id; }
    public function getInvoice(): Invoice          { return $this->invoice; }
    public function setInvoice(Invoice $i): self   { $this->invoice = $i; return $this; }
    public function getDescription(): string       { return $this->description; }
    public function setDescription(string $d): self { $this->description = $d; return $this; }
    public function getItemType(): string          { return $this->itemType; }
    public function setItemType(string $t): self   { $this->itemType = $t; return $this; }
    public function getItemId(): int               { return $this->itemId; }
    public function setItemId(int $i): self        { $this->itemId = $i; return $this; }
    public function getQuantity(): int             { return $this->quantity; }
    public function setQuantity(int $q): self      { $this->quantity = $q; return $this; }
    public function getUnitPrice(): float          { return $this->unitPrice; }
    public function setUnitPrice(float $p): self   { $this->unitPrice = $p; return $this; }
    public function getTotal(): float              { return $this->total; }
    public function setTotal(float $t): self       { $this->total = $t; return $this; }
}
