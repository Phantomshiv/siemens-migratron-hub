// People data extracted from Cosmos org chart (soc.siemens.cloud)
// Source: https://soc.siemens.cloud/collaboration/tribe/aymdz24z

export type Person = {
  name: string;
  role?: string;
  type: "internal" | "external";
};

export type OrgModule = {
  name: string;
  lead: string;
  coLead?: string;
  pmo?: Person[];
  members: Person[];
};

export type OrgStructure = {
  program: string;
  leadership: {
    programLead: string;
    productManagement: string;
    finance: string;
    ai: string;
  };
  pmo: Person[];
  modules: OrgModule[];
  externals: Person[];
};

export const orgData: OrgStructure = {
  program: "ONE Software Engineering System (OSES)",
  leadership: {
    programLead: "Dr. Henrik Thiele",
    productManagement: "Christopher Leach",
    finance: "Lachezar Zarov",
    ai: "Mgr. Vladimír Kulla",
  },
  pmo: [
    { name: "Jacqueline Müller", type: "internal" },
    { name: "Nisha DeThomas", type: "internal" },
    { name: "Elena Fuchs", type: "internal" },
    { name: "PHILIP HALL", type: "internal" },
    { name: "Borja Martinez Yllera", type: "internal" },
  ],
  modules: [
    {
      name: "Project Leadership",
      lead: "Christopher Leach",
      coLead: "Nizar Chaouch",
      pmo: [
        { name: "Jacqueline Müller", type: "internal" },
        { name: "Nisha DeThomas", type: "internal" },
        { name: "Elena Fuchs", type: "internal" },
        { name: "PHILIP HALL", type: "internal" },
        { name: "Borja Martinez Yllera", type: "internal" },
      ],
      members: [
        { name: "Alexander Schatz", type: "internal" },
      ],
    },
    {
      name: "Product Management",
      lead: "Christopher Leach",
      pmo: [{ name: "Nisha DeThomas", type: "internal" }],
      members: [
        { name: "Divya Sree Dinnepati", type: "internal" },
        { name: "Traci Dyson", type: "internal" },
        { name: "dr. Ede Heltovics", type: "internal" },
        { name: "Eike Hensler", type: "internal" },
        { name: "William Kaupp", type: "internal" },
        { name: "Sebastian Mittnacht", type: "internal" },
        { name: "Fabiola Paulina Moyon Constante", type: "internal" },
        { name: "Shubham Srivastava", type: "internal" },
        { name: "Parth Srivastav", type: "internal" },
      ],
    },
    {
      name: "Finance",
      lead: "Lachezar Zarov",
      members: [
        { name: "Ioana Both", type: "internal" },
        { name: "Bc. Patrik Hovorka", type: "internal" },
        { name: "Natalia Lazareva", type: "internal" },
        { name: "Lorena Oppel", type: "internal" },
        { name: "Thorsten Schlüter", type: "internal" },
      ],
    },
    {
      name: "AI Initiatives",
      lead: "Mgr. Vladimír Kulla",
      coLead: "Khosro Rahbar",
      pmo: [{ name: "Michael Volkmer", type: "internal" }],
      members: [
        { name: "Adrian Dischinger", type: "internal" },
        { name: "Henrike Hardt", type: "internal" },
        { name: "Pedro Andre Pinheiro Sequeira", type: "internal" },
        { name: "Thomas Rettenmaier", type: "internal" },
        { name: "Stephan Rödiger", type: "internal" },
        { name: "Imke Sophia Schmidt", type: "internal" },
        { name: "Sinthujan Senthilrajah", type: "internal" },
        { name: "Jörg Wiersbitzki", type: "internal" },
      ],
    },
    {
      name: "Platform Development",
      lead: "Jamie Florence",
      pmo: [{ name: "Nisha DeThomas", type: "internal" }],
      members: [
        { name: "Divya Sree Dinnepati", type: "internal" },
        { name: "Traci Dyson", type: "internal" },
        { name: "Mohamed Elmorsy Elbendary Elshaer", type: "internal" },
        { name: "Brandon Jones", type: "internal" },
        { name: "dr. Ede Heltovics", type: "internal" },
        { name: "Eike Hensler", type: "internal" },
        { name: "William Kaupp", type: "internal" },
        { name: "Gerard Malone", type: "internal" },
        { name: "Sebastian Mittnacht", type: "internal" },
        { name: "Fabiola Paulina Moyon Constante", type: "internal" },
        { name: "Ramanagouda Patil", type: "internal" },
        { name: "Parth Srivastav", type: "internal" },
        { name: "Shubham Srivastava", type: "internal" },
        { name: "Kavirajacholan Selvaraj", type: "internal" },
        { name: "Scott Schwartz", type: "internal" },
      ],
    },
    {
      name: "Architecture & Governance",
      lead: "Gregory Haynes",
      coLead: "Holger Heise",
      pmo: [{ name: "Gabriel Osburn", type: "internal" }],
      members: [
        { name: "Christian Beining", type: "internal" },
        { name: "Nisha DeThomas", type: "internal" },
        { name: "Jamie Florence", type: "internal" },
        { name: "Dirk Arne Lehmann", type: "internal" },
        { name: "Mohamed Mohamed", type: "internal" },
        { name: "Igor Milovanovic", type: "internal" },
        { name: "Peter Stoll", type: "internal" },
        { name: "Jörg Wiersbitzki", type: "internal" },
      ],
    },
    {
      name: "Migration & Harmonization",
      lead: "Mamun Natour",
      coLead: "Andreas Degraf",
      pmo: [
        { name: "Elena Fuchs", type: "internal" },
        { name: "Dr. Isabell Meiners", type: "internal" },
      ],
      members: [
        { name: "Jörg Scheiderer", type: "internal" },
        { name: "Temenuga Bakalska-Takev", type: "internal" },
        { name: "Andreas Atug", type: "internal" },
        { name: "Sofia Cefaliello", type: "internal" },
        { name: "Sara Huerta De Castro", type: "internal" },
        { name: "Ruth Madrid Dusik", type: "internal" },
        { name: "PHILIP HALL", type: "internal" },
        { name: "Carsten Hammerstein", type: "internal" },
        { name: "Franziska Kraus", type: "internal" },
        { name: "Lorena Oppel", type: "internal" },
        { name: "Steffen Wagner", type: "internal" },
      ],
    },
    {
      name: "Communication & Growth",
      lead: "Dr. Marie-Catherine Fritsch",
      coLead: "Conrad Reisch",
      pmo: [
        { name: "Elena Fuchs", type: "internal" },
        { name: "Dr. Isabell Meiners", type: "internal" },
        { name: "PHILIP HALL", type: "internal" },
      ],
      members: [
        { name: "Lisa Demlehner", type: "internal" },
        { name: "Carsten Hammerstein", type: "internal" },
        { name: "Thomas Maier", type: "internal" },
        { name: "Florian Oberste", type: "internal" },
        { name: "Jan-Patrik Patt", type: "internal" },
        { name: "Attila Beczök", type: "internal" },
        { name: "Muhammet Bilgin", type: "internal" },
        { name: "Antje Finger", type: "internal" },
        { name: "Adrian Neumann", type: "internal" },
        { name: "Elmar Schilling", type: "internal" },
        { name: "Ion-Catalin Tudor", type: "internal" },
        { name: "Alexander Schmidt", type: "internal" },
      ],
    },
    {
      name: "Community Management & Learning",
      lead: "",
      members: [
        { name: "Ana Cristina Alves de Almeida", type: "internal" },
        { name: "Aenne Barnard", type: "internal" },
        { name: "PHILIP HALL", type: "internal" },
        { name: "Pamela Angelica Pacheco Tellez", type: "internal" },
        { name: "Adrian Strauß", type: "internal" },
      ],
    },
    {
      name: "Client Management",
      lead: "Dr. Johannes Ixmeier",
      coLead: "Tim Westhoff",
      members: [],
    },
  ],
  externals: [
    { name: "Saurabh Singh", type: "external" },
    { name: "Sai Pranava Paidimarri", type: "external" },
    { name: "Deepak Pandit", type: "external" },
    { name: "Ajeet Kumar Chouksey", type: "external" },
  ],
};

export function getOrgStats() {
  const allMembers = new Set<string>();

  Object.values(orgData.leadership).forEach((n) => allMembers.add(n));
  orgData.pmo.forEach((p) => allMembers.add(p.name));
  orgData.modules.forEach((m) => {
    if (m.lead) allMembers.add(m.lead);
    if (m.coLead) allMembers.add(m.coLead);
    m.pmo?.forEach((p) => allMembers.add(p.name));
    m.members.forEach((p) => allMembers.add(p.name));
  });

  return {
    totalPeople: allMembers.size + orgData.externals.length,
    internalCount: allMembers.size,
    externalCount: orgData.externals.length,
    moduleCount: orgData.modules.length,
  };
}
