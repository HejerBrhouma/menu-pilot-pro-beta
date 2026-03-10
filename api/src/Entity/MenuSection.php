<?php

// src/Entity/MenuSection.php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 *   normalizationContext={"groups"={"menu_section:read"}},
 *   denormalizationContext={"groups"={"menu_section:write"}}
 * )
 * @ORM\Entity()
 * @ORM\Table(name="menu_sections")
 */
class MenuSection
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     * @Groups({"menu_section:read", "menu:read"})
     */
    private ?int $id = null;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"menu_section:read", "menu_section:write", "menu:read", "menu:write"})
     */
    private string $title;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"menu_section:read", "menu_section:write", "menu:read", "menu:write"})
     */
    private int $position = 0;

    /**
     * @ORM\ManyToOne(targetEntity=Menu::class, inversedBy="sections")
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"menu_section:read", "menu_section:write"})
     */
    private ?Menu $menu = null;

    /**
     * @ORM\ManyToMany(targetEntity=Product::class)
     * @Groups({"menu_section:read", "menu_section:write", "menu:read", "menu:write"})
     */
    private Collection $products;

    /**
     * @ORM\ManyToMany(targetEntity=Pack::class)
     * @Groups({"menu_section:read", "menu_section:write", "menu:read", "menu:write"})
     */
    private Collection $packs;

    /**
     * @ORM\ManyToMany(targetEntity=Category::class)
     * @Groups({"menu_section:read", "menu_section:write", "menu:read", "menu:write"})
     */
    private Collection $categories;

    public function __construct()
    {
        $this->products   = new ArrayCollection();
        $this->packs      = new ArrayCollection();
        $this->categories = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): self { $this->title = $title; return $this; }

    public function getPosition(): int { return $this->position; }
    public function setPosition(int $position): self { $this->position = $position; return $this; }

    public function getMenu(): ?Menu { return $this->menu; }
    public function setMenu(?Menu $menu): self { $this->menu = $menu; return $this; }

    // ── Products ──────────────────────────────
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

    // ── Packs ─────────────────────────────────
    public function getPacks(): Collection { return $this->packs; }

    public function addPack(Pack $pack): self
    {
        if (!$this->packs->contains($pack)) {
            $this->packs[] = $pack;
        }
        return $this;
    }

    public function removePack(Pack $pack): self
    {
        $this->packs->removeElement($pack);
        return $this;
    }

    // ── Categories ────────────────────────────
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