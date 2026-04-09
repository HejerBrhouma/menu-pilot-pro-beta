-- ============================================================
-- story.sql  —  Toutes les requêtes ALTER à passer sur phpMyAdmin
-- Exécuter dans l'ordre, elles sont toutes idempotentes (IF NOT EXISTS)
-- ============================================================


-- ── 1. Colonnes manquantes sur la table `establishments` ──────────────
--      (modes de paiement + permissions staff)
--      Ces colonnes ont été ajoutées à l'entité PHP mais pas migrées en base.
--      CAUSE du bug "liste vide chez le super admin" : Doctrine cherche ces
--      colonnes au SELECT → MySQL lève "Unknown column" → 500 → liste vide.

ALTER TABLE establishments
    ADD COLUMN IF NOT EXISTS payment_methods        JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS custom_payment_methods JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS staff_permissions      JSON DEFAULT NULL;


-- ── 2. Valeurs par défaut pour les lignes existantes ─────────────────

UPDATE establishments
SET payment_methods = '["cash","card"]'
WHERE payment_methods IS NULL;

UPDATE establishments
SET custom_payment_methods = '[]'
WHERE custom_payment_methods IS NULL;

UPDATE establishments
SET staff_permissions = '{
  "manager": {
    "canManageProducts": true,
    "canManageMenu": true,
    "canManageCategories": true,
    "canManagePacks": true,
    "canManagePromotions": true,
    "canManageGallery": true,
    "canManageTables": true,
    "canViewReports": true
  },
  "waiter": {
    "canManageOrders": true,
    "canManageTables": true,
    "canViewReports": false
  }
}'
WHERE staff_permissions IS NULL;


-- ── 3. Table gallery_images (créer si elle n'existe pas encore) ───────

CREATE TABLE IF NOT EXISTS gallery_images (
    id               INT AUTO_INCREMENT NOT NULL,
    establishment_id INT NOT NULL,
    filename         VARCHAR(255) NOT NULL,
    title            VARCHAR(255) DEFAULT NULL,
    category         VARCHAR(100) DEFAULT 'Autre',
    position         INT NOT NULL DEFAULT 0,
    created_at       DATETIME NOT NULL,
    PRIMARY KEY (id),
    INDEX IDX_gallery_establishment (establishment_id),
    CONSTRAINT FK_gallery_establishment
        FOREIGN KEY (establishment_id)
        REFERENCES establishments (id)
        ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;


-- ── 4. Reviews — Plan fix avis anonymes + historique client ──────────

-- 4a. Rendre customer_id nullable sur reviews
--     (pour les avis anonymes sans compte connecté)
ALTER TABLE reviews MODIFY customer_id INT NULL;

-- 4b. Ajouter customer_id sur orders
--     (lien entre commande QR et client connecté)
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_id INT NULL;

-- 4c. Contrainte FK (ignorer si elle existe déjà)
SET @fk_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME         = 'orders'
      AND CONSTRAINT_NAME    = 'FK_orders_customer'
      AND CONSTRAINT_TYPE    = 'FOREIGN KEY'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE orders ADD CONSTRAINT FK_orders_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
