FROM node:20

WORKDIR /app

COPY package.json package-lock.json* tsconfig*.json ./
COPY prisma ./prisma

RUN npm ci

COPY src ./src

RUN npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/main.js"]
