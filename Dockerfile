FROM node:20-alpine

WORKDIR /app

# Copia dependências primeiro (cache de camadas)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production=false

# Gera o Prisma Client
RUN npx prisma generate

# Copia o restante e compila TypeScript
COPY . .
RUN npm run build

# Remove devDependencies para imagem menor
RUN npm prune --production

EXPOSE 3333

# Roda migrations e inicia o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
