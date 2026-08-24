# Deploy Ticidocs

Ticidocs docs ship as a self-hosted Next.js app. No database is required.

## Docker (recommended)

From the repository root:

```bash
docker compose up --build -d
```

Open [http://localhost:3000](http://localhost:3000).

The image builds with `DOCKER_BUILD=1` so Next.js `standalone` output is used.
Local Windows `pnpm build` stays non-standalone (avoids symlink permission issues).

Or build/run manually:

```bash
docker build -t ticidocs-docs .
docker run --rm -p 3000:3000 ticidocs-docs
```

## Node.js host (VPS / VDS)

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @ticidocs/docs start
```

Keep `apps/docs/content` and `apps/docs/openapi` available at runtime (the server reads them for navigation, search, and OpenAPI).

## Kubernetes

Use the same image as Docker Compose. Example Service + Deployment sketch:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ticidocs
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ticidocs
  template:
    metadata:
      labels:
        app: ticidocs
    spec:
      containers:
        - name: docs
          image: your-registry/ticidocs-docs:latest
          ports:
            - containerPort: 3000
          env:
            - name: PORT
              value: "3000"
            - name: HOSTNAME
              value: "0.0.0.0"
---
apiVersion: v1
kind: Service
metadata:
  name: ticidocs
spec:
  selector:
    app: ticidocs
  ports:
    - port: 80
      targetPort: 3000
```

## Nginx reverse proxy

```nginx
server {
  listen 80;
  server_name docs.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Configuration before deploy

Update `apps/docs/docs.config.ts`:

- `siteUrl` — public canonical base URL
- `api.allowedOrigins` — Try It browser origins
- `locales` / navigation / OpenAPI path

Then rebuild the image or Node build.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint, test, build, and a Docker image build on push/PR.
