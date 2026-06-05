# Multi-stage build for Next.js standalone output on Railway
FROM node:20-alpine AS base

# --- deps ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# --- builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build (dummy values, Railway replaces at runtime)
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=dummy
ENV NEXTAUTH_SECRET=dummy
ENV NEXTAUTH_URL=http://localhost:3000

RUN npm run build

# --- runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy the ENTIRE standalone output (this includes node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public directory  
COPY --from=builder /app/public ./public

# Also copy node_modules/.bin if needed (but standalone should have it)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

# Run the standalone server directly (not through npx)
CMD ["node", "server.js"]