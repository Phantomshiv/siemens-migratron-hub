// People data extracted from Cosmos org chart (soc.siemens.cloud)
// Source: https://soc.siemens.cloud/collaboration/tribe/aymdz24z

export type OrgModule = {
  name: string;
  leads: string[];
  pmo: string[];
  members: string[];
  externals: string[];
  children?: OrgModule[];
};

export type OrgStructure = {
  program: string;
  coLeads: string[];
  pmoLead: string;
  pmoMembers: string[];
  modules: OrgModule[];
};

export const orgData: OrgStructure = {
  program: "ONE Software Engineering System (OSES)",
  coLeads: ["Nizar Chaouch", "Christopher Leach", "Alexander Schatz"],
  pmoLead: "Dr. Henrik Thiele",
  pmoMembers: ["Jacqueline Müller", "Nisha DeThomas", "Elena Fuchs", "PHILIP HALL", "Borja Martinez Yllera"],
  modules: [
    {
      name: "Product Management",
      leads: ["Henrik Blixt"],
      pmo: ["Nisha DeThomas"],
      members: [
        "Divya Sree Dinnepati", "Traci Dyson", "dr. Ede Heltovics", "Eike Hensler",
        "William Kaupp", "Sebastian Mittnacht", "Fabiola Paulina Moyon Constante",
        "Shubham Srivastava", "Parth Srivastav",
      ],
      externals: [],
    },
    {
      name: "Finance",
      leads: ["Lachezar Zarov"],
      pmo: [],
      members: [
        "Ioana Both", "Bc. Patrik Hovorka", "Natalia Lazareva", "Lorena Oppel", "Thorsten Schlüter",
      ],
      externals: [],
    },
    {
      name: "DevBoost",
      leads: ["Khosro Rahbar"],
      pmo: ["Michael Volkmer"],
      members: [
        "Adrian Dischinger", "Henrike Hardt", "Pedro Andre Pinheiro Sequeira",
        "Thomas Rettenmaier", "Stephan Rödiger", "Imke Sophia Schmidt",
        "Sinthujan Senthilrajah", "Jörg Wiersbitzki",
      ],
      externals: [],
    },
    {
      name: "Development & Operations",
      leads: ["Jamie Florence"],
      pmo: [],
      members: [],
      externals: [],
      children: [
        {
          name: "Platform Development",
          leads: ["Jamie Florence"],
          pmo: ["Nisha DeThomas"],
          members: [
            "Divya Sree Dinnepati", "Traci Dyson", "Mohamed Elmorsy Elbendary Elshaer",
            "Brandon Jones", "dr. Ede Heltovics", "Eike Hensler", "William Kaupp",
            "Gerard Malone", "Sebastian Mittnacht", "Fabiola Paulina Moyon Constante",
            "Ramanagouda Patil", "Parth Srivastav", "Shubham Srivastava",
            "Kavirajacholan Selvaraj", "Scott Schwartz",
          ],
          externals: [],
        },
        {
          name: "Architecture & Governance",
          leads: ["Gregory Haynes"],
          pmo: ["Gabriel Osburn"],
          members: [
            "Christian Beining", "Nisha DeThomas", "Jamie Florence", "Gregory Haynes",
            "Dirk Arne Lehmann", "Mohamed Mohamed", "Igor Milovanovic",
            "Peter Stoll", "Jörg Wiersbitzki",
          ],
          externals: [],
        },
        {
          name: "ONE Operations Team",
          leads: ["Holger Heise"],
          pmo: [],
          members: ["Jörg Scheiderer", "Temenuga Bakalska-Takev"],
          externals: [],
        },
      ],
    },
    {
      name: "Migration & Harmonization",
      leads: ["Mamun Natour"],
      pmo: ["Elena Fuchs", "Dr. Isabell Meiners"],
      members: [
        "Andreas Atug", "Sofia Cefaliello", "Sara Huerta De Castro", "Ruth Madrid Dusik",
        "PHILIP HALL", "Carsten Hammerstein", "Franziska Kraus", "Lorena Oppel", "Steffen Wagner",
      ],
      externals: [],
      children: [
        {
          name: "Tools & Code",
          leads: ["Andreas Degraf"],
          pmo: ["Elena Fuchs", "Dr. Isabell Meiners"],
          members: [
            "Lisa Demlehner", "Carsten Hammerstein", "Thomas Maier",
            "Florian Oberste", "Jan-Patrik Patt",
          ],
          externals: ["Saurabh Singh", "Sai Pranava Paidimarri", "Deepak Pandit", "Ajeet Kumar Chouksey"],
        },
        {
          name: "Reusability",
          leads: ["Dr. Marie-Catherine Fritsch"],
          pmo: [],
          members: [
            "Attila Beczök", "Muhammet Bilgin", "Antje Finger", "Adrian Neumann",
            "Elmar Schilling", "Ion-Catalin Tudor", "Alexander Schmidt",
          ],
          externals: [],
        },
      ],
    },
    {
      name: "Communication & Growth",
      leads: ["Conrad Reisch"],
      pmo: ["PHILIP HALL"],
      members: [],
      externals: [],
      children: [
        {
          name: "Community Management & Learning",
          leads: ["Conrad Reisch"],
          pmo: [],
          members: [
            "Ana Cristina Alves de Almeida", "Aenne Barnard", "PHILIP HALL",
            "Pamela Angelica Pacheco Tellez", "Adrian Strauß",
          ],
          externals: [],
        },
        {
          name: "Client Management",
          leads: ["Dr. Johannes Ixmeier"],
          pmo: [],
          members: ["Tim Westhoff"],
          externals: [],
        },
      ],
    },
  ],
};

function collectPeople(modules: OrgModule[], set: Set<string>, extSet: Set<string>) {
  modules.forEach((m) => {
    m.leads.forEach((n) => set.add(n));
    m.pmo.forEach((n) => set.add(n));
    m.members.forEach((n) => set.add(n));
    m.externals.forEach((n) => { set.add(n); extSet.add(n); });
    if (m.children) collectPeople(m.children, set, extSet);
  });
}

export function getOrgStats() {
  const allPeople = new Set<string>();
  const externalPeople = new Set<string>();

  orgData.coLeads.forEach((n) => allPeople.add(n));
  allPeople.add(orgData.pmoLead);
  orgData.pmoMembers.forEach((n) => allPeople.add(n));
  collectPeople(orgData.modules, allPeople, externalPeople);

  // Count top-level + children
  let moduleCount = 0;
  orgData.modules.forEach((m) => {
    moduleCount++;
    if (m.children) moduleCount += m.children.length;
  });

  return {
    totalPeople: allPeople.size,
    internalCount: allPeople.size - externalPeople.size,
    externalCount: externalPeople.size,
    moduleCount,
  };
}
