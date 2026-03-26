#hajerbenrhouma-module-review-sc-97.sql

CREATE TABLE customer_accounts (
                                   id INT AUTO_INCREMENT NOT NULL,
                                   establishment_id INT NOT NULL,
                                   email VARCHAR(180) NOT NULL,
                                   first_name VARCHAR(100) DEFAULT NULL,
                                   last_name VARCHAR(100) DEFAULT NULL,
                                   password VARCHAR(255) DEFAULT NULL,
                                   avatar VARCHAR(255) DEFAULT NULL,
                                   google_id VARCHAR(255) DEFAULT NULL,
                                   facebook_id VARCHAR(255) DEFAULT NULL,
                                   created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
                                   UNIQUE INDEX UNIQ_customer_email (email, establishment_id),
                                   INDEX IDX_customer_est (establishment_id),
                                   PRIMARY KEY(id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

ALTER TABLE customer_accounts
    ADD CONSTRAINT FK_customer_est
        FOREIGN KEY (establishment_id) REFERENCES establishments (id);

CREATE TABLE reviews (
                         id INT AUTO_INCREMENT NOT NULL,
                         customer_id INT NOT NULL,
                         order_id INT NOT NULL,
                         establishment_id INT NOT NULL,
                         target_type VARCHAR(20) NOT NULL,
                         target_id INT NOT NULL,
                         rating INT NOT NULL,
                         comment LONGTEXT DEFAULT NULL,
                         photo VARCHAR(255) DEFAULT NULL,
                         is_liked TINYINT(1) DEFAULT NULL,
                         is_approved TINYINT(1) NOT NULL DEFAULT 0,
                         created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
                         INDEX IDX_review_customer (customer_id),
                         INDEX IDX_review_order (order_id),
                         INDEX IDX_review_target (target_type, target_id),
                         PRIMARY KEY(id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

ALTER TABLE reviews
    ADD CONSTRAINT FK_review_customer FOREIGN KEY (customer_id) REFERENCES customer_accounts (id),
    ADD CONSTRAINT FK_review_order FOREIGN KEY (order_id) REFERENCES orders (id),
    ADD CONSTRAINT FK_review_est FOREIGN KEY (establishment_id) REFERENCES establishments (id);