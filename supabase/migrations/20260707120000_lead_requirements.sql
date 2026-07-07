-- Structured buyer-requirement fields for leads.
-- Powers the "Requirement" block on the redesigned lead detail page and the
-- inventory-matching engine (src/lib/matching.ts). All columns are nullable so
-- existing rows are unaffected; PUT /api/leads/[id] already persists arbitrary
-- lead columns, so no API change is needed.

alter table public.leads
  add column if not exists property_type       text,
  add column if not exists configurations      text[] default '{}',
  add column if not exists budget_min           numeric,
  add column if not exists budget_max           numeric,
  add column if not exists possession_pref      text,
  add column if not exists purchase_purpose     text,
  add column if not exists preferred_localities text[] default '{}';

comment on column public.leads.property_type is 'Desired property type token (apartment, villa, plot, commercial_office, ...)';
comment on column public.leads.configurations is 'Desired unit configurations, e.g. {2bhk,3bhk}; matched against projects.unit_types';
comment on column public.leads.budget_min is 'Lower bound of buyer budget (₹) for inventory matching';
comment on column public.leads.budget_max is 'Upper bound of buyer budget (₹) for inventory matching';
comment on column public.leads.possession_pref is 'Possession timeline preference (ready_to_move, within_1yr, 1_3yr, 3plus)';
comment on column public.leads.purchase_purpose is 'Purchase intent (end_use | investment)';
comment on column public.leads.preferred_localities is 'Preferred localities/areas; matched against projects.city/location';

-- Seed a couple of existing leads with requirement data so the matching widget
-- has something to show in local/dev environments (no-op if leads absent).
update public.leads
set budget_min = coalesce(budget_min, case when budget is not null then round(budget * 0.85) else null end),
    budget_max = coalesce(budget_max, budget),
    configurations = case when coalesce(array_length(configurations, 1), 0) = 0 then array['2bhk','3bhk'] else configurations end,
    property_type = coalesce(property_type, 'apartment'),
    purchase_purpose = coalesce(purchase_purpose, 'end_use')
where budget is not null;
