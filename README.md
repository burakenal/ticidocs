# Ticidocs

Open-source, self-hosted documentation platform (Mintlify-inspired, independent implementation).

## Requirements

- Node.js 20+
- pnpm 9+

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/en`.

Try:

- `/en/getting-started`
- `/tr/getting-started`
- `/tr/advanced` (English fallback + banner)
- `/sitemap.xml`
- `/robots.txt`

## Workspace layout

```text
Ticidocs/
├── apps/docs/                 # Next.js dogfood site
├── packages/
│   ├── core/                  # @ticidocs/core
│   ├── config/                # @ticidocs/config
│   ├── mdx/                   # @ticidocs/mdx
│   ├── openapi/               # @ticidocs/openapi
│   ├── search/                # @ticidocs/search
│   ├── ui/                    # @ticidocs/ui
│   └── theme/                 # @ticidocs/theme
├── create-ticidocs/           # npx create-ticidocs
├── examples/{basic,api,full}/
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── PROJECT.md
```

## Scripts

```bash
pnpm dev        # start docs app
pnpm build      # build all packages + apps
pnpm lint       # ESLint
pnpm test       # Vitest (+ example validation)
```

## Scaffold a new site

```bash
pnpm --filter create-ticidocs build
pnpm --filter create-ticidocs start my-docs --template=basic --link --yes
```

Or after publish: `npx create-ticidocs my-docs`.

## Docker

```bash
docker compose up --build -d
```

See [DEPLOY.md](./DEPLOY.md) for VPS, Nginx, and Kubernetes notes.

## Phase 1 delivered

- Locale-first routing (`/[locale]/...`) with `en` + `tr`
- `docs.config.ts` validation (`siteUrl`, `locales`, `defaultLocale`)
- MDX content under `content/{locale}`
- Sidebar, navbar, theme toggle, locale switcher
- Translation fallback banner
- SEO: title/description, canonical, hreflang, Open Graph, Twitter card, sitemap, robots

## Phase 2 delivered

- Real MDX compilation (`next-mdx-remote`)
- Components: Callout, Tabs/Tab, Steps/Step, Card/CardGroup
- Syntax highlighting + copy button on code blocks
- Local search (`@ticidocs/search` + Ctrl/Cmd+K)
- TOC scroll spy (active heading)

## Phase 3 delivered

- `@ticidocs/openapi` — OpenAPI 3.0/3.1 YAML/JSON parser
- Nav `openapi` groups in `docs.config.ts`
- Endpoint pages: method badge, params, request/response schemas, auth
- API ops included in sidebar + search

## Phase 4 delivered

- Code examples: cURL, JavaScript, TypeScript, Python, C#
- Browser Try It with `api.allowedOrigins` guard (no server proxy / SSRF)
- Auth fields for bearer / API key (not stored)

## Phase 5 delivered

- Multi-stage `Dockerfile` + `docker-compose.yml`
- Next.js `standalone` output in Docker (`DOCKER_BUILD=1`); local Windows builds stay non-standalone (symlink permissions)
- GitHub Actions CI (lint / test / build / docker)
- [DEPLOY.md](./DEPLOY.md)

## Phase 6 delivered

- `create-ticidocs` CLI (`basic` / `api` / `full` templates)
- Interactive + non-interactive (`--yes`, `--template`, `--github`, `--link`)
- `examples/api` and `examples/full`

## Later leftovers

- JSON-LD Article schema
- Accordion / CodeGroup extras
- Publish `@ticidocs/*` to npm
