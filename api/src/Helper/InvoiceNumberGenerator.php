<?php
// src/Helper/InvoiceNumberGenerator.php
namespace App\Helper;

use App\Entity\Establishment;
use App\Entity\Invoice;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Génère un numéro de facture unique par enseigne et par année.
 * Format : FAC-{YYYY}-{NNNN}  ex: FAC-2026-0001
 */
class InvoiceNumberGenerator
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    public function generate(Establishment $establishment): string
    {
        $year  = date('Y');
        $count = (int) $this->em->createQueryBuilder()
            ->select('COUNT(i.id)')
            ->from(Invoice::class, 'i')
            ->where('i.establishment = :est')
            ->andWhere('i.createdAt >= :start')
            ->setParameter('est',   $establishment)
            ->setParameter('start', new \DateTime("$year-01-01"))
            ->getQuery()
            ->getSingleScalarResult();

        return sprintf('FAC-%s-%04d', $year, $count + 1);
    }
}
