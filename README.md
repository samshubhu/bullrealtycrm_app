# BullSales Suite — Real Estate CRM

A Freshsales-style CRM for real-estate sales teams: leads, contacts, accounts, deal
pipeline, tasks, calling, WhatsApp, email, campaigns, automation, reports, projects,
RBAC, AI assistant, and a lead-capture API.

Built with **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind**,
backed by **Supabase** (Postgres + Auth + RLS). Local now, cloud later.

> See [HANDBOOK.md](./HANDBOOK.md) for the goal, full module plan, and live status board.

## Prerequisites

- Node.js 20+ (tested on 26)
- Docker (for local Supabase)
- Supabase CLI (`supabase`)

## Quick start

```bash
# 1. Start the local Supabase stack (Postgres + Auth + Studio).
#    Applies migrations in supabase/migrations and loads supabase/seed.sql.
npm run db:start          # or: supabase start

# 2. Install dependencies
npm install

# 3. Run the app
npm run dev               # http://localhost:3000
```

`npm run db:status` prints the live API URL + keys. The values in `.env.local` match
the default local stack (API on `http://127.0.0.1:55521`). If your keys differ, copy
them from `db:status` into `.env.local`.

### Demo logins (password: `password123`)

| Email | Role |
|---|---|
| admin@bullrealty.com | Super Admin |
| manager@bullrealty.com | Sales Manager |
| rahul@bullrealty.com | Sales Executive |
| sneha@bullrealty.com | Sales Executive |
| kavya@bullrealty.com | Telecaller |
| marketing@bullrealty.com | Marketing |

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run db:start` / `db:stop` | Start/stop local Supabase |
| `npm run db:reset` | Re-apply migrations + seed |
| `npm run db:status` | Show local URLs + keys |
| `npm run types` | Generate TS types from the DB |

## Project layout

```
src/
  app/
    (auth)/            login, forgot-password
    (crm)/             authenticated app (sidebar layout)
      dashboard, leads, contacts, accounts, deals, pipeline,
      tasks, calendar, calls, whatsapp, email, campaigns,
      automation, reports, projects, team, settings,
      api-webhooks, notifications, profile, search
    api/               REST route handlers (leads, calls, whatsapp, tasks, deals, webhooks)
  components/          layout (sidebar/header), ui, charts, timeline
  lib/                 supabase clients, auth/RBAC, queries, constants, utils
supabase/
  migrations/          schema + RLS + grants
  seed.sql             demo users + sample data
  config.toml          local ports (55521 API, 55522 DB, 55523 Studio)
```

## Lead capture API

```bash
# Generic lead capture (set an API key in admin settings to use x-api-key)
curl -X POST http://localhost:3000/api/leads \
  -H "x-api-key: <key>" -H "Content-Type: application/json" \
  -d '{"full_name":"New Lead","phone":"+91 90000 00000","email":"x@y.com"}'

# Meta Lead Ads webhook (verify token via META_LEADS_VERIFY_TOKEN)
POST /api/webhooks/meta-leads
```

Both run duplicate detection by phone and write to the lead timeline.

## Going to cloud Supabase

1. Create a project at supabase.com, then `supabase link --project-ref <ref>`.
2. `supabase db push` to apply `supabase/migrations` to the cloud DB.
3. Update `.env.local` (or your host's env) with the cloud `NEXT_PUBLIC_SUPABASE_URL`,
   anon key, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Run the seed against cloud only if you want demo data.

No app code changes are needed — the same Supabase clients point at the cloud URL.

## Security notes

- Supabase Auth issues JWTs in httpOnly cookies; middleware guards every non-public route.
- Row Level Security is enabled on all tables. `authenticated` is row-governed; deletes on
  core entities are manager/admin only; notifications are per-user. `service_role` (server
  only) bypasses RLS for webhooks and lead capture.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client — it is server-only.
- Input is validated with Zod on write endpoints.

See [HANDBOOK.md](./HANDBOOK.md) §6 for what's still pending (tests, provider adapters,
automation engine, CSV import/export wiring).
