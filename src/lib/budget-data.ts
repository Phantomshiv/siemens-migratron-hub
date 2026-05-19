// Budget data extracted from OSES Actuals & FC Status spreadsheet
// Source: 20260324_OSES_Actuals_FC_P06_1.xlsx · "overview" tab (P06)

export const budgetSummary = {
  totalBudget: 40_000_000,
  actualSpend: 16_031_074,
  forecastFY26: 40_704_955,
  sapNo: "ID-00J97",
  fundingSource: "CMC",
  probability: "100%",
  customer: "FT FDS TF",
  reportingPeriod: "P06",
};

export type ModuleBudget = {
  module: string;
  actual: number;
  forecast: number;
};

export const byModule: ModuleBudget[] = [
  { module: "Platform Development", actual: 12_044_748, forecast: 26_643_289 },
  { module: "Migration & Harmonization", actual: 2_914_493, forecast: 10_500_000 },
  { module: "Communication & Growth", actual: 565_778, forecast: 1_568_666 },
  { module: "ONE SRE Team", actual: 100_000, forecast: 1_200_000 },
  { module: "PMO Cost", actual: 509_090, forecast: 996_035 },
];

export type OrgBudget = {
  org: string;
  actual: number;
  forecast: number;
};

export const byOrg: OrgBudget[] = [
  { org: "FT FDS DES", actual: 12_205_554, forecast: 18_282_990 },
  { org: "IT APS", actual: 3_014_493, forecast: 11_900_000 },
  { org: "CYS", actual: 755_762, forecast: 8_925_000 },
  { org: "IT", actual: 0, forecast: 1_500_000 },
  { org: "FT ST", actual: 158_300, forecast: 300_000 },
];

export type CostTypeBudget = {
  type: string;
  actual: number;
  forecast: number;
};

export const byCostType: CostTypeBudget[] = [
  { type: "Labour Cost", actual: 9_647_340, forecast: 23_904_570 },
  { type: "Contractors", actual: 3_539_132, forecast: 7_762_207 },
  { type: "Licence", actual: 1_707_576, forecast: 7_806_667 },
  { type: "Infrastructure", actual: 40_061, forecast: 1_434_546 },
  { type: "Other", actual: 1_200_000, forecast: 0 },
];

export type ContractorBudget = {
  contractor: string;
  actual: number;
  forecast: number;
};

export const byContractor: ContractorBudget[] = [
  { contractor: "External (IT APS)", actual: 1_401_215, forecast: 2_802_430 },
  { contractor: "FT RPD", actual: 651_565, forecast: 1_764_233 },
  { contractor: "FT D India", actual: 568_367, forecast: 1_255_700 },
  { contractor: "FT UX", actual: 413_032, forecast: 988_756 },
  { contractor: "Evosoft gmbH / FT D", actual: 504_953, forecast: 951_088 },
];

// Kept for backward compat with any consumer that still imports it, but
// no longer rendered in the UI.
export type FTEBreakdown = {
  country: string;
  countryCode: string;
  ownFTEs: number;
  contractorFTEs: number;
};

export const fteBreakdown: FTEBreakdown[] = [];

export const fteTotals = {
  ownTotal: 0,
  contractorTotal: 0,
  grandTotal: 0,
};

export const spendingTimeline = {
  oneTime: { actual: 4_898_158, forecast: 16_500_753 },
  recurring: { actual: 11_235_951, forecast: 24_407_237 },
};

// Quarterly breakdown derived from periodic columns on the "overview"
// tab. Q1 = P01-P03 actual, Q2 = P04-P06 actual, Q3/Q4 are forecast.
// Budget per quarter is the annual €40M plan evenly distributed.
export type QuarterBudget = {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  label: string;
  actual: number;       // actual spend if quarter is closed, else 0
  forecast: number;     // forecast for that quarter (actual for closed quarters)
  budget: number;       // planned budget for the quarter
  status: "closed" | "current" | "forecast";
};

export const byQuarter: QuarterBudget[] = [
  { quarter: "Q1", label: "Q1 FY26 (Oct–Dec ’25)", actual: 391_015,    forecast: 391_015,    budget: 10_000_000, status: "closed"   },
  { quarter: "Q2", label: "Q2 FY26 (Jan–Mar ’26)", actual: 5_146_670,  forecast: 5_146_670,  budget: 10_000_000, status: "closed"   },
  { quarter: "Q3", label: "Q3 FY26 (Apr–Jun ’26)", actual: 0,          forecast: 17_162_467, budget: 10_000_000, status: "current"  },
  { quarter: "Q4", label: "Q4 FY26 (Jul–Sep ’26)", actual: 0,          forecast: 17_162_467, budget: 10_000_000, status: "forecast" },
];

// Line items retained for potential future use / data exports, but
// no longer rendered in the UI.
export type BudgetLineItem = {
  id: string;
  module: string;
  unit: string;
  costType: string;
  contractor: string;
  title: string;
  actual: number;
  budget: number;
  forecast: number;
};

export const lineItems: BudgetLineItem[] = [];
