<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ORM\Entity()
 * @ORM\Table(name="gallery_images")
 * @ORM\HasLifecycleCallbacks()
 */
class GalleryImage
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     * @Groups({"gallery:read"})
     */
    private ?int $id = null;

    /**
     * @ORM\ManyToOne(targetEntity=Establishment::class)
     * @ORM\JoinColumn(nullable=false, onDelete="CASCADE")
     */
    private Establishment $establishment;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"gallery:read"})
     */
    private string $filename;

    /**
     * @ORM\Column(type="string", length=120, nullable=true)
     * @Groups({"gallery:read"})
     */
    private ?string $title = null;

    /**
     * @ORM\Column(type="string", length=80, options={"default": "Autre"})
     * @Groups({"gallery:read"})
     */
    private string $category = 'Autre';

    /**
     * @ORM\Column(type="integer", options={"default": 0})
     * @Groups({"gallery:read"})
     */
    private int $position = 0;

    /**
     * @ORM\Column(type="datetime_immutable")
     * @Groups({"gallery:read"})
     */
    private \DateTimeImmutable $createdAt;

    /** @ORM\PrePersist */
    public function initDates(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getEstablishment(): Establishment { return $this->establishment; }
    public function setEstablishment(Establishment $e): self { $this->establishment = $e; return $this; }
    public function getFilename(): string { return $this->filename; }
    public function setFilename(string $f): self { $this->filename = $f; return $this; }
    public function getTitle(): ?string { return $this->title; }
    public function setTitle(?string $t): self { $this->title = $t; return $this; }
    public function getCategory(): string { return $this->category; }
    public function setCategory(string $c): self { $this->category = $c; return $this; }
    public function getPosition(): int { return $this->position; }
    public function setPosition(int $p): self { $this->position = $p; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
