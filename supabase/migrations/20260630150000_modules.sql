-- =============================================================================
-- Contacts / Accounts / Deals / Pipeline — Freshsales-grade modules
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Pipelines (multiple deal pipelines, each with its own stages + rotting days)
-- ---------------------------------------------------------------------------
create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  rotting_days int not null default 30,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.pipelines (id, name, sort_order, rotting_days, is_default) values
  ('f1111111-0000-0000-0000-000000000001','Residential Sales',0,30,true),
  ('f1111111-0000-0000-0000-000000000002','Commercial Sales',1,45,false)
on conflict (id) do nothing;

-- Stages belong to a pipeline; allow same stage name across pipelines.
alter table public.deal_stages add column if not exists pipeline_id uuid references public.pipelines(id) on delete cascade;
update public.deal_stages set pipeline_id = 'f1111111-0000-0000-0000-000000000001' where pipeline_id is null;
alter table public.deal_stages drop constraint if exists deal_stages_name_key;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'deal_stages_pipeline_name_key') then
    alter table public.deal_stages add constraint deal_stages_pipeline_name_key unique (pipeline_id, name);
  end if;
end $$;

-- Commercial pipeline stages
insert into public.deal_stages (name, sort_order, probability, color, is_won, is_lost, pipeline_id) values
  ('new_opportunity',0,10,'#3463ff',false,false,'f1111111-0000-0000-0000-000000000002'),
  ('requirement_discussion',1,25,'#6366f1',false,false,'f1111111-0000-0000-0000-000000000002'),
  ('negotiation',2,60,'#f97316',false,false,'f1111111-0000-0000-0000-000000000002'),
  ('agreement_pending',3,90,'#0ea5e9',false,false,'f1111111-0000-0000-0000-000000000002'),
  ('closed_won',4,100,'#16a34a',true,false,'f1111111-0000-0000-0000-000000000002'),
  ('closed_lost',5,0,'#ef4444',false,true,'f1111111-0000-0000-0000-000000000002')
on conflict do nothing;

-- Deal → pipeline (derived from its stage; kept on the row for fast filtering)
alter table public.deals add column if not exists pipeline_id uuid references public.pipelines(id);
update public.deals d set pipeline_id = s.pipeline_id from public.deal_stages s where d.stage_id = s.id and d.pipeline_id is null;
update public.deals set pipeline_id = 'f1111111-0000-0000-0000-000000000001' where pipeline_id is null;

-- ---------------------------------------------------------------------------
-- Deal products / line items (CPQ-lite → auto deal value)
-- ---------------------------------------------------------------------------
create table if not exists public.deal_products (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  name text not null,
  unit_type text,
  price numeric not null default 0,
  quantity int not null default 1,
  discount numeric not null default 0,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists deal_products_deal_idx on public.deal_products(deal_id);

-- ---------------------------------------------------------------------------
-- Contacts: lifecycle + score; multi-account association
-- ---------------------------------------------------------------------------
alter table public.contacts add column if not exists lifecycle_stage text not null default 'lead';
alter table public.contacts add column if not exists score int not null default 0;
alter table public.contacts add column if not exists job_title text;

create table if not exists public.contact_accounts (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (contact_id, account_id)
);

-- Backfill the join from the existing single account_id
insert into public.contact_accounts (contact_id, account_id, is_primary)
select id, account_id, true from public.contacts where account_id is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Accounts: hierarchy + website
-- ---------------------------------------------------------------------------
alter table public.accounts add column if not exists parent_account_id uuid references public.accounts(id) on delete set null;
alter table public.accounts add column if not exists website text;

-- ---------------------------------------------------------------------------
-- RLS for the new tables (grants auto-inherited via default privileges)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['pipelines','deal_products','contact_accounts'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy "auth read %1$s" on public.%1$s for select to authenticated using (true);', t);
    execute format('create policy "auth write %1$s" on public.%1$s for insert to authenticated with check (true);', t);
    execute format('create policy "auth update %1$s" on public.%1$s for update to authenticated using (true) with check (true);', t);
    execute format('create policy "auth delete %1$s" on public.%1$s for delete to authenticated using (true);', t);
  end loop;
end $$;
