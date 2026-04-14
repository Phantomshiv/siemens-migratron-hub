// Budget data extracted from OSES Actuals & FC Status spreadsheet

export const budgetSummary = {
  totalBudget: 40_000_000,
  actualSpend: 14_321_422,
  forecastFY26: 39_874_025,
  sapNo: "ID-00J97",
  fundingSource: "CMC",
  probability: "100%",
  customer: "FT FDS TF",
};

export type ModuleBudget = {
  module: string;
  actual: number;
  forecast: number;
};

export const byModule: ModuleBudget[] = [
  { module: "Platform Development", actual: 10_772_960, forecast: 24_787_990 },
  { module: "Migration & Harmonization", actual: 2_453_948, forecast: 10_500_000 },
  { module: "Communication & Growth", actual: 517_090, forecast: 2_090_000 },
  { module: "ONE SRE Team", actual: 100_000, forecast: 1_500_000 },
  { module: "PMO Cost", actual: 477_424, forecast: 996_035 },
];

export type OrgBudget = {
  org: string;
  actual: number;
  forecast: number;
};

export const byOrg: OrgBudget[] = [
  { org: "FT FDS DES", actual: 10_885_078, forecast: 16_949_025 },
  { org: "IT APS", actual: 2_553_948, forecast: 12_200_000 },
  { org: "CYS", actual: 755_762, forecast: 8_925_000 },
  { org: "FT ST", actual: 126_633, forecast: 300_000 },
  { org: "IT", actual: 0, forecast: 1_500_000 },
];

export type CostTypeBudget = {
  type: string;
  actual: number;
  forecast: number;
};

export const byCostType: CostTypeBudget[] = [
  { type: "Labour Cost", actual: 9_160_700, forecast: 22_483_712 },
  { type: "Contractors", actual: 2_808_871, forecast: 7_471_399 },
  { type: "Licence", actual: 1_117_184, forecast: 6_784_368 },
  { type: "Infrastructure", actual: 34_667, forecast: 3_134_546 },
  { type: "Other", actual: 1_200_000, forecast: 0 },
];

export type ContractorBudget = {
  contractor: string;
  actual: number;
  forecast: number;
};

export const byContractor: ContractorBudget[] = [
  { contractor: "External (IT APS)", actual: 1_395_644, forecast: 2_791_288 },
  { contractor: "FT RPD", actual: 534_524, forecast: 1_817_567 },
  { contractor: "FT UX", actual: 256_349, forecast: 988_756 },
  { contractor: "Evosoft gmbH / FT D", actual: 131_320, forecast: 951_088 },
  { contractor: "FT D India", actual: 491_034, forecast: 922_700 },
];

export type FTEBreakdown = {
  country: string;
  countryCode: string;
  ownFTEs: number;
  contractorFTEs: number;
};

export const fteBreakdown: FTEBreakdown[] = [
  { country: "Germany", countryCode: "DE", ownFTEs: 34.75, contractorFTEs: 6 },
  { country: "India", countryCode: "IN", ownFTEs: 9.3, contractorFTEs: 21 },
  { country: "United States", countryCode: "US", ownFTEs: 8.6, contractorFTEs: 0 },
  { country: "Austria", countryCode: "AUT", ownFTEs: 0, contractorFTEs: 4.6 },
  { country: "Other", countryCode: "Other", ownFTEs: 9.6, contractorFTEs: 0 },
];

export const fteTotals = {
  ownTotal: 62.25,
  contractorTotal: 31.6,
  grandTotal: 93.85,
};

export const spendingTimeline = {
  oneTime: { actual: 4_167_897, forecast: 16_709_945 },
  recurring: { actual: 10_153_525, forecast: 23_164_080 },
};

// Line items for detail table
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

export const lineItems: BudgetLineItem[] = [
  { id: "001", module: "PMO Cost", unit: "FT FDS DES", costType: "infrastructure", contractor: "", title: "OSES sticker", actual: 3_035, budget: 0, forecast: 3_035 },
  { id: "013", module: "Migration & Harmonization", unit: "IT APS", costType: "labour", contractor: "", title: "OSES Professional services setup", actual: 0, budget: 3_100_000, forecast: 0 },
  { id: "014", module: "Migration & Harmonization", unit: "IT APS", costType: "labour", contractor: "", title: "Pilot migration for DI SW, SI B and SI EA", actual: 0, budget: 100_000, forecast: 100_000 },
  { id: "015", module: "Migration & Harmonization", unit: "IT APS", costType: "infrastructure", contractor: "", title: "Migration tooling made available", actual: 0, budget: 1_500_000, forecast: 1_500_000 },
  { id: "016", module: "Migration & Harmonization", unit: "IT APS", costType: "infrastructure", contractor: "", title: "Pilot migration for DI SW, SI EA, SI B finished", actual: 0, budget: 100_000, forecast: 100_000 },
  { id: "017", module: "Migration & Harmonization", unit: "IT APS", costType: "licence", contractor: "", title: "Key tool licenses consolidated (Jfrog)", actual: 0, budget: 2_000_000, forecast: 2_000_000 },
  { id: "018a", module: "Migration & Harmonization", unit: "IT APS", costType: "labour", contractor: "", title: "Migration projects in all BUs (FTE)", actual: 37_840, budget: 2_200_000, forecast: 316_000 },
  { id: "018b", module: "Migration & Harmonization", unit: "IT APS", costType: "contractor", contractor: "External", title: "Migration projects in all BUs (contractor)", actual: 942_000, budget: 2_200_000, forecast: 1_884_000 },
  { id: "019", module: "Migration & Harmonization", unit: "IT APS", costType: "infrastructure", contractor: "", title: "Software Catalogue available", actual: 0, budget: 1_500_000, forecast: 1_500_000 },
  { id: "002", module: "Platform Development", unit: "FT FDS DES", costType: "contractor", contractor: "FT UX", title: "UX Support", actual: 256_349, budget: 0, forecast: 988_756 },
  { id: "003", module: "Platform Development", unit: "FT FDS DES", costType: "contractor", contractor: "FT RPD", title: "OSES Compute - Technical PM", actual: 157_260, budget: 0, forecast: 528_640 },
  { id: "004", module: "Platform Development", unit: "FT FDS DES", costType: "contractor", contractor: "Evosoft / FT D", title: "Observability Dev (HU)", actual: 131_320, budget: 0, forecast: 951_088 },
  { id: "005", module: "Platform Development", unit: "FT FDS DES", costType: "contractor", contractor: "FT D India", title: "Universal Control Plane", actual: 295_783, budget: 0, forecast: 693_200 },
  { id: "006", module: "Platform Development", unit: "FT FDS DES", costType: "contractor", contractor: "FT D India", title: "Airbyte FAROS", actual: 117_453, budget: 0, forecast: 229_500 },
  { id: "007", module: "Platform Development", unit: "FT FDS DES", costType: "contractor", contractor: "FT RPD", title: "Security in OSES Roadmap", actual: 171_570, budget: 0, forecast: 336_132 },
  { id: "029", module: "Platform Development", unit: "FT FDS DES", costType: "contractor", contractor: "FT RPD", title: "SSP Scaling UCP", actual: 58_603, budget: 0, forecast: 362_795 },
  { id: "031", module: "Platform Development", unit: "FT FDS DES", costType: "contractor", contractor: "FT D India", title: "Agentic Development", actual: 77_798, budget: 0, forecast: 0 },
  { id: "XPE", module: "Platform Development", unit: "FT FDS DES", costType: "labour", contractor: "", title: "FT FDS DES XPE Labor cost", actual: 6_500_000, budget: 12_000_000, forecast: 8_200_000 },
  { id: "FAROS", module: "Platform Development", unit: "FT FDS DES", costType: "licence", contractor: "", title: "FAROS licence", actual: 1_117_184, budget: 2_234_368, forecast: 2_234_368 },
  { id: "GH", module: "Platform Development", unit: "IT", costType: "licence", contractor: "", title: "GitHub licences", actual: 0, budget: 5_500_000, forecast: 1_500_000 },
  { id: "SRE", module: "ONE SRE Team", unit: "IT APS", costType: "labour", contractor: "", title: "ONE SRE team", actual: 100_000, budget: 3_000_000, forecast: 1_500_000 },
  { id: "008", module: "Communication & Growth", unit: "FT FDS DES", costType: "contractor", contractor: "FT RPD", title: "Coding Excellence Academy", actual: 147_090, budget: 0, forecast: 590_000 },
  { id: "CG-L", module: "Communication & Growth", unit: "FT FDS DES", costType: "labour", contractor: "", title: "Communication & Growth labor", actual: 370_000, budget: 0, forecast: 1_300_000 },
  { id: "PMO-L", module: "PMO Cost", unit: "FT FDS DES", costType: "labour", contractor: "", title: "OSES PMO & Project cost", actual: 250_000, budget: 0, forecast: 500_000 },
  { id: "FTST", module: "PMO Cost", unit: "FT ST", costType: "labour", contractor: "", title: "Contractors FT ST&TR T", actual: 126_633, budget: 0, forecast: 300_000 },
  { id: "CYS-P", module: "PMO Cost", unit: "CYS", costType: "labour", contractor: "", title: "CYS Program lead cost", actual: 97_755, budget: 0, forecast: 193_000 },
];
