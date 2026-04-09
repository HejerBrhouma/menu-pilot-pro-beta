<?php
// src/Doctrine/OrderExtension.php
namespace App\Doctrine;

use App\Entity\Order;
use App\Entity\Invoice;
use App\Entity\Table;
use App\Entity\User;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\Security\Core\Security;

class OrderExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public function applyToCollection(QueryBuilder $qb, $qng, string $resourceClass, string $operationName = null): void
    {
        $this->addWhere($qb, $resourceClass);
    }

    public function applyToItem(QueryBuilder $qb, $qng, string $resourceClass, array $identifiers, string $operationName = null, array $context = []): void
    {
        $this->addWhere($qb, $resourceClass);
    }

    private function addWhere(QueryBuilder $qb, string $resourceClass): void
    {
        if (!in_array($resourceClass, [Order::class, Invoice::class, Table::class])) return;

        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) return;

        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) return;

        $establishment = $user->getEstablishment();
        if (!$establishment) {
            $qb->andWhere(sprintf('%s.id IS NULL', $qb->getRootAliases()[0]));
            return;
        }

        $rootAlias = $qb->getRootAliases()[0];

        // TOUS les rôles (WAITER, MANAGER, ADMIN) voient
        // toutes les commandes de leur enseigne
        $qb->andWhere(sprintf('%s.establishment = :est', $rootAlias))
            ->setParameter('est', $establishment);
    }
}
