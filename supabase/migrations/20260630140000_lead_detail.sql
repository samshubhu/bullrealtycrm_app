-- =============================================================================
-- Lead detail panel — supporting schema (Freshsales-style record page)
-- =============================================================================

-- Lead: lifecycle stage + job title (referenced by the record header)
alter table public.leads add column if not exists job_title text;
alter table public.leads add column if not exists lifecycle_stage text not null default 'lead';

-- Tasks gain real meeting + outcome fields (meetings reuse the tasks table)
alter table public.tasks add column if not exists start_at timestamptz;
alter table public.tasks add column if not exists end_at timestamptz;
alter table public.tasks add column if not exists location text;
alter table public.tasks add column if not exists video_link text;
alter table public.tasks add column if not exists outcome text;
alter table public.tasks add column if not exists attendees text[] default '{}';

-- Storage bucket for lead files / documents
insert into storage.buckets (id, name, public)
values ('lead-files', 'lead-files', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'lead-files read') then
    create policy "lead-files read" on storage.objects for select to authenticated using (bucket_id = 'lead-files');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'lead-files upload') then
    create policy "lead-files upload" on storage.objects for insert to authenticated with check (bucket_id = 'lead-files');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'lead-files delete') then
    create policy "lead-files delete" on storage.objects for delete to authenticated using (bucket_id = 'lead-files');
  end if;
end $$;
