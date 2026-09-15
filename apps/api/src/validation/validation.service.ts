import { Injectable } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import {
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { PrismaService } from '../prisma/prisma.service';

// A compact disposable-domain blocklist (top offenders); production would
// sync a maintained list on a schedule.
const DISPOSABLE = new Set([
  'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'throwawaymail.com', 'getnada.com',
  'trashmail.com', 'sharklasers.com', 'dispostable.com', 'maildrop.cc',
]);

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export type EmailVerdict = {
  input: string;
  normalized: string;
  verdict: 'valid' | 'risky' | 'invalid' | 'unknown';
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

/**
 * Tiered validation:
 *   instant  — syntax + MX DNS + disposable + role-account checks (free,
 *              unlimited, self-hosted; no SMTP handshake because cloud
 *              hosts block outbound port 25 and catch-alls defeat it)
 *   deep     — ZeroBounce mailbox-level check when a key is configured
 *              (free tier: 100/month), cached in Postgres.
 */
@Injectable()
export class ValidationService {
  constructor(private prisma: PrismaService) {}

  async validateEmail(userId: string, input: string, deep = false): Promise<EmailVerdict> {
    const normalized = input.trim().toLowerCase();
    const checks: EmailVerdict['checks'] = {
      syntax: EMAIL_RE.test(normalized),
      domainHasMx: null,
      disposable: false,
      roleAccount: false,
      deep: null,
    };

    let verdict: EmailVerdict['verdict'] = 'invalid';
    let score = 0;
    let source = 'local';

    if (checks.syntax) {
      const [local, domain] = normalized.split('@');
      checks.disposable = DISPOSABLE.has(domain);
      checks.roleAccount = /^(info|admin|support|sales|contact|hello|team|office|billing|noreply|no-reply)$/.test(local);
      try {
        const mx = await dns.resolveMx(domain);
        checks.domainHasMx = mx.length > 0;
      } catch {
        checks.domainHasMx = false;
      }

      if (!checks.domainHasMx) {
        verdict = 'invalid';
        score = 5;
      } else if (checks.disposable) {
        verdict = 'risky';
        score = 25;
      } else if (checks.roleAccount) {
        verdict = 'risky';
        score = 55;
      } else {
        verdict = 'valid';
        score = 80; // mailbox-level certainty needs the deep tier
      }

      if (deep && process.env.ZEROBOUNCE_API_KEY && checks.domainHasMx) {
        const zb = await this.zeroBounce(normalized);
        if (zb) {
          checks.deep = zb;
          source = 'zerobounce';
          const map: Record<string, [EmailVerdict['verdict'], number]> = {
            valid: ['valid', 97],
            invalid: ['invalid', 3],
            'catch-all': ['risky', 60],
            unknown: ['unknown', 50],
            spamtrap: ['invalid', 1],
            abuse: ['risky', 30],
            do_not_mail: ['risky', 20],
          };
          [verdict, score] = map[zb.status] ?? ['unknown', 50];
          await this.prisma.creditUsage.create({
            data: { userId, provider: 'zerobounce', action: 'validate' },
          });
        }
      }
    }

    const result: EmailVerdict = { input, normalized, verdict, score, checks, source };
    await this.prisma.validationResult.create({
      data: {
        userId,
        kind: 'email',
        input,
        normalized,
        verdict,
        score,
        source,
        details: checks as object,
      },
    });
    return result;
  }

  private async zeroBounce(email: string) {
    try {
      const res = await fetch(
        `https://api.zerobounce.net/v2/validate?api_key=${process.env.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`,
      );
      const json = (await res.json()) as { status?: string; sub_status?: string };
      if (!json.status) return null;
      return { status: json.status, subStatus: json.sub_status };
    } catch {
      return null;
    }
  }

  async validatePhone(userId: string, input: string, defaultCountry = 'US') {
    const parsed = parsePhoneNumberFromString(input, defaultCountry as never);
    const valid = parsed?.isValid() ?? false;
    const result = {
      input,
      normalized: parsed?.number ?? null,
      verdict: valid ? ('valid' as const) : ('invalid' as const),
      score: valid ? 90 : 5,
      details: parsed
        ? {
            e164: parsed.number,
            national: parsed.formatNational(),
            country: parsed.country ?? null,
            type: parsed.getType() ?? 'unknown',
            possible: parsed.isPossible(),
          }
        : { reason: 'unparseable' },
      // Honest label: offline validation proves format + allocated range,
      // not that the line is live (that's a paid carrier lookup).
      source: 'libphonenumber',
    };
    await this.prisma.validationResult.create({
      data: {
        userId,
        kind: 'phone',
        input,
        normalized: result.normalized,
        verdict: result.verdict,
        score: result.score,
        source: result.source,
        details: result.details as object,
      },
    });
    return result;
  }

  async history(userId: string, kind?: string) {
    return this.prisma.validationResult.findMany({
      where: { userId, ...(kind ? { kind } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
