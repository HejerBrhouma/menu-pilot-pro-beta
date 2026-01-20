<?php

namespace App\Security;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Symfony\Component\Security\Guard\AbstractGuardAuthenticator;

class GoogleAuthenticator extends AbstractGuardAuthenticator
{
    private $em;
    private $jwtManager;
    private $clientId = '880714273826-008hclp6kop4incg6lg4pv93bu7muid2.apps.googleusercontent.com';

    public function __construct(EntityManagerInterface $em, JWTTokenManagerInterface $jwtManager)
    {
        $this->em = $em;
        $this->jwtManager = $jwtManager;
    }

    public function supports(Request $request)
    {
        // On intercepte les requêtes POST sur /api/login/google
        return $request->attributes->get('_route') === 'api_login_google' && $request->isMethod('POST');
    }

    public function getCredentials(Request $request)
    {
        $data = json_decode($request->getContent(), true);
        return [
            'idToken' => $data['accessToken'] ?? null,
        ];
    }

    public function getUser($credentials, UserProviderInterface $userProvider)
    {
        $idToken = $credentials['idToken'];
        if (!$idToken) return null;

        // Note: Dans un environnement de production, utilisez la bibliothèque google-auth-library-php
        // pour vérifier la signature du token. Ici, on simule l'extraction.
        // Pour le test, on décode le payload (attention: non sécurisé sans vérification de signature)
        $payload = explode('.', $idToken);
        if (count($payload) < 2) return null;
        $decodedPayload = json_decode(base64_decode($payload[1]), true);

        $email = $decodedPayload['email'] ?? null;
        if (!$email) return null;

        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);

        if (!$user) {
            $user = new User();
            $user->setEmail($email);
            $user->setFirstName($decodedPayload['given_name'] ?? '');
            $user->setLastName($decodedPayload['family_name'] ?? '');
            $user->setPassword(bin2hex(random_bytes(16)));
            $user->setIsActive(true);

            $this->em->persist($user);
            $this->em->flush();
        }

        return $user;
    }

    public function checkCredentials($credentials, UserInterface $user)
    {
        return true;
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, $providerKey)
    {
        $user = $token->getUser();
        $jwt = $this->jwtManager->create($user);

        return new JsonResponse([
            'token' => $jwt,
            'user'  => [
                'email' => $user->getEmail(),
                'firstName' => $user->getFirstName()
            ]
        ]);
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception)
    {
        return new JsonResponse(['error' => 'Invalid Google Token'], Response::HTTP_UNAUTHORIZED);
    }

    public function start(Request $request, AuthenticationException $authException = null)
    {
        return new JsonResponse(['message' => 'Auth required'], Response::HTTP_UNAUTHORIZED);
    }

    public function supportsRememberMe()
    {
        return false;
    }
}