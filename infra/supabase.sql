-- Agent WorkBench Database Schema
-- Run this in your Supabase SQL editor

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  repo_url text,
  created_at timestamptz default now()
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  label text,
  status text check (status in ('queued','running','success','error')) default 'queued',
  started_at timestamptz default now(),
  finished_at timestamptz,
  meta jsonb default '{}'::jsonb
);

create table if not exists logs (
  id bigserial primary key,
  run_id uuid references runs(id) on delete cascade,
  level text default 'info',
  ts timestamptz default now(),
  source text,
  message text,
  data jsonb
);

create table if not exists graph_nodes (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  type text,
  label text,
  state jsonb,
  pos jsonb
);

create table if not exists graph_edges (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  from_id uuid references graph_nodes(id) on delete cascade,
  to_id uuid references graph_nodes(id) on delete cascade,
  label text,
  state jsonb
);

create table if not exists costs (
  id bigserial primary key,
  run_id uuid references runs(id) on delete cascade,
  provider text,
  input_tokens bigint default 0,
  output_tokens bigint default 0,
  usd numeric(10,4) default 0,
  ts timestamptz default now()
);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  node_id uuid references graph_nodes(id) on delete cascade,
  kind text,
  url text,
  blob bytea,
  meta jsonb,
  created_at timestamptz default now()
);
