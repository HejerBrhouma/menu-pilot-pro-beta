# Menu Pilot Pro — Documentation

Application de gestion de restaurant full-stack avec commande QR, caisse (POS), gestion des avis clients et tableau de bord administrateur.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Angular 21 (standalone components) |
| Backend | Symfony 5.4 + API Platform 2 |
| Base de données | MariaDB 10.11 |
| Authentification | JWT (LexikJWTBundle) + Refresh Token |
| Temps réel | Mercure Hub (SSE) |
| Serveur web | Nginx (reverse proxy) |
| Conteneurisation | Docker + Docker Compose |
| Admin BDD | phpMyAdmin |

---

## Architecture du projet

```
menu-pilot-pro-beta/
├── api/                        # Backend Symfony
│   ├── src/
│   │   ├── Controller/         # 15 controllers REST
│   │   ├── Entity/             # 20 entités Doctrine
│   │   ├── Repository/
│   │   ├── Service/
│   │   └── EventSubscriber/
│   ├── config/
│   └── public/uploads/         # Fichiers uploadés (logos, photos)
├── frontend/                   # Frontend Angular
│   └── src/app/
│       ├── core/
│       │   ├── services/       # 30 services
│       │   ├── models/         # 13 interfaces TypeScript
│       │   ├── guards/         # AdminGuard, SuperAdminGuard
│       │   └── interceptors/   # JwtInterceptor
│       ├── pages/
│       │   ├── dashboard/      # Interface admin (28 composants)
│       │   ├── super-admin/    # Super admin (7 composants)
│       │   ├── public/         # Interface client (8 composants)
│       │   ├── establishment-public/
│       │   └── menu-public/
│       └── layout/
├── docker/
│   ├── php/Dockerfile
│   ├── nginx/nginx.conf
│   └── angular/Dockerfile
└── docker-compose.yml
```

---

## Prérequis

- Docker Desktop >= 24
- Docker Compose >= 2
- (Optionnel en local) PHP >= 7.4, Composer, Node.js >= 20, Angular CLI

---

## Lancement avec Docker

### 1. Copier le fichier d'environnement

```bash
cp .env.example .env
```

Remplir les variables :

```env
DB_USER=digimenu
DB_PASSWORD=secret
DB_ROOT_PASSWORD=root_secret
DB_NAME=digimenu
DB_PORT=3306

SYMFONY_PORT=8008
ANGULAR_PORT=4200
PMA_PORT=8080

MERCURE_JWT_SECRET=votre_secret_mercure
```

### 2. Démarrer les services

```bash
docker compose up -d
```

### 3. Initialiser la base de données

```bash
# Créer les tables
docker exec digimenu_symfony_fpm php bin/console doctrine:migrations:migrate --no-interaction

# (Optionnel) Charger les données de démonstration
docker exec digimenu_symfony_fpm php bin/console doctrine:fixtures:load --no-interaction
```

### 4. Générer les clés JWT

```bash
docker exec digimenu_symfony_fpm php bin/console lexik:jwt:generate-keypair
```

### 5. Accès aux services

| Service | URL |
|---------|-----|
| Application Angular | http://localhost:4200 |
| API Symfony | http://localhost:8008 |
| phpMyAdmin | http://localhost:8080 |
| Mercure Hub | http://localhost:3000 |

---

## Lancement sans Docker (développement local)

### Backend

```bash
cd api
composer install
cp .env .env.local   # Adapter DATABASE_URL
php bin/console doctrine:migrations:migrate
symfony serve --port=8008
```

### Frontend

```bash
cd frontend
npm install
ng serve --port=4200
```

---

## Fonctionnalités

### Interface publique (clients)

| Page | URL | Description |
|------|-----|-------------|
| Menu digital | `/menu/:token` | Consultation du menu via QR code |
| Commande QR | `/table/:token` | Commande depuis la table |
| Confirmation | `/order-confirmed` | Page après validation de commande |
| Compte client | `/account` | Connexion, inscription, historique commandes |
| Laisser un avis | `/account/review/:orderId` | Formulaire d'avis après commande payée |
| Page enseigne | `/:slug` | Page publique de l'établissement |

### Interface administration (`/dashboard`)

| Module | Description |
|--------|-------------|
| Tableau de bord | Statistiques, chiffre du jour, alertes |
| Commandes | Liste, détail, changement de statut, paiement |
| Factures | Génération et export PDF |
| Produits | CRUD avec images, prix, catégories |
| Catégories | Organisation du menu |
| Formules (Packs) | Menus composés |
| Menus | Menus du jour / saisonniers |
| Tables | Gestion des tables, QR codes par table |
| Promotions | Remises, conflits de promotions |
| Personnel | Gestion des serveurs et rôles |
| Avis clients | Modération (approuver / rejeter) |
| Notifications | Alertes temps réel |
| Établissement | Paramètres, logo, informations |
| Caisse (POS) | Interface plein écran pour la salle |

### Interface super-admin (`/super-admin`)

| Module | Description |
|--------|-------------|
| Établissements | Créer et gérer plusieurs établissements |
| Utilisateurs | Gestion globale des comptes admin |

---

## Rôles et accès

| Rôle | Accès |
|------|-------|
| `ROLE_CUSTOMER` | Interface publique, compte client, avis |
| `ROLE_WAITER` | Mode POS (lecture), commandes |
| `ROLE_MANAGER` | Dashboard complet, modération avis |
| `ROLE_ADMIN` | Toutes les fonctions de l'établissement |
| `ROLE_SUPER_ADMIN` | Gestion multi-établissements |

---

## Authentification

### Admin / Staff
- Login via `/login` → JWT + Refresh Token
- OAuth Google disponible (`/api/auth/google`)
- Token envoyé dans le header `Authorization: Bearer <token>`

### Client
- Inscription / Connexion via `/account`
- OAuth Google et Facebook disponibles
- Token stocké en `localStorage` (`customer_token`)

---

## API — Principaux endpoints

### Authentification client

```
POST /api/public/customer/register     Inscription
POST /api/public/customer/login        Connexion
POST /api/public/customer/oauth/google OAuth Google
POST /api/public/customer/oauth/facebook OAuth Facebook
GET  /api/public/customer/me           Profil connecté
PATCH /api/public/customer/profile     Mise à jour profil
```

### Commandes publiques (QR)

```
GET  /api/public/table/:token          Infos table + menu
POST /api/public/orders                Créer une commande
GET  /api/public/orders/:id/review-info Infos commande pour avis
GET  /api/public/customer/orders       Historique commandes client
```

### Avis clients

```
POST /api/public/reviews               Soumettre un avis
POST /api/public/reviews/:id/photo     Ajouter une photo à l'avis
GET  /api/public/reviews/:type/:id     Avis publics approuvés d'une cible
GET  /api/reviews/pending              Avis en attente (admin)
POST /api/reviews/:id/moderate         Approuver ou rejeter un avis
```

### Ressources API Platform (CRUD automatique)

```
/api/products
/api/categories
/api/orders
/api/invoices
/api/menus
/api/packs
/api/tables
/api/promotions
/api/establishments
/api/users
```

---

## Modèle de données (entités principales)

```
User ──────────────── Establishment
 │                         │
 ├── ROLE_CUSTOMER          ├── Product ── Category
 ├── ROLE_WAITER            ├── Pack
 ├── ROLE_MANAGER           ├── Menu ── MenuSection
 └── ROLE_ADMIN             ├── Table
                            ├── Order ── OrderItem
                            │    └── Invoice ── InvoiceLine
                            ├── Promotion
                            ├── Review
                            └── Notification
```

---

## Uploads et fichiers

| Type | Dossier | Format |
|------|---------|--------|
| Logo établissement | `public/uploads/logos/` | JPG, PNG, WebP |
| Images produits | `public/uploads/products/` | JPG, PNG, WebP |
| Photos avis | `public/uploads/reviews/` | JPG, PNG |
| Galerie | `public/uploads/gallery/` | JPG, PNG |

---

## Variables d'environnement importantes

### Backend (`api/.env.local`)

```env
DATABASE_URL=mysql://user:pass@localhost:3306/digimenu?serverVersion=mariadb-10.11.2
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=votre_passphrase
JWT_TTL=3600
MERCURE_URL=http://mercure:3000/.well-known/mercure
MERCURE_PUBLIC_URL=http://localhost:3000/.well-known/mercure
MERCURE_JWT_SECRET=votre_secret_mercure
```

### Frontend (`frontend/src/environments/`)

L'API est proxifiée via `proxy.conf.json` — les appels `/api/*` sont redirigés vers le backend.

---

## Commandes utiles

### Docker

```bash
docker compose up -d               # Démarrer tous les services
docker compose down                # Arrêter
docker compose logs -f api         # Logs Symfony
docker compose logs -f node_management  # Logs Angular
docker compose restart api         # Redémarrer l'API
```

### Symfony (dans le container)

```bash
docker exec -it digimenu_symfony_fpm bash

php bin/console doctrine:migrations:diff    # Générer une migration
php bin/console doctrine:migrations:migrate # Appliquer les migrations
php bin/console cache:clear                 # Vider le cache
php bin/console debug:router               # Lister les routes
```

### Angular (dans le container)

```bash
docker exec -it digimenu_angular_cli bash

ng generate component pages/mon-composant --standalone
ng build --configuration production
```

---

## Structure des données de test

Le fichier `story.sql` à la racine contient un jeu de données de démonstration importable directement via phpMyAdmin ou :

```bash
docker exec -i digimenu_mariadb mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME < story.sql
```
