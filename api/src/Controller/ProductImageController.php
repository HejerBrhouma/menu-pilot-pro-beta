<?php
// src/Controller/ProductImageController.php
namespace App\Controller;

use App\Entity\Product;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ProductImageController extends AbstractController
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    /**
     * @Route("/api/products/{id}/image", methods={"POST"})
     */
    public function uploadImage(int $id, Request $request): JsonResponse
    {
        $product = $this->em->getRepository(Product::class)->find($id);
        if (!$product) {
            return $this->json(['error' => 'Produit introuvable'], 404);
        }

        /** @var \Symfony\Component\HttpFoundation\File\UploadedFile|null $file */
        $file = $request->files->get('image');

        if (!$file) {
            return $this->json(['error' => 'Aucun fichier reçu'], 400);
        }

        // Vérifier que le fichier est valide
        if (!$file->isValid()) {
            return $this->json([
                'error' => 'Fichier invalide : ' . $file->getErrorMessage()
            ], 400);
        }

        // Valider le type MIME
        $mimeType     = $file->getMimeType();
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($mimeType, $allowedTypes)) {
            return $this->json([
                'error' => 'Type non autorisé : ' . $mimeType
            ], 400);
        }

        // Valider la taille (10MB max)
        if ($file->getSize() > 10 * 1024 * 1024) {
            return $this->json(['error' => 'Fichier trop volumineux (max 10MB)'], 400);
        }

        // Supprimer l'ancienne image si elle existe
        if ($product->getImage()) {
            $oldPath = $this->getParameter('kernel.project_dir')
                . '/public/uploads/products/'
                . $product->getImage();
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        // Générer un nom unique
        $originalName = $file->getClientOriginalName();
        $extension    = pathinfo($originalName, PATHINFO_EXTENSION) ?: 'jpg';
        $filename     = 'product_' . $id . '_' . uniqid() . '.' . strtolower($extension);
        $uploadDir    = $this->getParameter('kernel.project_dir') . '/public/uploads/products';

        // Créer le dossier si nécessaire
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        // Déplacer le fichier
        try {
            $file->move($uploadDir, $filename);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Erreur lors du déplacement du fichier : ' . $e->getMessage()
            ], 500);
        }

        // Vérifier que le fichier existe bien après le move
        if (!file_exists($uploadDir . '/' . $filename)) {
            return $this->json(['error' => 'Fichier non sauvegardé'], 500);
        }

        // Sauvegarder en base
        $product->setImage($filename);
        $this->em->flush();

        return $this->json([
            'image'    => $filename,
            'imageUrl' => '/uploads/products/' . $filename,
        ]);
    }

    /**
     * @Route("/api/products/{id}/image", methods={"DELETE"})
     */
    public function deleteImage(int $id): JsonResponse
    {
        $product = $this->em->getRepository(Product::class)->find($id);
        if (!$product) {
            return $this->json(['error' => 'Produit introuvable'], 404);
        }

        if ($product->getImage()) {
            $path = $this->getParameter('kernel.project_dir')
                . '/public/uploads/products/'
                . $product->getImage();
            if (file_exists($path)) {
                @unlink($path);
            }
            $product->setImage(null);
            $this->em->flush();
        }

        return $this->json(['success' => true]);
    }
}