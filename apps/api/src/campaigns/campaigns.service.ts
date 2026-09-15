import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AiService, WritingBrief } from '../ai/ai.service';

export const DAY_MS = Number(process.env.DAY_MS ?? 86_400_000); // demo: set DAY_MS=10000

export function renderTemplate(
  tpl: string,
  vars: Record<string, string | null | undefined>,
) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value && value.length > 0 ? value : `[${key.replace('_', ' ')}]`;
  });
}

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    @InjectQueue('generate') private generateQueue: Queue,
    @InjectQueue('send') private sendQueue: Queue,
  ) {}

  private async owned(userId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  all(userId: string) {
    return this.prisma.campaign.findMany({
      where: { userId },
      include: {
        _count: { select: { contacts: true, steps: true, messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async one(userId: string, id: string) {
    await this.owned(userId, id);
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { order: 'asc' } },
        contacts: {
          include: { contact: { include: { company: true } } },
          orderBy: { addedAt: 'desc' },
        },
      },
    });
    const statusCounts = await this.prisma.message.groupBy({
      by: ['status', 'channel'],
      where: { campaignId: id },
      _count: true,
    });
    return { ...campaign, messageStats: statusCounts };
  }

  /** Create from a 4-field brief; steps AI-generated when providers exist. */
  async create(
    userId: string,
    input: { name?: string; brief: WritingBrief; steps?: number; aiGenerate?: boolean },
  ) {
    let name = input.name?.trim() || 'New campaign';
    let steps: Array<{
      channel: 'EMAIL' | 'LINKEDIN';
      waitDays: number;
      subjectTpl: string;
      bodyTpl: string;
    }> = [];

    if (input.aiGenerate !== false && this.ai.enabled) {
      const generated = await this.ai.generateCampaign({
        ...input.brief,
        steps: input.steps ?? 3,
      });
      name = input.name?.trim() || generated.name;
      steps = generated.steps as typeof steps;
    }
    if (steps.length === 0) {
      steps = [
        {
          channel: 'EMAIL',
          waitDays: 0,
          subjectTpl: 'Quick question, {{first_name}}',
          bodyTpl:
            'Hi {{first_name}},\n\nI noticed {{company}} and wanted to reach out about ' +
            `${input.brief.offer}.\n\nWorth a short call?\n\nBest,\nDaniyal`,
        },
        {
          channel: 'LINKEDIN',
          waitDays: 2,
          subjectTpl: '',
          bodyTpl:
            'Hi {{first_name}}, following up on my email. As {{title}} at {{company}} this seemed relevant. Open to a quick chat?',
        },
        {
          channel: 'EMAIL',
          waitDays: 4,
          subjectTpl: 'Closing the loop',
          bodyTpl:
            'Hi {{first_name}},\n\nLast note from me. If the timing is wrong, a one-line "not now" is perfectly fine.\n\nBest,\nDaniyal',
        },
      ];
    }

    return this.prisma.campaign.create({
      data: {
        userId,
        name,
        brief: input.brief as object,
        steps: { create: steps.map((s, i) => ({ ...s, order: i + 1 })) },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  }

  async updateStep(
    userId: string,
    id: string,
    stepId: string,
    patch: { subjectTpl?: string; bodyTpl?: string; waitDays?: number },
  ) {
    await this.owned(userId, id);
    await this.prisma.campaignStep.update({
      where: { id: stepId },
      data: patch,
    });
    return { ok: true };
  }

  async addContacts(
    userId: string,
    id: string,
    input: { contactIds?: string[]; listId?: string },
  ) {
    await this.owned(userId, id);
    let contactIds = input.contactIds ?? [];
    if (input.listId) {
      const items = await this.prisma.listItem.findMany({
        where: { listId: input.listId, contactId: { not: null } },
        select: { contactId: true },
      });
      contactIds = contactIds.concat(items.map((i) => i.contactId as string));
    }
    if (contactIds.length === 0) {
      throw new BadRequestException('No contacts supplied');
    }
    const result = await this.prisma.campaignContact.createMany({
      data: [...new Set(contactIds)].map((contactId) => ({
        campaignId: id,
        contactId,
      })),
      skipDuplicates: true,
    });
    return { added: result.count };
  }

  /** Queue per-contact draft generation (AI-personalized step 1). */
  async generateDrafts(userId: string, id: string) {
    await this.owned(userId, id);
    const contacts = await this.prisma.campaignContact.findMany({
      where: { campaignId: id, status: { in: ['pending', 'ready'] } },
    });
    if (contacts.length === 0) throw new BadRequestException('Add contacts first');

    await this.prisma.campaignContact.updateMany({
      where: { campaignId: id },
      data: { status: 'generating' },
    });
    await this.generateQueue.addBulk(
      contacts.map((cc) => ({
        name: 'contact-drafts',
        data: { campaignId: id, campaignContactId: cc.id, userId },
      })),
    );
    return { queued: contacts.length };
  }

  /** Launch: queue step-1 sends now, later steps as delayed jobs. */
  async launch(userId: string, id: string) {
    await this.owned(userId, id);
    const messages = await this.prisma.message.findMany({
      where: { campaignId: id, status: 'DRAFT', channel: 'EMAIL' },
      include: { step: true },
    });
    if (messages.length === 0) {
      throw new BadRequestException('Generate drafts before launching');
    }

    let queued = 0;
    for (const message of messages) {
      const delay = (message.step?.waitDays ?? 0) * DAY_MS;
      await this.sendQueue.add(
        'send-email',
        { messageId: message.id },
        { delay, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
      queued++;
    }
    await this.prisma.message.updateMany({
      where: { id: { in: messages.map((m) => m.id) } },
      data: { status: 'QUEUED' },
    });
    await this.prisma.campaign.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    return { queued };
  }

  /** LinkedIn compliant flow: tasks list + mark-copied. */
  async linkedinTasks(userId: string, id: string) {
    await this.owned(userId, id);
    return this.prisma.message.findMany({
      where: { campaignId: id, channel: 'LINKEDIN', status: { in: ['DRAFT', 'COPIED'] } },
      include: { contact: { include: { company: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markCopied(userId: string, id: string, messageId: string) {
    await this.owned(userId, id);
    await this.prisma.message.updateMany({
      where: { id: messageId, campaignId: id, channel: 'LINKEDIN' },
      data: { status: 'COPIED', sentAt: new Date() },
    });
    return { ok: true };
  }

  async messages(userId: string, id: string) {
    await this.owned(userId, id);
    return this.prisma.message.findMany({
      where: { campaignId: id },
      include: { contact: { include: { company: true } }, step: true },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });
  }
}
