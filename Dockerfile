FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* tsconfig*.json ./
COPY prisma ./prisma

RUN npm install --production

COPY src ./src

RUN npm run build

CMD ["node", "dist/main.js"]
