<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260317124350 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE menus ADD establishment_id INT NOT NULL');
        $this->addSql('ALTER TABLE menus ADD CONSTRAINT FK_727508CF8565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('CREATE INDEX IDX_727508CF8565851 ON menus (establishment_id)');
        $this->addSql('ALTER TABLE product ADD establishment_id INT NOT NULL, ADD description LONGTEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE product ADD CONSTRAINT FK_D34A04AD8565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('CREATE INDEX IDX_D34A04AD8565851 ON product (establishment_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE menus DROP FOREIGN KEY FK_727508CF8565851');
        $this->addSql('DROP INDEX IDX_727508CF8565851 ON menus');
        $this->addSql('ALTER TABLE menus DROP establishment_id');
        $this->addSql('ALTER TABLE product DROP FOREIGN KEY FK_D34A04AD8565851');
        $this->addSql('DROP INDEX IDX_D34A04AD8565851 ON product');
        $this->addSql('ALTER TABLE product DROP establishment_id, DROP description');
    }
}
