<?php

// src/Controller/EstablishmentLogoController.php

namespace App\Controller;

use App\Entity\Establishment;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class EstablishmentLogoController extends AbstractController
{
    private EntityManagerInterface $em;
    private string $uploadDir;

    public function __construct(
        EntityManagerInterface $em,
        string $uploadDir
    ) {
        $this->em = $em;
        $this->uploadDir = $uploadDir;
    }

    /**
     * @Route("/api/establishments/{id}/logo", methods={"POST"})
     */
    public function uploadLogo(Request $request, Establishment $establishment): JsonResponse
    {
        $file = $request->files->get('logo');

        if (!$file) {
            return $this->json(['error' => 'Aucun fichier'], 400);
        }

        // Valider le type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!in_array($file->getMimeType(), $allowedTypes)) {
            return $this->json(['error' => 'Type de fichier non autorisé'], 400);
        }

        // Supprimer l'ancien logo
        if ($establishment->getLogo()) {
            $oldPath = $this->uploadDir . '/' . $establishment->getLogo();
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        // Nouveau nom de fichier
        $filename = uniqid('logo_') . '.' . $file->guessExtension();
        $file->move($this->uploadDir, $filename);

        $establishment->setLogo($filename);
        $this->em->flush();

        return $this->json([
            'logo' => $filename,
            'url'  => '/uploads/logos/' . $filename
        ]);
    }
}