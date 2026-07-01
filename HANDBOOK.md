# BullSales Suite — Project Handbook

> Read this file before starting any coding session. It is the single source of truth
> for what this product is, what is planned, what is done, and what remains.

Last updated: 2026-06-30

---

## 1. Goal

Build a production-ready, Freshsales-Suite–style CRM for a real-estate sales
organization (**Bull Realty Global**). It must look and feel like a premium SaaS CRM:
clean left sidebar, top header with global search, dashboard cards + charts, lead
management flow, deal pipeline (Kanban), customer timeline, automation, calling,
WhatsApp/email, reports, admin settings, RBAC, and AI assistant features.

Original branding only — no Freshsales logos/trademarks/assets. The *structure,
workflow, and polish* are the reference, not the brand.

## 2. Tech Stack (chosen)

A single full-stack **Next.js 16 (App Router, Turbopack)** app backed by **Supabase**
(local now, cloud later — same code, swap env vars).

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript, Turbopack dev & build
- **Styling:** Tailwind CSS + custom design tokens, lucide-react icons
- **DB / Auth:** Supabase — Postgres + GoTrue auth + Row Level Security
- **Data access:** `@supabase/ssr` (cookie-bound server client respects RLS; service-role
  client for webhooks). TanStack Query on the client.
- **API:** Next.js Route Handlers (`/app/api/**`) — REST style
- **Charts:** Recharts · **Validation:** Zod · **State:** Zustand

Why: the prompt lists Next.js/TS/Tailwind + Supabase as preferred. Supabase gives auth,
Postgres, and RLS out of the box; going from local to cloud is just an env-var change.

## 3. How to run

```bash
cd Desktop/bullsales_suite
npm run db:start     # supabase start — Postgres+Auth+Studio, applies migrations+seed
npm install
npm run dev          # http://localhost:3000
```

Local ports: API `55521`, DB `55522`, Studio `55523` (see `supabase/config.toml`).
Demo login: `admin@bullrealty.com` / `password123` (all roles in `supabase/seed.sql`).

## 4. Module / feature plan (from spec)

Dashboard · Leads · Contacts · Accounts · Deals + Pipeline · Tasks · Calendar · Calls ·
WhatsApp · Email · Campaigns · Automation · Reports · Projects/Properties · Team ·
Admin Settings · API/Webhooks · Profile · Notifications · AI Assistant · Import/Export ·
Global Search · RBAC · Audit logs.

## 5. Status board

Legend: ✅ done · 🟡 partial/functional-MVP · ⬜ not started

### Foundation
- ✅ Project scaffold (Next.js + TS + Tailwind config)
- ✅ Prisma schema (all core CRM tables)
- ✅ Seed data (users, leads, contacts, accounts, deals, projects, tasks, activities…)
- ✅ JWT auth (login/logout, httpOnly cookie, middleware guard)
- ✅ Role-based access control (role on user, permission helper)
- ✅ App layout: sidebar + top header + global search shell + quick-create + profile menu

### Modules (all built and compiling; 36 routes)
- ✅ Login page (+ forgot-password) with Supabase Auth
- ✅ Dashboard (15 KPI cards + funnel/donut/bar charts + recent activity + today's follow-ups)
- ✅ Leads: list + filters + debounced search + detail w/ 7 timeline tabs + create/edit drawer
      + quick actions (call/whatsapp/note/task/status/convert) + AI panel
- ✅ Contacts: list + detail (deals + timeline)
- ✅ Accounts: list + detail (linked contacts + deals + timeline)
- ✅ Deals: list + Kanban pipeline (HTML5 drag to change stage, persisted)
- ✅ Tasks: today/upcoming/overdue/completed views + inline complete toggle
- ✅ Calendar: month grid with task events
- ✅ Calls: log + KPIs + dispositions
- ✅ WhatsApp: message log + templates
- ✅ Email: log + templates
- ✅ Campaigns: list + CPL/spend/ROI metrics
- ✅ Projects/Properties: card grid + per-project lead counts
- ✅ Reports: source/status/pipeline/calls/user-performance charts
- ✅ Automation: rule list (trigger → actions)
- ✅ Team / Users: list + roles + per-user lead load + channels
- ✅ Admin Settings: sources, statuses, stages, dispositions, WhatsApp/email templates
- ✅ API/Webhooks: keys + endpoints + events + logs
- ✅ Notifications, Profile, Global Search
- ✅ REST API: leads CRUD, deals stage update, calls/whatsapp/notes/tasks, Meta lead webhook

### Cross-cutting
- ✅ Reusable UI: Sidebar, Header (global search + quick-create + profile menu),
  StatCard, DataTable, StatusBadge/PriorityBadge/StageBadge, Avatar, Timeline,
  Modal/Drawer, Kanban, charts, EmptyState, Skeleton
- ✅ AI assistant panel (lead scoring + next-best-action, rule-based)
- ✅ Production build passes (`npm run build`, Turbopack, 36 routes); `tsc --noEmit` clean
- ✅ Verified: auth redirect, login, Supabase auth token, RLS reads, service-role webhook insert
- ⬜ Real telephony / WhatsApp / email provider integrations (API-ready stubs only)
- ⬜ Automated tests
- ⬜ CSV import/export wiring (export buttons present, not wired)

### Gotcha fixed this session
- Tables created by migration did **not** inherit Supabase's default SELECT/INSERT grants,
  so `authenticated`/`service_role` got `permission denied`. Fixed by explicit `grant` +
  `alter default privileges` block at the end of the init migration.

## 6. Pending / next up

1. Flesh partial (🟡) module pages into full CRUD where still read-only.
2. Wire create/edit forms for contacts, accounts, deals, tasks.
3. Real provider adapters for calls/WhatsApp/email behind the existing stubs.
4. Automation rule execution engine (triggers → actions).
5. Tests (auth, RBAC, lead CRUD, dedupe, deal stage, reports).
6. CSV import/export, scheduled reports.
7. Swap SQLite → Postgres/Supabase + RLS for production; add rate limiting + helmet-style headers.

## 7. Conventions

- App Router pages under `src/app/(crm)/<module>/`. Public pages under `src/app/(auth)/`.
- API under `src/app/api/<resource>/route.ts`.
- DB access via `src/lib/db.ts` (Prisma singleton). Auth via `src/lib/auth.ts`.
- Shared UI in `src/components/ui`, layout in `src/components/layout`.
- Keep this handbook's status board updated at the end of each session.
