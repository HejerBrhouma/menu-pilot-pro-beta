<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260309155625 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE menu (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, is_active TINYINT(1) NOT NULL, time_start VARCHAR(5) DEFAULT NULL, time_end VARCHAR(5) DEFAULT NULL, qr_token VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_7D053A931AE26361 (qr_token), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE menu_section (id INT AUTO_INCREMENT NOT NULL, menu_id INT NOT NULL, title VARCHAR(255) NOT NULL, position INT NOT NULL, INDEX IDX_A5A86751CCD7E912 (menu_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE menu_section_product (menu_section_id INT NOT NULL, product_id INT NOT NULL, INDEX IDX_3D17E786F98E57A8 (menu_section_id), INDEX IDX_3D17E7864584665A (product_id), PRIMARY KEY(menu_section_id, product_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE menu_section_pack (menu_section_id INT NOT NULL, pack_id INT NOT NULL, INDEX IDX_6D62438DF98E57A8 (menu_section_id), INDEX IDX_6D62438D1919B217 (pack_id), PRIMARY KEY(menu_section_id, pack_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE menu_section_category (menu_section_id INT NOT NULL, category_id INT NOT NULL, INDEX IDX_AA1EBD62F98E57A8 (menu_section_id), INDEX IDX_AA1EBD6212469DE2 (category_id), PRIMARY KEY(menu_section_id, category_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE menu_section ADD CONSTRAINT FK_A5A86751CCD7E912 FOREIGN KEY (menu_id) REFERENCES menu (id)');
        $this->addSql('ALTER TABLE menu_section_product ADD CONSTRAINT FK_3D17E786F98E57A8 FOREIGN KEY (menu_section_id) REFERENCES menu_section (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE menu_section_product ADD CONSTRAINT FK_3D17E7864584665A FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE menu_section_pack ADD CONSTRAINT FK_6D62438DF98E57A8 FOREIGN KEY (menu_section_id) REFERENCES menu_section (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE menu_section_pack ADD CONSTRAINT FK_6D62438D1919B217 FOREIGN KEY (pack_id) REFERENCES pack (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE menu_section_category ADD CONSTRAINT FK_AA1EBD62F98E57A8 FOREIGN KEY (menu_section_id) REFERENCES menu_section (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE menu_section_category ADD CONSTRAINT FK_AA1EBD6212469DE2 FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE menu_section DROP FOREIGN KEY FK_A5A86751CCD7E912');
        $this->addSql('ALTER TABLE menu_section_product DROP FOREIGN KEY FK_3D17E786F98E57A8');
        $this->addSql('ALTER TABLE menu_section_product DROP FOREIGN KEY FK_3D17E7864584665A');
        $this->addSql('ALTER TABLE menu_section_pack DROP FOREIGN KEY FK_6D62438DF98E57A8');
        $this->addSql('ALTER TABLE menu_section_pack DROP FOREIGN KEY FK_6D62438D1919B217');
        $this->addSql('ALTER TABLE menu_section_category DROP FOREIGN KEY FK_AA1EBD62F98E57A8');
        $this->addSql('ALTER TABLE menu_section_category DROP FOREIGN KEY FK_AA1EBD6212469DE2');
        $this->addSql('DROP TABLE menu');
        $this->addSql('DROP TABLE menu_section');
        $this->addSql('DROP TABLE menu_section_product');
        $this->addSql('DROP TABLE menu_section_pack');
        $this->addSql('DROP TABLE menu_section_category');
    }
}
