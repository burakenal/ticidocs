# syntax=docker/dockerfile:1
# Build from this project directory:
#   docker build -t my-docs .
#   docker run --rm -p 3000:3000 my-docs

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml* ./
COPY . .
ENV DOCKER_BUILD=1
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi
RUN pnpm build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup -S ticidocs && adduser -S ticidocs -G ticidocs

COPY --from=builder --chown=ticidocs:ticidocs /app/.next/standalone ./
COPY --from=builder --chown=ticidocs:ticidocs /app/.next/static ./.next/static
COPY --from=builder --chown=ticidocs:ticidocs /app/public ./public
COPY --from=builder --chown=ticidocs:ticidocs /app/content ./content
COPY --from=builder --chown=ticidocs:ticidocs /app/openapi ./openapi

USER ticidocs
EXPOSE 3000
CMD ["node", "server.js"]
