<?php

// src/Controller/ImpersonationController.php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Security;

class ImpersonationController extends AbstractController
{
    private EntityManagerInterface $em;
    private JWTTokenManagerInterface $jwtManager;
    private Security $security;

    public function __construct(
        EntityManagerInterface $em,
        JWTTokenManagerInterface $jwtManager,
        Security $security
    ) {
        $this->em         = $em;
        $this->jwtManager = $jwtManager;
        $this->security   = $security;
    }

    /**
     * @Route("/api/impersonate/{id}", methods={"POST"})
     */
    public function impersonate(int $id): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->security->getUser();

        if (!$currentUser) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }

        $isSuperAdmin = in_array('ROLE_SUPER_ADMIN', $currentUser->getRoles());
        $isAdmin      = in_array('ROLE_ADMIN',       $currentUser->getRoles());
        $isManager    = in_array('ROLE_MANAGER',     $currentUser->getRoles());

        if (!$isSuperAdmin && !$isAdmin && !$isManager) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        /** @var User|null $targetUser */
        $targetUser = $this->em->getRepository(User::class)->find($id);

        if (!$targetUser) {
            return $this->json(['error' => 'Utilisateur introuvable'], 404);
        }

        $targetRoles = $targetUser->getRoles();

        // SUPER_ADMIN → peut prendre la main sur ADMIN uniquement
        if ($isSuperAdmin && !$isAdmin && !$isManager) {
            if (!in_array('ROLE_ADMIN', $targetRoles)) {
                return $this->json(['error' => 'Vous ne pouvez prendre la main que sur un ADMIN'], 403);
            }
        }

        // ADMIN → peut prendre la main sur MANAGER ou WAITER de son enseigne
        if ($isAdmin && !$isSuperAdmin) {
            $allowed = ['ROLE_MANAGER', 'ROLE_WAITER'];
            if (!count(array_intersect($allowed, $targetRoles))) {
                return $this->json(['error' => 'Vous ne pouvez prendre la main que sur un Manager ou Serveur'], 403);
            }
            if (!$this->sameEstablishment($currentUser, $targetUser)) {
                return $this->json(['error' => 'Cet utilisateur n\'appartient pas à votre enseigne'], 403);
            }
        }

        // MANAGER → peut prendre la main sur WAITER de son enseigne uniquement
        if ($isManager && !$isAdmin && !$isSuperAdmin) {
            if (!in_array('ROLE_WAITER', $targetRoles)) {
                return $this->json(['error' => 'Vous ne pouvez prendre la main que sur un Serveur'], 403);
            }
            if (!$this->sameEstablishment($currentUser, $targetUser)) {
                return $this->json(['error' => 'Cet utilisateur n\'appartient pas à votre enseigne'], 403);
            }
        }

        $token = $this->jwtManager->create($targetUser);

        return $this->json(['token' => $token]);
    }

    private function sameEstablishment(User $a, User $b): bool
    {
        $estA = $a->getEstablishment();
        $estB = $b->getEstablishment();
        if (!$estA || !$estB) return false;
        return $estA->getId() === $estB->getId();
    }
}