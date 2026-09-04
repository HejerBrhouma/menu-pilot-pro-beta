<?php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiFilter;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Filter\BooleanFilter;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Filter\SearchFilter;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 * normalizationContext={"groups"={"pack:read"}},
 * denormalizationContext={"groups"={"pack:write"}}
 * )
 * @ApiFilter(BooleanFilter::class, properties={"isActive"})
 * @ApiFilter(SearchFilter::class, properties={"establishment": "exact"})
 * @ORM\Entity()
 */
class Pack
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     * @Groups({"pack:read", "menu:read"})
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"pack:read", "pack:write", "menu:read"})
     */
    private $name;

    /**
     * @ORM\Column(type="text", nullable=true)
     * @Groups({"pack:read", "pack:write", "menu:read"})
     */
    private $description;

    /**
     * @ORM\Column(type="float")
     * @Groups({"pack:read", "pack:write", "menu:read"})
     */
    private $price;

    /**
     * @ORM\ManyToMany(targetEntity=Product::class)
     * @Groups({"pack:read", "pack:write", "menu:read"})
     */
    private $products;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"pack:read", "pack:write", "menu:read"})
     */
    private $isActive = true;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"pack:read", "pack:write", "menu:read"})
     */
    private bool $trackStock = false;

    /**
     * @ORM\Column(type="integer", nullable=true)
     * @Groups({"pack:read", "pack:write", "menu:read"})
     */
    private ?int $stock = null;

    /**
     * Enseigne propriétaire de ce menu
     * @ORM\ManyToOne(targetEntity=Establishment::class)
     * @ORM\JoinColumn(nullable=true)
     * @Groups({"menu:read"})
     */
    private Establishment $establishment;

    public function __construct()
    {
        $this->products = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): ?string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): self { $this->description = $description; return $this; }

    public function getPrice(): ?float { return $this->price; }
    public function setPrice(float $price): self { $this->price = $price; return $this; }

    public function getIsActive(): ?bool { return $this->isActive; }
    public function setIsActive(bool $isActive): self { $this->isActive = $isActive; return $this; }

    public function getEstablishment(): Establishment { return $this->establishment; }
    public function setEstablishment(Establishment $establishment): self
    {
        $this->establishment = $establishment;
        return $this;
    }

    /** @return Collection|Product[] */
    public function getProducts(): Collection { return $this->products; }

    public function addProduct(Product $product): self
    {
        if (!$this->products->contains($product)) {
            $this->products[] = $product;
        }
        return $this;
    }

    public function removeProduct(Product $product): self
    {
        $this->products->removeElement($product);
        return $this;
    }

    public function getTrackStock(): bool { return $this->trackStock; }
    public function setTrackStock(bool $v): self { $this->trackStock = $v; return $this; }

    public function getStock(): ?int { return $this->stock; }
    public function setStock(?int $v): self { $this->stock = $v; return $this; }

    public function isOutOfStock(): bool
    {
        return $this->trackStock && $this->stock !== null && $this->stock <= 0;
    }
}