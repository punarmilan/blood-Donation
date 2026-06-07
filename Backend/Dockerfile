FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads/news uploads/impact-gallery uploads/success-stories uploads/backgrounds

EXPOSE 5000

CMD ["node", "app.js"]
