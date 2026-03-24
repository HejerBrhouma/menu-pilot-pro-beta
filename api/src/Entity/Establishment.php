<?php

// src/Entity/Establishment.php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiFilter;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Filter\SearchFilter;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ApiResource(
 *   normalizationContext={"groups"={"establishment:read"}},
 *   denormalizationContext={"groups"={"establishment:write"}},
 *   collectionOperations={
 *     "get",
 *     "post"
 *   },
 *   itemOperations={
 *     "get",
 *     "put",
 *     "patch"={"input_formats"={"json"={"application/merge-patch+json"}}},
 *     "delete"
 *   }
 * )
 * @ApiFilter(SearchFilter::class, properties={"slug": "exact", "owner": "exact"})
 * @ORM\Entity()
 * @ORM\Table(name="establishments")
 * @ORM\HasLifecycleCallbacks()
 */
class Establishment
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     * @Groups({"establishment:read"})
     */
    private ?int $id = null;

    /** @Groups({"establishment:read", "invoice:read"}) */
    private ?string $name = null;

    /**
     * Slug unique pour l'URL publique /r/{slug}
     * @ORM\Column(type="string", length=100, unique=true)
     * @Assert\NotBlank()
     * @Assert\Regex("/^[a-z0-9-]+$/")
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $slug = null;

    /**
     * @ORM\Column(type="text", nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $description = null;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $email = null;

    /**
     * @ORM\Column(type="string", length=30, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $phone = null;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $address = null;

    /**
     * @ORM\Column(type="string", length=100, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $city = null;

    /**
     * @ORM\Column(type="string", length=100, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $country = null;

    /**
     * Nom du fichier logo (stocké dans public/uploads/logos/)
     * @ORM\Column(type="string", length=255, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $logo = null;

    /**
     * Couleur principale du thème (hex)
     * @ORM\Column(type="string", length=7, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $primaryColor = '#6366f1';

    /**
     * Couleur secondaire du thème (hex)
     * @ORM\Column(type="string", length=7, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $secondaryColor = '#ec4899';

    /**
     * Horaires JSON : {"monday":{"open":"08:00","close":"22:00","closed":false}, ...}
     * @ORM\Column(type="json", nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?array $openingHours = null;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $website = null;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $instagram = null;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?string $facebook = null;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"establishment:read", "establishment:write"})
     */
    private bool $isActive = true;

    /**
     * @ORM\ManyToOne(targetEntity=User::class)
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?User $owner = null;

    /**
     * @ORM\Column(type="date", nullable=true)
     * @Groups({"establishment:read", "establishment:write"})
     */
    private ?\DateTime $anniversaryDate = null;

    /**
     * @ORM\Column(type="datetime_immutable")
     * @Groups({"establishment:read"})
     */
    private \DateTimeImmutable $createdAt;

    /**
     * @ORM\Column(type="datetime_immutable", nullable=true)
     * @Groups({"establishment:read"})
     */
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->openingHours = $this->defaultOpeningHours();
    }

    /** @ORM\PreUpdate() */
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    private function defaultOpeningHours(): array
    {
        $days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        $hours = [];
        foreach ($days as $day) {
            $hours[$day] = ['open' => '08:00', 'close' => '22:00', 'closed' => false];
        }
        return $hours;
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): ?string { return $this->name ?? null; }
    public function setName(?string $name): self { $this->name = $name; return $this; }

    public function getSlug(): ?string { return $this->slug; }
    public function setSlug(?string $slug): self { $this->slug = $slug; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): self { $this->description = $description; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(?string $email): self { $this->email = $email; return $this; }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $phone): self { $this->phone = $phone; return $this; }

    public function getAddress(): ?string { return $this->address; }
    public function setAddress(?string $address): self { $this->address = $address; return $this; }

    public function getCity(): ?string { return $this->city; }
    public function setCity(?string $city): self { $this->city = $city; return $this; }

    public function getCountry(): ?string { return $this->country; }
    public function setCountry(?string $country): self { $this->country = $country; return $this; }

    public function getLogo(): ?string { return $this->logo; }
    public function setLogo(?string $logo): self { $this->logo = $logo; return $this; }

    public function getPrimaryColor(): ?string { return $this->primaryColor; }
    public function setPrimaryColor(?string $primaryColor): self { $this->primaryColor = $primaryColor; return $this; }

    public function getSecondaryColor(): ?string { return $this->secondaryColor; }
    public function setSecondaryColor(?string $secondaryColor): self { $this->secondaryColor = $secondaryColor; return $this; }

    public function getOpeningHours(): ?array { return $this->openingHours; }
    public function setOpeningHours(?array $openingHours): self { $this->openingHours = $openingHours; return $this; }

    public function getWebsite(): ?string { return $this->website; }
    public function setWebsite(?string $website): self { $this->website = $website; return $this; }

    public function getInstagram(): ?string { return $this->instagram; }
    public function setInstagram(?string $instagram): self { $this->instagram = $instagram; return $this; }

    public function getFacebook(): ?string { return $this->facebook; }
    public function setFacebook(?string $facebook): self { $this->facebook = $facebook; return $this; }

    public function getIsActive(): bool { return $this->isActive; }
    public function setIsActive(bool $isActive): self { $this->isActive = $isActive; return $this; }

    public function getOwner(): ?User { return $this->owner; }
    public function setOwner(?User $owner): self { $this->owner = $owner; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
}