<?php
// src/Entity/Promotion.php
namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiFilter;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Filter\BooleanFilter;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ApiResource(
 *   normalizationContext={"groups"={"promotion:read"}},
 *   denormalizationContext={"groups"={"promotion:write"}}
 * )
 * @ApiFilter(SearchFilter::class, properties={"scope": "exact", "establishment": "exact"})
 * @ApiFilter(BooleanFilter::class, properties={"isActive"})
 * @ORM\Entity()
 * @ORM\Table(name="promotions")
 */
class Promotion
{
    const SCOPE_PRODUCT  = 'PRODUCT';
    const SCOPE_CATEGORY = 'CATEGORY';
    const SCOPE_PACK     = 'PACK';
    const SCOPE_MENU     = 'MENU';

    const TYPE_PERCENTAGE   = 'PERCENTAGE';
    const TYPE_FIXED_AMOUNT = 'FIXED_AMOUNT';

    const RECURRENCE_NONE    = 'NONE';
    const RECURRENCE_DAILY   = 'DAILY';
    const RECURRENCE_WEEKLY  = 'WEEKLY';
    const RECURRENCE_MONTHLY = 'MONTHLY';
    const RECURRENCE_YEARLY  = 'YEARLY';

    const EVENT_NONE           = 'NONE';
    const EVENT_ANNIVERSARY    = 'ANNIVERSARY';
    const EVENT_AID_ADHA       = 'AID_ADHA';
    const EVENT_AID_FITR       = 'AID_FITR';
    const EVENT_FETE_MERES     = 'FETE_MERES';
    const EVENT_FETE_PERES     = 'FETE_PERES';
    const EVENT_NOEL           = 'NOEL';
    const EVENT_NOUVEL_AN      = 'NOUVEL_AN';
    const EVENT_SAINT_VALENTIN = 'SAINT_VALENTIN';
    const EVENT_FETE_NAT_TUN   = 'FETE_NAT_TUN';
    const EVENT_CUSTOM         = 'CUSTOM';

    /** @ORM\Id() @ORM\GeneratedValue() @ORM\Column(type="integer") @Groups({"promotion:read"}) */
    private ?int $id = null;

    /** @ORM\Column(type="string", length=255) @Groups({"promotion:read", "promotion:write"}) */
    private string $name;

    /** @ORM\Column(type="text", nullable=true) @Groups({"promotion:read", "promotion:write"}) */
    private ?string $description = null;

    /** @ORM\Column(type="string", length=20) @Groups({"promotion:read", "promotion:write"}) */
    private string $type = self::TYPE_PERCENTAGE;

    /** @ORM\Column(type="float") @Groups({"promotion:read", "promotion:write"}) */
    private float $value;

    /** @ORM\Column(type="string", length=20) @Groups({"promotion:read", "promotion:write"}) */
    private string $scope;

    /** @ORM\Column(type="json") @Groups({"promotion:read", "promotion:write"}) */
    private array $targetIds = [];

    /** @ORM\Column(type="date", nullable=true) @Groups({"promotion:read", "promotion:write"}) */
    private ?\DateTime $startDate = null;

    /** @ORM\Column(type="date", nullable=true) @Groups({"promotion:read", "promotion:write"}) */
    private ?\DateTime $endDate = null;

    /** @ORM\Column(type="string", length=5, nullable=true) @Groups({"promotion:read", "promotion:write"}) */
    private ?string $startTime = null;

    /** @ORM\Column(type="string", length=5, nullable=true) @Groups({"promotion:read", "promotion:write"}) */
    private ?string $endTime = null;

    /** @ORM\Column(type="string", length=20) @Groups({"promotion:read", "promotion:write"}) */
    private string $recurrenceType = self::RECURRENCE_NONE;

    /** @ORM\Column(type="json", nullable=true) @Groups({"promotion:read", "promotion:write"}) */
    private ?array $recurrenceDays = null;

    /** @ORM\Column(type="string", length=30) @Groups({"promotion:read", "promotion:write"}) */
    private string $specialEvent = self::EVENT_NONE;

    /** @ORM\Column(type="date", nullable=true) @Groups({"promotion:read", "promotion:write"}) */
    private ?\DateTime $specialEventDate = null;

    /** @ORM\Column(type="json", nullable=true) @Groups({"promotion:read", "promotion:write"}) */
    private ?array $customDates = null;

    /** @ORM\Column(type="boolean") @Groups({"promotion:read", "promotion:write"}) */
    private bool $isActive = true;

    /** @ORM\ManyToOne(targetEntity=Establishment::class) @ORM\JoinColumn(nullable=false) @Groups({"promotion:read"}) */
    private Establishment $establishment;

    /** @ORM\Column(type="datetime_immutable") @Groups({"promotion:read"}) */
    private \DateTimeImmutable $createdAt;

    public function __construct() { $this->createdAt = new \DateTimeImmutable(); }

    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function setName(string $n): self { $this->name = $n; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $d): self { $this->description = $d; return $this; }
    public function getType(): string { return $this->type; }
    public function setType(string $t): self { $this->type = $t; return $this; }
    public function getValue(): float { return $this->value; }
    public function setValue(float $v): self { $this->value = $v; return $this; }
    public function getScope(): string { return $this->scope; }
    public function setScope(string $s): self { $this->scope = $s; return $this; }
    public function getTargetIds(): array { return $this->targetIds; }
    public function setTargetIds(array $ids): self { $this->targetIds = $ids; return $this; }
    public function getStartDate(): ?\DateTime { return $this->startDate; }
    public function setStartDate(?\DateTime $d): self { $this->startDate = $d; return $this; }
    public function getEndDate(): ?\DateTime { return $this->endDate; }
    public function setEndDate(?\DateTime $d): self { $this->endDate = $d; return $this; }
    public function getStartTime(): ?string { return $this->startTime; }
    public function setStartTime(?string $t): self { $this->startTime = $t; return $this; }
    public function getEndTime(): ?string { return $this->endTime; }
    public function setEndTime(?string $t): self { $this->endTime = $t; return $this; }
    public function getRecurrenceType(): string { return $this->recurrenceType; }
    public function setRecurrenceType(string $r): self { $this->recurrenceType = $r; return $this; }
    public function getRecurrenceDays(): ?array { return $this->recurrenceDays; }
    public function setRecurrenceDays(?array $d): self { $this->recurrenceDays = $d; return $this; }
    public function getSpecialEvent(): string { return $this->specialEvent; }
    public function setSpecialEvent(string $e): self { $this->specialEvent = $e; return $this; }
    public function getSpecialEventDate(): ?\DateTime { return $this->specialEventDate; }
    public function setSpecialEventDate(?\DateTime $d): self { $this->specialEventDate = $d; return $this; }
    public function getCustomDates(): ?array { return $this->customDates; }
    public function setCustomDates(?array $d): self { $this->customDates = $d; return $this; }
    public function getIsActive(): bool { return $this->isActive; }
    public function setIsActive(bool $v): self { $this->isActive = $v; return $this; }
    public function getEstablishment(): Establishment { return $this->establishment; }
    public function setEstablishment(Establishment $e): self { $this->establishment = $e; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function appliesToTarget(int $targetId): bool
    {
        return in_array($targetId, $this->targetIds);
    }

    public function applyTo(float $price): float
    {
        if ($this->type === self::TYPE_PERCENTAGE) {
            return round($price * (1 - $this->value / 100), 2);
        }
        return max(0, round($price - $this->value, 2));
    }

    public function isCurrentlyActive(?string $anniversaryDate = null): bool
    {
        if (!$this->isActive) return false;
        $now   = new \DateTime();
        $today = new \DateTime('today');
        $time  = $now->format('H:i');

        if ($this->startDate && $today < $this->startDate) return false;
        if ($this->endDate   && $today > $this->endDate)   return false;

        if ($this->startTime && $this->endTime) {
            if ($time < $this->startTime || $time > $this->endTime) return false;
        }

        if ($this->recurrenceType === self::RECURRENCE_WEEKLY) {
            $dow = (int)$now->format('w');
            if ($this->recurrenceDays && !in_array($dow, $this->recurrenceDays)) return false;
        }
        if ($this->recurrenceType === self::RECURRENCE_MONTHLY && $this->startDate) {
            if ($now->format('d') !== $this->startDate->format('d')) return false;
        }
        if ($this->recurrenceType === self::RECURRENCE_YEARLY && $this->startDate) {
            if ($now->format('m-d') !== $this->startDate->format('m-d')) return false;
        }

        if ($this->specialEvent !== self::EVENT_NONE) {
            return $this->checkSpecialEvent($now, $anniversaryDate);
        }

        return true;
    }

    private function checkSpecialEvent(\DateTime $now, ?string $anniversaryDate): bool
    {
        $mmdd = $now->format('m-d');
        $year = (int)$now->format('Y');

        switch ($this->specialEvent) {
            case self::EVENT_ANNIVERSARY:
                if (!$anniversaryDate) return false;
                return $mmdd === (new \DateTime($anniversaryDate))->format('m-d');
            case self::EVENT_NOEL:           return $mmdd === '12-25';
            case self::EVENT_NOUVEL_AN:      return $mmdd === '01-01';
            case self::EVENT_SAINT_VALENTIN: return $mmdd === '02-14';
            case self::EVENT_FETE_NAT_TUN:   return $mmdd === '03-20';
            case self::EVENT_FETE_MERES:
                return $mmdd === $this->getNthWeekday($year, 5, 0, 2)->format('m-d');
            case self::EVENT_FETE_PERES:
                return $mmdd === $this->getNthWeekday($year, 6, 0, 3)->format('m-d');
            case self::EVENT_AID_ADHA:
            case self::EVENT_AID_FITR:
                return $this->specialEventDate
                    ? $mmdd === $this->specialEventDate->format('m-d')
                    : false;
            case self::EVENT_CUSTOM:
                if (!$this->customDates) return false;
                foreach ($this->customDates as $d) {
                    if ((new \DateTime($d))->format('Y-m-d') === $now->format('Y-m-d')) return true;
                }
                return false;
        }
        return false;
    }

    private function getNthWeekday(int $year, int $month, int $dow, int $nth): \DateTime
    {
        $date = new \DateTime("$year-$month-01");
        $count = 0;
        while ($count < $nth) {
            if ((int)$date->format('w') === $dow) $count++;
            if ($count < $nth) $date->modify('+1 day');
        }
        return $date;
    }
}