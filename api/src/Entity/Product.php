<?php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 * normalizationContext={"groups"={"product:read"}},
 * denormalizationContext={"groups"={"product:write"}}
 * )
 * @ORM\Entity()
 */
class Product
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     * @Groups({"product:read", "menu:read"})
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"product:read", "product:write", "menu:read"})
     */
    private $name;

    /**
     * @ORM\Column(type="float")
     * @Groups({"product:read", "product:write", "menu:read"})
     */
    private $price;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"product:read", "product:write", "menu:read"})
     */
    private bool $isAvailable = true;

    /**
     * @ORM\ManyToMany(targetEntity=Category::class, inversedBy="products")
     * @Groups({"product:read", "product:write"})
     */
    private $categories;

    public function __construct()
    {
        $this->categories = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): ?string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }

    public function getPrice(): ?float { return $this->price; }
    public function setPrice(float $price): self { $this->price = $price; return $this; }

    public function getIsAvailable(): bool { return $this->isAvailable; }
    public function setIsAvailable(bool $isAvailable): self { $this->isAvailable = $isAvailable; return $this; }

    /** @return Collection|Category[] */
    public function getCategories(): Collection { return $this->categories; }

    public function addCategory(Category $category): self
    {
        if (!$this->categories->contains($category)) {
            $this->categories[] = $category;
        }
        return $this;
    }

    public function removeCategory(Category $category): self
    {
        $this->categories->removeElement($category);
        return $this;
    }
}