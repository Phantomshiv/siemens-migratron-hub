
ALTER TABLE public.weekly_snapshots
  ADD COLUMN cadence TEXT NOT NULL DEFAULT 'weekly' CHECK (cadence IN ('weekly', 'monthly')),
  ADD COLUMN key_metrics JSONB;
