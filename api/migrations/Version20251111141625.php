<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251111141625 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE refresh_token ADD refresh_token_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE refresh_token ADD CONSTRAINT FK_C74F2195F765F60E FOREIGN KEY (refresh_token_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_C74F2195F765F60E ON refresh_token (refresh_token_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE refresh_token DROP FOREIGN KEY FK_C74F2195F765F60E');
        $this->addSql('DROP INDEX IDX_C74F2195F765F60E ON refresh_token');
        $this->addSql('ALTER TABLE refresh_token DROP refresh_token_id');
    }
}
