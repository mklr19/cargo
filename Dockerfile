# Verwende ein offizielles Node.js-Image als Basis
FROM node:14

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere Abhängigkeiten
RUN npm install

# Kopiere den restlichen Code in den Container
COPY . .

# Exponiere den Port, den die Anwendung verwendet
EXPOSE 3005

# Starte die Anwendung
CMD ["npm", "start", "--host", "0.0.0.0"]
