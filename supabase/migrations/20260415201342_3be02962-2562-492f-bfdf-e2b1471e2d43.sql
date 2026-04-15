
CREATE TABLE public.weekly_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  title TEXT NOT NULL,
  executive_summary TEXT,
  full_digest TEXT,
  raw_data JSONB,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed'))
);

ALTER TABLE public.weekly_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read snapshots" ON public.weekly_snapshots
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert snapshots" ON public.weekly_snapshots
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public update snapshots" ON public.weekly_snapshots
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
