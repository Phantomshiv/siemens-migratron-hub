// People data extracted from Cosmos org chart (soc.siemens.cloud)

export type Person = {
  name: string;
  role?: string;
  type: "internal" | "external";
};

export type OrgModule = {
  name: string;
  lead: string;
  coLead?: string;
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
    programLead: "Nizar Chaouch",
    productManagement: "Dr. Henrik Thiele",
    finance: "Christopher Leach",
    ai: "Alexander Schatz",
  },
  pmo: [
    { name: "Jacqueline Müller", type: "internal" },
    { name: "Thorsten Schlüter", type: "internal" },
    { name: "Nisha DeThomas", type: "internal" },
    { name: "Elena Fuchs", type: "internal" },
  ],
  modules: [
    {
      name: "Platform Development",
      lead: "Christopher Leach",
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
        { name: "Ioana Both", type: "internal" },
        { name: "Bc. Patrik Hovorka", type: "internal" },
        { name: "Natalia Lazareva", type: "internal" },
        { name: "Lorena Oppel", type: "internal" },
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
      name: "Architecture & Governance",
      lead: "Lachezar Zarov",
      members: [
        { name: "Mohamed Elmorsy Elbendary Elshaer", type: "internal" },
        { name: "Brandon Jones", type: "internal" },
        { name: "Gerard Malone", type: "internal" },
        { name: "Ramanagouda Patil", type: "internal" },
        { name: "Kavirajacholan Selvaraj", type: "internal" },
        { name: "Scott Schwartz", type: "internal" },
      ],
    },
    {
      name: "ONE Operations Team",
      lead: "Mgr. Vladimír Kulla",
      members: [
        { name: "Christian Beining", type: "internal" },
        { name: "Nisha DeThomas", type: "internal" },
        { name: "Jamie Florence", type: "internal" },
        { name: "Gregory Haynes", type: "internal" },
        { name: "Dirk Arne Lehmann", type: "internal" },
        { name: "Mohamed Mohamed", type: "internal" },
        { name: "Igor Milovanovic", type: "internal" },
        { name: "Peter Stoll", type: "internal" },
        { name: "Jörg Wiersbitzki", type: "internal" },
        { name: "Jörg Scheiderer", type: "internal" },
      ],
    },
    {
      name: "Migration & Harmonization",
      lead: "Khosro Rahbar",
      members: [
        { name: "Temenuga Bakalska-Takev", type: "internal" },
        { name: "Andreas Atug", type: "internal" },
      ],
    },
    {
      name: "Tools & Code",
      lead: "Jamie Florence",
      members: [],
    },
    {
      name: "Reusability",
      lead: "Gregory Haynes",
      members: [],
    },
    {
      name: "Communication & Growth",
      lead: "Holger Heise",
      coLead: "Mamun Natour",
      members: [
        { name: "Sofia Cefaliello", type: "internal" },
        { name: "Sara Huerta De Castro", type: "internal" },
        { name: "Ruth Madrid Dusik", type: "internal" },
        { name: "Philip Hall", type: "internal" },
        { name: "Carsten Hammerstein", type: "internal" },
        { name: "Franziska Kraus", type: "internal" },
        { name: "Lorena Oppel", type: "internal" },
        { name: "Steffen Wagner", type: "internal" },
      ],
    },
    {
      name: "Community Management & Learning",
      lead: "Andreas Degraf",
      members: [
        { name: "Lisa Demlehner", type: "internal" },
        { name: "Carsten Hammerstein", type: "internal" },
        { name: "Thomas Maier", type: "internal" },
        { name: "Florian Oberste", type: "internal" },
        { name: "Jan-Patrik Patt", type: "internal" },
      ],
    },
    {
      name: "Client Management",
      lead: "Dr. Marie-Catherine Fritsch",
      coLead: "Conrad Reisch",
      members: [
        { name: "Attila Beczök", type: "internal" },
        { name: "Muhammet Bilgin", type: "internal" },
        { name: "Antje Finger", type: "internal" },
        { name: "Adrian Neumann", type: "internal" },
        { name: "Elmar Schilling", type: "internal" },
        { name: "Ion-Catalin Tudor", type: "internal" },
        { name: "Alexander Schmidt", type: "internal" },
        { name: "Ana Cristina Alves de Almeida", type: "internal" },
        { name: "Aenne Barnard", type: "internal" },
        { name: "Philip Hall", type: "internal" },
        { name: "Pamela Angelica Pacheco Tellez", type: "internal" },
        { name: "Adrian Strauß", type: "internal" },
        { name: "Dr. Johannes Ixmeier", type: "internal" },
        { name: "Tim Westhoff", type: "internal" },
      ],
    },
  ],
  externals: [
    { name: "Saurabh Singh", type: "external" },
    { name: "Sai Pranava Paidimarri", type: "external" },
    { name: "Deepak Pandit", type: "external" },
    { name: "Ajeet Kumar Chouksey", type: "external" },
  ],
};

// Compute stats
export function getOrgStats() {
  const allMembers = new Set<string>();
  
  // Leadership
  Object.values(orgData.leadership).forEach(n => allMembers.add(n));
  
  // PMO
  orgData.pmo.forEach(p => allMembers.add(p.name));
  
  // Modules
  orgData.modules.forEach(m => {
    allMembers.add(m.lead);
    if (m.coLead) allMembers.add(m.coLead);
    m.members.forEach(p => allMembers.add(p.name));
  });

  return {
    totalPeople: allMembers.size + orgData.externals.length,
    internalCount: allMembers.size,
    externalCount: orgData.externals.length,
    moduleCount: orgData.modules.length,
  };
}
