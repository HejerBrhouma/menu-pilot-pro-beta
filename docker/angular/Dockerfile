# Utilise une image Node.js officielle (LTS)
FROM node:20

# Installe Angular CLI globalement pour pouvoir exécuter les commandes 'ng'
RUN npm install -g @angular/cli

# Définition du répertoire de travail
WORKDIR /usr/src/app

# Expose le port par défaut pour le développement Angular
EXPOSE 4200