-- =============================================================================
-- Lead lifecycle for real-estate CRM conversion workflow
-- =============================================================================

alter table public.leads add column if not exists pipeline_status text not null default 'contacted';
alter table public.leads add column if not exists customer_type text not null default 'individual'
  check (customer_type in ('individual','company','channel_partner','referral'));
alter table public.leads add column if not exists company_name text;
alter table public.leads add column if not exists company_designation text;
alter table public.leads add column if not exists channel_partner_name text;
alter table public.leads add column if not exists channel_partner_phone text;
alter table public.leads add column if not exists channel_partner_email text;
alter table public.leads add column if not exists referral_name text;
alter table public.leads add column if not exists referral_phone text;
alter table public.leads add column if not exists referral_email text;
alter table public.leads add column if not exists account_id uuid references public.accounts(id) on delete set null;
alter table public.leads add column if not exists deal_id uuid references public.deals(id) on delete set null;
alter table public.leads add column if not exists converted_at timestamptz;

create index if not exists leads_pipeline_status_idx on public.leads(pipeline_status);
create index if not exists leads_customer_type_idx on public.leads(customer_type);

insert into public.lead_statuses (name, sort_order, color, is_won, is_lost) values
  ('new', 0, '#3463ff', false, false),
  ('cold', 1, '#0ea5e9', false, false),
  ('warm', 2, '#f59e0b', false, false),
  ('interested', 3, '#10b981', false, false),
  ('not_interested', 4, '#64748b', false, true),
  ('junk_trash', 5, '#71717a', false, true),
  ('converted', 6, '#16a34a', true, false)
on conflict (name) do update set
  sort_order = excluded.sort_order,
  color = excluded.color,
  is_won = excluded.is_won,
  is_lost = excluded.is_lost;

insert into public.deal_stages (name, sort_order, probability, color, is_won, is_lost, pipeline_id) values
  ('contacted', 0, 10, '#3463ff', false, false, 'f1111111-0000-0000-0000-000000000001'),
  ('site_visit_pending', 1, 20, '#8b5cf6', false, false, 'f1111111-0000-0000-0000-000000000001'),
  ('site_visit_done', 2, 35, '#14b8a6', false, false, 'f1111111-0000-0000-0000-000000000001'),
  ('obm_pending', 3, 45, '#6366f1', false, false, 'f1111111-0000-0000-0000-000000000001'),
  ('obm_done', 4, 55, '#4f46e5', false, false, 'f1111111-0000-0000-0000-000000000001'),
  ('re_site_visit', 5, 60, '#0f766e', false, false, 'f1111111-0000-0000-0000-000000000001'),
  ('re_obm_visit', 6, 65, '#0891b2', false, false, 'f1111111-0000-0000-0000-000000000001'),
  ('proposal', 7, 75, '#f59e0b', false, false, 'f1111111-0000-0000-0000-000000000001'),
  ('negotiation', 8, 85, '#f97316', false, false, 'f1111111-0000-0000-0000-000000000001'),
  ('booking_expected', 9, 95, '#22c55e', false, false, 'f1111111-0000-0000-0000-000000000001'),
  ('closed_won', 10, 100, '#16a34a', true, false, 'f1111111-0000-0000-0000-000000000001'),
  ('closed_lost', 11, 0, '#ef4444', false, true, 'f1111111-0000-0000-0000-000000000001')
on conflict do nothing;
