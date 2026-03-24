<?php
// src/Entity/Table.php
namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiFilter;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Filter\BooleanFilter;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 *   normalizationContext={"groups"={"table:read"}},
 *   denormalizationContext={"groups"={"table:write"}}
 * )
 * @ApiFilter(BooleanFilter::class, properties={"isActive"})
 * @ORM\Entity()
 * @ORM\Table(name="restaurant_tables")
 */
class Table
{
    /**
     * @ORM\Id() @ORM\GeneratedValue() @ORM\Column(type="integer")
     * @Groups({"table:read"})
     */
    private ?int $id = null;

    /**
     * @ORM\Column(type="string", length=100)
     * @Groups({"table:read", "table:write", "order:read", "invoice:read"})
     */
    private string $name;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"table:read", "table:write", "order:read", "invoice:read"})
     */
    private int $capacity = 4;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"table:read", "table:write"})
     */
    private bool $isActive = true;

    /**
     * @ORM\Column(type="string", length=64, unique=true)
     * @Groups({"table:read"})
     */
    private string $qrToken;

    /**
     * @ORM\ManyToOne(targetEntity=Establishment::class)
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"table:read"})
     */
    private Establishment $establishment;

    public function __construct()
    {
        $this->qrToken = bin2hex(random_bytes(16));
    }

    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function setName(string $n): self { $this->name = $n; return $this; }
    public function getCapacity(): int { return $this->capacity; }
    public function setCapacity(int $c): self { $this->capacity = $c; return $this; }
    public function getIsActive(): bool { return $this->isActive; }
    public function setIsActive(bool $v): self { $this->isActive = $v; return $this; }
    public function getQrToken(): string { return $this->qrToken; }
    public function getEstablishment(): Establishment { return $this->establishment; }
    public function setEstablishment(Establishment $e): self { $this->establishment = $e; return $this; }
}
