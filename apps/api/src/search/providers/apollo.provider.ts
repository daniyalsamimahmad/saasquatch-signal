import { Injectable, Logger } from '@nestjs/common';

/**
 * Apollo.io — live-verified capability map for FREE plan keys (Sept 2026):
 * organization enrichment by domain WORKS; people/company search endpoints
 * return API_INACCESSIBLE (paid plans only). So this provider does the one
 * thing the free tier does well: pull a real company record for a domain.
 */
@Injectable()
export class ApolloProvider {
  private readonly logger = new Logger(ApolloProvider.name);

  get enabled() {
    return !!process.env.APOLLO_API_KEY;
  }

  async enrichOrganization(domain: string): Promise<{
    ok: boolean;
    org?: Record<string, unknown>;
    error?: string;
  }> {
    if (!this.enabled) return { ok: false, error: 'APOLLO_API_KEY not configured' };
    try {
      const res = await fetch(
        `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`,
        { headers: { 'X-Api-Key': process.env.APOLLO_API_KEY as string } },
      );
      const json = (await res.json()) as {
        organization?: Record<string, unknown>;
        error?: string;
      };
      if (!res.ok || json.error || !json.organization) {
        return { ok: false, error: json.error ?? `HTTP ${res.status}` };
      }
      return { ok: true, org: json.organization };
    } catch (err) {
      this.logger.warn(`Apollo enrich failed for ${domain}: ${err}`);
      return { ok: false, error: 'Apollo request failed' };
    }
  }
}
