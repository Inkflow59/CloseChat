FROM node:20-alpine

WORKDIR /app

# Installer les dépendances prod
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copier le code
COPY . .

ENV NODE_ENV=production

EXPOSE 6767

CMD ["npm", "run", "start"]

