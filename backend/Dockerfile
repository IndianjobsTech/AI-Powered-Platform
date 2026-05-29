# ============= BUILDER STAGE =============
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache libcrypto3 libssl3 ca-certificates

# Copy package files and install dependencies
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma/ ./prisma/
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Generate Prisma client
# prisma generate in v7 needs a DATABASE_URL set (value doesn't matter for code generation)
ENV DATABASE_URL="postgresql://p:p@localhost:5432/placeholder"
RUN npx prisma generate

# ============= RUNNER STAGE =============
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime system dependencies
RUN apk add --no-cache libcrypto3 libssl3 ca-certificates tzdata wget

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodeuser

# Copy built artifacts from builder
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodeuser:nodejs /app/package.json ./

# Expose port (Railway will set PORT env var)
EXPOSE 5000

ENV NODE_ENV=production

USER nodeuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/api/v1/health || exit 1

CMD ["node", "dist/index.js"]
