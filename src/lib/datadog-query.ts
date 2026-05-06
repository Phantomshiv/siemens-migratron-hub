import type { DDWidget } from "@/hooks/useDatadogDashboard";

export type TemplateVars = Record<string, string>;

/**
 * Substitute Datadog template variables ($name) in a query string.
 * - `*` (wildcard) means "no filter" — strip the placeholder and clean up commas.
 * - Otherwise replace `$name` with `name:value`.
 */
export function substituteTemplateVars(query: string, vars: TemplateVars): string {
  if (!query) return query;
  let out = query;
  for (const [name, value] of Object.entries(vars)) {
    const re = new RegExp(`\\$${name}\\b`, "g");
    if (!value || value === "*") {
      out = out.replace(re, "");
    } else if (value.includes(":")) {
      out = out.replace(re, value);
    } else {
      out = out.replace(re, `${name}:${value}`);
    }
  }
  // Clean up `{,foo}`, `{foo,}`, `{,}`, repeated commas, and stray spaces from removed vars.
  out = out
    .replace(/,\s*,/g, ",")
    .replace(/\{\s*,/g, "{")
    .replace(/,\s*\}/g, "}")
    .replace(/\{\s*\}/g, "{*}");
  return out;
}

/** Map a single dashboard query into a v2 API query, by data source. */
export function mapQuery(q: any, vars: TemplateVars) {
  const ds = q?.data_source;
  const base: any = { data_source: ds, name: q?.name ?? "query1" };

  if (ds === "metrics") {
    // Metrics data source: a single `query` string in DDQL.
    base.query = substituteTemplateVars(q?.query ?? "", vars);
    if (q?.aggregator) base.aggregator = q.aggregator;
    return base;
  }

  // Logs / RUM / events / incident_analytics / spans / ci_pipelines etc.
  base.search = { query: substituteTemplateVars(q?.search?.query ?? "", vars) };
  base.group_by = q?.group_by ?? [];
  if (q?.compute) base.compute = q.compute;
  if (q?.indexes) base.indexes = q.indexes;
  if (q?.metric) base.metric = q.metric;
  if (q?.aggregator) base.aggregator = q.aggregator;
  return base;
}

export function mapFormulas(r: any, queries: any[]) {
  const fs = r?.formulas;
  if (Array.isArray(fs) && fs.length > 0) {
    return fs.map((f: any) => ({ formula: f.formula, alias: f.alias, limit: f.limit }));
  }
  return [{ formula: queries[0]?.name ?? "query1" }];
}

/** Build a scalar v2 request payload from a widget request, with template vars. */
export function buildScalarPayload(
  widget: DDWidget,
  vars: TemplateVars,
  fromTs: number,
  toTs: number
) {
  const r = widget.definition?.requests?.[0];
  if (!r) return null;
  const queries = (r.queries ?? []).map((q: any) => mapQuery(q, vars));
  const formulas = mapFormulas(r, queries);
  return {
    data: {
      attributes: { formulas, queries, from: fromTs, to: toTs },
      type: "scalar_request",
    },
  };
}

/** Build a timeseries v2 request payload. */
export function buildTimeseriesPayload(
  widget: DDWidget,
  vars: TemplateVars,
  fromTs: number,
  toTs: number
) {
  const r = widget.definition?.requests?.[0];
  if (!r) return null;
  const queries = (r.queries ?? []).map((q: any) => mapQuery(q, vars));
  const formulas = mapFormulas(r, queries);
  const intervalMs = Math.max(60_000, Math.floor((toTs - fromTs) / 80));
  return {
    data: {
      attributes: { formulas, queries, from: fromTs, to: toTs, interval: intervalMs },
      type: "timeseries_request",
    },
  };
}
