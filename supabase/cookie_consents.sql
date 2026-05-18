-- Cookie consent audit table for Latwo
-- Run in Supabase SQL Editor

create table if not exists public.cookie_consents (
  id bigint generated always as identity primary key,
  consent_id text not null unique,
  consent_version text not null,
  consent_timestamp timestamptz not null,
  consent_source text,
  consent_locale text,
  consent_path text,
  consent_essential boolean not null default true,
  consent_analytics boolean not null default false,
  consent_marketing boolean not null default false,
  ip_hash text not null,
  user_agent text,
  user_agent_hash text not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_cookie_consents_logged_at
  on public.cookie_consents (logged_at desc);

create index if not exists idx_cookie_consents_consent_timestamp
  on public.cookie_consents (consent_timestamp desc);

alter table public.cookie_consents enable row level security;

-- No anon/authenticated policies on purpose.
-- Inserts are performed only by server using service role key.
