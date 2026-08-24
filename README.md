# Ticidocs

Open-source, self-hosted documentation platform (Mintlify-inspired, independent implementation).

Build MDX + OpenAPI developer docs as a Next.js site you host yourself — no SaaS, no mandatory database.

## Requirements

- Node.js 20+
- pnpm 9+ (pinned via `packageManager` in root `package.json`)

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/en`.

Dogfood routes to try:

- `/en/getting-started`
- `/tr/getting-started`
- `/tr/advanced` (English fallback + banner)
- `/sitemap.xml`
- `/robots.txt`

## Features

- Locale-first routing (`/[locale]/...`) with translation fallback
- `docs.config.ts` validation (`siteUrl`, locales, navigation, theme, API origins)
- MDX guides (`content/{locale}`) with Callout, Tabs, Steps, Cards
- Syntax highlighting and copy on code blocks
- Local search (`Ctrl` / `Cmd` + `K`)
- OpenAPI 3.0 / 3.1 reference pages (params, schemas, auth, Try It)
- Code examples: cURL, JavaScript, TypeScript, Python, C#
- Optional docs versioning via `versions` / `defaultVersion`
- Docker / Compose deploy (`standalone` Next.js output)
- `create-ticidocs` CLI with `basic`, `api`, and `full` templates

## Monorepo layout

pnpm workspaces + Turborepo:

```text
Ticidocs/
├── apps/
│   └── docs/                  # Next.js dogfood site (@ticidocs/docs)
├── packages/
│   ├── core/                  # @ticidocs/core — engine types & helpers
│   ├── config/                # @ticidocs/config — docs.config.ts
│   ├── mdx/                   # @ticidocs/mdx — load / frontmatter / headings
│   ├── openapi/               # @ticidocs/openapi — OpenAPI 3.0/3.1
│   ├── search/                # @ticidocs/search — local search index
│   ├── ui/                    # @ticidocs/ui — doc UI components
│   └── theme/                 # @ticidocs/theme — CSS variables
├── create-ticidocs/           # npx create-ticidocs
├── examples/
│   ├── basic/
│   ├── api/
│   └── full/                  # config / OpenAPI validation fixtures
├── .github/workflows/         # CI + publish
├── docker-compose.yml
├── Dockerfile
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Dogfood docs (`apps/docs`) on `:3000` |
| `pnpm dev:packages` | Watch `@ticidocs/*` packages |
| `pnpm dev:all` | Package watch + dogfood docs |
| `pnpm build` | Build all packages + apps |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (+ example validation) |
| `pnpm typecheck` | TypeScript across the workspace |
| `pnpm docker:up` | `docker compose up --build -d` |
| `pnpm publish:dry` | Dry-run publish of packages + CLI |

## Scaffold a new site

From this monorepo (local link):

```bash
pnpm --filter create-ticidocs build
pnpm --filter create-ticidocs start my-docs --template=basic --link --yes
```

After packages are on npm:

```bash
npx create-ticidocs my-docs
```

Templates: `basic` · `api` · `full` — see [create-ticidocs/README.md](./create-ticidocs/README.md).

## Docker

```bash
docker compose up --build -d
# or: pnpm docker:up
```

See [DEPLOY.md](./DEPLOY.md) for VPS, Nginx, and Kubernetes notes.

## Docs in this repo

| File | Topic |
| --- | --- |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Local workflow and conventions |
| [DEPLOY.md](./DEPLOY.md) | Self-host / Docker / K8s |
| [PUBLISH.md](./PUBLISH.md) | Publishing `@ticidocs/*` to npm |
| [LICENSE](./LICENSE) | MIT |

## Roadmap

- Publish `@ticidocs/*` when the npm org is ready (`pnpm publish:dry` / Actions)
- Nested nav groups; richer code-block options (line numbers / diff)
- Optional runnable Next apps under `examples/` (today they validate config only)
- Per-version OpenAPI files (versioned URLs/content exist; specs are still shared)
