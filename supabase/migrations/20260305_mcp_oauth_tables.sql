-- MCP OAuth tables for remote MCP server
-- Run via Supabase SQL editor with service role

-- Dynamic client registration (Claude registers itself)
create table if not exists mcp_oauth_clients (
  client_id text primary key default gen_random_uuid()::text,
  client_secret text not null default gen_random_uuid()::text,
  redirect_uris text[] not null default '{}',
  client_name text,
  created_at timestamptz not null default now()
);

-- OAuth tokens — maps our access tokens to Supabase sessions
create table if not exists mcp_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references mcp_oauth_clients(client_id) on delete cascade,
  access_token text unique,
  refresh_token text unique,
  auth_code text unique,
  code_challenge text,
  redirect_uri text,
  state text,
  supabase_access_token text,
  supabase_refresh_token text,
  user_email text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_mcp_tokens_access on mcp_oauth_tokens(access_token) where access_token is not null;
create index if not exists idx_mcp_tokens_auth_code on mcp_oauth_tokens(auth_code) where auth_code is not null;
create index if not exists idx_mcp_tokens_refresh on mcp_oauth_tokens(refresh_token) where refresh_token is not null;
