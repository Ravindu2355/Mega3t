FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/downloads

EXPOSE 8000

CMD ["node", "bot/index.js"]
