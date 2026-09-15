import { Module } from '@nestjs/common';
import { LlmClient } from './llm.client';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  providers: [LlmClient, AiService],
  controllers: [AiController],
  exports: [AiService, LlmClient],
})
export class AiModule {}
