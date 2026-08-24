# Contributing to Ticidocs

## Setup

- Node.js 20+
- pnpm 9+ (`packageManager` is pinned in root `package.json`)

```bash
pnpm install
pnpm dev          # dogfood docs at http://localhost:3000
pnpm dev:packages # watch @ticidocs/* while developing packages
```

## Checks before a PR

```bash
pnpm lint
pnpm test
pnpm build
```

CI (`.github/workflows/ci.yml`) runs the same quality steps and a Docker image build.

## Monorepo layout

| Path | Role |
| --- | --- |
| `apps/docs` | Dogfood Next.js site |
| `packages/*` | `@ticidocs/*` libraries |
| `create-ticidocs` | `npx create-ticidocs` CLI + templates |
| `examples/*` | Config / OpenAPI validation fixtures |

## Conventions

- TypeScript strict; avoid `any` unless necessary
- No Tailwind — CSS modules + CSS variables (`@ticidocs/theme`)
- No admin panel, database, or SaaS auth in this repo
- Keep Ticiyo-specific product docs in sibling `Enal.TiciDocs`, not here
- Docs versioning is optional (`versions` / `defaultVersion` in `docs.config.ts`); omit it for `/{locale}/...` sites

## Scaffold templates

After changing `create-ticidocs/templates/shared`, run:

```bash
pnpm --filter create-ticidocs test
```

## Publishing

See [PUBLISH.md](./PUBLISH.md). Do not publish until the `@ticidocs` npm org is ready.
