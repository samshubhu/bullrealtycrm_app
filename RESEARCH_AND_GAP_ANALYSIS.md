# BullSales Suite — Freshsales R&D + Gap Analysis

Author: build session · Date: 2026-06-30
Reference video: https://www.youtube.com/watch?v=KehhQcMhOYE (Freshsales walkthrough)
Reference docs: freshworks.com/crm/features, freshworks.com/crm/suite

> **TL;DR (Hinglish):** Structure poora ban gaya hai (26 pages, 29 tables, login + RLS chal
> raha hai). Lekin **sirf Leads module hi truly Freshsales-jaisa functional hai**. Baaki
> ~70% pages abhi **read-only "dummy" hain** — data dikhता hai (seed se), par add/edit/bulk/
> send/import/export buttons kaam nahi karte. Neeche har module ka honest status + Freshsales
> ke missing features + UI gaps + priority backlog diya hai.

---

## Part A — Freshsales R&D Notes (what the real product does)

The video could not be transcribed automatically (YouTube returned no captions), so this is
compiled from the official Freshworks feature pages + the product as it works in 2026.

### A1. Core CRM objects
- **Leads / Contacts / Accounts / Deals** with a **360° record page**: customizable summary
  sections, "highlight cards" (key metrics on top), full activity timeline, and related lists
  (notes, tasks, appointments, calls, emails, documents).
- **Auto-profile enrichment** — pulls social/public data onto the contact.
- **Contact lifecycle stages** (Lead → Sales Qualified → Customer) configurable per pipeline.
- **Multiple sales pipelines** + **multiple deal pipelines** (not just one board).
- **Product catalog / CPQ** — products with SKU, price, quantity, discount; deal value auto-
  calculated from line items.

### A2. Productivity & automation
- **Sales Sequences** — multi-step automated outreach (email → wait → call task → SMS → email),
  with open/click triggers and auto-stop on reply. *This is the single biggest Freshsales feature
  we do not have.*
- **Workflows** — visual if/this/then automation (triggers → conditions → actions → delays).
- **Auto-assignment rules** + **territory management** (assign by geography/source/product).
- **Sales goals/targets** and **forecasting** (weighted pipeline, deal estimates).
- **"Rotten deals"** alerts (deals untouched for N days), **out-of-office detection**.

### A3. Communication (built into the record)
- **Cloud telephony** (Freshcaller) — click-to-call, recordings, call logs, IVR, virtual numbers.
- **Email** — 2-way sync (Gmail/Outlook add-ons), open/click tracking, templates, bulk email.
- **WhatsApp Business**, **SMS**, **live chat** (Freshchat), **Apple Business Chat**.
- All conversations land on the contact timeline automatically.

### A4. Freddy AI (the intelligence layer)
- Contact/deal **scoring** & ranking, **next-best-action**, **deal insights** & close prediction,
  **duplicate detection/dedupe**, **email writing assist**, **call summary**, **chatbots**.

### A5. Marketing (Suite tier)
- **Journeys** (visual customer-journey builder), **email campaigns** with drag-drop builder,
  **landing pages**, **web forms** (code-free), **segments/marketing lists**, A/B testing, heatmaps.

### A6. Analytics
- Standard + **custom report builder**, **dashboards** with multiple widgets, **attribution**,
  **win-loss analysis**, **conversion tracking**, sales-activity reports, scheduled report email.

### A7. Governance & platform
- **Custom roles + field-level permissions + record-type rules**, **audit logs**,
  **custom modules**, **custom fields** (incl. formula fields), **API + webhooks**, marketplace.

### A8. UI/UX patterns that define the Freshsales "feel"
1. **Left icon-rail sidebar** that expands on hover; module switcher at the very top.
2. **List page = saved Views** ("All", "My", "New this week"…) as tabs, plus a **filter rail**
   on the right, **column chooser**, **inline edit**, **bulk action bar** when rows are checked.
3. **Table ↔ Kanban toggle** on Leads/Deals.
4. **Record page = 3 columns**: left (details + highlight cards), center (timeline + activity
   composer tabs: Note / Call / Email / Task / Appointment), right (related/associations + Freddy).
5. **Quick-add "+" composer** docked, and a **slide-over (drawer)** for create/edit — never a full
   page reload.
6. **Global search** with grouped results + recent items.
7. **Bottom-right activity/timer dock** for calls and running tasks.
8. Soft shadows, rounded-xl cards, pill status badges, generous spacing, blue/green accents.

---

## Part B — How our project maps to Freshsales (honest audit)

**Legend**
- ✅ **Functional** — real data + create/edit/actions actually work (Freshsales-like).
- 🟡 **Read-only** — shows real seeded data, but no add/edit/bulk/send/import/export.
- 🔴 **Dummy** — page renders but its buttons/actions do nothing.
- ❌ **Missing** — not built at all.

### B1. Two different scores (don't confuse them)
- **Structural coverage** (does the screen exist & look right): **~80%**.
- **Functional depth** (does it actually work like Freshsales): **~35%**.

That gap is exactly what "bahut saare section sirf dummy hai" means.

### B2. Module-by-module scorecard

| # | Module | Status | Match vs Freshsales | What works | What's dummy / missing |
|---|--------|--------|--------------------:|------------|------------------------|
| 1 | **Login** | ✅ | 80% | Supabase email/password, error+loading, redirect guard | "Remember me" not wired; no SSO |
| 2 | Forgot password | 🔴 | 30% | UI only | Submit does nothing; no reset email |
| 3 | **Reset password** | ❌ | 0% | — | Page does not exist |
| 4 | App shell (sidebar/header) | ✅ | 70% | Collapsible sidebar, active state, global search, quick-create menu, profile menu+signout | No **mobile drawer** (button is dummy), no **breadcrumbs**, no hover-expand icon rail, no saved-view tabs |
| 5 | **Dashboard** | 🟡→✅ | 55% | Real KPI cards, source donut, funnel, pipeline bar, today's follow-ups, recent activity | Missing cards: site visits sched/done, monthly target, deals lost, missed calls; missing sections: revenue forecast, campaign/call/WhatsApp performance, monthly trend, lost-lead analysis; no widget customization; no date filter |
| 6 | **Leads — list** | ✅ | 65% | Real list, filters (status/priority/owner), debounced search, **create/edit drawer (full CRUD)**, duplicate detect on create | No **card/Kanban view**, no date/project filter, no sort menu, no **bulk actions**, no **import**, **export button is dummy**, no saved views, no column chooser, no inline edit |
| 7 | **Leads — detail** | ✅ | 70% | 7 tabs, timeline, quick actions that really write (call/WhatsApp/note/task/status/convert), AI panel, edit drawer | Email action = `alert()` (dummy); missing tabs: **Emails, Documents, Site visits, History**; no appointment composer; AI is rule-based not real |
| 8 | **Contacts** | 🟡 | 40% | List + detail show real data, timeline, linked deals | No create/edit, no filters, no bulk, no export, no quick actions on detail, no notes-add |
| 9 | **Accounts** | 🟡 | 40% | List + detail, linked contacts + deals + timeline | No create/edit, no filters, no activities composer |
| 10 | **Deals — list** | 🟡 | 45% | Real list + KPI cards | Rows not clickable, no **deal detail page**, no create/edit, no filters |
| 11 | **Pipeline (Kanban)** | ✅ | 60% | Drag-drop stage change **persists**, stage value/count, color-coded | Cards not clickable to detail, no filters, single pipeline only, no WIP/rotten alerts |
| 12 | **Tasks** | 🟡 | 50% | Today/Upcoming/Overdue/Completed views, **complete toggle works** | No create/edit/reschedule from this page, no reminders, no calendar link, no escalation |
| 13 | **Calendar** | 🟡 | 35% | Month grid with task events | No day/week/agenda, no create event, no drag, no Google Calendar |
| 14 | **Calls** | 🟡 | 45% | Read-only log + KPI cards; logging works from lead page | No click-to-call dialer here, no recordings, no provider wiring, no call reports |
| 15 | **WhatsApp** | 🟡 | 45% | Read-only log + templates; sending works from lead page | No conversation/chat UI, no send/bulk here, no template CRUD, no delivery webhooks |
| 16 | **Email** | 🟡 | 35% | Read-only log + templates | No compose/send, no tracking, no template CRUD, no bulk |
| 17 | **Campaigns** | 🟡 | 40% | Read-only list + CPL/spend/ROI metrics | No create, no campaign detail/reports, no journey builder |
| 18 | **Automation** | 🔴 | 30% | Shows seeded rules (trigger→actions) | "New rule" dummy, **no builder**, **no execution engine** — rules never actually fire |
| 19 | **Reports** | 🟡 | 45% | Real charts: source/status/pipeline/calls/user-performance | No date/user/project filters, no **export PDF/Excel**, no custom builder, no scheduled reports |
| 20 | **Projects/Properties** | 🟡 | 50% | Real card grid + per-project lead counts | No add/edit, no project detail, no brochure upload, no project reports |
| 21 | **Team/Users** | 🟡 | 45% | List + roles + lead-load + channels | No invite/create, no edit, no activity logs, no per-user dashboard |
| 22 | **Settings** | 🟡 | 35% | Read-only view of sources/statuses/stages/dispositions/templates | Nothing editable; missing company profile, roles & permissions UI, API keys, notif settings, import/export, audit logs |
| 23 | **API & Webhooks** | 🔴 | 35% | Endpoint/event reference + logs view | "Generate key" dummy — no real key create/revoke; only meta-leads webhook exists |
| 24 | **Notifications** | 🟡 | 50% | Real list, unread styling | No mark-as-read, no realtime, no preferences |
| 25 | **Profile** | 🔴 | 40% | Shows real profile | **Save button does nothing**, no avatar upload, no password change |
| 26 | **Global Search** | ✅ | 70% | Real grouped results across leads/contacts/deals/accounts/projects | No recent items, no notes/tasks search, no advanced filter builder |

### B3. Backend / API reality
**Working APIs:** `POST/GET /api/leads`, `GET/PUT/DELETE /api/leads/:id`, `POST /api/calls`,
`POST /api/whatsapp`, `POST /api/notes`, `POST/PATCH /api/tasks`, `PUT/DELETE /api/deals/:id`,
`POST /api/webhooks/meta-leads`.

**Missing APIs (spec asks for these):** `POST /api/deals`, contacts/accounts/campaigns/projects
CRUD, `POST /api/webhooks/99acres`, `POST /api/webhooks/call-events`, WhatsApp status webhooks,
API-key generate/revoke, reset-password, import/export endpoints, automation execution.

### B4. Database reality
- **29 tables exist** and are well-modelled. Good.
- **Tables with NO UI/usage yet:** `site_visits`, `attachments` (documents), `audit_logs`,
  `import_logs`, `automation_logs`, `webhook_logs` (only meta writes), `api_keys` (only displayed).
- **Spec tables not created:** `roles`, `permissions`, `role_permissions`, `team_members`,
  `user_sessions`. RBAC today = a single `role` column + RLS, **not** granular per-module/action
  permissions like the spec/Freshsales describe.

---

## Part C — UI/UX gaps vs the Freshsales look & feel

These are the visual/interaction things that make it "feel" like Freshsales and that we are
missing right now:

1. **Saved-view tabs** on every list (All / My / New / Hot…) — we only have filters.
2. **Bulk action bar** (checkboxes → assign / status / WhatsApp / email / delete / export).
3. **Table ↔ Kanban / Card toggle** on Leads & Deals.
4. **Right-hand filter rail + column chooser + inline edit** on list pages.
5. **3-column record layout** with a docked **activity composer** (Note/Call/Email/Task tabs) —
   ours uses modals instead of an inline composer.
6. **Slide-over create everywhere** (contacts/accounts/deals/tasks/projects) — only Leads has it.
7. **Breadcrumbs** under the header.
8. **Mobile**: hamburger drawer + bottom nav (button exists but does nothing today).
9. **Toasts / confirmation dialogs** — currently using `alert()`/none.
10. **Real date-picker & multi-select** components (we use native inputs).
11. **Skeleton loaders / loading.tsx / error.tsx** boundaries per route.
12. **Empty-state CTAs** that actually open the create drawer (some are static).

---

## Part D — Prioritized backlog to go from "dummy" → "Freshsales-grade"

**P0 — make the core objects fully functional (highest impact)**
1. Reusable **CRUD drawer + API** pattern, then apply to Contacts, Accounts, Deals, Tasks,
   Projects, Campaigns (currently read-only).
2. **Deal detail page** (3-column, timeline, stage history) + clickable deal cards/rows.
3. **Bulk action bar** + row selection on Leads/Contacts/Deals.
4. **Import (CSV) wizard** + **Export** (wire the existing buttons) using `import_logs`.
5. **Toast + confirm dialog** primitives; replace `alert()`.

**P1 — communication & activity depth**
6. Inline **activity composer** on record pages (Note/Call/Email/Task/Appointment tabs).
7. **Email compose/send** + template CRUD; **WhatsApp chat view** + template CRUD.
8. **Site visits** UI (schedule/complete) + **Documents** tab (Supabase Storage + `attachments`).
9. Telephony **click-to-call** + provider webhook (`/api/webhooks/call-events`).

**P2 — automation, RBAC, reporting**
10. **Automation builder + execution engine** (cron/Edge Function consuming `automation_rules`,
    writing `automation_logs`): round-robin assign, auto-WhatsApp, overdue escalation.
11. **Granular RBAC**: add `roles/permissions/role_permissions`, a permissions matrix UI, and
    tighten RLS (executive sees only owned leads, manager sees team).
12. **Reports**: date/user/project filters, PDF/Excel export, saved/scheduled reports.
13. **Settings**: make config tables editable; **API keys** generate/revoke; **audit logs** page.

**P3 — polish & Freshsales feel**
14. Saved-view tabs, table/Kanban toggle, column chooser, inline edit.
15. Mobile drawer + bottom nav; breadcrumbs; skeletons; error boundaries.
16. Forgot/reset-password flow end-to-end.
17. Real Freddy-style AI (optional): wire an LLM for lead scoring, reply/email drafts, call summaries.

**P4 — advanced Freshsales parity (optional/large)**
18. Sales **Sequences**, multiple pipelines, **product catalog/CPQ**, **forecasting & goals**,
    marketing **journeys/landing pages/web forms**, territory management, custom fields/modules.

---

## Part E — Suggested definition of "done = matches Freshsales"
A module counts as ✅ only when it has: list with saved views + filters + bulk + import/export,
a slide-over create/edit, a 3-column detail page with inline activity composer and timeline,
and the relevant communication actions actually sending/logging. Today only **Leads** meets most
of this bar; everything else is the work in Part D.

---

### Sources
- https://www.freshworks.com/crm/features/
- https://www.freshworks.com/crm/suite/
- https://crm.org/news/freshworks-freshsales-crm-review
- https://www.onepagecrm.com/crm-reviews/freshsales/
- Reference video: https://www.youtube.com/watch?v=KehhQcMhOYE
