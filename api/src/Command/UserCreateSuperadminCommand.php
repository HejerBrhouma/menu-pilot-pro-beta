<?php
// src/Command/UserCreateSuperadminCommand.php

namespace App\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Constraints\Email;
use Symfony\Component\Validator\Validation;

// Suppression de 'use Symfony\Component\Console\Attribute\AsCommand;'

class UserCreateSuperadminCommand extends Command
{
    // Définition du nom de la commande (Ancienne méthode, compatible PHP < 8.0)
    protected static $defaultName = 'app:user:create-superadmin';
    protected static $defaultDescription = 'Crée un utilisateur super administrateur avec ROLE_SUPER_ADMIN de manière interactive.';

    private EntityManagerInterface $entityManager;
    private UserPasswordHasherInterface $userPasswordHasher;

    public function __construct(EntityManagerInterface $entityManager, UserPasswordHasherInterface $userPasswordHasher)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
        $this->userPasswordHasher = $userPasswordHasher;
    }

    protected function configure(): void
    {
        // La description est définie dans $defaultDescription, ici on ajoute juste la configuration
        // S'assurer que le nom et la description sont définis dans les propriétés statiques ci-dessus
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Création interactive d\'un Super Administrateur');

        // 1. Collecte et validation de l'Email
        $validator = Validation::createValidator();
        $email = $io->ask('Entrez l\'adresse email du super administrateur', null, function ($value) use ($validator) {
            // Logique de validation de l'email inchangée
            $violations = $validator->validate($value, [new Email(), new \Symfony\Component\Validator\Constraints\NotBlank()]);
            if (count($violations) > 0) {
                throw new \RuntimeException((string) $violations->get(0)->getMessage());
            }
            return $value;
        });

        // Reste du code (Vérification de l'existence de l'utilisateur, collecte et confirmation du mot de passe)
        // ... (Le reste de la logique d'exécution est inchangée)

        $existingUser = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);

        if ($existingUser) {
            $io->warning(sprintf('L\'utilisateur avec l\'email "%s" existe déjà. Opération annulée.', $email));
            return Command::SUCCESS;
        }

        // 2. Collecte et confirmation du Mot de passe
        while (true) {
            $password = $io->askHidden('Entrez le mot de passe (la saisie est masquée)', function ($value) {
                if (empty($value)) {
                    throw new \RuntimeException('Le mot de passe ne peut pas être vide.');
                }
                return $value;
            });

            $passwordConfirmation = $io->askHidden('Confirmez le mot de passe');

            if ($password === $passwordConfirmation) {
                break;
            }
            $io->warning('Les mots de passe ne correspondent pas. Veuillez réessayer.');
        }

        // 3. Création de l'utilisateur
        $user = new User();

        // Hachage du mot de passe
        $hashedPassword = $this->userPasswordHasher->hashPassword(
            $user,
            $password
        );

        // Définition des propriétés
        $user->setEmail($email);
        $user->setPassword($hashedPassword);
        $user->setRoles(['ROLE_SUPER_ADMIN']);
        $user->setFirstName('Super');
        $user->setLastName('Admin');
        $user->setIsActive(true);
        $user->setCreatedAt(new \DateTimeImmutable());

        // Sauvegarde
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $io->success(sprintf('Super Administrateur "%s" créé avec succès.', $email));

        return Command::SUCCESS;
    }
}