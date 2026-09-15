/**
 * The canonical industry set and the ordered rules that collapse ~290 raw
 * production strings into it. NAICS codes are 2022-revision, US Census
 * Bureau (public domain). Where NAICS is deliberately coarse (most software
 * products sit under 513210 Software Publishers), distinct canonical
 * industries may share a code — the canonical layer is the product taxonomy,
 * NAICS is the standards mapping.
 */

export type CanonicalDef = {
  id: string;
  label: string;
  naicsCode: string;
  naicsTitle: string;
  sector: string;
};

const S_IT = "Software & IT";
const S_VERT = "Vertical SaaS";
const S_DATA = "Data & Infrastructure";
const S_COM = "Commerce & Distribution";
const S_PRO = "Professional Services";

export const CANONICAL: CanonicalDef[] = [
  // ---- Software & IT
  { id: "software-development", label: "Software Development", naicsCode: "541511", naicsTitle: "Custom Computer Programming Services", sector: S_IT },
  { id: "software-publishing", label: "Software Publishing (SaaS)", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_IT },
  { id: "business-productivity-software", label: "Business & Productivity Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_IT },
  { id: "communications-media-software", label: "Communications & Media Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_IT },
  { id: "cybersecurity-software", label: "Security & Cybersecurity Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_IT },
  { id: "software-testing-qa", label: "Software Testing & QA", naicsCode: "541511", naicsTitle: "Custom Computer Programming Services", sector: S_IT },
  { id: "it-consulting", label: "IT Consulting", naicsCode: "541512", naicsTitle: "Computer Systems Design Services", sector: S_IT },
  { id: "it-managed-services", label: "IT Managed Services (MSP / ITAM)", naicsCode: "541513", naicsTitle: "Computer Facilities Management Services", sector: S_IT },
  { id: "computer-training", label: "Computer Training", naicsCode: "611420", naicsTitle: "Computer Training", sector: S_IT },

  // ---- Data & Infrastructure
  { id: "data-analytics-software", label: "Data & Analytics Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_DATA },
  // 513210, not 518210: these raw strings are software *vendors*; 518210 is
  // for firms that operate hosting/compute infrastructure as a service.
  { id: "cloud-infrastructure-software", label: "Cloud, DevOps & Infrastructure", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_DATA },

  // ---- Vertical SaaS
  { id: "healthcare-software", label: "Healthcare Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "fintech-software", label: "FinTech Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "insurtech-software", label: "Insurance Software (InsurTech)", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "legaltech-software", label: "Legal Software (LegalTech)", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "govtech-public-safety", label: "GovTech & Public Safety", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "edtech-software", label: "Education Software (EdTech)", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "proptech-software", label: "Real Estate Software (PropTech)", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "construction-software", label: "Construction Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "logistics-software", label: "Logistics & Supply Chain Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "hr-software", label: "HR & Talent Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "sales-marketing-software", label: "Sales & Marketing Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "commerce-retail-software", label: "Commerce & Retail Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "energy-utilities-software", label: "Energy & Utilities Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "sustainability-software", label: "Sustainability & ESG Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "manufacturing-software", label: "Manufacturing & Industrial Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "compliance-grc-software", label: "Compliance & GRC Software", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },
  { id: "vertical-saas-other", label: "Vertical SaaS (Other Niches)", naicsCode: "513210", naicsTitle: "Software Publishers", sector: S_VERT },

  // ---- Commerce & Distribution
  { id: "software-distribution", label: "Software & Hardware Distribution", naicsCode: "423430", naicsTitle: "Computer and Computer Peripheral Equipment and Software Merchant Wholesalers", sector: S_COM },
  { id: "software-retail", label: "Software Retail", naicsCode: "449210", naicsTitle: "Electronics and Appliance Retailers", sector: S_COM },

  // ---- Professional Services (non-software — the strings behind the law-firm bug)
  { id: "legal-services", label: "Legal Services", naicsCode: "541110", naicsTitle: "Offices of Lawyers", sector: S_PRO },
  { id: "professional-services", label: "Professional Services", naicsCode: "541990", naicsTitle: "All Other Professional, Scientific, and Technical Services", sector: S_PRO },
];

export const CANONICAL_BY_ID = new Map(CANONICAL.map((c) => [c.id, c]));

/**
 * Ordered classification rules over the normalised + spellfixed string.
 * First match wins — order is the specificity ranking.
 */
export const RULES: Array<[RegExp, string]> = [
  // distribution / retail / training first — they contain generic words
  // (wholesale context required: "Lead Distribution Software" is sales tech)
  [/wholesale\w*|merchant|hardware & software distribution/, "software-distribution"],
  [/software retail/, "software-retail"],
  [/training institute|computer training/, "computer-training"],

  // vertical signals
  [/\b(health|healthcare|medical|patient|clinic|mental|veterinary|vet|senior living|practice management|dental|pharma|hospice)\b/, "healthcare-software"],
  [/\binsurance|insurtech\b/, "insurtech-software"],
  [/\b(fintech|finance|financial|trading|mortgage|lending|banking|investment|quant|underwriting|payment)\b/, "fintech-software"],
  [/\b(ediscovery|e discovery|legal|attorney|lawyer)\b/, "legaltech-software"],
  [/\b(government|municipal|public safety|law enforcement|emergency|defense|military|mission|safety)\b/, "govtech-public-safety"],
  [/\b(education\w*|edtech|school|student|learning|childcare)\b/, "edtech-software"],
  [/\b(real estate|property|proptech)\b/, "proptech-software"],
  [/\b(construction|contractor|bidding)\b/, "construction-software"],
  [/\b(supply chain|logistic\w*|transportation|shipping|fulfillment|freight|maritime|fleet|scm)\b/, "logistics-software"],
  [/\b(hr|human resource|workforce|recruit|recruiting|recruitment|talent|employee|payroll|career)\b/, "hr-software"],
  [/\b(crm|customer relationship|customer engagement|sales|marketing|advertising|clienteling|lead distribution|review platform|interactive demo)\b/, "sales-marketing-software"],
  [/\b(ecommerce|e commerce|ebusiness|e business|retail|pos|point of sale|merchandising|order management|trade in)\b/, "commerce-retail-software"],
  [/\b(energy|utility|utilitie|oil|gas|pipeline|solar|electric)\b/, "energy-utilities-software"],
  [/\b(sustainab\w*|esg|carbon|environment\w*|green|waste|climate)\b/, "sustainability-software"],
  [/\b(manufactur\w*|industrial|aerospace|maintenance|facility|cmms)\b/, "manufacturing-software"],
  [/\b(compliance|grc|governance|risk|regulatory|credential\w*|certification|audit)\b/, "compliance-grc-software"],

  // horizontal software categories
  [/\b(security|cyber|cybersecurity)\b/, "cybersecurity-software"],
  [/\b(business intelligence|analytic\w*|data|database|survey|research)\b/, "data-analytics-software"],
  [/\b(devops|cloud|infrastructure|hosting|server|storage|monitoring|network|wireless|geolocation|iot)\b/, "cloud-infrastructure-software"],
  [/\b(telecom|voip|videoconferencing|video conferencing|email|messaging|communication\w*|multimedia|media|content)\b/, "communications-media-software"],
  [/\b(productivity|workflow|project management|document|collaboration|cpq|procurement|accounting|billing|erp|onboarding|business software|performance management|internal)\b/, "business-productivity-software"],
  [/\b(testing|qa|quality assurance)\b/, "software-testing-qa"],

  // long-tail niches
  [/\b(landscap\w*|laundry|museum|cannabis|membership|association|volunteer|collection management|niche)\b/, "vertical-saas-other"],

  // services around software
  [/\b(msp|managed service|itam|itsm|it service|outsourc\w*|facilities)\b/, "it-managed-services"],
  [/\bconsult\w*\b/, "it-consulting"],

  // generic software buckets — packaged products → publishing (513210),
  // custom/services-flavoured strings → development (541511)
  [/\b(publisher\w*|publishing|saas|software as a service|application\w*|enterprise|open source|architectural|multimedia)\b/, "software-publishing"],
  [/\b(vertical|horizontal|b2b)\b/, "vertical-saas-other"],
  [/\b(develop\w*|engineering|programming|custom|web|internet|computer software|company|perusahaan)\b/, "software-development"],
];

/** Non-software strings (no software/tech token at all). */
export const NON_SOFTWARE_RULES: Array<[RegExp, string]> = [
  [/lawyer|attorney|legalattorney|probate|law\b|legal/, "legal-services"],
  [/professional service/, "professional-services"],
];

export const SOFTWAREISH =
  /\b(software|saas|tech\w*|it|app|application|platform|digital)\b/;
