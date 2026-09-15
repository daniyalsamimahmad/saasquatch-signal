/**
 * Deterministic seed: a realistic, filterable lead index the app ships with.
 * Real data imported live (Apollo / Hunter) lands in the same tables with
 * its own `source`, so the demo dataset and real rows coexist cleanly.
 */
import { PrismaClient, EmailStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// mulberry32: reproducible dataset on every seed
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260916);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

const INDUSTRIES = [
  'Software Development', 'Financial Services', 'Healthcare Technology',
  'E-commerce & Retail', 'Cybersecurity', 'Logistics & Supply Chain',
  'Marketing & Advertising', 'Real Estate Technology', 'Education Technology',
  'Energy & Utilities', 'Manufacturing', 'Legal Services', 'HR Technology',
  'Data & Analytics', 'Telecommunications',
] as const;

const METROS = [
  ['Austin', 'TX'], ['Dallas', 'TX'], ['Houston', 'TX'], ['San Francisco', 'CA'],
  ['San Jose', 'CA'], ['Los Angeles', 'CA'], ['San Diego', 'CA'], ['Seattle', 'WA'],
  ['Portland', 'OR'], ['Denver', 'CO'], ['Phoenix', 'AZ'], ['Salt Lake City', 'UT'],
  ['Chicago', 'IL'], ['Minneapolis', 'MN'], ['Columbus', 'OH'], ['Indianapolis', 'IN'],
  ['Nashville', 'TN'], ['Atlanta', 'GA'], ['Miami', 'FL'], ['Tampa', 'FL'],
  ['Charlotte', 'NC'], ['Raleigh', 'NC'], ['Boston', 'MA'], ['New York', 'NY'],
  ['Philadelphia', 'PA'],
] as const;

const TECH = [
  'AWS', 'Salesforce', 'HubSpot', 'Stripe', 'Shopify', 'React', 'PostgreSQL',
  'Snowflake', 'Kubernetes', 'Segment', 'Marketo', 'Zendesk', 'Slack', 'Okta',
  'Datadog', 'Twilio',
] as const;

const STEMS = [
  'Northbeam', 'Bluegrain', 'Quartzline', 'Fernwood', 'Halcyon', 'Ironvale',
  'Lumenreef', 'Cedarstack', 'Brightmoor', 'Kestrelpoint', 'Silvermarsh',
  'Oakridge', 'Vantabrook', 'Coppervein', 'Duskwater', 'Emberfield', 'Glasspine',
  'Hollowbrook', 'Juniperbay', 'Larkspur', 'Mistvale', 'Novabranch', 'Palegrove',
  'Quillstone', 'Ridgefern', 'Saltmeadow', 'Thornbury', 'Umberlake', 'Violetmoor',
  'Wrenfield', 'Ashgate', 'Birchwell', 'Cloverpeak', 'Dovetail', 'Elmcrest',
  'Foxglove', 'Graniteleaf', 'Heronmark', 'Islewood', 'Kilnworth', 'Loamfield',
  'Marrowgate', 'Nettlebay', 'Otterfield', 'Pinemarsh', 'Reedhollow', 'Sablecrest',
  'Tarnwick', 'Umberfield', 'Wolfram',
] as const;

const SUFFIXES = [
  'Labs', 'Systems', 'Technologies', 'Software', 'Solutions', 'Group', 'HQ',
  'Works', 'Digital', 'Platform', 'Analytics', 'Networks',
] as const;

const FIRST = [
  'Avery', 'Jordan', 'Riley', 'Morgan', 'Casey', 'Quinn', 'Rowan', 'Skyler',
  'Emerson', 'Finley', 'Harper', 'Kendall', 'Logan', 'Marlowe', 'Nico', 'Parker',
  'Reese', 'Sawyer', 'Tatum', 'Winter', 'Adrian', 'Bianca', 'Carmen', 'Darius',
  'Elena', 'Felix', 'Greta', 'Hugo', 'Iris', 'Jonas', 'Keira', 'Lucas', 'Mira',
  'Noel', 'Opal', 'Pablo', 'Runa', 'Silas', 'Talia', 'Uma',
] as const;
const LAST = [
  'Calloway', 'Bexley', 'Ashford', 'Delgado', 'Ellison', 'Fairbanks', 'Granger',
  'Holloway', 'Iverson', 'Jennings', 'Kirkland', 'Lockhart', 'Merriweather',
  'Northrop', 'Okafor', 'Pemberton', 'Quintero', 'Rutledge', 'Sinclair',
  'Thackeray', 'Underhill', 'Vasquez', 'Wexford', 'Yarrow', 'Zellner', 'Alcott',
  'Briggs', 'Colfax', 'Draper', 'Easton',
] as const;

const ROLES: Array<{
  title: string; seniority: string; department: string; weight: number;
}> = [
  { title: 'Chief Executive Officer', seniority: 'c_suite', department: 'operations', weight: 3 },
  { title: 'Founder', seniority: 'founder', department: 'operations', weight: 2 },
  { title: 'Chief Technology Officer', seniority: 'c_suite', department: 'engineering', weight: 3 },
  { title: 'Chief Financial Officer', seniority: 'c_suite', department: 'finance', weight: 2 },
  { title: 'VP of Engineering', seniority: 'vp', department: 'engineering', weight: 3 },
  { title: 'VP of Sales', seniority: 'vp', department: 'sales', weight: 3 },
  { title: 'VP of Marketing', seniority: 'vp', department: 'marketing', weight: 2 },
  { title: 'Director of Operations', seniority: 'director', department: 'operations', weight: 3 },
  { title: 'Director of Product', seniority: 'director', department: 'product', weight: 2 },
  { title: 'Engineering Manager', seniority: 'manager', department: 'engineering', weight: 3 },
  { title: 'Sales Manager', seniority: 'manager', department: 'sales', weight: 2 },
  { title: 'Head of People', seniority: 'director', department: 'hr', weight: 2 },
  { title: 'Senior Software Engineer', seniority: 'senior', department: 'engineering', weight: 3 },
  { title: 'Account Executive', seniority: 'entry', department: 'sales', weight: 3 },
  { title: 'Marketing Specialist', seniority: 'entry', department: 'marketing', weight: 2 },
  { title: 'Head of Growth', seniority: 'director', department: 'marketing', weight: 2 },
];

const SIGNALS = [
  (c: { name: string }) => ({ kind: 'hiring', text: `${c.name} has open engineering roles posted this month` }),
  (c: { name: string }) => ({ kind: 'hiring', text: `${c.name} is hiring across sales and customer success` }),
  (c: { name: string; techStack: string[] }) => ({ kind: 'tech', text: `${c.name} runs on ${c.techStack[0] ?? 'a modern stack'}` }),
  (c: { name: string }) => ({ kind: 'news', text: `${c.name} announced a new product line last quarter` }),
  (c: { name: string }) => ({ kind: 'funding', text: `${c.name} closed a growth funding round this year` }),
];

async function main() {
  const companyCount = await prisma.company.count();
  if (companyCount > 0 && !process.argv.includes('--force')) {
    console.log(`Seed skipped: ${companyCount} companies already present (use --force to reseed).`);
    return;
  }
  if (process.argv.includes('--force')) {
    await prisma.$transaction([
      prisma.message.deleteMany(),
      prisma.campaignContact.deleteMany(),
      prisma.campaignStep.deleteMany(),
      prisma.campaign.deleteMany(),
      prisma.listItem.deleteMany(),
      prisma.list.deleteMany(),
      prisma.savedSearch.deleteMany(),
      prisma.validationResult.deleteMany(),
      prisma.creditUsage.deleteMany(),
      prisma.contact.deleteMany(),
      prisma.company.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  }

  // demo account
  const user = await prisma.user.upsert({
    where: { email: 'demo@saasquatch.test' },
    update: {},
    create: {
      email: 'demo@saasquatch.test',
      name: 'Daniyal Samim',
      passwordHash: bcrypt.hashSync('demo1234', 10),
      aiBrief: {
        offer: 'SaaSquatch Leads, a lead sourcing and outreach platform for B2B teams',
        audience: 'sales and growth leaders at B2B companies',
        tone: 'direct but warm',
        cta: 'a 15-minute intro call this week',
      },
    },
  });

  // companies + contacts
  const usedNames = new Set<string>();
  const companies: Array<{ id: string; name: string; techStack: string[] }> = [];
  for (let i = 0; companies.length < 400 && i < 2000; i++) {
    const name = `${pick(STEMS)} ${pick(SUFFIXES)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const [city, state] = pick(METROS);
    const industry = pick(INDUSTRIES);
    const domain = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.example.com';
    const employeeCount = [randInt(2, 10), randInt(11, 50), randInt(11, 50), randInt(51, 200), randInt(51, 200), randInt(201, 1000), randInt(1001, 5000)][randInt(0, 6)];
    const techStack = [...new Set([pick(TECH), pick(TECH), pick(TECH)])];

    const company = await prisma.company.create({
      data: {
        name,
        domain,
        website: `https://${domain}`,
        linkedinUrl: `https://linkedin.com/company/${domain.split('.')[0]}`,
        industry,
        keywords: [industry.toLowerCase(), city.toLowerCase()],
        employeeCount,
        revenue: employeeCount > 1000 ? '$250M+' : employeeCount > 200 ? '$50M-$250M' : employeeCount > 50 ? '$10M-$50M' : '$1M-$10M',
        foundedYear: randInt(1990, 2024),
        city,
        state,
        country: 'United States',
        description: `${name} builds ${industry.toLowerCase()} products for mid-market teams.`,
        techStack,
      },
    });
    companies.push({ id: company.id, name, techStack });
  }

  const weightedRoles = ROLES.flatMap((r) => Array(r.weight).fill(r));
  let contacts = 0;
  for (const company of companies) {
    const n = randInt(2, 4);
    for (let i = 0; i < n; i++) {
      const role = pick(weightedRoles);
      const firstName = pick(FIRST);
      const lastName = pick(LAST);
      const [city, state] = pick(METROS);
      const statusRoll = rand();
      const emailStatus: EmailStatus =
        statusRoll < 0.55 ? 'VERIFIED' : statusRoll < 0.85 ? 'GUESSED' : 'UNAVAILABLE';
      await prisma.contact.create({
        data: {
          companyId: company.id,
          firstName,
          lastName,
          title: role.title,
          seniority: role.seniority,
          department: role.department,
          email:
            emailStatus === 'UNAVAILABLE'
              ? null
              : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.example.com`,
          emailStatus,
          phone: rand() < 0.4 ? `+1512555${String(randInt(1000, 9999))}` : null,
          linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${contacts}`,
          city,
          state,
          country: 'United States',
          signal: rand() < 0.65 ? pick(SIGNALS)(company as never) : undefined,
        },
      });
      contacts++;
    }
  }

  // a starter list so the first login isn't empty
  const list = await prisma.list.create({
    data: { userId: user.id, name: 'Austin engineering leaders', kind: 'people' },
  });
  const austinLeads = await prisma.contact.findMany({
    where: { seniority: { in: ['c_suite', 'vp'] }, company: { city: 'Austin' } },
    take: 8,
  });
  await prisma.listItem.createMany({
    data: austinLeads.map((c) => ({ listId: list.id, contactId: c.id })),
    skipDuplicates: true,
  });

  console.log(`✓ Seeded ${companies.length} companies, ${contacts} contacts`);
  console.log('  · demo user: demo@saasquatch.test / demo1234');
  console.log(`  · starter list "${list.name}" with ${austinLeads.length} leads`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
