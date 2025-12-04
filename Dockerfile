FROM node:20

WORKDIR /app

COPY package.json package-lock.json* tsconfig*.json ./
COPY prisma ./prisma

RUN npm ci

COPY src ./src

RUN npm run build

CMD ["node", "dist/main.js"]
