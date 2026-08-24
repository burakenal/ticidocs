# Publishing @ticidocs/* packages

Packages live under `packages/*` with names `@ticidocs/core`, `@ticidocs/config`, `@ticidocs/mdx`, `@ticidocs/openapi`, `@ticidocs/search`, `@ticidocs/theme`, `@ticidocs/ui`, plus `create-ticidocs`.

All packages ship at **`0.1.0`** with `"publishConfig": { "access": "public" }`.

## Prerequisites

1. npm org access for `@ticidocs` (reserve the scope first)
2. Local auth: `npm login` (or CI secret `NPM_TOKEN`)
3. Built packages via `pnpm build --filter=./packages/* --filter=create-ticidocs`

## Dry run (recommended first)

```bash
cd Ticidocs
pnpm publish:dry
```

Or GitHub Actions → **Publish** workflow → leave **dry_run** checked.

## Publish (manual)

```bash
cd Ticidocs
pnpm publish:packages
```

Or Actions → **Publish** → uncheck dry_run (requires repo secret `NPM_TOKEN`).

## After publish

- Consumers can use `npx create-ticidocs my-docs` without `--link`
- Enal.TiciDocs (and other apps) may switch from `workspace:*` to `"0.1.0"` when ready
- Bump versions together when cutting `0.1.1` / `0.2.0` (including `PACKAGE_VERSION` in `create-ticidocs/src/scaffold.ts`)

## Notes

- `@ticidocs/ui` ships TypeScript source (`"main": "./src/index.ts"`) and relies on consumer `transpilePackages`
- `pnpm publish` from the workspace rewrites `workspace:*` dependencies to published versions
- Do not publish until the npm org and package names are reserved
