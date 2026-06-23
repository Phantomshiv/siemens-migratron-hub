
-- budget_uploads: restrict to authenticated users
DROP POLICY IF EXISTS "Allow public insert" ON public.budget_uploads;
DROP POLICY IF EXISTS "Allow public read" ON public.budget_uploads;
DROP POLICY IF EXISTS "Allow public update" ON public.budget_uploads;

REVOKE ALL ON public.budget_uploads FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.budget_uploads TO authenticated;
GRANT ALL ON public.budget_uploads TO service_role;

CREATE POLICY "Authenticated users can read budget uploads"
  ON public.budget_uploads FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert budget uploads"
  ON public.budget_uploads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budget uploads"
  ON public.budget_uploads FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- weekly_snapshots: restrict to authenticated users
DROP POLICY IF EXISTS "Allow public insert snapshots" ON public.weekly_snapshots;
DROP POLICY IF EXISTS "Allow public read snapshots" ON public.weekly_snapshots;
DROP POLICY IF EXISTS "Allow public update snapshots" ON public.weekly_snapshots;

REVOKE ALL ON public.weekly_snapshots FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.weekly_snapshots TO authenticated;
GRANT ALL ON public.weekly_snapshots TO service_role;

CREATE POLICY "Authenticated users can read snapshots"
  ON public.weekly_snapshots FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert snapshots"
  ON public.weekly_snapshots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update snapshots"
  ON public.weekly_snapshots FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
