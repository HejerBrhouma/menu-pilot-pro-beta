<?php

namespace App\Controller;

use App\Entity\Establishment;
use App\Entity\GalleryImage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class GalleryController extends AbstractController
{
    private EntityManagerInterface $em;
    private string $galleryUploadDir;

    public function __construct(
        EntityManagerInterface $em,
        string $galleryUploadDir
    ) {
        $this->em = $em;
        $this->galleryUploadDir = $galleryUploadDir;
    }

    /**
     * @Route("/api/gallery", methods={"GET"})
     */
    public function list(Request $request): JsonResponse
    {
        $estId = $request->query->get('establishment');
        if (!$estId) {
            return $this->json(['error' => 'establishment requis'], 400);
        }

        $images = $this->em->getRepository(GalleryImage::class)->findBy(
            ['establishment' => (int)$estId],
            ['category' => 'ASC', 'position' => 'ASC', 'createdAt' => 'ASC']
        );

        return $this->json(array_map(fn(GalleryImage $img) => [
            'id'       => $img->getId(),
            'filename' => $img->getFilename(),
            'title'    => $img->getTitle(),
            'category' => $img->getCategory(),
            'position' => $img->getPosition(),
            'url'      => '/uploads/gallery/' . $img->getFilename(),
        ], $images));
    }

    /**
     * @Route("/api/gallery/{id}/upload", methods={"POST"})
     */
    public function upload(Request $request, Establishment $id): JsonResponse
    {
        $establishment = $id; // param converter by id
        $file = $request->files->get('image');

        if (!$file) {
            return $this->json(['error' => 'Aucun fichier'], 400);
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($file->getMimeType(), $allowedTypes)) {
            return $this->json(['error' => 'Type non autorisé'], 400);
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            return $this->json(['error' => 'Fichier trop lourd (max 5 Mo)'], 400);
        }

        $filename = uniqid('gal_') . '.' . $file->guessExtension();
        $file->move($this->galleryUploadDir, $filename);

        $image = new GalleryImage();
        $image->setEstablishment($establishment);
        $image->setFilename($filename);
        $image->setTitle($request->request->get('title') ?: null);
        $image->setCategory($request->request->get('category') ?: 'Autre');
        $image->setPosition((int)$request->request->get('position', 0));

        $this->em->persist($image);
        $this->em->flush();

        return $this->json([
            'id'       => $image->getId(),
            'filename' => $filename,
            'title'    => $image->getTitle(),
            'category' => $image->getCategory(),
            'position' => $image->getPosition(),
            'url'      => '/uploads/gallery/' . $filename,
        ], 201);
    }

    /**
     * @Route("/api/gallery/{id}", methods={"DELETE"})
     */
    public function delete(int $id): JsonResponse
    {
        $image = $this->em->getRepository(GalleryImage::class)->find($id);
        if (!$image) {
            return $this->json(['error' => 'Image introuvable'], 404);
        }

        $path = $this->galleryUploadDir . '/' . $image->getFilename();
        if (file_exists($path)) {
            unlink($path);
        }

        $this->em->remove($image);
        $this->em->flush();

        return $this->json(null, 204);
    }

    /**
     * @Route("/api/gallery/{id}", methods={"PATCH"})
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $image = $this->em->getRepository(GalleryImage::class)->find($id);
        if (!$image) {
            return $this->json(['error' => 'Image introuvable'], 404);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        if (isset($data['title']))    $image->setTitle($data['title'] ?: null);
        if (isset($data['category'])) $image->setCategory($data['category']);
        if (isset($data['position'])) $image->setPosition((int)$data['position']);

        $this->em->flush();

        return $this->json([
            'id'       => $image->getId(),
            'filename' => $image->getFilename(),
            'title'    => $image->getTitle(),
            'category' => $image->getCategory(),
            'position' => $image->getPosition(),
            'url'      => '/uploads/gallery/' . $image->getFilename(),
        ]);
    }
}
