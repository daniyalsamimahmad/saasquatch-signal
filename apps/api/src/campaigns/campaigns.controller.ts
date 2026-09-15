import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CampaignsService } from './campaigns.service';
import type { WritingBrief } from '../ai/ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class CreateCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsObject()
  brief!: WritingBrief;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  steps?: number;

  @IsOptional()
  @IsBoolean()
  aiGenerate?: boolean;
}

class UpdateStepDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subjectTpl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bodyTpl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  waitDays?: number;
}

class AddContactsDto {
  @IsOptional()
  @IsArray()
  contactIds?: string[];

  @IsOptional()
  @IsString()
  listId?: string;
}

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private campaigns: CampaignsService) {}

  @Get()
  all(@CurrentUser() u: { id: string }) {
    return this.campaigns.all(u.id);
  }

  @Post()
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  create(@CurrentUser() u: { id: string }, @Body() dto: CreateCampaignDto) {
    return this.campaigns.create(u.id, dto);
  }

  @Get(':id')
  one(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.campaigns.one(u.id, id);
  }

  @Patch(':id/steps/:stepId')
  updateStep(
    @CurrentUser() u: { id: string },
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateStepDto,
  ) {
    return this.campaigns.updateStep(u.id, id, stepId, dto);
  }

  @Post(':id/contacts')
  addContacts(
    @CurrentUser() u: { id: string },
    @Param('id') id: string,
    @Body() dto: AddContactsDto,
  ) {
    return this.campaigns.addContacts(u.id, id, dto);
  }

  @Post(':id/generate')
  generate(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.campaigns.generateDrafts(u.id, id);
  }

  @Post(':id/launch')
  launch(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.campaigns.launch(u.id, id);
  }

  @Get(':id/messages')
  messages(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.campaigns.messages(u.id, id);
  }

  @Get(':id/linkedin-tasks')
  linkedinTasks(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.campaigns.linkedinTasks(u.id, id);
  }

  @Post(':id/linkedin-tasks/:messageId/copied')
  markCopied(
    @CurrentUser() u: { id: string },
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.campaigns.markCopied(u.id, id, messageId);
  }
}
