<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260317125621 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE category ADD establishment_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE category ADD CONSTRAINT FK_64C19C18565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('CREATE INDEX IDX_64C19C18565851 ON category (establishment_id)');
        $this->addSql('ALTER TABLE menus CHANGE establishment_id establishment_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE menus ADD CONSTRAINT FK_727508CF8565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('CREATE INDEX IDX_727508CF8565851 ON menus (establishment_id)');
        $this->addSql('ALTER TABLE pack ADD establishment_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE pack ADD CONSTRAINT FK_97DE5E238565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('CREATE INDEX IDX_97DE5E238565851 ON pack (establishment_id)');
        $this->addSql('ALTER TABLE product ADD establishment_id INT DEFAULT NULL, ADD description LONGTEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE product ADD CONSTRAINT FK_D34A04AD8565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('CREATE INDEX IDX_D34A04AD8565851 ON product (establishment_id)');
        $this->addSql('ALTER TABLE user ADD establishment_id INT DEFAULT NULL, ADD max_users INT NOT NULL, DROP facebook_id');
        $this->addSql('ALTER TABLE user ADD CONSTRAINT FK_8D93D6498565851 FOREIGN KEY (establishment_id) REFERENCES establishments (id)');
        $this->addSql('CREATE INDEX IDX_8D93D6498565851 ON user (establishment_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE menus DROP FOREIGN KEY FK_727508CF8565851');
        $this->addSql('DROP INDEX IDX_727508CF8565851 ON menus');
        $this->addSql('ALTER TABLE menus CHANGE establishment_id establishment_id INT NOT NULL');
        $this->addSql('ALTER TABLE pack DROP FOREIGN KEY FK_97DE5E238565851');
        $this->addSql('DROP INDEX IDX_97DE5E238565851 ON pack');
        $this->addSql('ALTER TABLE pack DROP establishment_id');
        $this->addSql('ALTER TABLE product DROP FOREIGN KEY FK_D34A04AD8565851');
        $this->addSql('DROP INDEX IDX_D34A04AD8565851 ON product');
        $this->addSql('ALTER TABLE product DROP establishment_id, DROP description');
        $this->addSql('ALTER TABLE user DROP FOREIGN KEY FK_8D93D6498565851');
        $this->addSql('DROP INDEX IDX_8D93D6498565851 ON user');
        $this->addSql('ALTER TABLE user ADD facebook_id VARCHAR(255) DEFAULT NULL, DROP establishment_id, DROP max_users');
        $this->addSql('ALTER TABLE category DROP FOREIGN KEY FK_64C19C18565851');
        $this->addSql('DROP INDEX IDX_64C19C18565851 ON category');
        $this->addSql('ALTER TABLE category DROP establishment_id');
    }
}
