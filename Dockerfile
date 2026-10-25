# ---- stage 1: web ----
FROM node:24-alpine AS web
WORKDIR /build/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ---- stage 2: server ----
FROM node:24-alpine AS server
RUN apk add --no-cache openssl python3 make g++
WORKDIR /build/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate && node build.js

# ---- stage 3: runtime ----
FROM node:24-alpine
RUN apk add --no-cache openssl
ENV NODE_ENV=production \
    DULORA_DATA_DIR=/app/data \
    DULORA_WEB_DIR=/app/web-dist \
    DATABASE_URL=file:/app/data/dulora.db
WORKDIR /app/server
COPY --from=server /build/server ./
COPY --from=web /build/web/dist /app/web-dist
EXPOSE 3000
VOLUME /app/data
CMD ["sh", "-c", "mkdir -p /app/data && touch /app/data/dulora.db && npx prisma db push --skip-generate && node dist/app.js"]
