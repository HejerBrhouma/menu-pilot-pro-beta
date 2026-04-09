<?php
// src/Controller/CustomerAuthController.php
namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

class CustomerAuthController extends AbstractController
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
     * Inscription client (sans enseigne)
     * @Route("/api/public/customer/register", methods={"POST"})
     */
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['email'])) {
            return $this->json(['error' => 'Email requis'], 400);
        }

        // Vérifier email unique parmi les customers
        $existing = $this->em->getRepository(User::class)->findOneBy([
            'email' => $data['email']
        ]);
        if ($existing) {
            return $this->json(['error' => 'Email déjà utilisé'], 409);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setFirstName($data['firstName'] ?? '');
        $user->setLastName($data['lastName'] ?? null);
        $user->setRoles(['ROLE_CUSTOMER']);
        $user->setEstablishment(null); // pas lié à une enseigne

        if (!empty($data['password'])) {
            $hashed = $this->hasher->hashPassword($user, $data['password']);
            $user->setPassword($hashed);
        } else {
            $user->setPassword(''); // OAuth only
        }

        $this->em->persist($user);
        $this->em->flush();

        return $this->json([
            'token'    => $this->jwtManager->create($user),
            'customer' => $this->serialize($user),
        ], 201);
    }

    /**
     * Connexion client
     * @Route("/api/public/customer/login", methods={"POST"})
     */
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $user = $this->em->getRepository(User::class)->findOneBy([
            'email' => $data['email'] ?? ''
        ]);

        if (!$user || !in_array('ROLE_CUSTOMER', $user->getRoles())) {
            return $this->json(['error' => 'Compte introuvable'], 404);
        }

        if (!$this->hasher->isPasswordValid($user, $data['password'] ?? '')) {
            return $this->json(['error' => 'Mot de passe incorrect'], 401);
        }

        return $this->json([
            'token'    => $this->jwtManager->create($user),
            'customer' => $this->serialize($user),
        ]);
    }

    /**
     * OAuth Google
     * @Route("/api/public/customer/oauth/google", methods={"POST"})
     */
    public function googleOAuth(Request $request): JsonResponse
    {
        $data  = json_decode($request->getContent(), true);
        $token = $data['token'] ?? null;
        if (!$token) return $this->json(['error' => 'Token requis'], 400);

        $googleData = $this->verifyGoogleToken($token);
        if (!$googleData) return $this->json(['error' => 'Token Google invalide'], 401);

        // Chercher par googleId ou email
        $user = $this->em->getRepository(User::class)
            ->findOneBy(['googleId' => $googleData['sub']]);

        if (!$user) {
            $user = $this->em->getRepository(User::class)
                ->findOneBy(['email' => $googleData['email']]);
        }

        if (!$user) {
            $user = new User();
            $user->setRoles(['ROLE_CUSTOMER']);
            $user->setEstablishment(null);
            $user->setPassword('');
        }

        $user->setEmail($googleData['email']);
        $user->setFirstName($googleData['given_name'] ?? '');
        $user->setLastName($googleData['family_name'] ?? null);
        $user->setGoogleId($googleData['sub']);
        if (!empty($googleData['picture'])) {
            $user->setAvatar($googleData['picture']);
        }

        $this->em->persist($user);
        $this->em->flush();

        return $this->json([
            'token'    => $this->jwtManager->create($user),
            'customer' => $this->serialize($user),
        ]);
    }

    /**
     * OAuth Facebook
     * @Route("/api/public/customer/oauth/facebook", methods={"POST"})
     */
    public function facebookOAuth(Request $request): JsonResponse
    {
        $data        = json_decode($request->getContent(), true);
        $accessToken = $data['accessToken'] ?? null;
        if (!$accessToken) return $this->json(['error' => 'Token requis'], 400);

        $fbData = $this->verifyFacebookToken($accessToken);
        if (!$fbData) return $this->json(['error' => 'Token Facebook invalide'], 401);

        $user = $this->em->getRepository(User::class)
            ->findOneBy(['facebookId' => $fbData['id']]);

        if (!$user && !empty($fbData['email'])) {
            $user = $this->em->getRepository(User::class)
                ->findOneBy(['email' => $fbData['email']]);
        }

        if (!$user) {
            $user = new User();
            $user->setRoles(['ROLE_CUSTOMER']);
            $user->setEstablishment(null);
            $user->setPassword('');
        }

        $user->setFacebookId($fbData['id']);
        if (!empty($fbData['email']))      $user->setEmail($fbData['email']);
        if (!empty($fbData['first_name'])) $user->setFirstName($fbData['first_name']);
        if (!empty($fbData['last_name']))  $user->setLastName($fbData['last_name']);

        $this->em->persist($user);
        $this->em->flush();

        return $this->json([
            'token'    => $this->jwtManager->create($user),
            'customer' => $this->serialize($user),
        ]);
    }

    /**
     * Profil client connecté
     * @Route("/api/public/customer/me", methods={"GET"})
     */
    public function me(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) return $this->json(['error' => 'Non connecté'], 401);
        return $this->json($this->serialize($user));
    }

    // ── Helpers ────────────────────────────────────────────────────

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

    private function serialize(User $user): array
    {
        return [
            'id'        => $user->getId(),
            'email'     => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName'  => $user->getLastName(),
            'fullName'  => $user->getFullName(),
            'avatar'    => $user->getAvatar(),
        ];
    }
}