<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260323092030 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE product_category DROP FOREIGN KEY FK_CDFC73564584665A');
        $this->addSql('ALTER TABLE menu_section_product DROP FOREIGN KEY FK_3D17E7864584665A');
        $this->addSql('ALTER TABLE pack_product DROP FOREIGN KEY FK_E80394D04584665A');
        $this->addSql('CREATE TABLE products (id INT AUTO_INCREMENT NOT NULL, establishment_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, price DOUBLE PRECISION NOT NULL, description LONGTEXT DEFAULT NULL, image VARCHAR(255) DEFAULT NULL, is_available TINYINT(1) NOT NULL, INDEX IDX_B3BA5A5A8565851 (establishment_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE products ADD CONSTRAINT FK_B3BA5A5A8565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('ALTER TABLE product DROP FOREIGN KEY FK_product_est');
        $this->addSql('DROP TABLE product');
        $this->addSql('ALTER TABLE establishments DROP name');
        $this->addSql('ALTER TABLE menu_section_product DROP FOREIGN KEY FK_3D17E7864584665A');
        $this->addSql('ALTER TABLE menu_section_product ADD CONSTRAINT FK_3D17E7864584665A FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE');
        $this->addSql('DROP INDEX UNIQ_E52FFDEE551F0F81 ON orders');
        $this->addSql('ALTER TABLE orders ADD customer_name VARCHAR(100) DEFAULT NULL, CHANGE order_number order_number VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE pack_product DROP FOREIGN KEY FK_E80394D04584665A');
        $this->addSql('ALTER TABLE pack_product ADD CONSTRAINT FK_E80394D04584665A FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE product_category DROP FOREIGN KEY FK_CDFC73564584665A');
        $this->addSql('ALTER TABLE product_category ADD CONSTRAINT FK_CDFC73564584665A FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user CHANGE first_name first_name VARCHAR(100) DEFAULT NULL, CHANGE last_name last_name VARCHAR(100) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE menu_section_product DROP FOREIGN KEY FK_3D17E7864584665A');
        $this->addSql('ALTER TABLE pack_product DROP FOREIGN KEY FK_E80394D04584665A');
        $this->addSql('ALTER TABLE product_category DROP FOREIGN KEY FK_CDFC73564584665A');
        $this->addSql('CREATE TABLE product (id INT AUTO_INCREMENT NOT NULL, establishment_id INT DEFAULT NULL, name VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, price DOUBLE PRECISION NOT NULL, is_available TINYINT(1) NOT NULL, description LONGTEXT CHARACTER SET utf8mb4 DEFAULT NULL COLLATE `utf8mb4_unicode_ci`, INDEX IDX_D34A04AD8565851 (establishment_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('ALTER TABLE product ADD CONSTRAINT FK_product_est FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('ALTER TABLE products DROP FOREIGN KEY FK_B3BA5A5A8565851');
        $this->addSql('DROP TABLE products');
        $this->addSql('ALTER TABLE product_category DROP FOREIGN KEY FK_CDFC73564584665A');
        $this->addSql('ALTER TABLE product_category ADD CONSTRAINT FK_CDFC73564584665A FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE orders DROP customer_name, CHANGE order_number order_number VARCHAR(20) NOT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_E52FFDEE551F0F81 ON orders (order_number)');
        $this->addSql('ALTER TABLE menu_section_product DROP FOREIGN KEY FK_3D17E7864584665A');
        $this->addSql('ALTER TABLE menu_section_product ADD CONSTRAINT FK_3D17E7864584665A FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user CHANGE first_name first_name VARCHAR(255) NOT NULL, CHANGE last_name last_name VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE pack_product DROP FOREIGN KEY FK_E80394D04584665A');
        $this->addSql('ALTER TABLE pack_product ADD CONSTRAINT FK_E80394D04584665A FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE establishments ADD name VARCHAR(255) NOT NULL');
    }
}
