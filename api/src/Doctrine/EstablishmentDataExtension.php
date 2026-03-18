<?php

// src/Doctrine/EstablishmentDataExtension.php
// Remplace ProductExtension, PackExtension, CategoryExtension, MenuExtension

namespace App\Doctrine;

use App\Entity\Product;
use App\Entity\Pack;
use App\Entity\Category;
use App\Entity\Menu;
use App\Entity\User;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Core\Bridge\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\Security\Core\Security;

class EstablishmentDataExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    private Security $security;

    // Entités filtrées par enseigne
    private const FILTERED_ENTITIES = [
        Product::class,
        Pack::class,
        Category::class,
        Menu::class,
    ];

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
        // Vérifier que l'entité est concernée
        if (!in_array($resourceClass, self::FILTERED_ENTITIES)) {
            return;
        }

        // SUPER_ADMIN voit tout
        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return;
        }

        /** @var User|null $user */
        $user = $this->security->getUser();

        // Non connecté → accès public (menu par qrToken géré par le filtre SearchFilter)
        if (!$user) {
            return;
        }

        // Récupérer l'enseigne directement depuis l'user
        // Tous les users (ADMIN, MANAGER, WAITER) ont $establishment
        $establishment = $user->getEstablishment();

        if (!$establishment) {
            // User sans enseigne → ne retourne rien
            $rootAlias = $queryBuilder->getRootAliases()[0];
            $queryBuilder->andWhere(sprintf('%s.id IS NULL', $rootAlias));
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];
        $queryBuilder
            ->andWhere(sprintf('%s.establishment = :current_establishment', $rootAlias))
            ->setParameter('current_establishment', $establishment);
    }
}