<?php
// src/EventSubscriber/TableStatusSubscriber.php
namespace App\EventSubscriber;

use ApiPlatform\Core\EventListener\EventPriorities;
use App\Entity\Table;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Calcule le statut FREE/OCCUPIED de chaque table en une seule requête SQL,
 * juste avant la sérialisation de la réponse API Platform.
 */
class TableStatusSubscriber implements EventSubscriberInterface
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::VIEW => ['onKernelView', EventPriorities::PRE_SERIALIZE],
        ];
    }

    public function onKernelView(ViewEvent $event): void
    {
        $request = $event->getRequest();

        if ($request->attributes->get('_api_resource_class') !== Table::class) {
            return;
        }

        // Une seule requête : IDs des tables ayant une commande active
        $occupiedIds = $this->em->createQuery(
            'SELECT IDENTITY(o.table) as tableId
             FROM App\Entity\Order o
             WHERE o.status IN (:statuses) AND o.table IS NOT NULL'
        )
        ->setParameter('statuses', ['PENDING', 'CONFIRMED', 'SERVED'])
        ->getSingleColumnResult();

        $occupiedSet = array_flip($occupiedIds);

        $result = $event->getControllerResult();

        if ($result instanceof Table) {
            $result->setStatus(isset($occupiedSet[$result->getId()]) ? 'OCCUPIED' : 'FREE');
            return;
        }

        if (is_iterable($result)) {
            foreach ($result as $table) {
                if ($table instanceof Table) {
                    $table->setStatus(isset($occupiedSet[$table->getId()]) ? 'OCCUPIED' : 'FREE');
                }
            }
        }
    }
}
