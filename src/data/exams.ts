export type ExamCategory = {
  slug: string;
  name: string;
  fullName: string;
  description: string;
  examCount: number;
  accent: "emerald" | "gold" | "deep";
};

export type Exam = {
  slug: string;
  category: string;
  name: string;
  fullName: string;
  description: string;
  eligibility: string;
  ageLimit: string;
  qualification: string;
  selectionProcess: string[];
  pattern: { stage: string; details: string }[];
  syllabus: string[];
  importantDates: { label: string; date: string }[];
  applyUrl: string;
  officialUrl: string;
  notifications: { title: string; date: string; tag: string }[];
  studyPlan: { week: string; focus: string }[];
  previousPapers: { year: string; name: string }[];
  mockTests: { title: string; questions: number; duration: string }[];
  currentAffairs: { title: string; date: string }[];
  materials: { title: string; type: string; size: string }[];
  faq: { q: string; a: string }[];
};

export const categories: ExamCategory[] = [
  {
    slug: "upsc",
    name: "UPSC",
    fullName: "Union Public Service Commission",
    description: "Civil services for IAS, IPS, IFS and allied central services.",
    examCount: 3,
    accent: "emerald",
  },
  {
    slug: "ssc",
    name: "SSC",
    fullName: "Staff Selection Commission",
    description: "Central government Group B & C posts including CGL, CHSL, MTS, GD.",
    examCount: 4,
    accent: "gold",
  },
  {
    slug: "rrb",
    name: "RRB",
    fullName: "Railway Recruitment Board",
    description: "Indian Railways recruitments — NTPC, Group D, Junior Engineer.",
    examCount: 3,
    accent: "deep",
  },
  {
    slug: "ibps",
    name: "IBPS",
    fullName: "Institute of Banking Personnel Selection",
    description: "Public sector bank recruitment — PO, Clerk, Specialist Officer.",
    examCount: 3,
    accent: "emerald",
  },
  {
    slug: "sbi",
    name: "SBI",
    fullName: "State Bank of India",
    description: "State Bank of India PO and Clerk recruitments.",
    examCount: 2,
    accent: "gold",
  },
  {
    slug: "tnpsc",
    name: "TNPSC",
    fullName: "Tamil Nadu Public Service Commission",
    description: "Tamil Nadu state services — Group 1, 2, 4 and CTSE.",
    examCount: 4,
    accent: "deep",
  },
  {
    slug: "defence",
    name: "Defence",
    fullName: "Defence & Armed Forces",
    description:
      "Explore opportunities in the Indian Army, Navy, Air Force, and Defence organizations.",
    examCount: 6,
    accent: "deep",
  },
];

const mkDefaults = (name: string) => ({
  selectionProcess: [
    "Preliminary Examination",
    "Main Examination",
    "Interview / Skill Test",
    "Document Verification",
  ],
  pattern: [
    { stage: "Prelims", details: "Objective MCQs — General Studies & Aptitude" },
    { stage: "Mains", details: "Descriptive papers across core subjects" },
    { stage: "Interview", details: "Personality test by board" },
  ],
  syllabus: [
    "General Awareness & Current Affairs",
    "Quantitative Aptitude & Reasoning",
    "English / Regional Language Comprehension",
    `${name} specific technical / domain subjects`,
    "Indian Polity, Economy, Geography & History",
  ],
  importantDates: [
    { label: "Notification Release", date: "Feb 2026" },
    { label: "Application Start", date: "Feb 2026" },
    { label: "Application Close", date: "Mar 2026" },
    { label: "Prelims Exam", date: "Jun 2026" },
    { label: "Mains Exam", date: "Sep 2026" },
  ],
  notifications: [
    {
      title: `${name} 2026 official notification expected`,
      date: "12 Jun 2026",
      tag: "Notification",
    },
    { title: `${name} application correction window opens`, date: "05 Jun 2026", tag: "Update" },
    { title: `${name} previous year cutoff released`, date: "20 May 2026", tag: "Result" },
  ],
  studyPlan: [
    { week: "Week 1-2", focus: "Foundation — syllabus mapping & NCERTs" },
    { week: "Week 3-6", focus: "Core subjects deep dive + daily current affairs" },
    { week: "Week 7-10", focus: "Standard reference books + answer writing" },
    { week: "Week 11-14", focus: "Previous year papers + sectional tests" },
    { week: "Week 15-16", focus: "Full-length mocks + revision sprints" },
  ],
  previousPapers: [
    { year: "2024", name: `${name} 2024 Question Paper with Solutions` },
    { year: "2023", name: `${name} 2023 Question Paper with Solutions` },
    { year: "2022", name: `${name} 2022 Question Paper with Solutions` },
    { year: "2021", name: `${name} 2021 Question Paper with Solutions` },
  ],
  mockTests: [
    { title: `${name} Full Mock Test 01`, questions: 100, duration: "120 min" },
    { title: `${name} Full Mock Test 02`, questions: 100, duration: "120 min" },
    { title: `${name} Sectional — Reasoning`, questions: 50, duration: "45 min" },
    { title: `${name} Sectional — Quantitative`, questions: 50, duration: "45 min" },
  ],
  currentAffairs: [
    { title: "Union Budget 2026 — key allocations summary", date: "22 Jun 2026" },
    { title: "G20 summit outcomes for India", date: "18 Jun 2026" },
    { title: "RBI monetary policy highlights", date: "10 Jun 2026" },
  ],
  materials: [
    { title: `${name} Complete Syllabus PDF`, type: "PDF", size: "2.4 MB" },
    { title: `${name} Topper Notes Compilation`, type: "PDF", size: "8.1 MB" },
    { title: `${name} Formula & Shortcut Sheet`, type: "PDF", size: "1.2 MB" },
    { title: `${name} Current Affairs Monthly Magazine`, type: "PDF", size: "5.6 MB" },
  ],
  faq: [
    {
      q: `What is the eligibility for ${name}?`,
      a: `Indian nationals meeting the age and educational qualification stated above are eligible for ${name}.`,
    },
    {
      q: `How many attempts are allowed for ${name}?`,
      a: `Attempts vary by category — general candidates typically get 4-6 attempts with relaxations for reserved categories.`,
    },
    {
      q: `Is coaching required to clear ${name}?`,
      a: `Self-study with the right resources is sufficient. Coaching helps with structure but is not mandatory.`,
    },
    {
      q: `What is the average preparation time?`,
      a: `Most successful candidates prepare for 10-14 months with 6-8 hours of focused study daily.`,
    },
  ],
  applyUrl: "#",
  officialUrl: "#",
});

const exams: Exam[] = [
  // UPSC
  {
    slug: "ias",
    category: "upsc",
    name: "IAS",
    fullName: "Indian Administrative Service",
    description: "Premier civil service overseeing administration across India.",
    eligibility: "Indian citizen",
    ageLimit: "21-32 years",
    qualification: "Bachelor's degree in any discipline",
    ...mkDefaults("IAS"),
  },
  {
    slug: "ips",
    category: "upsc",
    name: "IPS",
    fullName: "Indian Police Service",
    description: "Leadership of state and central police organisations.",
    eligibility: "Indian citizen",
    ageLimit: "21-32 years",
    qualification: "Bachelor's degree in any discipline",
    ...mkDefaults("IPS"),
  },
  {
    slug: "ifs",
    category: "upsc",
    name: "IFS",
    fullName: "Indian Foreign Service",
    description: "India's diplomatic corps representing the nation abroad.",
    eligibility: "Indian citizen",
    ageLimit: "21-32 years",
    qualification: "Bachelor's degree in any discipline",
    ...mkDefaults("IFS"),
  },
  // SSC
  {
    slug: "cgl",
    category: "ssc",
    name: "CGL",
    fullName: "Combined Graduate Level",
    description: "Group B and C posts in central ministries and departments.",
    eligibility: "Indian citizen",
    ageLimit: "18-32 years",
    qualification: "Bachelor's degree",
    ...mkDefaults("SSC CGL"),
  },
  {
    slug: "chsl",
    category: "ssc",
    name: "CHSL",
    fullName: "Combined Higher Secondary Level",
    description: "LDC, DEO and Postal Assistant posts in central government.",
    eligibility: "Indian citizen",
    ageLimit: "18-27 years",
    qualification: "12th pass (10+2)",
    ...mkDefaults("SSC CHSL"),
  },
  {
    slug: "mts",
    category: "ssc",
    name: "MTS",
    fullName: "Multi-Tasking Staff",
    description: "Group C non-gazetted posts in central ministries.",
    eligibility: "Indian citizen",
    ageLimit: "18-25 years",
    qualification: "10th pass",
    ...mkDefaults("SSC MTS"),
  },
  {
    slug: "gd",
    category: "ssc",
    name: "GD",
    fullName: "General Duty Constable",
    description: "Constable recruitment for CAPFs, NIA and SSF.",
    eligibility: "Indian citizen",
    ageLimit: "18-23 years",
    qualification: "10th pass + physical standards",
    ...mkDefaults("SSC GD"),
  },
  // RRB
  {
    slug: "ntpc",
    category: "rrb",
    name: "NTPC",
    fullName: "Non-Technical Popular Categories",
    description: "Graduate & undergraduate posts in Indian Railways.",
    eligibility: "Indian citizen",
    ageLimit: "18-33 years",
    qualification: "12th / Bachelor's degree",
    ...mkDefaults("RRB NTPC"),
  },
  {
    slug: "group-d",
    category: "rrb",
    name: "Group D",
    fullName: "Level 1 Posts",
    description: "Track maintainer, helper and assistant level posts.",
    eligibility: "Indian citizen",
    ageLimit: "18-33 years",
    qualification: "10th pass / ITI",
    ...mkDefaults("RRB Group D"),
  },
  {
    slug: "je",
    category: "rrb",
    name: "JE",
    fullName: "Junior Engineer",
    description: "Technical engineer posts across railway departments.",
    eligibility: "Indian citizen",
    ageLimit: "18-33 years",
    qualification: "Engineering diploma / B.E.",
    ...mkDefaults("RRB JE"),
  },
  // IBPS
  {
    slug: "po",
    category: "ibps",
    name: "PO",
    fullName: "Probationary Officer",
    description: "Officer cadre recruitment for participating public sector banks.",
    eligibility: "Indian citizen",
    ageLimit: "20-30 years",
    qualification: "Bachelor's degree",
    ...mkDefaults("IBPS PO"),
  },
  {
    slug: "clerk",
    category: "ibps",
    name: "Clerk",
    fullName: "Clerical Cadre",
    description: "Customer-facing clerical positions in public sector banks.",
    eligibility: "Indian citizen",
    ageLimit: "20-28 years",
    qualification: "Bachelor's degree",
    ...mkDefaults("IBPS Clerk"),
  },
  {
    slug: "so",
    category: "ibps",
    name: "SO",
    fullName: "Specialist Officer",
    description: "IT, HR, Marketing and Law specialist officer cadre.",
    eligibility: "Indian citizen",
    ageLimit: "20-30 years",
    qualification: "Relevant specialist degree",
    ...mkDefaults("IBPS SO"),
  },
  // SBI
  {
    slug: "po",
    category: "sbi",
    name: "PO",
    fullName: "SBI Probationary Officer",
    description: "Officer cadre recruitment exclusively for State Bank of India.",
    eligibility: "Indian citizen",
    ageLimit: "21-30 years",
    qualification: "Bachelor's degree",
    ...mkDefaults("SBI PO"),
  },
  {
    slug: "clerk",
    category: "sbi",
    name: "Clerk",
    fullName: "SBI Junior Associate",
    description: "Junior Associate (Customer Support & Sales) at SBI branches.",
    eligibility: "Indian citizen",
    ageLimit: "20-28 years",
    qualification: "Bachelor's degree",
    ...mkDefaults("SBI Clerk"),
  },
  // TNPSC
  {
    slug: "group-1",
    category: "tnpsc",
    name: "Group 1",
    fullName: "TNPSC Group 1 Services",
    description: "Highest TN state civil services — Deputy Collector, DSP and more.",
    eligibility: "Indian citizen / TN domicile preferred",
    ageLimit: "21-32 years",
    qualification: "Bachelor's degree",
    ...mkDefaults("TNPSC Group 1"),
  },
  {
    slug: "group-2",
    category: "tnpsc",
    name: "Group 2",
    fullName: "TNPSC Group 2 Services",
    description: "Combined Civil Services — interview and non-interview posts.",
    eligibility: "Indian citizen",
    ageLimit: "21-32 years",
    qualification: "Bachelor's degree",
    ...mkDefaults("TNPSC Group 2"),
  },
  {
    slug: "group-4",
    category: "tnpsc",
    name: "Group 4",
    fullName: "TNPSC Group 4 Services",
    description: "VAO, Junior Assistant and Typist posts in TN government.",
    eligibility: "Indian citizen",
    ageLimit: "18-32 years",
    qualification: "10th / 12th pass",
    ...mkDefaults("TNPSC Group 4"),
  },
  {
    slug: "ctse",
    category: "tnpsc",
    name: "CTSE",
    fullName: "Combined Technical Services Exam",
    description: "Engineering and technical posts across TN state departments.",
    eligibility: "Indian citizen",
    ageLimit: "21-37 years",
    qualification: "Engineering degree / diploma",
    ...mkDefaults("TNPSC CTSE"),
  },
  // Defence & Armed Forces
  {
    slug: "nda",
    category: "defence",
    name: "NDA",
    fullName: "National Defence Academy",
    description: "Joint Services academy of the Indian Armed Forces for officers training.",
    eligibility: "Unmarried Male & Female candidates born between specified dates.",
    ageLimit: "16.5 to 19.5 years",
    qualification: "12th Class pass of the 10+2 pattern of School Education.",
    ...mkDefaults("NDA"),
    selectionProcess: ["Written Exam (Math & GAT)", "SSB Interview (5-Day)", "Medical Exam"],
  },
  {
    slug: "cds",
    category: "defence",
    name: "CDS",
    fullName: "Combined Defence Services",
    description: "Recruitment of officers into the Army, Navy, and Air Force.",
    eligibility: "Unmarried graduates meeting physical standards.",
    ageLimit: "19 to 25 years",
    qualification: "Bachelor's degree for Army; Engineering degree for Navy/Air Force.",
    ...mkDefaults("CDS"),
    selectionProcess: ["Written Exam", "SSB Interview (5-Day)", "Medical Exam"],
  },
  {
    slug: "afcat",
    category: "defence",
    name: "AFCAT",
    fullName: "Air Force Common Admission Test",
    description: "Officers recruitment for Flying, Technical, and Ground Duty branches.",
    eligibility: "Indian citizen.",
    ageLimit: "20 to 26 years",
    qualification: "Bachelor's degree or B.E. / B.Tech.",
    ...mkDefaults("AFCAT"),
    selectionProcess: ["AFCAT Computer Test", "AFSB Interview (5-Day)", "Medical Exam"],
  },
  {
    slug: "army-agniveer",
    category: "defence",
    name: "Army Agniveer",
    fullName: "Indian Army Agniveer",
    description: "Soldiers recruitment under the Agnipath Scheme for 4 years.",
    eligibility: "Male and Female candidates meeting physical standard requirements.",
    ageLimit: "17.5 to 21 years",
    qualification: "10th pass / 12th pass depending on post.",
    ...mkDefaults("Army Agniveer"),
    selectionProcess: ["Common Entrance Exam", "Physical Fitness Test", "Medical Exam"],
  },
  {
    slug: "navy-agniveer",
    category: "defence",
    name: "Navy Agniveer",
    fullName: "Indian Navy Agniveer",
    description: "Sailors recruitment under the Agnipath Scheme for SSR and MR.",
    eligibility: "Indian citizen.",
    ageLimit: "17.5 to 21 years",
    qualification: "10th pass (MR) / 12th pass with Math & Physics (SSR).",
    ...mkDefaults("Navy Agniveer"),
    selectionProcess: ["INET Computer Test", "Physical Fitness Test", "Medical Exam"],
  },
  {
    slug: "capf",
    category: "defence",
    name: "CAPF AC",
    fullName: "CAPF Assistant Commandant",
    description: "Officers recruitment for BSF, CRPF, CISF, ITBP, and SSB.",
    eligibility: "Indian citizen.",
    ageLimit: "20 to 25 years",
    qualification: "Bachelor's degree in any discipline.",
    ...mkDefaults("CAPF"),
    selectionProcess: ["Written Test (Paper I & II)", "Physical Efficiency Test", "Interview"],
  },
];

export const allExams = exams;

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getExamsByCategory = (slug: string) => exams.filter((e) => e.category === slug);
export const getExam = (category: string, slug: string) =>
  exams.find((e) => e.category === category && e.slug === slug);

export const allNotifications = exams.flatMap((e) =>
  e.notifications.map((n) => ({ ...n, exam: e.name, category: e.category, examSlug: e.slug })),
);
