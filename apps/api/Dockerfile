# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
# redis-memory-server is the no-Docker dev fallback; its postinstall
# downloads a Redis binary, which is pointless (and fails) in the image.
ENV REDISMS_DISABLE_POSTINSTALL=1
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
# A copied-in tsbuildinfo makes incremental tsc emit nothing (empty dist)
RUN rm -f *.tsbuildinfo && npm run build && test -f dist/main.js && test -f dist/worker.js

# ---- runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
EXPOSE 4000
# API by default; the worker container overrides CMD (see docker-compose.yml)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
