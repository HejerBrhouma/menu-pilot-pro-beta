<?php
// src/Controller/SocialAuthController.php
namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

class SocialAuthController extends AbstractController
{
    private EntityManagerInterface      $em;
    private UserPasswordHasherInterface $hasher;
    private JWTTokenManagerInterface    $jwtManager;

    public function __construct(
        EntityManagerInterface      $em,
        UserPasswordHasherInterface $hasher,
        JWTTokenManagerInterface    $jwtManager
    ) {
        $this->em         = $em;
        $this->hasher     = $hasher;
        $this->jwtManager = $jwtManager;
    }

    /**
     * OAuth Google pour ADMIN/WAITER/MANAGER
     * @Route("/api/auth/google", methods={"POST"})
     */
    public function google(Request $request): JsonResponse
    {
        $data  = json_decode($request->getContent(), true);
        $token = $data['token'] ?? null;

        if (!$token) {
            return $this->json(['error' => 'Token requis'], 400);
        }

        // Vérifier le token Google
        $googleData = $this->verifyGoogleToken($token);
        if (!$googleData) {
            return $this->json(['error' => 'Token Google invalide'], 401);
        }

        // Chercher par googleId ou email
        $user = $this->em->getRepository(User::class)
            ->findOneBy(['googleId' => $googleData['sub']]);

        if (!$user) {
            $user = $this->em->getRepository(User::class)
                ->findOneBy(['email' => $googleData['email']]);
        }

        // Si aucun user trouvé — refuser (on ne crée pas de nouveaux admins via OAuth)
        if (!$user) {
            return $this->json([
                'error' => 'Aucun compte trouvé pour cet email Google. Contactez votre administrateur.'
            ], 401);
        }

        // Vérifier que le compte est actif
        if (!$user->getIsActive()) {
            return $this->json(['error' => 'Compte désactivé'], 403);
        }

        // Vérifier que c'est pas un ROLE_CUSTOMER qui essaie de se connecter en admin
        if (in_array('ROLE_CUSTOMER', $user->getRoles()) &&
            !in_array('ROLE_ADMIN', $user->getRoles()) &&
            !in_array('ROLE_MANAGER', $user->getRoles()) &&
            !in_array('ROLE_WAITER', $user->getRoles()) &&
            !in_array('ROLE_SUPER_ADMIN', $user->getRoles())) {
            return $this->json(['error' => 'Accès non autorisé'], 403);
        }

        // Lier le googleId si pas encore fait
        if (!$user->getGoogleId()) {
            $user->setGoogleId($googleData['sub']);
        }
        if (!empty($googleData['picture']) && method_exists($user, 'setAvatar')) {
            $user->setAvatar($googleData['picture']);
        }

        $this->em->flush();

        return $this->json([
            'token' => $this->jwtManager->create($user)
        ]);
    }

    /**
     * OAuth Facebook pour ADMIN/WAITER/MANAGER
     * @Route("/api/auth/facebook", methods={"POST"})
     */
    public function facebook(Request $request): JsonResponse
    {
        $data        = json_decode($request->getContent(), true);
        $accessToken = $data['token'] ?? null;

        if (!$accessToken) {
            return $this->json(['error' => 'Token requis'], 400);
        }

        $fbData = $this->verifyFacebookToken($accessToken);
        if (!$fbData) {
            return $this->json(['error' => 'Token Facebook invalide'], 401);
        }

        // Chercher par facebookId ou email
        $user = null;
        if (method_exists($this->em->getRepository(User::class), 'findOneBy')) {
            $user = $this->em->getRepository(User::class)
                ->findOneBy(['facebookId' => $fbData['id']]);
        }

        if (!$user && !empty($fbData['email'])) {
            $user = $this->em->getRepository(User::class)
                ->findOneBy(['email' => $fbData['email']]);
        }

        if (!$user) {
            return $this->json([
                'error' => 'Aucun compte trouvé pour ce compte Facebook. Contactez votre administrateur.'
            ], 401);
        }

        if (!$user->getIsActive()) {
            return $this->json(['error' => 'Compte désactivé'], 403);
        }

        // Lier facebookId
        if (method_exists($user, 'setFacebookId') && !$user->getFacebookId()) {
            $user->setFacebookId($fbData['id']);
            $this->em->flush();
        }

        return $this->json([
            'token' => $this->jwtManager->create($user)
        ]);
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private function verifyGoogleToken(string $token): ?array
    {
        $url      = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . $token;
        $response = @file_get_contents($url);
        if (!$response) return null;
        $data = json_decode($response, true);
        return isset($data['sub']) ? $data : null;
    }

    private function verifyFacebookToken(string $accessToken): ?array
    {
        $url      = 'https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token=' . $accessToken;
        $response = @file_get_contents($url);
        if (!$response) return null;
        $data = json_decode($response, true);
        return isset($data['id']) ? $data : null;
    }
}