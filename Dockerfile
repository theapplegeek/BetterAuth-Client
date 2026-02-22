FROM oven/bun:1.3.5-alpine AS builder
ARG ENV=production
WORKDIR /app
COPY package.json .
COPY bun.lock .
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build --configuration $ENV

FROM nginx:1.21.5-alpine
COPY nginx-default.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
RUN chown -R nginx:nginx /var/cache/nginx && \
        chown -R nginx:nginx /var/log/nginx && \
        chown -R nginx:nginx /etc/nginx/conf.d && \
        chown -R nginx:nginx /usr/share/nginx
RUN touch /var/run/nginx.pid && chown -R nginx:nginx /var/run/nginx.pid
USER nginx
COPY --from=builder /app/dist/**/browser/ /usr/share/nginx/html
EXPOSE 80