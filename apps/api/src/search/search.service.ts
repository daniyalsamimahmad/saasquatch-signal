import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SearchCompaniesDto, SearchPeopleDto } from './search.dto';

const SEARCH_TTL_MS = 60_000;
const FACETS_TTL_MS = 10 * 60_000;

function locationClause(locations?: string[]) {
  if (!locations?.length) return undefined;
  const clauses: Record<string, unknown>[] = [];
  for (const loc of locations) {
    const [a, b] = loc.split(',').map((s) => s.trim());
    if (a && b) {
      clauses.push({
        AND: [
          { city: { equals: a, mode: 'insensitive' } },
          { state: { equals: b, mode: 'insensitive' } },
        ],
      });
    } else {
      clauses.push(
        { city: { equals: loc, mode: 'insensitive' } },
        { state: { equals: loc, mode: 'insensitive' } },
        { country: { equals: loc, mode: 'insensitive' } },
      );
    }
  }
  return { OR: clauses };
}

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  private key(prefix: string, payload: unknown) {
    return `${prefix}:${createHash('sha1').update(JSON.stringify(payload)).digest('hex')}`;
  }

  async people(dto: SearchPeopleDto) {
    const cacheKey = this.key('search:people', dto);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.ContactWhereInput = { AND: [] };
    const and = where.AND as Prisma.ContactWhereInput[];

    if (dto.q?.trim()) {
      const q = dto.q.trim();
      and.push({
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { company: { name: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }
    if (dto.titles?.length) {
      and.push({
        OR: dto.titles.map((t) => ({
          title: { contains: t, mode: 'insensitive' as const },
        })),
      });
    }
    if (dto.seniorities?.length) and.push({ seniority: { in: dto.seniorities } });
    if (dto.departments?.length) and.push({ department: { in: dto.departments } });
    const loc = locationClause(dto.locations);
    if (loc) and.push(loc as Prisma.ContactWhereInput);
    if (dto.emailStatus?.length) {
      and.push({
        emailStatus: { in: dto.emailStatus.map((s) => s.toUpperCase()) as never },
      });
    }
    const companyFilter: Prisma.CompanyWhereInput = {};
    if (dto.industries?.length) {
      companyFilter.industry = { in: dto.industries, mode: 'insensitive' };
    }
    if (dto.employeesMin !== undefined || dto.employeesMax !== undefined) {
      companyFilter.employeeCount = {
        ...(dto.employeesMin !== undefined ? { gte: dto.employeesMin } : {}),
        ...(dto.employeesMax !== undefined ? { lte: dto.employeesMax } : {}),
      };
    }
    if (dto.tech?.length) companyFilter.techStack = { hasSome: dto.tech };
    if (Object.keys(companyFilter).length > 0) and.push({ company: companyFilter });

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 25;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.contact.count({ where }),
      this.prisma.contact.findMany({
        where,
        include: { company: true },
        orderBy: [{ emailStatus: 'asc' }, { lastName: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const result = { rows, total, page, perPage };
    await this.cache.set(cacheKey, result, SEARCH_TTL_MS);
    return result;
  }

  async companies(dto: SearchCompaniesDto) {
    const cacheKey = this.key('search:companies', dto);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.CompanyWhereInput = { AND: [] };
    const and = where.AND as Prisma.CompanyWhereInput[];

    if (dto.q?.trim()) {
      const q = dto.q.trim();
      and.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { domain: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { keywords: { hasSome: [q.toLowerCase()] } },
        ],
      });
    }
    if (dto.industries?.length) {
      and.push({ industry: { in: dto.industries, mode: 'insensitive' } });
    }
    const loc = locationClause(dto.locations);
    if (loc) and.push(loc as Prisma.CompanyWhereInput);
    if (dto.employeesMin !== undefined || dto.employeesMax !== undefined) {
      and.push({
        employeeCount: {
          ...(dto.employeesMin !== undefined ? { gte: dto.employeesMin } : {}),
          ...(dto.employeesMax !== undefined ? { lte: dto.employeesMax } : {}),
        },
      });
    }
    if (dto.tech?.length) and.push({ techStack: { hasSome: dto.tech } });
    if (dto.foundedMin) and.push({ foundedYear: { gte: dto.foundedMin } });
    if (dto.foundedMax) and.push({ foundedYear: { lte: dto.foundedMax } });

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 25;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        include: { _count: { select: { contacts: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const result = { rows, total, page, perPage };
    await this.cache.set(cacheKey, result, SEARCH_TTL_MS);
    return result;
  }

  /** Filter-rail options, cached hard, these change only on import. */
  async facets() {
    const cacheKey = 'search:facets';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [industries, seniorities, departments, locations, tech] =
      await Promise.all([
        this.prisma.company.groupBy({
          by: ['industry'],
          _count: true,
          orderBy: { _count: { industry: 'desc' } },
          where: { industry: { not: null } },
          take: 40,
        }),
        this.prisma.contact.groupBy({
          by: ['seniority'],
          _count: true,
          where: { seniority: { not: null } },
          orderBy: { _count: { seniority: 'desc' } },
        }),
        this.prisma.contact.groupBy({
          by: ['department'],
          _count: true,
          where: { department: { not: null } },
          orderBy: { _count: { department: 'desc' } },
        }),
        this.prisma.company.groupBy({
          by: ['city', 'state'],
          _count: true,
          where: { city: { not: null } },
          orderBy: { _count: { city: 'desc' } },
          take: 40,
        }),
        this.prisma.$queryRaw<{ tech: string; n: bigint }[]>`
          SELECT unnest("techStack") AS tech, COUNT(*) AS n
          FROM "Company" GROUP BY 1 ORDER BY 2 DESC LIMIT 30`,
      ]);

    const result = {
      industries: industries.map((i) => ({ value: i.industry, count: i._count })),
      seniorities: seniorities.map((s) => ({ value: s.seniority, count: s._count })),
      departments: departments.map((d) => ({ value: d.department, count: d._count })),
      locations: locations.map((l) => ({
        value: `${l.city}, ${l.state}`,
        count: l._count,
      })),
      tech: tech.map((t) => ({ value: t.tech, count: Number(t.n) })),
    };
    await this.cache.set(cacheKey, result, FACETS_TTL_MS);
    return result;
  }
}
