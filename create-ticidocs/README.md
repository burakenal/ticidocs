# create-ticidocs

Scaffold a Ticidocs documentation site.

```bash
npx create-ticidocs my-docs
npx create-ticidocs my-api --template=api --yes
pnpm --filter create-ticidocs start ../tmp-docs --template=full --link --yes
```

## Templates

| Template | Contents |
|----------|----------|
| `basic` | Guides (`index`, `getting-started`), en + tr |
| `api` | Guides + OpenAPI reference |
| `full` | Full guides + OpenAPI (mirrors `apps/docs`) |

## Flags

- `--template <basic|api|full>`
- `--github` — add GitHub URL placeholder
- `--link` — use `workspace:*` deps (local monorepo)
- `--yes` — non-interactive
