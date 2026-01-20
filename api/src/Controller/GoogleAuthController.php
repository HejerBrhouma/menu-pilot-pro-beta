<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class GoogleAuthController extends AbstractController
{
    /**
     * @Route("/api/login/google", name="api_login_google", methods={"POST"})
     */
    public function loginGoogle(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $em,
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $idToken = $data['accessToken'] ?? null;

        if (!$idToken) {
            return new JsonResponse(['error' => 'Token manquant'], 400);
        }

        try {
            // 1. Vérifier le token auprès de Google via l'API tokeninfo
            // Cette méthode ne nécessite pas le clientSecret, seulement l'id_token
            $client = new \GuzzleHttp\Client();
            $response = $client->get('https://oauth2.googleapis.com/tokeninfo?id_token=' . $idToken);
            $payload = json_decode($response->getBody()->getContents(), true);

            // Vérification de la validité du payload et de l'audience (le Client ID)
            if (!isset($payload['email'])) {
                throw new \Exception('Token Google invalide ou expiré');
            }

            // Optionnel : Vérifier que l'audience correspond à votre GOOGLE_CLIENT_ID
            // if ($payload['aud'] !== $_ENV['GOOGLE_CLIENT_ID']) {
            //     throw new \Exception('Audience invalide');
            // }

            $email = $payload['email'];
            $googleId = $payload['sub'];

            // 2. Chercher ou créer l'utilisateur
            $user = $userRepository->findOneBy(['email' => $email]);

            if (!$user) {
                $user = new User();
                $user->setEmail($email);
                $user->setFirstName($payload['given_name'] ?? '');
                $user->setLastName($payload['family_name'] ?? '');
                $user->setGoogleId($googleId);
                // On génère un mot de passe aléatoire car le champ est obligatoire en base
                $user->setPassword(bin2hex(random_bytes(16)));
                $user->setIsActive(true);
                $user->setRoles(['ROLE_USER']);

                $em->persist($user);
                $em->flush();
            } else {
                // Mettre à jour le googleId s'il n'existe pas encore pour cet utilisateur
                if (!$user->getGoogleId()) {
                    $user->setGoogleId($googleId);
                    $em->flush();
                }
            }

            // 3. Générer le JWT interne (LexikJWT) pour le frontend Angular
            $token = $jwtManager->create($user);

            return new JsonResponse([
                'token' => $token,
                'user' => [
                    'id' => $user->getId(),
                    'email' => $user->getEmail(),
                    'firstName' => $user->getFirstName()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Authentification échouée: ' . $e->getMessage()], 401);
        }
    }
}