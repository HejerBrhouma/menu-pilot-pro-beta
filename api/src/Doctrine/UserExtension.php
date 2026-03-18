<?php

// src/Doctrine/UserExtension.php

namespace App\Doctrine;

use App\Entity\User;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\Security\Core\Security;

class UserExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public function applyToCollection(
        QueryBuilder $queryBuilder,
                     $queryNameGenerator,
        string $resourceClass,
        string $operationName = null
    ): void {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    public function applyToItem(
        QueryBuilder $queryBuilder,
                     $queryNameGenerator,
        string $resourceClass,
        array $identifiers,
        string $operationName = null,
        array $context = []
    ): void {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    private function addWhere(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        if ($resourceClass !== User::class) {
            return;
        }

        // SUPER_ADMIN voit TOUS les users
        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return;
        }

        /** @var User|null $currentUser */
        $currentUser = $this->security->getUser();

        if (!$currentUser) {
            return;
        }

        $establishment = $currentUser->getEstablishment();

        // ADMIN avec enseigne → voit uniquement les users de son enseigne
        if ($establishment) {
            $rootAlias = $queryBuilder->getRootAliases()[0];
            $queryBuilder
                ->andWhere(sprintf('%s.establishment = :user_establishment', $rootAlias))
                ->setParameter('user_establishment', $establishment);
            return;
        }

        // Pas d'enseigne et pas SUPER_ADMIN → rien
        $rootAlias = $queryBuilder->getRootAliases()[0];
        $queryBuilder->andWhere(sprintf('%s.id IS NULL', $rootAlias));
    }
}