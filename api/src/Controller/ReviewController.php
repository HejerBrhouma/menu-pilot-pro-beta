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
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    /**
     * Créer un avis (client connecté OU anonyme avec guestName)
     * @Route("/api/public/reviews", methods={"POST"})
     */
    public function create(Request $request): JsonResponse
    {
        $requestData = json_decode($request->getContent(), true);
        $user        = $this->getUser();
        $isCustomer  = $user instanceof User && in_array('ROLE_CUSTOMER', $user->getRoles());
        $guestName   = trim($requestData['guestName'] ?? '');

        if (!$isCustomer && empty($guestName)) {
            return $this->json(['error' => 'Connexion ou prénom requis'], 401);
        }

        $order = $this->entityManager->getRepository(Order::class)->find($requestData['orderId'] ?? 0);
        if (!$order || $order->getStatus() !== 'PAID') {
            return $this->json(['error' => 'Commande invalide ou non payée'], 400);
        }

        // Vérifier doublon : une seule fois par commande
        $existingReview = $isCustomer
            ? $this->entityManager->getRepository(Review::class)->findOneBy(['customer' => $user,      'order' => $order])
            : $this->entityManager->getRepository(Review::class)->findOneBy(['guestName' => $guestName, 'order' => $order]);

        if ($existingReview) {
            return $this->json(['error' => 'Vous avez déjà laissé un avis pour cette commande'], 409);
        }

        $review = new Review();
        if ($isCustomer) {
            $review->setCustomer($user);
        } else {
            $review->setGuestName($guestName);
        }
        $review->setOrder($order);
        $review->setEstablishment($order->getEstablishment());
        $review->setTargetType($requestData['targetType']);
        $review->setTargetId((int) $requestData['targetId']);
        $review->setRating((int) ($requestData['rating'] ?? 5));
        $review->setComment($requestData['comment'] ?? null);
        $review->setIsLiked(isset($requestData['isLiked']) ? (bool) $requestData['isLiked'] : null);
        $review->setIsApproved(false); // En attente de validation par le personnel

        $this->entityManager->persist($review);
        $this->entityManager->flush();

        return $this->json(['id' => $review->getId()], 201);
    }

    /**
     * Upload photo avis
     * @Route("/api/public/reviews/{id}/photo", methods={"POST"})
     */
    public function uploadPhoto(int $id, Request $request): JsonResponse
    {
        $review = $this->entityManager->getRepository(Review::class)->find($id);
        if (!$review) {
            return $this->json(['error' => 'Avis introuvable'], 404);
        }

        $uploadedFile = $request->files->get('photo');
        if (!$uploadedFile || !$uploadedFile->isValid()) {
            return $this->json(['error' => 'Fichier invalide'], 400);
        }

        $filename  = 'review_' . $id . '_' . uniqid() . '.' . $uploadedFile->guessExtension();
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/reviews';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }
        $uploadedFile->move($uploadDir, $filename);

        $review->setPhoto($filename);
        $this->entityManager->flush();

        return $this->json(['photo' => $filename]);
    }

    /**
     * Infos commande pour avis anonyme
     * @Route("/api/public/orders/{id}/review-info", methods={"GET"})
     */
    public function orderReviewInfo(int $id): JsonResponse
    {
        $order = $this->entityManager->getRepository(Order::class)->find($id);
        if (!$order || $order->getStatus() !== 'PAID') {
            return $this->json(['error' => 'Commande non trouvée ou non payée'], 404);
        }

        $user            = $this->getUser();
        $alreadyReviewed = $user instanceof User
            ? (bool) $this->entityManager->getRepository(Review::class)->findOneBy(['customer' => $user, 'order' => $order])
            : false; // anonyme : vérifié à la soumission (guestName inconnu ici)

        $establishment = $order->getEstablishment();

        return $this->json([
            'id'              => $order->getId(),
            'orderNumber'     => $order->getOrderNumber(),
            'status'          => $order->getStatus(),
            'total'           => $order->getTotal(),
            'customerName'    => $order->getCustomerName(),
            'establishmentId' => $establishment->getId(),
            'establishment'   => [
                'id'   => $establishment->getId(),
                'name' => $establishment->getName(),
                'logo' => $establishment->getLogo(),
                'slug' => $establishment->getSlug(),
            ],
            'canReview'       => !$alreadyReviewed,
            'items'           => array_map(fn($orderItem) => [
                'itemType' => $orderItem->getItemType(),
                'itemId'   => $orderItem->getItemId(),
                'itemName' => $orderItem->getItemName(),
            ], $order->getItems()->toArray()),
        ]);
    }

    /**
     * Avis publics d'une cible
     * @Route("/api/public/reviews/{type}/{id}", methods={"GET"}, requirements={"id"="\d+"})
     */
    public function getByTarget(string $type, int $id): JsonResponse
    {
        if ($id <= 0) {
            return $this->json(['reviews' => [], 'count' => 0, 'avgRating' => 0]);
        }

        $reviews = $this->entityManager->createQueryBuilder()
            ->select('review')
            ->from(Review::class, 'review')
            ->where('review.targetType = :type')
            ->andWhere('review.targetId = :id')
            ->andWhere('review.isApproved = true')
            ->setParameter('type', strtoupper($type))
            ->setParameter('id', $id)
            ->orderBy('review.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $reviewsData = array_map(fn(Review $review) => [
            'id'        => $review->getId(),
            'rating'    => $review->getRating(),
            'comment'   => $review->getComment(),
            'photo'     => $review->getPhoto(),
            'isLiked'   => $review->getIsLiked(),
            'createdAt' => $review->getCreatedAt()->format('Y-m-d'),
            'customer'  => $review->getCustomer() ? [
                'firstName' => $review->getCustomer()->getFirstName(),
                'lastName'  => $review->getCustomer()->getLastName(),
                'avatar'    => $review->getCustomer()->getAvatar(),
            ] : [
                'firstName' => $review->getGuestName() ?? 'Anonyme',
                'lastName'  => '',
                'avatar'    => null,
            ],
        ], $reviews);

        $avgRating = count($reviewsData) > 0
            ? round(array_sum(array_column($reviewsData, 'rating')) / count($reviewsData), 1)
            : 0;

        return $this->json([
            'reviews'   => $reviewsData,
            'count'     => count($reviewsData),
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
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non connecté'], 401);
        }

        // Commandes liées via FK (nouvelles) OU via customerName (anciennes)
        $firstName = trim($user->getFirstName() ?? '');
        $fullName  = trim(($user->getFirstName() ?? '') . ' ' . ($user->getLastName() ?? ''));

        $conditions = ['customerOrder.customer = :user'];
        $parameters = ['user' => $user];

        if ($firstName !== '') {
            $conditions[] = 'customerOrder.customerName = :firstName';
            $parameters['firstName'] = $firstName;
        }
        if ($fullName !== $firstName && $fullName !== '') {
            $conditions[] = 'customerOrder.customerName = :fullName';
            $parameters['fullName'] = $fullName;
        }

        $queryBuilder = $this->entityManager->createQueryBuilder()
            ->select('customerOrder')
            ->from(Order::class, 'customerOrder')
            ->where(implode(' OR ', $conditions))
            ->orderBy('customerOrder.createdAt', 'DESC')
            ->setMaxResults(50);

        foreach ($parameters as $key => $value) {
            $queryBuilder->setParameter($key, $value);
        }

        $orders = $queryBuilder->getQuery()->getResult();

        return $this->json(array_map(function (Order $order) use ($user) {
            $establishment = $order->getEstablishment();
            return [
                'id'              => $order->getId(),
                'orderNumber'     => $order->getOrderNumber(),
                'status'          => $order->getStatus(),
                'total'           => $order->getTotal(),
                'createdAt'       => $order->getCreatedAt()->format('Y-m-d H:i'),
                'establishmentId' => $establishment->getId(),
                'establishment'   => [
                    'id'   => $establishment->getId(),
                    'name' => $establishment->getName(),
                    'logo' => $establishment->getLogo(),
                    'slug' => $establishment->getSlug(),
                ],
                'canReview'       => $order->getStatus() === 'PAID' && !$this->entityManager->getRepository(Review::class)->findOneBy(['customer' => $user, 'order' => $order]),
                'items'           => array_map(fn($orderItem) => [
                    'itemType' => $orderItem->getItemType(),
                    'itemId'   => $orderItem->getItemId(),
                    'itemName' => $orderItem->getItemName(),
                ], $order->getItems()->toArray()),
            ];
        }, $orders));
    }

    /**
     * Avis en attente de modération (admin)
     * @Route("/api/reviews/pending", methods={"GET"})
     */
    public function pending(): JsonResponse
    {
        $reviews = $this->entityManager->createQueryBuilder()
            ->select('review')
            ->from(Review::class, 'review')
            ->where('review.isApproved = false')
            ->orderBy('review.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->json(array_map(fn(Review $review) => [
            'id'         => $review->getId(),
            'targetType' => $review->getTargetType(),
            'targetId'   => $review->getTargetId(),
            'rating'     => $review->getRating(),
            'comment'    => $review->getComment(),
            'isLiked'    => $review->getIsLiked(),
            'photo'      => $review->getPhoto(),
            'createdAt'  => $review->getCreatedAt()->format('Y-m-d H:i'),
            'customer'   => $review->getCustomer()
                ? $review->getCustomer()->getFullName()
                : ($review->getGuestName() ?? 'Anonyme'),
        ], $reviews));
    }

    /**
     * Approuver / rejeter (admin)
     * @Route("/api/reviews/{id}/moderate", methods={"POST"})
     */
    public function moderate(int $id, Request $request): JsonResponse
    {
        $review = $this->entityManager->getRepository(Review::class)->find($id);
        if (!$review) {
            return $this->json(['error' => 'Avis introuvable'], 404);
        }

        $requestData    = json_decode($request->getContent(), true);
        $moderationAction = $requestData['action'] ?? 'approve';

        if ($moderationAction === 'approve') {
            $review->setIsApproved(true);
            $this->entityManager->flush();
            return $this->json(['success' => true, 'status' => 'approved']);
        }

        $this->entityManager->remove($review);
        $this->entityManager->flush();
        return $this->json(['success' => true, 'status' => 'rejected']);
    }
}
