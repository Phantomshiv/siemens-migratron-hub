
CREATE TABLE public.api_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow edge functions to read/write via service role (no RLS needed for server-only table)
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- Index for cleanup
CREATE INDEX idx_api_cache_expires ON public.api_cache (expires_at);
