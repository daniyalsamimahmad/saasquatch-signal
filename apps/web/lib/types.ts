/**
 * Shapes returned by the NestJS API (mirrors apps/api Prisma models and
 * service return values). One source of truth for every page and component.
 */

export type Plan = "free" | "pro" | "team";

export type EmailStatus = "VERIFIED" | "GUESSED" | "UNAVAILABLE" | "UNKNOWN";

export type Signal = { kind: "hiring" | "funding" | "tech" | "news"; text: string };

export type Company = {
  id: string;
  name: string;
  domain: string | null;
  website: string | null;
  linkedinUrl: string | null;
  industry: string | null;
  keywords: string[];
  employeeCount: number | null;
  revenue: string | null;
  foundedYear: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
  techStack: string[];
  source: string;
  createdAt: string;
};

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  seniority: string | null;
  department: string | null;
  email: string | null;
  emailStatus: EmailStatus;
  phone: string | null;
  linkedinUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  signal: Signal | null;
  source: string;
  companyId: string | null;
  company: Company | null;
};

export type SearchResult<Row> = {
  rows: Row[];
  total: number;
  page: number;
  perPage: number;
};

export type CompanyRow = Company & { _count: { contacts: number } };

export type FacetEntry = { value: string; count: number };

export type Facets = {
  industries: FacetEntry[];
  seniorities: FacetEntry[];
  departments: FacetEntry[];
  locations: FacetEntry[];
  tech: FacetEntry[];
};

export type ListSummary = {
  id: string;
  name: string;
  kind: "people" | "companies";
  createdAt: string;
  updatedAt: string;
  _count: { items: number };
};

export type ListItem = {
  id: string;
  addedAt: string;
  contact: Contact | null;
  company: Company | null;
};

export type ListDetail = Omit<ListSummary, "_count"> & { items: ListItem[] };

export type WritingBrief = {
  offer: string;
  audience?: string;
  tone?: string;
  cta?: string;
  avoidWords?: string;
};

export type Channel = "EMAIL" | "LINKEDIN";

export type MessageStatus =
  | "DRAFT"
  | "QUEUED"
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "OPENED"
  | "FAILED"
  | "COPIED";

export type CampaignStep = {
  id: string;
  order: number;
  channel: Channel;
  waitDays: number;
  subjectTpl: string;
  bodyTpl: string;
};

export type CampaignSummary = {
  id: string;
  name: string;
  status: string;
  brief: WritingBrief | null;
  createdAt: string;
  updatedAt: string;
  _count: { contacts: number; steps: number; messages: number };
};

export type CampaignContact = {
  id: string;
  status: string;
  addedAt: string;
  contact: Contact;
};

export type MessageStat = {
  status: MessageStatus;
  channel: Channel;
  _count: number;
};

export type CampaignDetail = Omit<CampaignSummary, "_count"> & {
  steps: CampaignStep[];
  contacts: CampaignContact[];
  messageStats: MessageStat[];
};

export type Message = {
  id: string;
  channel: Channel;
  subject: string;
  body: string;
  status: MessageStatus;
  error: string | null;
  events: Array<{ event: string; at: string }> | null;
  sentAt: string | null;
  createdAt: string;
  contact: Contact;
  step?: CampaignStep | null;
};

export type EmailVerdict = {
  input: string;
  normalized: string;
  verdict: "valid" | "risky" | "invalid" | "unknown";
  score: number;
  checks: {
    syntax: boolean;
    domainHasMx: boolean | null;
    disposable: boolean;
    roleAccount: boolean;
    deep?: { status: string; subStatus?: string } | null;
  };
  source: string;
};

export type PhoneVerdict = {
  input: string;
  normalized: string | null;
  verdict: "valid" | "invalid";
  score: number;
  details:
    | {
        e164: string;
        national: string;
        country: string | null;
        type: string;
        possible: boolean;
      }
    | { reason: string };
  source: string;
};

export type ValidationRecord = {
  id: string;
  kind: "email" | "phone";
  input: string;
  normalized: string | null;
  verdict: string;
  score: number;
  source: string;
  createdAt: string;
};

export type DashboardStats = {
  index: { companies: number; contacts: number };
  pipeline: { lists: number; savedLeads: number; campaigns: number };
  messages: Partial<Record<Lowercase<MessageStatus>, number>>;
  validations: Array<{ kind: string; verdict: string; count: number }>;
  recentMessages: Message[];
  creditUsage: Record<string, number>;
};

export type IntegrationsStatus = Record<
  string,
  { configured: boolean; capability: string; mode?: string }
>;

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  aiBrief: WritingBrief | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  createdAt: string; // ISO
};

export const EMAIL_STATUS_LABEL: Record<EmailStatus, string> = {
  VERIFIED: "Verified",
  GUESSED: "Guessed",
  UNAVAILABLE: "No email",
  UNKNOWN: "Unknown",
};
