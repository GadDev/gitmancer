FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 GITMANCER_DATA_DIR=/app/data
RUN addgroup -S gitmancer && adduser -S gitmancer -G gitmancer && mkdir /app/data && chown gitmancer:gitmancer /app/data
COPY --from=builder --chown=gitmancer:gitmancer /app/.next/standalone ./
COPY --from=builder --chown=gitmancer:gitmancer /app/.next/static ./.next/static
COPY --from=builder --chown=gitmancer:gitmancer /app/public ./public
USER gitmancer
EXPOSE 3000
CMD ["node", "server.js"]
