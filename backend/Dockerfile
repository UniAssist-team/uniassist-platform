FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache tini
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_PATH=/data/data.db

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY openapi.yaml ./
COPY src ./src

RUN mkdir -p /data /app/uploads

EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/main.js"]
