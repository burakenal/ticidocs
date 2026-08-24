# Publishing @ticidocs/* packages

Packages live under `packages/*` with names `@ticidocs/core`, `@ticidocs/config`, `@ticidocs/mdx`, `@ticidocs/openapi`, `@ticidocs/search`, `@ticidocs/theme`, `@ticidocs/ui`, plus `create-ticidocs`.

## Prerequisites

1. npm org access for `@ticidocs`
2. Built `dist/` (or `src` for `@ticidocs/ui`) via `pnpm build --filter=./packages/*`
3. Align versions in each `package.json` (currently `0.1.0`)

## Publish (manual)

```bash
cd Ticidocs
pnpm build --filter=./packages/*
pnpm --filter "./packages/*" publish --access public --no-git-checks
pnpm --filter create-ticidocs publish --access public --no-git-checks
```

After publish, Enal.TiciDocs (and other consumers) can switch from `workspace:*` / local file links to versioned npm deps.

## Notes

- `@ticidocs/ui` ships TypeScript source (`"main": "./src/index.ts"`) and relies on consumer `transpilePackages`
- Do not publish until the npm org and package names are reserved
