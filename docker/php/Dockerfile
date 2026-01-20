# Utilise l'image PHP 7.4 officielle avec FPM (FastCGI Process Manager)
FROM php:7.4-fpm

# Installe les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
git \
unzip \
libzip-dev \
libpq-dev \
libpng-dev \
libxml2-dev \
# Installe les outils nécessaires pour les extensions
libjpeg-dev \
libfreetype6-dev

# Installe les extensions PHP requises par Symfony et la BDD
# pdo_mysql pour MariaDB/MySQL. intl et gd pour Symfony/gestion des images.
RUN docker-php-ext-install pdo pdo_mysql opcache intl gd zip

# Installe Composer globalement
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# Définition du répertoire de travail (où le code sera monté)
WORKDIR /var/www/html

# Expose le port de FPM
EXPOSE 9000