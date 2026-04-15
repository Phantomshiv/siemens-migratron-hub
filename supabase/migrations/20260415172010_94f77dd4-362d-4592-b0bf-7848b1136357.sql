CREATE TABLE public.budget_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  filename text NOT NULL,
  data jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.budget_uploads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/insert (internal dashboard, no auth)
CREATE POLICY "Allow public read" ON public.budget_uploads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert" ON public.budget_uploads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.budget_uploads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);