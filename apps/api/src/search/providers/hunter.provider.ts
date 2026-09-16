import { Injectable, Logger } from '@nestjs/common';

export type HunterPerson = {
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  seniority: string | null;
  department: string | null;
  value: string; // email
  confidence: number;
  linkedin: string | null;
  phone_number: string | null;
};

/**
 * Hunter.io Domain Search, real people (names, titles, work emails with a
 * confidence score) for a company domain. Free plan: ~50 credits/month with
 * full API access; activates when HUNTER_API_KEY is configured.
 */
@Injectable()
export class HunterProvider {
  private readonly logger = new Logger(HunterProvider.name);

  get enabled() {
    return !!process.env.HUNTER_API_KEY;
  }

  async domainSearch(domain: string): Promise<{
    ok: boolean;
    people?: HunterPerson[];
    organization?: string | null;
    error?: string;
  }> {
    if (!this.enabled) return { ok: false, error: 'HUNTER_API_KEY not configured' };
    try {
      const res = await fetch(
        `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=10&api_key=${process.env.HUNTER_API_KEY}`,
      );
      const json = (await res.json()) as {
        data?: { emails?: HunterPerson[]; organization?: string | null };
        errors?: Array<{ details: string }>;
      };
      if (!res.ok || json.errors?.length) {
        return { ok: false, error: json.errors?.[0]?.details ?? `HTTP ${res.status}` };
      }
      return {
        ok: true,
        people: json.data?.emails ?? [],
        organization: json.data?.organization ?? null,
      };
    } catch (err) {
      this.logger.warn(`Hunter domain search failed for ${domain}: ${err}`);
      return { ok: false, error: 'Hunter request failed' };
    }
  }
}
