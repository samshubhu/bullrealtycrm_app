-- =============================================================================
-- BullSales Suite — initial schema
-- Real-estate CRM (Freshsales-style). Postgres / Supabase.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ---------------------------------------------------------------------------
-- Teams & profiles
-- ---------------------------------------------------------------------------
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  manager_id  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  full_name            text not null default '',
  email                text not null,
  phone                text,
  role                 text not null default 'sales_executive'
                       check (role in ('super_admin','admin','sales_manager','sales_executive','telecaller','marketing','support','accounts')),
  team_id              uuid references public.teams(id) on delete set null,
  reporting_manager_id uuid references public.profiles(id) on delete set null,
  status               text not null default 'active' check (status in ('active','inactive')),
  avatar_url           text,
  did_number           text,
  whatsapp_enabled     boolean not null default true,
  calling_enabled      boolean not null default true,
  last_login_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.teams
  add constraint teams_manager_fk foreign key (manager_id) references public.profiles(id) on delete set null;

-- Role helpers (defined after profiles so the SQL bodies validate).
create or replace function public.auth_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in ('super_admin','admin','sales_manager'), false);
$$;

-- Auto-create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'sales_executive')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Configuration tables (lead sources, statuses, stages, dispositions)
-- ---------------------------------------------------------------------------
create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lead_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  color text not null default '#64748b',
  is_won boolean not null default false,
  is_lost boolean not null default false
);

create table public.deal_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  probability int not null default 0,
  color text not null default '#3463ff',
  is_won boolean not null default false,
  is_lost boolean not null default false
);

create table public.call_dispositions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Real-estate projects / properties
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  developer text,
  location text,
  city text,
  property_type text default 'residential',
  price_min numeric,
  price_max numeric,
  unit_types text[] default '{}',
  possession_date date,
  rera_number text,
  brochure_url text,
  website_url text,
  status text not null default 'active' check (status in ('active','upcoming','sold_out','on_hold')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Accounts & contacts
-- ---------------------------------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  contact_person text,
  phone text,
  email text,
  address text,
  city text,
  industry text,
  owner_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  account_id uuid references public.accounts(id) on delete set null,
  location text,
  city text,
  contact_type text default 'buyer'
    check (contact_type in ('buyer','investor','tenant','channel_partner','broker','vendor','existing_customer')),
  owner_id uuid references public.profiles(id) on delete set null,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Campaigns
-- ---------------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null default 'meta',
  start_date date,
  end_date date,
  budget numeric default 0,
  spend numeric default 0,
  leads_generated int default 0,
  project_id uuid references public.projects(id) on delete set null,
  status text not null default 'active' check (status in ('active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  alt_phone text,
  email text,
  project_id uuid references public.projects(id) on delete set null,
  budget numeric,
  location text,
  city text,
  source_id uuid references public.lead_sources(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  status text not null default 'new',
  priority text not null default 'warm' check (priority in ('hot','warm','cold')),
  score int not null default 0,
  owner_id uuid references public.profiles(id) on delete set null,
  manager_id uuid references public.profiles(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  follow_up_at timestamptz,
  last_call_status text,
  last_whatsapp_status text,
  last_activity_at timestamptz default now(),
  notes text,
  tags text[] default '{}',
  is_duplicate boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_owner_idx on public.leads(owner_id);
create index leads_status_idx on public.leads(status);
create index leads_phone_idx on public.leads(phone);
create index leads_follow_up_idx on public.leads(follow_up_at);

-- ---------------------------------------------------------------------------
-- Deals
-- ---------------------------------------------------------------------------
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lead_id uuid references public.leads(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  value numeric not null default 0,
  expected_close_date date,
  probability int not null default 0,
  stage_id uuid references public.deal_stages(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  source_id uuid references public.lead_sources(id) on delete set null,
  lost_reason text,
  notes text,
  last_activity_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index deals_stage_idx on public.deals(stage_id);
create index deals_owner_idx on public.deals(owner_id);

-- ---------------------------------------------------------------------------
-- Tasks & site visits
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null default 'call' ,
  lead_id uuid references public.leads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  assignee_id uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'pending' check (status in ('pending','in_progress','completed','overdue','cancelled')),
  reminder_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_assignee_idx on public.tasks(assignee_id);
create index tasks_due_idx on public.tasks(due_at);

create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz,
  completed_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Communications: calls, whatsapp, emails, templates
-- ---------------------------------------------------------------------------
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  phone text,
  user_id uuid references public.profiles(id) on delete set null,
  direction text not null default 'outgoing' check (direction in ('incoming','outgoing')),
  status text not null default 'connected',
  disposition text,
  duration_seconds int default 0,
  recording_url text,
  notes text,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index calls_lead_idx on public.calls(lead_id);

create table public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default 'general',
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  direction text not null default 'outgoing' check (direction in ('incoming','outgoing')),
  body text,
  template_id uuid references public.whatsapp_templates(id) on delete set null,
  status text not null default 'sent' check (status in ('sent','delivered','read','failed','replied')),
  wa_message_id text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index wa_lead_idx on public.whatsapp_messages(lead_id);

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.emails (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  direction text not null default 'outgoing' check (direction in ('incoming','outgoing')),
  subject text,
  body text,
  template_id uuid references public.email_templates(id) on delete set null,
  status text not null default 'sent' check (status in ('sent','delivered','opened','failed','replied')),
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notes, attachments, activities (timeline), notifications
-- ---------------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  lead_id uuid references public.leads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  related_type text,
  related_id uuid,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  description text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  lead_id uuid references public.leads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  meta jsonb default '{}',
  created_at timestamptz not null default now()
);
create index activities_lead_idx on public.activities(lead_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Automation, API keys, webhooks, audit, imports
-- ---------------------------------------------------------------------------
create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger text not null,
  conditions jsonb default '[]',
  actions jsonb default '[]',
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.automation_rules(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  status text not null default 'success',
  detail text,
  created_at timestamptz not null default now()
);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prefix text not null,
  key_hash text not null,
  permissions text[] default '{read}',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  payload jsonb default '{}',
  status text not null default 'received',
  response text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create table public.import_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  file_name text,
  total int default 0,
  success int default 0,
  failed int default 0,
  errors jsonb default '[]',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'teams','profiles','projects','accounts','contacts','campaigns','leads',
    'deals','tasks','site_visits','automation_rules'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Baseline: any authenticated staff member can read/write CRM data.
-- Owner/role refinement is layered in the app and can be tightened here.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'teams','profiles','lead_sources','lead_statuses','deal_stages','call_dispositions',
    'projects','accounts','contacts','campaigns','leads','deals','tasks','site_visits',
    'calls','whatsapp_templates','whatsapp_messages','email_templates','emails','notes',
    'attachments','activities','notifications','automation_rules','automation_logs',
    'api_keys','webhook_logs','audit_logs','import_logs'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy "auth read %1$s" on public.%1$s for select to authenticated using (true);', t);
    execute format(
      'create policy "auth write %1$s" on public.%1$s for insert to authenticated with check (true);', t);
    execute format(
      'create policy "auth update %1$s" on public.%1$s for update to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Deletes restricted to managers/admins on core entities.
create policy "mgr delete leads" on public.leads for delete to authenticated using (public.is_manager());
create policy "mgr delete deals" on public.deals for delete to authenticated using (public.is_manager());
create policy "mgr delete contacts" on public.contacts for delete to authenticated using (public.is_manager());
create policy "mgr delete accounts" on public.accounts for delete to authenticated using (public.is_manager());

-- Notifications: users only see their own.
drop policy if exists "auth read notifications" on public.notifications;
create policy "own notifications" on public.notifications for select to authenticated
  using (user_id = auth.uid() or public.is_manager());

-- ---------------------------------------------------------------------------
-- Table-level grants. RLS still governs the `authenticated` role row-by-row;
-- `service_role` bypasses RLS (used by webhooks / lead capture).
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
