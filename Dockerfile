# Stage 1: Build the React/TypeScript production bundle
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src

ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Stage 2: Minimal Nginx production runtime with SPA routing, caching, security headers & healthcheck
FROM nginx:1.27-alpine AS runtime

RUN rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/40-akademia-runtime-config.sh /docker-entrypoint.d/40-akademia-runtime-config.sh

RUN sed -i 's/\r$//' /docker-entrypoint.d/40-akademia-runtime-config.sh \
    && chmod +x /docker-entrypoint.d/40-akademia-runtime-config.sh \
    && chown -R nginx:nginx /usr/share/nginx/html /etc/nginx/conf.d

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:80/healthz || exit 1
