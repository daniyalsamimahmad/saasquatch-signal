import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SearchService } from './search.service';
import { EnrichService } from './enrich.service';
import { SearchController } from './search.controller';
import { ApolloProvider } from './providers/apollo.provider';
import { HunterProvider } from './providers/hunter.provider';

@Module({
  imports: [AiModule],
  providers: [SearchService, EnrichService, ApolloProvider, HunterProvider],
  controllers: [SearchController],
  exports: [ApolloProvider, HunterProvider],
})
export class SearchModule {}
