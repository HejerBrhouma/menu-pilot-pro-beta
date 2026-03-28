<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * - establishments : ajoute tva_rate (taux TVA configurable, null = 19% par défaut)
 * - invoices       : ajoute tva_rate (figé au paiement) + tva_amount
 * - invoice_lines  : nouvelle table des lignes de facturation
 */
final class Version20260328000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'TVA sur factures : tva_rate sur establishments, tva_rate+tva_amount sur invoices, table invoice_lines';
    }

    public function up(Schema $schema): void
    {
        // 1. Taux TVA sur l'enseigne (nullable : null → 19 % par défaut)
        $this->addSql('ALTER TABLE establishments ADD tva_rate DOUBLE PRECISION DEFAULT NULL');

        // 2. Taux et montant TVA figés sur la facture
        $this->addSql('ALTER TABLE invoices ADD tva_rate DOUBLE PRECISION NOT NULL DEFAULT 19');
        $this->addSql('ALTER TABLE invoices ADD tva_amount DOUBLE PRECISION NOT NULL DEFAULT 0');

        // 3. Table des lignes de facturation
        $this->addSql('
            CREATE TABLE invoice_lines (
                id           INT AUTO_INCREMENT NOT NULL,
                invoice_id   INT NOT NULL,
                description  VARCHAR(255) NOT NULL,
                item_type    VARCHAR(20)  NOT NULL,
                item_id      INT NOT NULL,
                quantity     INT NOT NULL,
                unit_price   DOUBLE PRECISION NOT NULL,
                total        DOUBLE PRECISION NOT NULL,
                PRIMARY KEY(id),
                INDEX IDX_invoice_lines_invoice (invoice_id),
                CONSTRAINT FK_invoice_lines_invoice
                    FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        ');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE invoice_lines');
        $this->addSql('ALTER TABLE invoices DROP tva_rate, DROP tva_amount');
        $this->addSql('ALTER TABLE establishments DROP tva_rate');
    }
}
