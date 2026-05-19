import * as XLSX from "xlsx";
import type { BudgetDataset } from "@/hooks/useBudgetData";
import * as staticData from "@/lib/budget-data";

/**
 * Parse an uploaded Excel file into a BudgetDataset.
 * 
 * Expected sheets:
 * - "Summary" or first sheet: rows with key-value pairs (Total Budget, Actual Spend, Forecast FY26, SAP No, etc.)
 * - "By Module": columns Module, Actual, Forecast
 * - "By Org": columns Org, Actual, Forecast
 * - "By Cost Type": columns Type, Actual, Forecast
 * - "Contractors": columns Contractor, Actual, Forecast
 * - "FTE": columns Country, CountryCode, OwnFTEs, ContractorFTEs
 * - "Line Items": columns Id, Module, Unit, CostType, Contractor, Title, Actual, Budget, Forecast
 * 
 * If a sheet is missing, static defaults are used.
 */
export function parseExcelBudget(buffer: ArrayBuffer): { dataset: BudgetDataset; warnings: string[] } {
  const wb = XLSX.read(buffer, { type: "array" });
  const warnings: string[] = [];
  const sheets = wb.SheetNames.map(n => n.toLowerCase());

  const findSheet = (names: string[]): XLSX.WorkSheet | null => {
    for (const name of names) {
      const idx = sheets.findIndex(s => s.includes(name));
      if (idx >= 0) return wb.Sheets[wb.SheetNames[idx]];
    }
    return null;
  };

  const toRows = (ws: XLSX.WorkSheet): Record<string, unknown>[] =>
    XLSX.utils.sheet_to_json(ws, { defval: "" });

  const num = (v: unknown): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const cleaned = v.replace(/[€$,\s]/g, "").replace(/\((.+)\)/, "-$1");
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  };

  const str = (v: unknown): string => (v != null ? String(v) : "");

  // Summary
  let summary = { ...staticData.budgetSummary };
  const summaryWs = findSheet(["summary", "overview"]) || wb.Sheets[wb.SheetNames[0]];
  if (summaryWs) {
    const rows = toRows(summaryWs);
    for (const row of rows) {
      const key = str(Object.values(row)[0]).toLowerCase();
      const val = Object.values(row)[1];
      if (key.includes("total budget")) summary.totalBudget = num(val);
      else if (key.includes("actual")) summary.actualSpend = num(val);
      else if (key.includes("forecast")) summary.forecastFY26 = num(val);
      else if (key.includes("sap")) summary.sapNo = str(val);
      else if (key.includes("funding")) summary.fundingSource = str(val);
      else if (key.includes("customer")) summary.customer = str(val);
    }
  }

  // By Module
  let byModule = [...staticData.byModule];
  const moduleWs = findSheet(["module"]);
  if (moduleWs) {
    const rows = toRows(moduleWs);
    if (rows.length > 0) {
      byModule = rows.map(r => {
        const vals = Object.values(r);
        return { module: str(vals[0]), actual: num(vals[1]), forecast: num(vals[2]) };
      });
    }
  } else {
    warnings.push("'By Module' sheet not found — using static data");
  }

  // By Org
  let byOrg = [...staticData.byOrg];
  const orgWs = findSheet(["org"]);
  if (orgWs) {
    const rows = toRows(orgWs);
    if (rows.length > 0) {
      byOrg = rows.map(r => {
        const vals = Object.values(r);
        return { org: str(vals[0]), actual: num(vals[1]), forecast: num(vals[2]) };
      });
    }
  } else {
    warnings.push("'By Org' sheet not found — using static data");
  }

  // By Cost Type
  let byCostType = [...staticData.byCostType];
  const costWs = findSheet(["cost type", "costtype", "cost"]);
  if (costWs) {
    const rows = toRows(costWs);
    if (rows.length > 0) {
      byCostType = rows.map(r => {
        const vals = Object.values(r);
        return { type: str(vals[0]), actual: num(vals[1]), forecast: num(vals[2]) };
      });
    }
  } else {
    warnings.push("'By Cost Type' sheet not found — using static data");
  }

  // Contractors
  let byContractor = [...staticData.byContractor];
  const contWs = findSheet(["contractor"]);
  if (contWs) {
    const rows = toRows(contWs);
    if (rows.length > 0) {
      byContractor = rows.map(r => {
        const vals = Object.values(r);
        return { contractor: str(vals[0]), actual: num(vals[1]), forecast: num(vals[2]) };
      });
    }
  } else {
    warnings.push("'Contractors' sheet not found — using static data");
  }

  // FTE
  let fteBreakdown = [...staticData.fteBreakdown];
  let fteTotals = { ...staticData.fteTotals };
  const fteWs = findSheet(["fte", "headcount", "people"]);
  if (fteWs) {
    const rows = toRows(fteWs);
    if (rows.length > 0) {
      fteBreakdown = rows.map(r => {
        const vals = Object.values(r);
        return {
          country: str(vals[0]),
          countryCode: str(vals[1]),
          ownFTEs: num(vals[2]),
          contractorFTEs: num(vals[3]),
        };
      });
      const ownTotal = fteBreakdown.reduce((s, f) => s + f.ownFTEs, 0);
      const contractorTotal = fteBreakdown.reduce((s, f) => s + f.contractorFTEs, 0);
      fteTotals = { ownTotal, contractorTotal, grandTotal: ownTotal + contractorTotal };
    }
  } else {
    warnings.push("'FTE' sheet not found — using static data");
  }

  // Spending timeline
  const spendingTimeline = { ...staticData.spendingTimeline };

  // Quarterly breakdown from "OSES Financial overview" tab.
  // Looks for the row whose column B contains "OSES Total cost" and reads:
  //   col H (8) = FC Q3 QTD, col I (9) = FC Q4 QTD
  //   col M (13) = Q1 QTD actual, N (14) = Q2 QTD, O (15) = Q3 QTD, P (16) = Q4 QTD
  let byQuarter = [...staticData.byQuarter];
  const finOvWs = findSheet(["oses financial overview", "financial overview"]);
  if (finOvWs) {
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(finOvWs, { header: 1, defval: null });
    const totalRow = aoa.find(
      (r) => typeof r?.[1] === "string" && /oses total cost/i.test(r[1] as string),
    );
    if (totalRow) {
      const fcQ3 = num(totalRow[7]);
      const fcQ4 = num(totalRow[8]);
      const q1 = num(totalRow[12]);
      const q2 = num(totalRow[13]);
      const q3 = num(totalRow[14]);
      const q4 = num(totalRow[15]);
      const perQ = (staticData.budgetSummary.totalBudget || 40_000_000) / 4;
      byQuarter = [
        { quarter: "Q1", label: "Q1 FY26 (Oct–Dec ’25)", actual: q1, forecast: q1,         budget: perQ, status: "closed"  },
        { quarter: "Q2", label: "Q2 FY26 (Jan–Mar ’26)", actual: q2, forecast: q2,         budget: perQ, status: "closed"  },
        { quarter: "Q3", label: "Q3 FY26 (Apr–Jun ’26)", actual: q3, forecast: fcQ3 || q3, budget: perQ, status: "current" },
        { quarter: "Q4", label: "Q4 FY26 (Jul–Sep ’26)", actual: q4, forecast: fcQ4 || q4, budget: perQ, status: "forecast"},
      ];
    } else {
      warnings.push("'OSES Total cost' row not found in 'OSES Financial overview' — using static quarterly data");
    }
  } else {
    warnings.push("'OSES Financial overview' sheet not found — using static quarterly data");
  }


  // Line Items
  let lineItems = [...staticData.lineItems];
  const lineWs = findSheet(["line item", "lineitem", "detail"]);
  if (lineWs) {
    const rows = toRows(lineWs);
    if (rows.length > 0) {
      lineItems = rows.map(r => {
        const vals = Object.values(r);
        return {
          id: str(vals[0]),
          module: str(vals[1]),
          unit: str(vals[2]),
          costType: str(vals[3]),
          contractor: str(vals[4]),
          title: str(vals[5]),
          actual: num(vals[6]),
          budget: num(vals[7]),
          forecast: num(vals[8]),
        };
      });
    }
  } else {
    warnings.push("'Line Items' sheet not found — using static data");
  }

  return {
    dataset: { summary, byModule, byOrg, byCostType, byContractor, byQuarter: staticData.byQuarter, fteBreakdown, fteTotals, spendingTimeline, lineItems },
    warnings,
  };
}
