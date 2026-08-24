# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY examples ./examples
COPY create-ticidocs ./create-ticidocs
COPY eslint.config.mjs ./
ENV DOCKER_BUILD=1
RUN pnpm install --frozen-lockfile
# Turbo builds workspace deps in order (^build). Fresh tree: no host dist/tsbuildinfo.
RUN pnpm turbo run build --filter=@ticidocs/docs...

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup -S ticidocs && adduser -S ticidocs -G ticidocs

COPY --from=builder --chown=ticidocs:ticidocs /app/apps/docs/.next/standalone ./
COPY --from=builder --chown=ticidocs:ticidocs /app/apps/docs/.next/static ./apps/docs/.next/static
COPY --from=builder --chown=ticidocs:ticidocs /app/apps/docs/public ./apps/docs/public
COPY --from=builder --chown=ticidocs:ticidocs /app/apps/docs/content ./apps/docs/content
COPY --from=builder --chown=ticidocs:ticidocs /app/apps/docs/openapi ./apps/docs/openapi

USER ticidocs
EXPOSE 3000
CMD ["node", "apps/docs/server.js"]
