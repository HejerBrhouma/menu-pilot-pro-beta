<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260318131026 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE promotion_conflicts (id INT AUTO_INCREMENT NOT NULL, establishment_id INT NOT NULL, resolved_by_id INT DEFAULT NULL, target_type VARCHAR(20) NOT NULL, target_id INT NOT NULL, target_name VARCHAR(255) NOT NULL, promotion_ids JSON NOT NULL COMMENT \'(DC2Type:json)\', resolution VARCHAR(10) DEFAULT NULL, is_resolved TINYINT(1) NOT NULL, resolved_at DATETIME DEFAULT NULL, auto_resolve_at DATETIME NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_2C5DDAC28565851 (establishment_id), INDEX IDX_2C5DDAC26713A32B (resolved_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE promotions (id INT AUTO_INCREMENT NOT NULL, establishment_id INT NOT NULL, name VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, type VARCHAR(20) NOT NULL, value DOUBLE PRECISION NOT NULL, scope VARCHAR(20) NOT NULL, target_id INT NOT NULL, start_date DATETIME NOT NULL, end_date DATETIME NOT NULL, is_active TINYINT(1) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_EA1B30348565851 (establishment_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE promotion_conflicts ADD CONSTRAINT FK_2C5DDAC28565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('ALTER TABLE promotion_conflicts ADD CONSTRAINT FK_2C5DDAC26713A32B FOREIGN KEY (resolved_by_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE promotions ADD CONSTRAINT FK_EA1B30348565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE promotion_conflicts DROP FOREIGN KEY FK_2C5DDAC28565851');
        $this->addSql('ALTER TABLE promotion_conflicts DROP FOREIGN KEY FK_2C5DDAC26713A32B');
        $this->addSql('ALTER TABLE promotions DROP FOREIGN KEY FK_EA1B30348565851');
        $this->addSql('DROP TABLE promotion_conflicts');
        $this->addSql('DROP TABLE promotions');
    }
}
