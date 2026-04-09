<?php

// src/Entity/Menu.php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiFilter;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Filter\SearchFilter;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 *   normalizationContext={"groups"={"menu:read"}},
 *   denormalizationContext={"groups"={"menu:write"}}
 * )
 * @ApiFilter(SearchFilter::class, properties={"qrToken": "exact", "establishment": "exact"})
 * @ORM\Entity()
 * @ORM\Table(name="menus")
 * @ORM\HasLifecycleCallbacks()
 */
class Menu
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     * @Groups({"menu:read"})
     */
    private ?int $id = null;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"menu:read", "menu:write"})
     */
    private string $name;

    /**
     * @ORM\Column(type="text", nullable=true)
     * @Groups({"menu:read", "menu:write"})
     */
    private ?string $description = null;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"menu:read", "menu:write"})
     */
    private bool $isActive = true;

    /**
     * @ORM\Column(type="string", length=5, nullable=true)
     * @Groups({"menu:read", "menu:write"})
     */
    private ?string $timeStart = null;

    /**
     * @ORM\Column(type="string", length=5, nullable=true)
     * @Groups({"menu:read", "menu:write"})
     */
    private ?string $timeEnd = null;

    /**
     * @ORM\Column(type="string", length=64, unique=true)
     * @Groups({"menu:read"})
     */
    private string $qrToken;

    /**
     * @ORM\Column(type="datetime_immutable")
     * @Groups({"menu:read"})
     */
    private \DateTimeImmutable $createdAt;

    /**
     * Enseigne propriétaire de ce menu
     * @ORM\ManyToOne(targetEntity=Establishment::class)
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"menu:read"})
     */
    private Establishment $establishment;

    /**
     * @ORM\OneToMany(
     *   targetEntity=MenuSection::class,
     *   mappedBy="menu",
     *   cascade={"persist", "remove"},
     *   orphanRemoval=true
     * )
     * @ORM\OrderBy({"position"="ASC"})
     * @Groups({"menu:read", "menu:write"})
     */
    private Collection $sections;

    public function __construct()
    {
        $this->sections  = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->qrToken   = bin2hex(random_bytes(16));
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): self { $this->description = $description; return $this; }

    public function getIsActive(): bool { return $this->isActive; }
    public function setIsActive(bool $isActive): self { $this->isActive = $isActive; return $this; }

    public function getTimeStart(): ?string { return $this->timeStart; }
    public function setTimeStart(?string $timeStart): self { $this->timeStart = $timeStart; return $this; }

    public function getTimeEnd(): ?string { return $this->timeEnd; }
    public function setTimeEnd(?string $timeEnd): self { $this->timeEnd = $timeEnd; return $this; }

    public function getQrToken(): string { return $this->qrToken; }
    public function setQrToken(string $qrToken): self { $this->qrToken = $qrToken; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function getEstablishment(): Establishment { return $this->establishment; }
    public function setEstablishment(Establishment $establishment): self
    {
        $this->establishment = $establishment;
        return $this;
    }

    public function getSections(): Collection { return $this->sections; }

    public function addSection(MenuSection $section): self
    {
        if (!$this->sections->contains($section)) {
            $this->sections[] = $section;
            $section->setMenu($this);
        }
        return $this;
    }

    public function removeSection(MenuSection $section): self
    {
        if ($this->sections->removeElement($section)) {
            if ($section->getMenu() === $this) {
                $section->setMenu(null);
            }
        }
        return $this;
    }
}