import { Injectable, Logger, Module } from '@nestjs/common';
import { BullModule, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { AiModule } from '../ai/ai.module';
import { AiService, WritingBrief } from '../ai/ai.service';
import { MailerService } from '../messaging/mailer.service';
import { renderTemplate } from '../campaigns/campaigns.service';

/**
 * Queue processors. Run in the dedicated worker container (docker-compose)
 * or in-process when INLINE_WORKER=1 (single-dyno hosting).
 */

@Injectable()
@Processor('send', { concurrency: 3, limiter: { max: 5, duration: 1000 } })
class SendProcessor extends WorkerHost {
  private readonly logger = new Logger(SendProcessor.name);

  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
  ) {
    super();
  }

  async process(job: Job<{ messageId: string }>) {
    const message = await this.prisma.message.findUnique({
      where: { id: job.data.messageId },
      include: { contact: true },
    });
    if (!message || message.status === 'SENT') return;
    if (!message.contact.email) {
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: 'FAILED', error: 'Contact has no email address' },
      });
      return;
    }

    await this.prisma.message.update({
      where: { id: message.id },
      data: { status: 'SENDING' },
    });
    const result = await this.mailer.send({
      toEmail: message.contact.email,
      toName: `${message.contact.firstName} ${message.contact.lastName}`,
      subject: message.subject,
      body: message.body,
    });

    if (!result.ok) {
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: 'FAILED', error: result.error },
      });
      throw new Error(result.error); // let BullMQ retry
    }

    const events: Array<{ event: string; at: string; simulated?: boolean }> = [
      { event: 'sent', at: new Date().toISOString() },
    ];
    // The simulator also emits a delivery trail so funnel stats light up.
    if (result.simulated) {
      events.push({ event: 'delivered', at: new Date().toISOString(), simulated: true });
      if (Math.random() < 0.55) {
        events.push({ event: 'opened', at: new Date().toISOString(), simulated: true });
      }
    }
    const last = events[events.length - 1].event;
    await this.prisma.message.update({
      where: { id: message.id },
      data: {
        status: last === 'opened' ? 'OPENED' : last === 'delivered' ? 'DELIVERED' : 'SENT',
        providerId: result.providerId,
        sentAt: new Date(),
        events,
      },
    });
    this.logger.log(`sent ${message.id} via ${result.provider}`);
  }
}

@Injectable()
@Processor('generate', { concurrency: 2, limiter: { max: 8, duration: 60_000 } })
class GenerateProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerateProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {
    super();
  }

  async process(job: Job<{ campaignId: string; campaignContactId: string; userId: string }>) {
    const cc = await this.prisma.campaignContact.findUnique({
      where: { id: job.data.campaignContactId },
      include: {
        contact: { include: { company: true } },
        campaign: { include: { steps: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!cc) return;

    const contact = cc.contact;
    const brief = (cc.campaign.brief ?? { offer: 'our product' }) as WritingBrief;
    const vars = {
      first_name: contact.firstName,
      last_name: contact.lastName,
      company: contact.company?.name ?? null,
      title: contact.title,
    };

    for (const step of cc.campaign.steps) {
      const existing = await this.prisma.message.findFirst({
        where: { campaignId: cc.campaignId, contactId: contact.id, stepId: step.id },
      });
      if (existing) continue;

      let subject = renderTemplate(step.subjectTpl, vars);
      let body = renderTemplate(step.bodyTpl, vars);

      // Deep AI personalization on the first step; templates carry the rest.
      if (step.order === 1 && this.ai.enabled) {
        try {
          const written = await this.ai.writeMessage({
            channel: step.channel === 'LINKEDIN' ? 'linkedin' : 'email',
            lead: {
              firstName: contact.firstName,
              title: contact.title,
              companyName: contact.company?.name,
              industry: contact.company?.industry,
              employeeCount: contact.company?.employeeCount,
              city: contact.city ?? contact.company?.city,
              state: contact.state ?? contact.company?.state,
              signal: contact.signal as { kind: string; text: string } | null,
            },
            brief,
          });
          if (written.body) {
            subject = written.subject || subject;
            body = written.body;
          }
        } catch (err) {
          this.logger.warn(`AI personalization fell back to template: ${err}`);
        }
      }

      await this.prisma.message.create({
        data: {
          campaignId: cc.campaignId,
          stepId: step.id,
          contactId: contact.id,
          channel: step.channel,
          subject,
          body,
          status: 'DRAFT',
        },
      });
    }

    await this.prisma.campaignContact.update({
      where: { id: cc.id },
      data: { status: 'ready' },
    });
  }
}

@Module({
  imports: [
    PrismaModule,
    AiModule,
    BullModule.registerQueue({ name: 'send' }, { name: 'generate' }),
  ],
  providers: [SendProcessor, GenerateProcessor, MailerService],
})
export class ProcessorsModule {}
