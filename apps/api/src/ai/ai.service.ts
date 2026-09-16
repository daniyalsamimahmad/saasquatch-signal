import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmClient } from './llm.client';

export type WritingBrief = {
  offer: string; // what we sell / the value proposition
  audience?: string; // who we target
  tone?: string; // direct | friendly | formal | casual
  cta?: string; // desired next step
  avoidWords?: string;
};

type LeadContext = {
  firstName: string;
  title?: string | null;
  companyName?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  city?: string | null;
  state?: string | null;
  signal?: { kind: string; text: string } | null;
};

function stripFence(text: string) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

@Injectable()
export class AiService {
  constructor(
    private llm: LlmClient,
    private prisma: PrismaService,
  ) {}

  get enabled() {
    return this.llm.enabled;
  }

  /**
   * One personalized message. Signal-cited when a concrete fact exists,
   * plain-professional when it doesn't (Clay's SKIP rule: no signal, no
   * fake personalization).
   */
  async writeMessage(input: {
    channel: 'email' | 'linkedin';
    lead: LeadContext;
    brief: WritingBrief;
    improve?: { current: string; instruction: string };
  }): Promise<{ subject: string; body: string }> {
    const { channel, lead, brief } = input;
    const signalLine = lead.signal
      ? `Concrete signal about this lead (cite it naturally in the opener): ${lead.signal.text}`
      : `No specific signal is known — do NOT invent facts about the company; open with a relevant, honest industry observation instead.`;

    const constraints =
      channel === 'email'
        ? `Write a cold outreach EMAIL. 70-120 words. Include a subject line under 8 words.
Structure: personal opener (1 sentence) -> why relevant to them (1-2 sentences) -> ${brief.cta ?? 'a low-friction ask for a short call'} -> sign-off "Best,\\nDaniyal".`
        : `Write a LinkedIn message. Under 280 characters, no subject. One personal hook, one value sentence, one soft ask. No hashtags, no emojis.`;

    const prompt = `You write high-converting, human-sounding B2B outreach. Never sound like AI: no "I hope this finds you well", no exclamation spam, no buzzwords like "synergy"/"revolutionize", no em-dashes.

LEAD
- Name: ${lead.firstName}
- Title: ${lead.title ?? 'unknown'}
- Company: ${lead.companyName ?? 'their company'} (${lead.industry ?? 'industry unknown'}, ${lead.employeeCount ?? '?'} employees, ${[lead.city, lead.state].filter(Boolean).join(', ') || 'location unknown'})
- ${signalLine}

SENDER BRIEF
- Offer: ${brief.offer}
- Target audience: ${brief.audience ?? 'buyers like this lead'}
- Tone: ${brief.tone ?? 'direct but warm'}
${brief.avoidWords ? `- Words to avoid: ${brief.avoidWords}` : ''}

${input.improve ? `CURRENT DRAFT (improve it per this instruction: "${input.improve.instruction}"):\n${input.improve.current}\n` : ''}
${constraints}

Return STRICT JSON: {"subject": string, "body": string}. For LinkedIn, subject must be "".`;

    const raw = await this.llm.complete(prompt, { json: true });
    try {
      const parsed = JSON.parse(stripFence(raw));
      return {
        subject: String(parsed.subject ?? '').slice(0, 150),
        body: String(parsed.body ?? '').slice(0, 4000),
      };
    } catch {
      return { subject: '', body: stripFence(raw).slice(0, 4000) };
    }
  }

  /** Natural-language search: prompt -> filter state (Instantly/Apollo pattern). */
  async parseSearchPrompt(
    prompt: string,
    tab: 'people' | 'companies',
    vocab?: { industries?: string[]; tech?: string[] },
  ) {
    const schema =
      tab === 'people'
        ? `{"titles": string[], "seniorities": ("owner"|"founder"|"c_suite"|"vp"|"director"|"manager"|"senior"|"entry")[], "departments": ("engineering"|"sales"|"marketing"|"finance"|"hr"|"operations"|"product"|"legal")[], "industries": string[], "locations": string[], "employeesMin": number|null, "employeesMax": number|null, "q": string|null}`
        : `{"industries": string[], "locations": string[], "employeesMin": number|null, "employeesMax": number|null, "tech": string[], "q": string|null}`;

    // Ground open-vocabulary filters in what the index actually contains,
    // or "fintech" comes back verbatim and matches zero "Financial Services"
    // rows.
    const grounding = [
      vocab?.industries?.length
        ? `"industries" values MUST come from this exact list (map synonyms to the closest entries, e.g. fintech -> Financial Services; empty array if nothing fits): ${vocab.industries.join(' | ')}`
        : '',
      vocab?.tech?.length
        ? `"tech" values MUST come from this exact list: ${vocab.tech.join(' | ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const raw = await this.llm.complete(
      `Convert this lead-search request into filters. Request: "${prompt}"

Rules: locations as "City, ST" for US cities; a bare US state becomes its 2-letter code (Texas -> TX), other regions stay plain names; employee ranges from phrases like "50-200 person" or "mid-size" (mid-size = 51..500); prefer the seniorities/departments enums over "titles" (add a title only for a role the enums cannot express); leave arrays empty when not mentioned; q only for free-text keywords that fit no filter.
${grounding}
Return STRICT JSON matching: ${schema}`,
      { json: true },
    );
    try {
      return JSON.parse(stripFence(raw));
    } catch {
      return { q: prompt };
    }
  }

  /** Brief -> whole multi-step campaign (lemlist pattern). */
  async generateCampaign(brief: WritingBrief & { steps?: number }) {
    const raw = await this.llm.complete(
      `Design a ${brief.steps ?? 3}-step cold outreach sequence.

Offer: ${brief.offer}
Audience: ${brief.audience ?? 'B2B decision makers'}
Tone: ${brief.tone ?? 'direct but warm'}
CTA: ${brief.cta ?? 'book a 15-minute call'}

Steps alternate value angles (never repeat the same pitch), later steps get shorter, the last one is a polite breakup. Step 1 channel "email"; you may make one middle step "linkedin" (under 280 chars, empty subject). Use {{first_name}}, {{company}}, {{title}} variables naturally.
Write like a busy human: plain punctuation only, never em-dashes, no "I hope this finds you well", no buzzwords.
Return STRICT JSON: {"name": string, "steps": [{"channel": "email"|"linkedin", "waitDays": number, "subjectTpl": string, "bodyTpl": string}]}. waitDays of step 1 is 0.`,
      { json: true },
    );
    const parsed = JSON.parse(stripFence(raw));
    return {
      name: String(parsed.name ?? 'New campaign').slice(0, 120),
      steps: (Array.isArray(parsed.steps) ? parsed.steps : []).slice(0, 6).map(
        (s: any, i: number) => ({
          channel: s.channel === 'linkedin' ? 'LINKEDIN' : 'EMAIL',
          waitDays: i === 0 ? 0 : Math.min(30, Math.max(1, Number(s.waitDays) || 3)),
          subjectTpl: String(s.subjectTpl ?? '').slice(0, 150),
          bodyTpl: String(s.bodyTpl ?? '').slice(0, 4000),
        }),
      ),
    };
  }

  async saveBrief(userId: string, brief: WritingBrief) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { aiBrief: brief as object },
    });
    return { ok: true };
  }
}
