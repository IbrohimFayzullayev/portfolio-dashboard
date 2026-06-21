# Portfolio Dashboard

An admin **CMS** for the portfolio & blog — create, edit, publish and delete posts
and projects (bilingual EN/UZ). It talks to the Go API in `../portfolio-api`.

## Stack

| Concern        | Choice                                       |
| -------------- | -------------------------------------------- |
| Framework      | Next.js 15 (App Router)                      |
| Language       | TypeScript (strict)                          |
| Styling        | Tailwind CSS v4 + shadcn/ui-style primitives |
| Data           | TanStack Query (server state + caching)      |
| Forms          | react-hook-form + zod                        |
| Auth           | JWT (stored in a cookie)                     |
| Notifications  | sonner                                       |

Shares the same design system as the public site for a consistent look.

## Quick start

```bash
# 1. Start the API first (see ../portfolio-api/README.md)

# 2. Configure and run the dashboard
cp .env.example .env.local      # point NEXT_PUBLIC_API_URL at the API
pnpm install
pnpm dev                        # http://localhost:3001
```

The dashboard runs on **port 3001** (the API's default `CORS_ORIGINS`).

## First login

Bootstrap the first admin once, against the API:

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"supersecret","name":"Ibrohim"}'
```

Then sign in at `/login` with those credentials.

## Features

- Auth-guarded dashboard shell with sidebar navigation and dark/light mode.
- Overview with post/project counts (published vs. draft).
- **Posts**: list with locale/status filters, create, edit, delete, and a
  one-click publish/unpublish toggle.
- **Projects**: list with filters, create, edit, delete, ordering.
- Forms with validation (zod), slug auto-generation, tags/stack as
  comma-separated input, and Markdown/MDX body editing.
- Optimistic cache invalidation via TanStack Query + toast feedback.

## Structure

```
src/
├── app/
│   ├── layout.tsx              # root layout + providers
│   ├── login/page.tsx          # public login
│   └── (dashboard)/            # auth-guarded route group
│       ├── layout.tsx          # sidebar shell + auth guard
│       ├── page.tsx            # overview
│       ├── posts/              # list, new, [id] edit
│       └── projects/           # list, new, [id] edit
├── components/
│   ├── ui/                     # button, card, input, select, switch, …
│   ├── providers.tsx           # React Query + theme + toaster
│   ├── post-form.tsx
│   ├── project-form.tsx
│   └── content-form.tsx        # shared Field / ToggleField helpers
└── lib/
    ├── api.ts                  # fetch wrapper + token store
    ├── auth-context.tsx        # auth state
    ├── hooks.ts                # TanStack Query hooks (CRUD)
    ├── types.ts                # API DTO types
    └── utils.ts
```

## Notes

- The token is stored in a cookie and sent as `Authorization: Bearer …`.
- On a 401 the token is cleared and you're returned to the login screen.
- This app is `noindex` — it's an internal tool, not public.
