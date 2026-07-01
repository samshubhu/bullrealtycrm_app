# R&D — Contacts · Accounts · Deals · Pipeline (Freshsales analysis + plan)

Date: 2026-06-30 · Reference: Freshworks/Freshsales support + feature docs (sources at end)

> Same flow as the Leads work: **R&D first → audit → phased plan → you decide → build.**
> TL;DR (Hinglish): Yeh 4 modules abhi **read-only dummy** hain (43–89 line ke chhote
> pages, koi create/edit/filter/bulk nahi; deals me sirf pipeline drag chalta hai). Neeche
> Freshsales me yeh kaise kaam karte hain uska R&D, humare current state ka audit, aur ek
> phased plan diya hai. Leads jaisa hi 360° record + inline-edit + composer pattern reuse hoga.

---

## PART A — How Freshsales does these modules

### A1. Data model (how they connect)
- **Contact** = a person. **Account** = a company. **Deal** = an opportunity/booking.
- A contact has **one+ related accounts** (multi-account association); an account has many
  **related contacts**; deals link to a contact + account + (optionally) products.
- **Account hierarchy:** parent ↔ child accounts (e.g. Developer → project SPVs). Up to 25
  nested parents, 250 children per parent.

### A2. Contacts module
**List view:** saved **Views** (All/My/New…), filter rail, **column chooser**, **table↔board**,
inline edit, **bulk actions** (assign owner, add to sequence, email, add tag, delete, export),
search, import/export.
**360° record page:** highlight cards on top; **inline-editable** fields; **activity timeline**
(all website/app/sales interactions); **Conversations** (email 2-way, SMS, calls, WhatsApp);
Notes, Tasks, Appointments; **Deals** associated; **Related accounts** (multiple); **Files**;
**Freddy** contact score + auto-profile enrichment. Actions: convert, **clone, merge, delete**,
add to sequence, unsubscribe.

### A3. Accounts module
**Account = the company you do business with.** Fields: name, industry, employees, revenue,
website, phone, address, owner, territory, parent account.
**360° account view:** company logo + highlight cards; **Related contacts**; **Deals with stage
+ value** and **open/won deal totals**; **Recent conversations** aggregated across *all related
contacts* (email/SMS/calls); Notes, Tasks, Files, activity timeline; **Account hierarchy** tree
(click the hierarchy icon to see parent/child).
**List view:** views/filters/columns/bulk like contacts.

### A4. Deals module + record
**Deal record:** summary + highlight cards; **stage** + **probability**; **value** (auto-computed
from **products/line items** in CPQ — qty × price − discount); expected close date; owner; source;
associated **contact / account / products**; **stage history**; activity timeline; Conversations;
Tasks; Notes; Files; **lost reason** on Closed-Lost. Inline-editable.

### A5. Pipeline (the Kanban) — the signature view
- **Kanban by default**: deals are cards grouped by stage; **drag-drop** to advance a stage.
- **Stage header shows count + total value**; color-coded stages.
- **Weighted forecast:** each stage has a **probability %**; expected revenue = Σ(stage value ×
  probability). Managers forecast from this.
- **Rotten / stale deals:** if a deal passes its **rotting date** (default **30 days** untouched)
  the card **turns red**. Configurable per pipeline.
- **Multiple pipelines:** separate pipelines, each with its own stages (plan-gated: 1/10/25).
  A pipeline switcher sits at the top.
- **Sales targets / quota:** quota vs achievement per owner/period.
- **List ↔ Kanban ↔ Forecast** view toggle; filters (owner/source/date/value), search, bulk.

### A6. Real-estate mapping for us
Account = developer / channel-partner firm / family office · Contact = buyer/investor ·
Deal = a unit booking · Products = unit types (2BHK/3BHK/villa) · Rotten deal = no follow-up
in N days · Pipelines = "Residential", "Commercial", "Resale".

---

## PART B — Audit of our current modules

Legend: ✅ functional · 🟡 read-only (real data, no actions) · 🔴 dummy · ❌ missing

| Module | Status | Today | Missing vs Freshsales |
|---|---|---|---|
| **Contacts list** | 🟡 | Real table, click→detail | No create/edit, no views/filters/columns, no bulk, no import/export, no board |
| **Contacts detail** | 🟡 | Shows deals + timeline | Not inline-editable; no conversations/tasks/notes-add/files/related-accounts; no convert/merge; no AI; no composer |
| **Accounts list** | 🟡 | Real table, click→detail | Same gaps as contacts list |
| **Accounts detail** | 🟡 | Linked contacts + deals + timeline | No **hierarchy**, no open/won totals, no aggregated conversations, no create/edit, no files/tasks/notes, no inline edit |
| **Deals list** | 🟡 | Real table + KPI cards | Rows **not clickable**, **no deal detail page**, no create/edit from list, no filters, no bulk, no lost-reason |
| **Pipeline (Kanban)** | ✅(partial) | Drag-drop stage change persists; stage value+count | Cards **not clickable** to detail; no filters/search; **single pipeline only**; no **weighted forecast** row; **no rotten-deal** highlight; no lost-reason prompt on Closed-Lost; no list/forecast toggle; no quota |

**Backend that already exists:** `POST /api/deals` (create), `PUT/DELETE /api/deals/:id` (stage/edit/delete).
**Missing APIs:** `/api/contacts` (CRUD), `/api/accounts` (CRUD), deal full-edit fields, pipelines.
**DB gaps:** no `pipelines` table (single implicit pipeline), no `deal_stages.pipeline_id`, no
`accounts.parent_account_id`, no products/line-items, no `contact_accounts` join (contacts have a
single `account_id`), no rotting config, deals have no `contact`/`products` line items UI.

---

## PART C — Proposed plan (phased; mirrors the Leads build)

We reuse the Leads patterns we already built: the **composer drawer**, **inline EditableRow**,
**timeline**, **AI insights route**, **toasts**, `loading/error` boundaries — generalized so
Contacts/Accounts/Deals share them.

### Phase D1 — Deals + Pipeline (highest impact)
1. **Deal detail page** (`/deals/[id]`) — Leads-style 360°: summary + inline edit, stage bar,
   stage **history**, Conversations, Tasks, Notes, **Files**, **lost reason** block, AI deal-insights.
2. **Add/Edit deal** drawer everywhere (list rows + pipeline cards clickable). Extend `PUT /api/deals/:id`
   for full edit; write `audit_logs` + stage-history activity.
3. **Pipeline upgrades:**
   - Clickable cards → detail; **filters** (owner/project/value/date) + search.
   - **Weighted forecast** summary bar (Σ value×probability) + per-stage totals (have count/value).
   - **Rotten-deal** red highlight (deal untouched > N days via `last_activity_at`; add
     `rotting_days` to stages/pipeline).
   - **Lost-reason prompt** when a card is dropped on Closed-Lost.
   - **Multiple pipelines**: new `pipelines` table + `deal_stages.pipeline_id` + top switcher.
   - **List ↔ Kanban ↔ Forecast** toggle.
4. **DB:** `pipelines` table, `deal_stages.pipeline_id`, `deals.rotting_at` (or computed),
   optional `deal_products` line-items (CPQ-lite → auto deal value).

### Phase D2 — Contacts (Leads-grade record)
5. **Contact detail** upgraded to 360° with inline edit, Conversations, Activities timeline,
   Deals, **Related accounts (multi)**, Files, Notes/Tasks composers, **Freddy AI** (reuse route),
   convert/clone/merge actions, prev/next.
6. **Contact create/edit** drawer + `/api/contacts` (POST/PUT/DELETE) with audit + dedupe by phone.
7. **List**: saved views, filters (owner/city/type/tags), bulk (assign/tag/delete/export), search, table/board.
8. **DB:** `contact_accounts` join for multi-account; contact `lifecycle_stage`, `score`.

### Phase D3 — Accounts (company 360° + hierarchy)
9. **Account detail** 360°: related contacts, **deals with open/won totals**, **aggregated
   conversations** across related contacts, hierarchy tree, Files, Notes/Tasks, inline edit, timeline.
10. **Account create/edit** drawer + `/api/accounts` (CRUD).
11. **Account hierarchy**: `accounts.parent_account_id` + tree UI.
12. **List**: filters/bulk/search; industry/owner columns.

### Phase D4 — Shared polish
13. Extract reusable `RecordShell` (rail + header + composer) from lead-detail so all four modules
    share one premium record page.
14. Quota/targets module for the pipeline forecast view (real-estate monthly booking targets).

---

## PART D — Suggested build order & estimate
1. **D1 Deals+Pipeline** (biggest visible win; deal detail + rotten + forecast + multi-pipeline)
2. **D2 Contacts** (reuse lead-detail wholesale)
3. **D3 Accounts** (hierarchy + 360°)
4. **D4** shared refactor + quotas

Each phase is independently shippable and leaves the app building green.

---

### Sources
- Deals/pipeline (Kanban, drag-drop): https://www.freshworks.com/crm/features/deal-management/
- Weighted pipelines: https://support.freshsales.io/support/solutions/articles/239123-how-to-set-up-and-use-weighted-pipelines-in-freshsales-
- Rotten deals + multiple pipelines: https://support.freshsales.io/support/solutions/articles/228353-how-to-configure-multiple-deal-pipelines-
- Sales pipeline guide: https://www.freshworks.com/freshsales-crm/sales-pipeline/
- Accounts 360°: https://crmsupport.freshworks.com/support/solutions/articles/50000009864-how-to-get-a-360-degree-view-of-accounts-accounts-module-
- Account hierarchy: https://crmsupport.freshworks.com/support/solutions/articles/50000003702-how-to-associate-a-group-of-accounts-to-a-parent-account-
- Contact management: https://crmsupport.freshworks.com/support/solutions/articles/50000002373-how-to-add-and-use-contacts-
- Data model: https://support.freshsales.io/support/solutions/160485
