-- Diário de Saúde — esquema inicial
-- Local: aplicado automaticamente por `npm run db:start`. Nuvem: SQL Editor → cole este arquivo → Run (ou `npx supabase db push`).
-- Cada tabela tem Row Level Security: cada usuário só lê e escreve as próprias linhas.

create extension if not exists pgcrypto;

-- Perfil (1 linha por usuário)
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  birth_date   date,
  height_cm    numeric(5,1),
  notes        text,
  -- Consentimento LGPD para tratamento de dados de saúde (art. 11)
  consent_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Remédios (ativos e suspensos, com histórico de motivo)
create table if not exists public.medications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  dose        text check (char_length(dose) <= 60),
  schedule    text check (char_length(schedule) <= 120),
  active      boolean not null default true,
  started_on  date,
  stopped_on  date,
  notes       text check (char_length(notes) <= 2000),
  created_at  timestamptz not null default now()
);

-- Medidas de pressão / frequência / sintomas
create table if not exists public.readings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  measured_at timestamptz not null default now(),
  systolic    smallint not null check (systolic between 50 and 300),
  diastolic   smallint not null check (diastolic between 30 and 200),
  heart_rate  smallint check (heart_rate between 20 and 250),
  position    text check (position in ('sentado','em_pe','deitado')),
  weight_kg   numeric(5,1) check (weight_kg between 20 and 400),
  dizziness   smallint check (dizziness between 0 and 10),
  notes       text check (char_length(notes) <= 1000),
  created_at  timestamptz not null default now()
);
create index if not exists readings_user_time on public.readings (user_id, measured_at desc);

-- Resultados de exames (um valor por linha)
create table if not exists public.lab_results (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  collected_on date not null,
  test_name   text not null check (char_length(test_name) between 1 and 120),
  value_text  text not null check (char_length(value_text) <= 40),
  value_num   numeric,
  unit        text check (char_length(unit) <= 30),
  reference   text check (char_length(reference) <= 80),
  flag        text not null default 'normal' check (flag in ('normal','alto','baixo')),
  lab_name    text check (char_length(lab_name) <= 120),
  notes       text check (char_length(notes) <= 1000),
  created_at  timestamptz not null default now()
);
create index if not exists lab_user_test on public.lab_results (user_id, test_name, collected_on desc);

-- Linha do tempo: trocas de remédio, sintomas, consultas
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  happened_on date not null,
  approximate boolean not null default false,
  kind        text not null default 'nota' check (kind in ('remedio','sintoma','consulta','nota')),
  description text not null check (char_length(description) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index if not exists events_user_date on public.events (user_id, happened_on desc);

-- Pendências (exames a fazer, perguntas ao médico)
create table if not exists public.todos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 300),
  done        boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- Row Level Security: dono acessa só o que é seu
do $$
declare t text;
begin
  foreach t in array array['medications','readings','lab_results','events','todos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Cria o perfil automaticamente no cadastro
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
