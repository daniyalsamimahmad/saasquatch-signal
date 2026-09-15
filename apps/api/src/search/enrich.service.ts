import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApolloProvider } from './providers/apollo.provider';
import { HunterProvider } from './providers/hunter.provider';

const SENIORITY_MAP: Record<string, string> = {
  executive: 'c_suite',
  senior: 'senior',
  junior: 'entry',
};

/**
 * Live import: pull the real company record (Apollo) and its real people
 * (Hunter) for a domain, upsert both into our index, and report what
 * happened per provider. Everything imported is marked with its source.
 */
@Injectable()
export class EnrichService {
  constructor(
    private prisma: PrismaService,
    private apollo: ApolloProvider,
    private hunter: HunterProvider,
  ) {}

  async enrichDomain(userId: string, rawDomain: string) {
    const domain = rawDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      throw new BadRequestException('Enter a valid domain, e.g. stripe.com');
    }

    const report: Record<string, string> = {};
    let company = await this.prisma.company.findFirst({ where: { domain } });

    // --- company layer via Apollo ---
    const apollo = await this.apollo.enrichOrganization(domain);
    if (apollo.ok && apollo.org) {
      const org = apollo.org as Record<string, any>;
      const data = {
        apolloId: String(org.id ?? ''),
        source: 'apollo',
        name: String(org.name ?? domain),
        domain,
        website: org.website_url ?? null,
        linkedinUrl: org.linkedin_url ?? null,
        industry: org.industry ?? null,
        keywords: Array.isArray(org.keywords) ? org.keywords.slice(0, 25) : [],
        employeeCount: org.estimated_num_employees ?? null,
        revenue: org.annual_revenue_printed ?? null,
        foundedYear: org.founded_year ?? null,
        city: org.city ?? null,
        state: org.state ?? null,
        country: org.country ?? null,
        description: org.short_description?.slice(0, 1000) ?? null,
        techStack: Array.isArray(org.technology_names)
          ? org.technology_names.slice(0, 30)
          : [],
        raw: org,
      };
      company = company
        ? await this.prisma.company.update({ where: { id: company.id }, data })
        : await this.prisma.company.create({ data });
      await this.prisma.creditUsage.create({
        data: { userId, provider: 'apollo', action: 'org_enrich', meta: { domain } },
      });
      report.apollo = `imported ${data.name}`;
    } else {
      report.apollo = apollo.error ?? 'unavailable';
    }

    // --- people layer via Hunter ---
    let importedPeople = 0;
    const hunter = await this.hunter.domainSearch(domain);
    if (hunter.ok && hunter.people) {
      if (!company) {
        company = await this.prisma.company.create({
          data: { name: hunter.organization ?? domain, domain, source: 'hunter' },
        });
      }
      for (const person of hunter.people) {
        if (!person.first_name && !person.last_name) continue;
        const existing = await this.prisma.contact.findFirst({
          where: { email: person.value },
        });
        const data = {
          source: 'hunter',
          companyId: company.id,
          firstName: person.first_name ?? '',
          lastName: person.last_name ?? '',
          title: person.position,
          seniority: person.seniority
            ? (SENIORITY_MAP[person.seniority] ?? person.seniority)
            : null,
          department: person.department,
          email: person.value,
          emailStatus:
            person.confidence >= 90
              ? ('VERIFIED' as const)
              : ('GUESSED' as const),
          phone: person.phone_number,
          linkedinUrl: person.linkedin,
          raw: person as object,
        };
        if (existing) {
          await this.prisma.contact.update({ where: { id: existing.id }, data });
        } else {
          await this.prisma.contact.create({ data });
        }
        importedPeople++;
      }
      await this.prisma.creditUsage.create({
        data: {
          userId,
          provider: 'hunter',
          action: 'domain_search',
          meta: { domain, people: importedPeople },
        },
      });
      report.hunter = `imported ${importedPeople} people`;
    } else {
      report.hunter = hunter.error ?? 'unavailable';
    }

    return {
      company: company
        ? await this.prisma.company.findUnique({
            where: { id: company.id },
            include: { contacts: true, _count: { select: { contacts: true } } },
          })
        : null,
      report,
    };
  }
}
