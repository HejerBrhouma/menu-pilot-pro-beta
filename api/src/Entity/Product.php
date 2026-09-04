<?php
// src/Entity/Product.php

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
 *   normalizationContext={"groups"={"product:read"}},
 *   denormalizationContext={"groups"={"product:write"}}
 * )
 * @ApiFilter(BooleanFilter::class, properties={"isAvailable"})
 * @ApiFilter(SearchFilter::class, properties={"establishment": "exact"})
 * @ORM\Entity()
 * @ORM\Table(name="products")
 */
class Product
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     * @Groups({"product:read", "menu:read"})
     */
    private ?int $id = null;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"product:read", "product:write", "invoice:read", "order:read", "pack:read", "menu:read"})
     */
    private string $name = '';

    /**
     * @ORM\Column(type="float")
     * @Groups({"product:read", "product:write", "invoice:read", "order:read", "pack:read", "menu:read"})
     */
    private float $price = 0;

    /**
     * Description courte du produit
     * @ORM\Column(type="text", nullable=true)
     * @Groups({"product:read", "product:write", "menu:read"})
     */
    private ?string $description = null;

    /** Nom du fichier image stocké dans /uploads/products/
     *  @ORM\Column(type="string", length=255, nullable=true)
     *  @Groups({"product:read","product:write","menu:read","pack:read", "invoice:read"})
     */
    private ?string $image = null;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"product:read", "product:write"})
     */
    private bool $isAvailable = true;

    /**
     * Si true, la quantité en stock est suivie
     * @ORM\Column(type="boolean")
     * @Groups({"product:read", "product:write", "menu:read"})
     */
    private bool $trackStock = false;

    /**
     * Quantité disponible en stock (null = non suivi)
     * @ORM\Column(type="integer", nullable=true)
     * @Groups({"product:read", "product:write", "menu:read"})
     */
    private ?int $stock = null;

    /**
     * @ORM\ManyToMany(targetEntity=Category::class, inversedBy="products")
     * @Groups({"product:read", "product:write"})
     */
    private Collection $categories;

    /**
     * @ORM\ManyToOne(targetEntity=Establishment::class)
     * @ORM\JoinColumn(nullable=true)
     * @Groups({"product:read"})
     */
    private ?Establishment $establishment = null;

    public function __construct()
    {
        $this->categories = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }

    public function getPrice(): float { return $this->price; }
    public function setPrice(float $price): self { $this->price = $price; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $d): self { $this->description = $d; return $this; }

    public function getImage(): ?string { return $this->image; }
    public function setImage(?string $image): self { $this->image = $image; return $this; }

    public function getIsAvailable(): bool { return $this->isAvailable; }
    public function setIsAvailable(bool $v): self { $this->isAvailable = $v; return $this; }

    public function getCategories(): Collection { return $this->categories; }
    public function addCategory(Category $category): self {
        if (!$this->categories->contains($category)) {
            $this->categories[] = $category;
        }
        return $this;
    }
    public function removeCategory(Category $category): self {
        $this->categories->removeElement($category);
        return $this;
    }

    public function getEstablishment(): ?Establishment { return $this->establishment; }
    public function setEstablishment(?Establishment $e): self { $this->establishment = $e; return $this; }

    public function getTrackStock(): bool { return $this->trackStock; }
    public function setTrackStock(bool $v): self { $this->trackStock = $v; return $this; }

    public function getStock(): ?int { return $this->stock; }
    public function setStock(?int $v): self { $this->stock = $v; return $this; }

    public function isOutOfStock(): bool
    {
        return $this->trackStock && $this->stock !== null && $this->stock <= 0;
    }
}