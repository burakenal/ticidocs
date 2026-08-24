# Ticidocs

## Project Definition

Ticidocs is an open-source, self-hosted documentation platform for developers.

The goal is to provide a modern documentation experience similar to products such as Mintlify, but with our own implementation, architecture, UI, and codebase.

Ticidocs must be usable for:

- REST API documentation
- SDK documentation
- Developer portals
- Product documentation
- Internal technical documentation
- OpenAPI documentation
- Markdown/MDX documentation

The platform must be generic.

It must NOT contain Ticiyo-specific business logic.

---

# 1. Product Vision

Ticidocs should allow a developer to create a documentation website with a few commands.

Example:

```bash
npx create-ticidocs my-docs
cd my-docs
npm install
npm run dev
```

The developer should then have:

```text
http://localhost:3000
```

A production build should be deployable to:

- Docker
- VPS
- VDS
- Kubernetes
- Nginx
- Cloudflare
- Vercel
- Any Node.js hosting environment

The platform should support both:

1. Static documentation
2. Server-side rendered documentation

---

# 2. Core Principles

## 2.1 Open Source

The project must be open source.

Use a permissive license such as MIT unless explicitly changed later.

---

## 2.2 Self Hosted

The user must be able to run the entire documentation platform on their own infrastructure.

No mandatory external SaaS dependency.

No mandatory cloud database.

No mandatory external authentication service.

No mandatory external search service.

---

## 2.3 Git First

Documentation should primarily be managed through Git.

Example:

```text
Developer
   ↓
Edit MDX
   ↓
git commit
   ↓
git push
   ↓
CI/CD
   ↓
Build
   ↓
Docker
   ↓
Production
```

No admin panel is required for the MVP.

---

## 2.4 Developer First

Configuration should be code-based.

Avoid complex dashboards.

Prefer:

```text
docs.config.ts
```

instead of a database-driven configuration system.

---

## 2.5 Framework Extensible

The core documentation engine should not be tightly coupled to one frontend framework.

However, the first implementation should use Next.js.

Future adapters may include:

```text
@ticidocs/next
@ticidocs/vite
@ticidocs/astro
```

Do not implement these adapters in MVP.

---

# 3. Technology Stack

## Frontend

Use:

- Next.js
- React
- TypeScript

Use the latest stable versions available during development.

Use App Router.

Use Server Components where appropriate.

Use Client Components only where interactivity requires them.

---

## Styling

Do NOT use Tailwind CSS.

Prefer:

- CSS Modules
- CSS variables
- modern CSS

Bootstrap may be used if it provides real value, but the preferred implementation is lightweight custom CSS.

---

## Markdown

Use:

- MDX
- unified ecosystem
- remark
- rehype

The exact libraries may be chosen by the implementation agent based on compatibility and maintenance.

---

## OpenAPI

Support:

- OpenAPI 3.0
- OpenAPI 3.1

Support:

- YAML
- JSON

The OpenAPI parser must be isolated from UI components.

---

## Search

MVP search should work without external services.

Possible implementation:

```text
Build time
    ↓
Generate search index
    ↓
Browser
    ↓
Local search
```

A future adapter may support:

- Algolia
- Meilisearch
- Typesense
- Elasticsearch

Do not require these for MVP.

---

# 4. Monorepo

Use pnpm workspaces.

Recommended structure:

```text
ticidocs/

├── apps/
│   ├── docs/
│   └── playground/
│
├── packages/
│   ├── core/
│   ├── mdx/
│   ├── openapi/
│   ├── search/
│   ├── ui/
│   ├── theme/
│   └── config/
│
├── create-ticidocs/
│
├── examples/
│   ├── basic/
│   ├── api/
│   └── full/
│
├── scripts/
│
├── Dockerfile
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── tsconfig.json
└── PROJECT.md
```

Use Turborepo if it materially improves development/build performance.

Do not add infrastructure unnecessarily.

---

# 5. Package Responsibilities

## @ticidocs/core

Responsible for:

- Documentation configuration
- Navigation model
- Page metadata
- Versioning model
- Documentation tree
- Route generation
- Shared types

Must be framework independent.

---

## @ticidocs/mdx

Responsible for:

- MDX loading
- Markdown processing
- Frontmatter
- Heading extraction
- Code blocks
- MDX component registration
- Table of contents generation

---

## @ticidocs/openapi

Responsible for:

- OpenAPI loading
- YAML parsing
- JSON parsing
- OpenAPI validation
- Endpoint extraction
- Schema extraction
- Parameters
- Request bodies
- Responses
- Security schemes
- Examples

Must not depend on React.

---

## @ticidocs/search

Responsible for:

- Search indexing
- Search tokenization
- Search ranking
- Search query
- Search results

MVP must support local client-side search.

---

## @ticidocs/ui

Reusable UI components:

- Navbar
- Sidebar
- Breadcrumb
- Table of Contents
- Search
- CodeBlock
- Tabs
- Cards
- Callout
- Steps
- API endpoint
- Parameters table
- Schema viewer
- Response viewer
- Theme switcher
- Pagination

Components must be reusable.

---

## @ticidocs/theme

Responsible for:

- Default theme
- Theme configuration
- CSS variables
- Typography
- Light mode
- Dark mode

The theme must be replaceable in the future.

---

## @ticidocs/config

Responsible for:

```text
docs.config.ts
```

loading and validation.

Configuration should be strongly typed.

---

# 6. Documentation Project Structure

A generated documentation project should look like:

```text
my-docs/

├── content/
│   ├── index.mdx
│   ├── getting-started.mdx
│   ├── authentication.mdx
│   │
│   └── api/
│       ├── products.mdx
│       └── orders.mdx
│
├── openapi/
│   └── openapi.yaml
│
├── public/
│   ├── logo.svg
│   └── favicon.ico
│
├── docs.config.ts
├── package.json
├── Dockerfile
└── docker-compose.yml
```

---

# 7. Configuration

Example:

```ts
import { defineConfig } from "@ticidocs/config";

export default defineConfig({
  name: "My API",
  description: "API documentation",

  logo: {
    light: "/logo-light.svg",
    dark: "/logo-dark.svg"
  },

  navigation: [
    {
      group: "Getting Started",
      pages: [
        "index",
        "getting-started",
        "authentication",
        // Nested OpenAPI stays under this product tab's sidebar
        {
          group: "API Reference",
          openapi: "./openapi/openapi.yaml",
          basePath: "api"
        }
      ]
    }

    // Or keep OpenAPI as its own top-level tab:
    // { group: "API Reference", openapi: "./openapi/openapi.yaml" }
  ],

  theme: {
    primaryColor: "#6366f1"
  },

  github: {
    url: "https://github.com/example/repository"
  }
});
```

---

# 8. Frontmatter

MDX pages must support frontmatter.

Example:

```md
---
title: Authentication
description: Learn how to authenticate with the API
sidebarTitle: Authentication
---

# Authentication

Documentation content.
```

Supported properties:

```text
title
description
sidebarTitle
slug
draft
order
icon
```

Additional properties may be added later.

---

# 9. Navigation

Navigation should support:

- groups
- pages
- nested groups
- external links
- icons
- ordering

Example:

```ts
navigation: [
  {
    group: "Getting Started",
    pages: [
      "index",
      "installation",
      "authentication"
    ]
  },

  {
    group: "API Reference",
    pages: [
      {
        title: "Products",
        path: "api/products"
      }
    ]
  }
]
```

The system should also be capable of automatically discovering content.

---

# 10. MDX Components

Provide these components:

```text
Callout
Card
CardGroup
Tabs
Tab
Steps
Step
CodeGroup
Badge
Link
Image
Accordion
AccordionGroup
```

API-specific:

```text
Endpoint
Request
Response
Parameter
Schema
TryIt
```

---

# 11. Callout

Example:

```mdx
<Callout type="info">
This endpoint requires authentication.
</Callout>
```

Types:

```text
info
warning
success
error
tip
```

---

# 12. Tabs

Example:

````mdx
<Tabs>
  <Tab title="cURL">

```bash
curl https://api.example.com/products
````

&#x20; \</Tab>

&#x20; \<Tab title="C#">

```csharp
var result = await client.GetAsync("/products");
```

&#x20; \</Tab>
\</Tabs>
\`\`\`

---

# 13. Code Blocks

Code blocks must support:

- syntax highlighting
- line numbers
- copy button
- filename
- highlighted lines
- diff mode

Supported common languages:

```text
javascript
typescript
csharp
java
python
php
go
rust
bash
shell
json
yaml
xml
html
css
sql
http
```

---

# 14. Table of Contents

Every documentation page should automatically extract:

```text
H1
H2
H3
```

The right sidebar should display:

```text
On this page

Overview
Authentication
Request
Response
Errors
```

The active heading should update while scrolling.

---

# 15. API Documentation

OpenAPI must be a first-class feature.

Given:

```yaml
paths:
  /products:
    get:
      summary: List products
```

Ticidocs should automatically generate:

```text
GET /products

List products
```

---

# 16. HTTP Methods

Support:

```text
GET
POST
PUT
PATCH
DELETE
HEAD
OPTIONS
TRACE
```

Each method must have its own visual representation.

---

# 17. Endpoint Details

Endpoint page must display:

```text
GET /api/products
```

Then:

```text
Description

Authentication

Parameters

Request Body

Request Example

Response

Response Schema

Errors

Try It
```

---

# 18. Parameters

Display:

```text
Name
Type
Required
Description
Default
Example
```

Support:

- path parameters
- query parameters
- headers
- cookies

---

# 19. Request Body

Display:

```text
Content-Type

application/json
```

Schema:

```json
{
  "name": "string",
  "price": 100
}
```

Support multiple content types.

---

# 20. Response

Display:

```text
200 OK
```

Example:

```json
{
  "id": 1,
  "name": "Product"
}
```

Support multiple status codes.

Examples:

```text
200
201
400
401
403
404
409
422
500
```

---

# 21. Schema Viewer

OpenAPI schemas must have an expandable visual representation.

Example:

```text
Product
├── id        integer
├── name      string
├── price     number
└── category  Category
```

Nested schemas must be expandable.

---

# 22. API Authentication

Support OpenAPI security schemes:

- bearerAuth
- apiKey
- basicAuth
- oauth2
- openIdConnect

---

# 23. Try It

Every supported endpoint should optionally have:

```text
[ Try it ]
```

The user should be able to enter:

- query parameters
- path parameters
- headers
- request body
- authentication

Then execute the request.

---

# 24. Try It Security

The Try It implementation must not introduce SSRF vulnerabilities.

Do NOT blindly proxy arbitrary URLs from the browser through the server.

Allowed API origins must be explicitly configured.

Example:

```ts
api: {
  allowedOrigins: [
    "https://api.example.com"
  ]
}
```

Tokens must not be logged.

Secrets must not be stored server-side.

---

# 25. Code Examples

API endpoints should optionally generate examples for:

```text
cURL
JavaScript
TypeScript
C#
Python
PHP
Go
```

Initial implementation may support only:

```text
cURL
JavaScript
TypeScript
C#
Python
```

The architecture should allow additional generators.

---

# 26. Search

Search must support:

```text
Ctrl + K
Cmd + K
```

Search modal:

```text
Search documentation...

Products API
Authentication
Create Order
Webhooks
```

Search results should display:

```text
Title
Breadcrumb
Short description
```

Search should be keyboard navigable.

---

# 27. Search Index

Generate a search index during build.

Example:

```text
content
   ↓
MDX parser
   ↓
Search index
   ↓
static JSON
```

Do not require a database.

---

# 28. Versioning

Support:

```text
v1
v2
v3
```

Configuration:

```ts
versions: [
  "v1",
  "v2"
]
```

URL structure:

```text
/docs/v1
/docs/v2
```

Version selector should be available in the navbar.

---

# 29. Internationalization

Architecture should support future i18n.

Do not implement a complete translation management system in MVP.

Potential structure:

```text
content/
├── en/
├── tr/
└── de/
```

The core should not make localization impossible.

---

# 30. Theme

Default theme:

- modern
- minimal
- developer focused

Must support:

```text
Light
Dark
System
```

Theme colors should use CSS variables.

Example:

```css
--docs-primary
--docs-background
--docs-foreground
--docs-sidebar
--docs-border
--docs-code-background
```

---

# 31. Responsive Design

Must work on:

- desktop
- laptop
- tablet
- mobile

Mobile:

```text
Navbar
  ↓
Menu button

Sidebar
  ↓
Drawer
```

API examples must be horizontally scrollable.

---

# 32. SEO

Each page must support:

- title
- description
- canonical URL
- OpenGraph
- Twitter metadata

Generate:

```text
sitemap.xml
robots.txt
```

---

# 33. Static Generation

Documentation pages should be statically generated whenever possible.

Preferred architecture:

```text
MDX
 ↓
Build
 ↓
HTML
```

Interactive functionality should only be client-side when necessary.

---

# 34. Docker

Provide a production Dockerfile.

Use multi-stage build.

Example architecture:

```text
Node build image
       ↓
Build application
       ↓
Production Node image
       ↓
Run Next.js
```

Also provide:

```text
docker-compose.yml
```

Example:

```yaml
services:

  docs:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
```

---

# 35. Self Hosting

Documentation must be deployable to:

```text
VPS
VDS
Dedicated Server
Docker
Kubernetes
```

No external database should be required for the basic documentation website.

---

# 36. CI/CD

Provide GitHub Actions example.

Flow:

```text
git push
   ↓
GitHub Actions
   ↓
Install dependencies
   ↓
Lint
   ↓
Test
   ↓
Build
   ↓
Docker build
```

Production deployment should be documented but not hardcoded to a specific hosting provider.

---

# 37. CLI

Create:

```text
create-ticidocs
```

Usage:

```bash
npx create-ticidocs my-docs
```

CLI should ask:

```text
Project name?
Use OpenAPI?
Use example documentation?
Use GitHub?
```

But CLI should also support non-interactive mode.

Example:

```bash
npx create-ticidocs my-docs --template=api
```

Templates:

```text
basic
api
full
```

---

# 38. Development Commands

Root commands:

```bash
pnpm install

pnpm dev

pnpm build

pnpm lint

pnpm test
```

Package-specific commands should also work.

---

# 39. Example Projects

Create examples:

```text
examples/basic
examples/api
examples/full
```

The API example should contain a realistic OpenAPI file.

---

# 40. Documentation Website

The project itself must use Ticidocs to document Ticidocs.

This creates a dogfooding environment.

Example:

```text
apps/docs
```

should document:

- Installation
- Configuration
- MDX
- Components
- OpenAPI
- Search
- Themes
- Deployment
- Docker
- CLI
- API Playground

---

# 41. Testing

Use automated tests.

Test:

- configuration parsing
- MDX parsing
- frontmatter
- navigation
- OpenAPI parsing
- schema extraction
- search
- route generation

UI tests should cover critical interactions.

---

# 42. TypeScript

Use strict TypeScript.

Avoid:

```ts
any
```

unless absolutely necessary.

Create reusable domain types.

---

# 43. Error Handling

Errors must be developer friendly.

Examples:

```text
Invalid docs.config.ts

OpenAPI file could not be parsed

Unknown navigation page

Invalid MDX

Duplicate route

Missing page
```

CLI errors should clearly explain:

1. What went wrong
2. Where it happened
3. How to fix it

---

# 44. Performance

Prioritize:

- static generation
- server components
- minimal JavaScript
- code splitting
- lazy loading
- optimized images

Do not ship the entire OpenAPI parser to the browser unnecessarily.

OpenAPI should preferably be parsed during build.

---

# 45. Accessibility

The UI must follow accessibility best practices.

Support:

- keyboard navigation
- focus states
- semantic HTML
- aria labels
- screen readers
- sufficient contrast

Search must be keyboard accessible.

Sidebar must be keyboard accessible.

Modal dialogs must trap focus correctly.

---

# 46. Security

Never execute arbitrary code from documentation content.

MDX must be treated carefully.

Do not expose:

```text
.env
server secrets
private configuration
```

to the browser.

Do not expose server-only environment variables with:

```text
NEXT_PUBLIC_
```

unless explicitly intended.

---

# 47. No Admin Panel in MVP

Do NOT implement:

- CMS
- user management
- database
- login
- organization management
- billing
- SaaS dashboard

These are future features.

The MVP is Git + files + build.

---

# 48. Future SaaS Layer

The architecture should not prevent a future SaaS version.

Future:

```text
Ticidocs Cloud
```

could provide:

```text
Organizations
Users
Projects
Custom domains
Analytics
Hosted search
Deployment
Team permissions
Billing
```

But none of these should be part of the MVP.

---

# 49. Branding

Do not copy Mintlify branding.

Do not use:

- Mintlify logo
- Mintlify trademarks
- Mintlify source code
- proprietary assets

The UI should be inspired by modern developer documentation platforms but implemented independently.

Use Ticidocs branding throughout the project.

---

# 50. MVP Scope

The first release must include:

### Core

- Next.js
- TypeScript
- MDX
- Frontmatter
- Navigation
- Sidebar
- Responsive layout

### UI

- Navbar
- Sidebar
- TOC
- Dark mode
- Search
- Code blocks
- Copy button
- Tabs
- Callout
- Cards
- Steps

### API

- OpenAPI 3.0
- OpenAPI 3.1
- YAML
- JSON
- Endpoint rendering
- Parameters
- Request body
- Responses
- Schemas
- Authentication

### Deployment

- Docker
- Docker Compose
- Production build
- README

### CLI

- create-ticidocs

---

# 51. V1 Scope

After MVP:

- Try It
- Code generation
- Versioning
- i18n
- Advanced search
- API playground improvements
- Theme customization
- Custom components
- Analytics hooks
- Better OpenAPI support

---

# 52. V2 Scope

Future:

- Ticidocs Cloud
- GitHub integration
- GitLab integration
- Custom domains
- Authentication
- Teams
- Organizations
- Hosted search
- Analytics
- Webhooks
- Deployment management
- Visual editor

---

# 53. Development Strategy

Do NOT implement the entire platform at once.

Work in phases.

## Phase 1 — Foundation

Implement:

- monorepo
- Next.js
- TypeScript
- MDX
- basic routing
- config
- navigation
- sidebar
- theme
- responsive layout

At the end:

```bash
pnpm build
```

must succeed.

---

## Phase 2 — Documentation UI

Implement:

- code blocks
- copy
- TOC
- Callout
- Cards
- Tabs
- Steps
- search

---

## Phase 3 — OpenAPI

Implement:

- parser
- endpoint model
- HTTP methods
- parameters
- schemas
- requests
- responses
- security

---

## Phase 4 — API Experience

Implement:

- Try It
- authentication
- generated examples
- response viewer

---

## Phase 5 — Production

Implement:

- Docker
- Docker Compose
- production build
- GitHub Actions
- deployment documentation

---

## Phase 6 — CLI

Implement:

```bash
npx create-ticidocs
```

with templates.

---

# 54. Cursor Agent Rules

You are working as the lead software engineer for this project.

Before writing code:

1. Inspect the repository.
2. Understand the existing structure.
3. Read PROJECT.md completely.
4. Identify the current phase.
5. Do not implement future-phase functionality unless required by the current phase.

Do not rewrite working code unnecessarily.

Do not introduce unnecessary dependencies.

Prefer small, reusable packages.

Prefer simple architecture over premature abstraction.

Do not create an admin panel.

Do not create a database.

Do not add authentication.

Do not add SaaS functionality.

Do not use Tailwind CSS.

Do not copy Mintlify source code.

Do not copy proprietary assets.

Use the project name Ticidocs consistently in package names, CLI commands, documentation, examples, and branding.

---

# 55. Quality Rules

Every phase must finish with:

```bash
pnpm lint
pnpm test
pnpm build
```

If Docker configuration exists:

```bash
docker build .
```

must succeed.

Do not report a phase as complete if the project does not build.

Fix TypeScript errors before continuing.

Fix lint errors before continuing.

---

# 56. Expected Result

The final product should allow this:

```bash
npx create-ticidocs my-api
cd my-api
npm install
npm run dev
```

Then the developer can create:

```text
content/
├── introduction.mdx
├── authentication.mdx
└── api/
    └── products.mdx
```

and:

```text
openapi/
└── openapi.yaml
```

The result should be a polished developer documentation website.

---

# 57. Definition of Success

The project is successful when a developer can:

1. Create a project with one CLI command.
2. Add MDX documentation.
3. Add an OpenAPI file.
4. Automatically get API reference pages.
5. Search the documentation.
6. Navigate using a sidebar.
7. Use dark mode.
8. Copy code examples.
9. Try API endpoints.
10. Build the site.
11. Run it in Docker.
12. Deploy it to their own VDS.

The entire process should require no external SaaS service.

---

# 58. First Task

Start with Phase 1 only.

Do not implement OpenAPI, Try It, SaaS, authentication, analytics, or advanced features yet.

First create the monorepo and the core documentation engine.

After Phase 1 is complete:

1. Run lint.
2. Run tests.
3. Run production build.
4. Fix all errors.
5. Show the final project tree.
6. Explain what was implemented.
7. Explain what remains for Phase 2.

Do not continue to Phase 2 automatically.
