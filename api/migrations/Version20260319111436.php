<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260319111436 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE invoices (id INT AUTO_INCREMENT NOT NULL, order_id INT NOT NULL, waiter_id INT NOT NULL, establishment_id INT NOT NULL, invoice_number VARCHAR(20) NOT NULL, items_snapshot JSON NOT NULL COMMENT \'(DC2Type:json)\', subtotal DOUBLE PRECISION NOT NULL, discount DOUBLE PRECISION NOT NULL, total DOUBLE PRECISION NOT NULL, payment_method VARCHAR(20) DEFAULT NULL, status VARCHAR(20) NOT NULL, paid_at DATETIME DEFAULT NULL, notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_6A2F2F952DA68207 (invoice_number), UNIQUE INDEX UNIQ_6A2F2F958D9F6D38 (order_id), INDEX IDX_6A2F2F95E9F3D07E (waiter_id), INDEX IDX_6A2F2F958565851 (establishment_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE order_items (id INT AUTO_INCREMENT NOT NULL, order_id INT DEFAULT NULL, item_type VARCHAR(10) NOT NULL, item_id INT NOT NULL, item_name VARCHAR(255) NOT NULL, unit_price DOUBLE PRECISION NOT NULL, final_price DOUBLE PRECISION NOT NULL, quantity INT NOT NULL, notes LONGTEXT DEFAULT NULL, applied_promotions JSON DEFAULT NULL COMMENT \'(DC2Type:json)\', INDEX IDX_62809DB08D9F6D38 (order_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE orders (id INT AUTO_INCREMENT NOT NULL, table_id INT DEFAULT NULL, waiter_id INT NOT NULL, establishment_id INT NOT NULL, order_number VARCHAR(20) NOT NULL, type VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, subtotal DOUBLE PRECISION NOT NULL, discount DOUBLE PRECISION NOT NULL, total DOUBLE PRECISION NOT NULL, notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_E52FFDEE551F0F81 (order_number), INDEX IDX_E52FFDEEECFF285C (table_id), INDEX IDX_E52FFDEEE9F3D07E (waiter_id), INDEX IDX_E52FFDEE8565851 (establishment_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE restaurant_tables (id INT AUTO_INCREMENT NOT NULL, establishment_id INT NOT NULL, name VARCHAR(100) NOT NULL, capacity INT NOT NULL, is_active TINYINT(1) NOT NULL, qr_token VARCHAR(64) NOT NULL, UNIQUE INDEX UNIQ_75D9FDD01AE26361 (qr_token), INDEX IDX_75D9FDD08565851 (establishment_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE invoices ADD CONSTRAINT FK_6A2F2F958D9F6D38 FOREIGN KEY (order_id) REFERENCES orders (id)');
        $this->addSql('ALTER TABLE invoices ADD CONSTRAINT FK_6A2F2F95E9F3D07E FOREIGN KEY (waiter_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE invoices ADD CONSTRAINT FK_6A2F2F958565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('ALTER TABLE order_items ADD CONSTRAINT FK_62809DB08D9F6D38 FOREIGN KEY (order_id) REFERENCES orders (id)');
        $this->addSql('ALTER TABLE orders ADD CONSTRAINT FK_E52FFDEEECFF285C FOREIGN KEY (table_id) REFERENCES restaurant_tables (id)');
        $this->addSql('ALTER TABLE orders ADD CONSTRAINT FK_E52FFDEEE9F3D07E FOREIGN KEY (waiter_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE orders ADD CONSTRAINT FK_E52FFDEE8565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('ALTER TABLE restaurant_tables ADD CONSTRAINT FK_75D9FDD08565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE invoices DROP FOREIGN KEY FK_6A2F2F958D9F6D38');
        $this->addSql('ALTER TABLE invoices DROP FOREIGN KEY FK_6A2F2F95E9F3D07E');
        $this->addSql('ALTER TABLE invoices DROP FOREIGN KEY FK_6A2F2F958565851');
        $this->addSql('ALTER TABLE order_items DROP FOREIGN KEY FK_62809DB08D9F6D38');
        $this->addSql('ALTER TABLE orders DROP FOREIGN KEY FK_E52FFDEEECFF285C');
        $this->addSql('ALTER TABLE orders DROP FOREIGN KEY FK_E52FFDEEE9F3D07E');
        $this->addSql('ALTER TABLE orders DROP FOREIGN KEY FK_E52FFDEE8565851');
        $this->addSql('ALTER TABLE restaurant_tables DROP FOREIGN KEY FK_75D9FDD08565851');
        $this->addSql('DROP TABLE invoices');
        $this->addSql('DROP TABLE order_items');
        $this->addSql('DROP TABLE orders');
        $this->addSql('DROP TABLE restaurant_tables');
    }
}
