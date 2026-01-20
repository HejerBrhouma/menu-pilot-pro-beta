<?php

namespace App\Entity;

use App\Repository\RefreshTokenRepository;
use Doctrine\ORM\Mapping as ORM;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenInterface;
use DateTimeImmutable;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * @ORM\Entity(repositoryClass=RefreshTokenRepository::class)
 *
 */
class RefreshToken implements RefreshTokenInterface
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="datetime_immutable", nullable=true)
     */
    private $expiresAt;

    /**
     * @ORM\Column(type="datetime_immutable", nullable=true)
     */
    private $createdAt;

    /**
     * @ORM\Column(type="datetime_immutable", nullable=true)
     */
    private $lastUsedAt;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $refreshToken; // <--- ESSENTIEL POUR LE MAPPING

    /**
     * @ORM\ManyToOne(targetEntity=User::class, inversedBy="refreshTokens")
     * @ORM\JoinColumn(nullable=false) // Ajout de nullable=false pour la relation ManyToOne
     */
    private ?User $user = null;


    public function getId(): ?int
    {
        return $this->id;
    }

    public function getExpiresAt(): ?\DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(?\DateTimeImmutable $expiresAt): self
    {
        $this->expiresAt = $expiresAt;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(?\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getLastUsedAt(): ?\DateTimeImmutable
    {
        return $this->lastUsedAt;
    }

    public function setLastUsedAt(?\DateTimeImmutable $lastUsedAt): self
    {
        $this->lastUsedAt = $lastUsedAt;

        return $this;
    }

    public function getToken(): string
    {
        return $this->refreshToken;
    }

    public function setToken(string $token): self
    {
        $this->refreshToken = $token;
        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;
        return $this;
    }


    public function setValid($valid): RefreshTokenInterface
    {
        return $this;
    }

    public function getValid(): bool
    {
        return $this->isValid();
    }

    public function setUsername($username): RefreshTokenInterface
    {
        return $this;
    }

    public function getUsername(): ?string
    {
        return $this->user ? $this->user->getUserIdentifier() : null;
    }

    public function __toString(): string
    {
        return (string) $this->refreshToken;
    }

    public static function createForUserWithTtl(string $refreshToken, UserInterface $user, int $ttl): RefreshTokenInterface
    {
        $token = new self();
        $expirationDate = (new \DateTimeImmutable())->modify("+$ttl seconds");

        $token->setToken($refreshToken); // Stocke la STRING
        $token->setUser($user);         // Stocke l'OBJET User
        $token->setExpiresAt($expirationDate);
        $token->setCreatedAt(new \DateTimeImmutable());
        return $token;
    }

    public function setRefreshToken($refreshToken = null): RefreshTokenInterface
    {
        $this->setToken((string) $refreshToken);
        return $this;
    }

    public function getRefreshToken(): ?string
    {
        return $this->getToken();
    }

    public function isValid(): bool
    {
        return ($this->expiresAt && $this->expiresAt > new \DateTimeImmutable());
    }
}
