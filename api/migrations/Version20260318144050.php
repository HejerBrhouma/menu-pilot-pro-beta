<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260318144050 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE establishments ADD anniversary_date DATE DEFAULT NULL');
        $this->addSql('ALTER TABLE menus CHANGE establishment_id establishment_id INT NOT NULL');
        $this->addSql('ALTER TABLE promotions ADD target_ids JSON NOT NULL COMMENT \'(DC2Type:json)\', ADD start_time VARCHAR(5) DEFAULT NULL, ADD end_time VARCHAR(5) DEFAULT NULL, ADD recurrence_type VARCHAR(20) NOT NULL, ADD recurrence_days JSON DEFAULT NULL COMMENT \'(DC2Type:json)\', ADD special_event VARCHAR(30) NOT NULL, ADD special_event_date DATE DEFAULT NULL, ADD custom_dates JSON DEFAULT NULL COMMENT \'(DC2Type:json)\', DROP target_id, CHANGE start_date start_date DATE DEFAULT NULL, CHANGE end_date end_date DATE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE menus CHANGE establishment_id establishment_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE promotions ADD target_id INT NOT NULL, DROP target_ids, DROP start_time, DROP end_time, DROP recurrence_type, DROP recurrence_days, DROP special_event, DROP special_event_date, DROP custom_dates, CHANGE start_date start_date DATETIME NOT NULL, CHANGE end_date end_date DATETIME NOT NULL');
        $this->addSql('ALTER TABLE establishments DROP anniversary_date');
    }
}
