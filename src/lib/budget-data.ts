// Budget data extracted from OSES Actuals & FC Reporting tool
// Source: OSES_Actuals_FC_Reporting_tool overview tab (P08 — May 2026)

export const budgetSummary = {
  totalBudget: 40_000_000,
  actualSpend: 19_304_067,
  forecastFY26: 35_417_854,
  sapNo: "ID-00J97",
  fundingSource: "CMC",
  probability: "100%",
  customer: "FT FDS TF",
  reportingPeriod: "P08",
};

export type ModuleBudget = {
  module: string;
  actual: number;
  forecast: number;
};

export const byModule: ModuleBudget[] = [
  { module: "Platform Development", actual: 14_508_860, forecast: 22_310_317 },
  { module: "Migration & Harmonization", actual: 3_417_493, forecast: 9_100_000 },
  { module: "Communication & Growth", actual: 698_838, forecast: 1_552_340 },
  { module: "Commercial Software Platforms", actual: 134_230, forecast: 690_000 },
  { module: "PMO Cost", actual: 544_646, forecast: 829_368 },
  { module: "OSES AI", actual: 0, forecast: 561_592 },
];

export type OrgBudget = {
  org: string;
  actual: number;
  forecast: number;
};

export const byOrg: OrgBudget[] = [
  { org: "FT FDS DES", actual: 14_774_947, forecast: 19_599_997 },
  { org: "IT APS", actual: 3_551_723, forecast: 9_990_000 },
  { org: "CYS", actual: 755_763, forecast: 3_851_229 },
  { org: "DI IT", actual: 0, forecast: 802_392 },
  { org: "IT", actual: 0, forecast: 500_000 },
  { org: "FT ST", actual: 221_633, forecast: 300_000 },
];

export type CostTypeBudget = {
  type: string;
  actual: number;
  forecast: number;
};

export const byCostType: CostTypeBudget[] = [
  { type: "Labour Cost", actual: 12_792_570, forecast: 19_294_970 },
  { type: "Contractors", actual: 3_964_699, forecast: 8_403_007 },
  { type: "Licence", actual: 2_504_445, forecast: 6_056_667 },
  { type: "Infrastructure", actual: 42_353, forecast: 1_284_546 },
  { type: "Direct", actual: 0, forecast: 50_000 },
];

export type ContractorBudget = {
  contractor: string;
  actual: number;
  forecast: number;
};

export const byContractor: ContractorBudget[] = [
  { contractor: "External (IT APS)", actual: 1_401_215, forecast: 3_202_430 },
  { contractor: "FT RPD", actual: 824_974, forecast: 1_764_233 },
  { contractor: "FT D India", actual: 686_235, forecast: 1_255_700 },
  { contractor: "FT UX", actual: 495_856, forecast: 988_756 },
  { contractor: "Evosoft gmbH / FT D", actual: 556_419, forecast: 951_088 },
];

// Kept for backward compat; not rendered.
export type FTEBreakdown = {
  country: string;
  countryCode: string;
  ownFTEs: number;
  contractorFTEs: number;
};

export const fteBreakdown: FTEBreakdown[] = [];

export const fteTotals = {
  ownTotal: 62.25,
  contractorTotal: 36.2,
  grandTotal: 98.45,
};

export const spendingTimeline = {
  oneTime: { actual: 4_157_956, forecast: 13_745_001 },
  recurring: { actual: 15_146_111, forecast: 20_994_189 },
};

export type QuarterBudget = {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  label: string;
  actual: number;
  forecast: number;
  budget: number;
  status: "closed" | "current" | "forecast";
};

// Source: row 9 of overview tab. Q1/Q2 closed, Q3 in progress (P08), Q4 forecast.
export const byQuarter: QuarterBudget[] = [
  { quarter: "Q1", label: "Q1 FY26 (Oct–Dec ’25)", actual: 3_688_087, forecast: 3_688_087,  budget: 10_000_000, status: "closed"  },
  { quarter: "Q2", label: "Q2 FY26 (Jan–Mar ’26)", actual: 9_947_134, forecast: 9_947_134,  budget: 10_000_000, status: "closed"  },
  { quarter: "Q3", label: "Q3 FY26 (Apr–Jun ’26)", actual: 5_481_059, forecast: 10_274_558, budget: 10_000_000, status: "current" },
  { quarter: "Q4", label: "Q4 FY26 (Jul–Sep ’26)", actual: 0,         forecast: 11_506_223, budget: 10_000_000, status: "forecast"},
];

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
