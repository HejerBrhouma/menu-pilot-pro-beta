<?php
// src/Controller/ReviewController.php
namespace App\Controller;

use App\Entity\User;
use App\Entity\Order;
use App\Entity\Review;
use App\Entity\Establishment;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ReviewController extends AbstractController
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    /**
     * Créer un avis (client connecté OU anonyme avec guestName)
     * @Route("/api/public/reviews", methods={"POST"})
     */
    public function create(Request $request): JsonResponse
    {
        $data      = json_decode($request->getContent(), true);
        $user      = $this->getUser();
        $isCustomer = $user instanceof User && in_array('ROLE_CUSTOMER', $user->getRoles());
        $guestName  = trim($data['guestName'] ?? '');

        if (!$isCustomer && empty($guestName)) {
            return $this->json(['error' => 'Connexion ou prénom requis'], 401);
        }

        $order = $this->em->getRepository(Order::class)->find($data['orderId'] ?? 0);
        if (!$order || $order->getStatus() !== 'PAID') {
            return $this->json(['error' => 'Commande invalide ou non payée'], 400);
        }

        // Vérifier doublon : une seule fois par commande
        $existing = $isCustomer
            ? $this->em->getRepository(Review::class)->findOneBy(['customer' => $user,      'order' => $order])
            : $this->em->getRepository(Review::class)->findOneBy(['guestName' => $guestName, 'order' => $order]);
        if ($existing) return $this->json(['error' => 'Vous avez déjà laissé un avis pour cette commande'], 409);

        $review = new Review();
        if ($isCustomer) {
            $review->setCustomer($user);
        } else {
            $review->setGuestName($guestName);
        }
        $review->setOrder($order);
        $review->setEstablishment($order->getEstablishment());
        $review->setTargetType($data['targetType']);
        $review->setTargetId((int)$data['targetId']);
        $review->setRating((int)($data['rating'] ?? 5));
        $review->setComment($data['comment'] ?? null);
        $review->setIsLiked(isset($data['isLiked']) ? (bool)$data['isLiked'] : null);

        $this->em->persist($review);
        $this->em->flush();

        return $this->json(['id' => $review->getId()], 201);
    }

    /**
     * Upload photo avis
     * @Route("/api/public/reviews/{id}/photo", methods={"POST"})
     */
    public function uploadPhoto(int $id, Request $request): JsonResponse
    {
        $review = $this->em->getRepository(Review::class)->find($id);
        if (!$review) return $this->json(['error' => 'Avis introuvable'], 404);

        $file = $request->files->get('photo');
        if (!$file || !$file->isValid()) return $this->json(['error' => 'Fichier invalide'], 400);

        $filename  = 'review_' . $id . '_' . uniqid() . '.' . $file->guessExtension();
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/reviews';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);
        $file->move($uploadDir, $filename);

        $review->setPhoto($filename);
        $this->em->flush();

        return $this->json(['photo' => $filename]);
    }


    /**
     * Infos commande pour avis anonyme
     * @Route("/api/public/orders/{id}/review-info", methods={"GET"})
     */
    public function orderReviewInfo(int $id): JsonResponse
    {
        $order = $this->em->getRepository(Order::class)->find($id);
        if (!$order || $order->getStatus() !== 'PAID') {
            return $this->json(['error' => 'Commande non trouvée ou non payée'], 404);
        }

        $user      = $this->getUser();
        $alreadyReviewed = $user instanceof User
            ? (bool) $this->em->getRepository(Review::class)->findOneBy(['customer' => $user, 'order' => $order])
            : false; // anonyme : vérifié à la soumission (guestName inconnu ici)

        return $this->json([
            'id'              => $order->getId(),
            'orderNumber'     => $order->getOrderNumber(),
            'status'          => $order->getStatus(),
            'total'           => $order->getTotal(),
            'establishmentId' => $order->getEstablishment()->getId(),
            'canReview'       => !$alreadyReviewed,
            'items'           => array_map(fn($item) => [
                'itemType' => $item->getItemType(),
                'itemId'   => $item->getItemId(),
                'itemName' => $item->getItemName(),
            ], $order->getItems()->toArray()),
        ]);
    }

    /**
     * Avis publics d'une cible
     * @Route("/api/public/reviews/{type}/{id}", methods={"GET"})
     */
    public function getByTarget(string $type, int $id): JsonResponse
    {
        $reviews = $this->em->createQueryBuilder()
            ->select('r')
            ->from(Review::class, 'r')
            ->where('r.targetType = :type')
            ->andWhere('r.targetId = :id')
            ->andWhere('r.isApproved = true')
            ->setParameter('type', strtoupper($type))
            ->setParameter('id', $id)
            ->orderBy('r.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $data = array_map(fn(Review $r) => [
            'id'        => $r->getId(),
            'rating'    => $r->getRating(),
            'comment'   => $r->getComment(),
            'photo'     => $r->getPhoto(),
            'isLiked'   => $r->getIsLiked(),
            'createdAt' => $r->getCreatedAt()->format('Y-m-d'),
            'customer'  => $r->getCustomer() ? [
                'firstName' => $r->getCustomer()->getFirstName(),
                'lastName'  => $r->getCustomer()->getLastName(),
                'avatar'    => $r->getCustomer()->getAvatar(),
            ] : [
                'firstName' => $r->getGuestName() ?? 'Anonyme',
                'lastName'  => '',
                'avatar'    => null,
            ],
        ], $reviews);

        $avgRating = count($data) > 0
            ? round(array_sum(array_column($data, 'rating')) / count($data), 1)
            : 0;

        return $this->json([
            'reviews'   => $data,
            'count'     => count($data),
            'avgRating' => $avgRating,
        ]);
    }

    /**
     * Historique commandes du client connecté
     * @Route("/api/public/customer/orders", methods={"GET"})
     */
    public function customerOrders(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) return $this->json(['error' => 'Non connecté'], 401);

        // Commandes liées via FK (nouvelles) OU via customerName (anciennes)
        $firstName = trim($user->getFirstName() ?? '');
        $fullName  = trim(($user->getFirstName() ?? '') . ' ' . ($user->getLastName() ?? ''));

        $conditions = ['o.customer = :user'];
        $params = ['user' => $user];

        if ($firstName !== '') {
            $conditions[] = 'o.customerName = :firstName';
            $params['firstName'] = $firstName;
        }
        if ($fullName !== $firstName && $fullName !== '') {
            $conditions[] = 'o.customerName = :fullName';
            $params['fullName'] = $fullName;
        }

        $qb = $this->em->createQueryBuilder()
            ->select('o')->from(Order::class, 'o')
            ->where(implode(' OR ', $conditions))
            ->orderBy('o.createdAt', 'DESC')
            ->setMaxResults(50);

        foreach ($params as $key => $val) {
            $qb->setParameter($key, $val);
        }

        $orders = $qb->getQuery()->getResult();

        return $this->json(array_map(fn(Order $o) => [
            'id'              => $o->getId(),
            'orderNumber'     => $o->getOrderNumber(),
            'status'          => $o->getStatus(),
            'total'           => $o->getTotal(),
            'createdAt'       => $o->getCreatedAt()->format('Y-m-d H:i'),
            'establishmentId' => $o->getEstablishment()->getId(),
            'canReview'       => $o->getStatus() === 'PAID' && !$this->em->getRepository(Review::class)->findOneBy(['customer' => $user, 'order' => $o]),
            'items'           => array_map(fn($item) => [
                'itemType' => $item->getItemType(),
                'itemId'   => $item->getItemId(),
                'itemName' => $item->getItemName(),
            ], $o->getItems()->toArray()),
        ], $orders));
    }

    /**
     * Avis en attente de modération (admin)
     * @Route("/api/reviews/pending", methods={"GET"})
     */
    public function pending(): JsonResponse
    {
        $reviews = $this->em->createQueryBuilder()
            ->select('r')
            ->from(Review::class, 'r')
            ->where('r.isApproved = false')
            ->orderBy('r.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->json(array_map(fn(Review $r) => [
            'id'         => $r->getId(),
            'targetType' => $r->getTargetType(),
            'targetId'   => $r->getTargetId(),
            'rating'     => $r->getRating(),
            'comment'    => $r->getComment(),
            'isLiked'    => $r->getIsLiked(),
            'photo'      => $r->getPhoto(),
            'createdAt'  => $r->getCreatedAt()->format('Y-m-d H:i'),
            'customer'   => $r->getCustomer()
                ? $r->getCustomer()->getFullName()
                : ($r->getGuestName() ?? 'Anonyme'),
        ], $reviews));
    }

    /**
     * Approuver / rejeter (admin)
     * @Route("/api/reviews/{id}/moderate", methods={"POST"})
     */
    public function moderate(int $id, Request $request): JsonResponse
    {
        $review = $this->em->getRepository(Review::class)->find($id);
        if (!$review) return $this->json(['error' => 'Avis introuvable'], 404);

        $data   = json_decode($request->getContent(), true);
        $action = $data['action'] ?? 'approve';

        if ($action === 'approve') {
            $review->setIsApproved(true);
            $this->em->flush();
            return $this->json(['success' => true, 'status' => 'approved']);
        } else {
            $this->em->remove($review);
            $this->em->flush();
            return $this->json(['success' => true, 'status' => 'rejected']);
        }
    }
}