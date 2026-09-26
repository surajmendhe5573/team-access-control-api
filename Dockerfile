# ---------- Builder ----------
FROM node:20-slim AS builder

WORKDIR /app

# openssl: Prisma's engines need it at generate time
# python3, make, g++: argon2 has no prebuilt binary for this platform and
# falls back to compiling its native binding via node-gyp at install time
RUN apt-get update -y && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generates the Prisma client from schema.prisma
RUN npx prisma generate

# Compiles TypeScript -> dist/
RUN npm run build

# ---------- Runner ----------
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

# openssl is also needed at runtime, not just build time
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# src/ is needed too, not just dist/ — prisma/seed.ts imports directly from
# ../src/config/db.js and is run via tsx (reading TS source), not from dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

EXPOSE 5000

# Apply any pending migrations, then start the compiled server.
# migrate deploy (not migrate dev) — non-interactive, applies existing
# migration files only, never generates new ones. Correct for containers.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]