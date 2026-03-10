<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260309171037 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE menu_section_product ADD CONSTRAINT FK_3D17E786F98E57A8 FOREIGN KEY (menu_section_id) REFERENCES menu_sections (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE menu_section_pack ADD CONSTRAINT FK_6D62438DF98E57A8 FOREIGN KEY (menu_section_id) REFERENCES menu_sections (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE menu_section_category ADD CONSTRAINT FK_AA1EBD62F98E57A8 FOREIGN KEY (menu_section_id) REFERENCES menu_sections (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE menu_section_product DROP FOREIGN KEY FK_3D17E786F98E57A8');
        $this->addSql('ALTER TABLE menu_section_pack DROP FOREIGN KEY FK_6D62438DF98E57A8');
        $this->addSql('ALTER TABLE menu_section_category DROP FOREIGN KEY FK_AA1EBD62F98E57A8');
    }
}
