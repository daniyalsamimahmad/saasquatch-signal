import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SearchService } from './search.service';
import { EnrichService } from './enrich.service';
import { AiService } from '../ai/ai.service';
import {
  EnrichDomainDto,
  NlSearchDto,
  SearchCompaniesDto,
  SearchPeopleDto,
} from './search.dto';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(
    private search: SearchService,
    private enrich: EnrichService,
    private ai: AiService,
  ) {}

  @Get('people')
  people(@Query() dto: SearchPeopleDto) {
    return this.search.people(dto);
  }

  @Get('companies')
  companies(@Query() dto: SearchCompaniesDto) {
    return this.search.companies(dto);
  }

  @Get('facets')
  facets() {
    return this.search.facets();
  }

  /** Natural-language prompt -> filter state. */
  @Post('nl')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  nl(@Body() dto: NlSearchDto) {
    return this.ai.parseSearchPrompt(dto.prompt, dto.tab);
  }

  /** Live import of real data for one domain (Apollo org + Hunter people). */
  @Post('enrich-domain')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  enrichDomain(
    @CurrentUser() user: { id: string },
    @Body() dto: EnrichDomainDto,
  ) {
    return this.enrich.enrichDomain(user.id, dto.domain);
  }
}
