<?php

// src/Doctrine/EstablishmentExtension.php

namespace App\Doctrine;

use App\Entity\Establishment;
use App\Entity\User;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\Security\Core\Security;

class EstablishmentExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        string $operationName = null
    ): void {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    public function applyToItem(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        array $identifiers,
        string $operationName = null,
        array $context = []
    ): void {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    private function addWhere(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        if ($resourceClass !== Establishment::class) {
            return;
        }

        // SUPER_ADMIN voit toutes les enseignes
        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return;
        }

        /** @var User|null $user */
        $user = $this->security->getUser();

        // Non connecté → accès public (/api/establishments?slug=xxx)
        if (!$user) {
            return;
        }

        // Récupérer l'enseigne de l'user connecté (ADMIN, MANAGER, WAITER)
        $establishment = $user->getEstablishment();

        if (!$establishment) {
            // User sans enseigne → ne retourne rien
            $rootAlias = $queryBuilder->getRootAliases()[0];
            $queryBuilder->andWhere(sprintf('%s.id IS NULL', $rootAlias));
            return;
        }

        // Retourner uniquement son enseigne
        $rootAlias = $queryBuilder->getRootAliases()[0];
        $queryBuilder
            ->andWhere(sprintf('%s.id = :establishment_id', $rootAlias))
            ->setParameter('establishment_id', $establishment->getId());
    }
}