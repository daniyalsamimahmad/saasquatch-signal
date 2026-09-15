import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { AiService } from './ai.service';
import type { WritingBrief } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class WriteDto {
  @IsIn(['email', 'linkedin'])
  channel!: 'email' | 'linkedin';

  @IsString()
  contactId!: string;

  @IsObject()
  brief!: WritingBrief;

  @IsOptional()
  @IsObject()
  improve?: { current: string; instruction: string };
}

class BriefDto {
  @IsString()
  @MaxLength(600)
  offer!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  audience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  tone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  avoidWords?: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private ai: AiService,
    private prisma: PrismaService,
  ) {}

  /** Side-panel writer: one personalized message for one lead. */
  @Post('write')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  async write(@CurrentUser() user: { id: string }, @Body() dto: WriteDto) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: dto.contactId },
      include: { company: true },
    });
    if (!contact) return { error: 'Contact not found' };

    const result = await this.ai.writeMessage({
      channel: dto.channel,
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
      brief: dto.brief,
      improve: dto.improve,
    });
    await this.prisma.creditUsage.create({
      data: { userId: user.id, provider: 'gemini', action: `write_${dto.channel}` },
    });
    return result;
  }

  /** Persist the reusable writing brief (Apollo "AI Content Center" pattern). */
  @Put('brief')
  saveBrief(@CurrentUser() user: { id: string }, @Body() dto: BriefDto) {
    return this.ai.saveBrief(user.id, dto);
  }
}
