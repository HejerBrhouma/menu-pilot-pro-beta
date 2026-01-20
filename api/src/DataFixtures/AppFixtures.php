<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture{
    private UserPasswordHasherInterface $passwordHasher;

    public function __construct(UserPasswordHasherInterface $passwordHasher)
    {
        $this->passwordHasher = $passwordHasher;
    }

    public function load(ObjectManager $manager): void
    {
        $user = new User();
        $user->setEmail('hejerbnrhouma@gmail.com');
        $user->setRoles(['ROLE_ADMIN']);
        $user->setFirstName('Admin');
        $user->setIsActive(1);

        $hashedPassword = $this->passwordHasher->hashPassword(
            $user,
            'hejer123'
        );
        $user->setPassword($hashedPassword);

        $manager->persist($user);

        $manager->flush();
    }
}