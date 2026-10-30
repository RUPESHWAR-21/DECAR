-- OBD-II Problem Detector: run once in Supabase > SQL Editor.

create table if not exists public.predictions (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  source           text not null check (source in ('manual', 'live')),
  make             text,
  model            text,
  model_year       int,
  fuel_type        text,
  dtc_codes        text[] not null default '{}',
  prediction       text not null,
  prediction_class smallint not null,
  probability      double precision not null,
  driving_mode     text,
  readings         jsonb not null
);

create index if not exists predictions_created_at_idx on public.predictions (created_at desc);
create index if not exists predictions_source_idx on public.predictions (source);

-- The backend talks to Supabase with the anon key, so anon needs read + insert.
grant select, insert on public.predictions to anon;
alter table public.predictions enable row level security;

drop policy if exists "anon read predictions" on public.predictions;
create policy "anon read predictions" on public.predictions
  for select to anon using (true);

drop policy if exists "anon insert predictions" on public.predictions;
create policy "anon insert predictions" on public.predictions
  for insert to anon with check (true);

-- Make the API see the new table immediately.
notify pgrst, 'reload schema';
