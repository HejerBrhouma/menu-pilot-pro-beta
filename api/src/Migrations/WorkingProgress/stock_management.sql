-- Migration: Gestion du stock pour produits et packs
-- À exécuter depuis le container PHP ou phpMyAdmin

ALTER TABLE products
    ADD COLUMN track_stock TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN stock INT DEFAULT NULL;

ALTER TABLE pack
    ADD COLUMN track_stock TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN stock INT DEFAULT NULL;

ALTER TABLE establishments
    ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 0;
