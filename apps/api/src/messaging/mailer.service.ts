import { Injectable, Logger } from '@nestjs/common';

export type SendResult =
  | { ok: true; providerId: string; provider: string; simulated: boolean }
  | { ok: false; error: string };

/**
 * One mailer interface, two transports:
 *  - Brevo when BREVO_API_KEY is configured (real sending, 300/day free)
 *  - a simulator otherwise: realistic latency + provider id, so the whole
 *    campaign pipeline (queue -> send -> events -> stats) runs end to end
 *    without a mail account. The message record is marked simulated.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  get mode(): 'brevo' | 'simulated' {
    return process.env.BREVO_API_KEY ? 'brevo' : 'simulated';
  }

  async send(input: {
    toEmail: string;
    toName: string;
    subject: string;
    body: string;
  }): Promise<SendResult> {
    if (this.mode === 'brevo') return this.brevo(input);
    // Simulated transport: 300-900ms latency, always succeeds.
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 600));
    return {
      ok: true,
      providerId: `sim_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
      provider: 'simulated',
      simulated: true,
    };
  }

  private async brevo(input: {
    toEmail: string;
    toName: string;
    subject: string;
    body: string;
  }): Promise<SendResult> {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY as string,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: process.env.BREVO_SENDER_EMAIL,
            name: process.env.BREVO_SENDER_NAME ?? 'SaaSquatch Leads',
          },
          to: [{ email: input.toEmail, name: input.toName }],
          subject: input.subject,
          textContent: input.body,
        }),
      });
      const json = (await res.json()) as { messageId?: string; message?: string };
      if (!res.ok || !json.messageId) {
        return { ok: false, error: json.message ?? `HTTP ${res.status}` };
      }
      return { ok: true, providerId: json.messageId, provider: 'brevo', simulated: false };
    } catch (err) {
      this.logger.warn(`Brevo send failed: ${err}`);
      return { ok: false, error: 'Brevo request failed' };
    }
  }
}
