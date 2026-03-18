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
        // Vérifier que l'appelant est bien SUPER_ADMIN ou ADMIN
        $currentUser = $this->security->getUser();

        if (!$currentUser) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }

        $isSuperAdmin = in_array('ROLE_SUPER_ADMIN', $currentUser->getRoles());
        $isAdmin      = in_array('ROLE_ADMIN', $currentUser->getRoles());

        if (!$isSuperAdmin && !$isAdmin) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        /** @var User|null $targetUser */
        $targetUser = $this->em->getRepository(User::class)->find($id);

        if (!$targetUser) {
            return $this->json(['error' => 'Utilisateur introuvable'], 404);
        }

        $targetRoles = $targetUser->getRoles();

        // SUPER_ADMIN peut prendre la main sur ADMIN uniquement
        if ($isSuperAdmin && !$isAdmin) {
            if (!in_array('ROLE_ADMIN', $targetRoles)) {
                return $this->json(['error' => 'Vous ne pouvez prendre la main que sur un ADMIN'], 403);
            }
        }

        // ADMIN peut prendre la main sur MANAGER ou WAITER de son enseigne uniquement
        if ($isAdmin) {
            $allowedRoles = ['ROLE_MANAGER', 'ROLE_WAITER'];
            $hasAllowedRole = count(array_intersect($allowedRoles, $targetRoles)) > 0;

            if (!$hasAllowedRole) {
                return $this->json(['error' => 'Vous ne pouvez prendre la main que sur un Manager ou Serveur'], 403);
            }

            // Vérifier même enseigne
            if ($currentUser instanceof User && $targetUser->getEstablishment()) {
                $currentEstablishment = $this->em
                    ->getRepository(\App\Entity\Establishment::class)
                    ->findOneBy(['owner' => $currentUser]);

                if (!$currentEstablishment ||
                    $currentEstablishment->getId() !== $targetUser->getEstablishment()->getId()) {
                    return $this->json(['error' => 'Cet utilisateur n\'appartient pas à votre enseigne'], 403);
                }
            }
        }

        // Générer un JWT au nom de l'utilisateur cible
        $token = $this->jwtManager->create($targetUser);

        return $this->json(['token' => $token]);
    }
}