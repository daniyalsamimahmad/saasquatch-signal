import {
  Body,
  Controller,
  Get,
  Module,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { ValidationService } from './validation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class EmailDto {
  @IsString()
  email!: string;

  @IsOptional()
  @IsBoolean()
  deep?: boolean;
}

class PhoneDto {
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  country?: string;
}

class BulkDto {
  @IsIn(['email', 'phone'])
  kind!: 'email' | 'phone';

  @IsArray()
  values!: string[];
}

@ApiTags('validate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('validate')
class ValidationController {
  constructor(private validation: ValidationService) {}

  @Post('email')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  email(@CurrentUser() u: { id: string }, @Body() dto: EmailDto) {
    return this.validation.validateEmail(u.id, dto.email, dto.deep ?? false);
  }

  @Post('phone')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  phone(@CurrentUser() u: { id: string }, @Body() dto: PhoneDto) {
    return this.validation.validatePhone(u.id, dto.phone, dto.country ?? 'US');
  }

  /** Small synchronous bulk (<=25); larger batches belong on the queue. */
  @Post('bulk')
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  async bulk(@CurrentUser() u: { id: string }, @Body() dto: BulkDto) {
    const values = dto.values.slice(0, 25);
    const results = [];
    for (const value of values) {
      results.push(
        dto.kind === 'email'
          ? await this.validation.validateEmail(u.id, value, false)
          : await this.validation.validatePhone(u.id, value),
      );
    }
    return { results };
  }

  @Get('history')
  history(@CurrentUser() u: { id: string }, @Query('kind') kind?: string) {
    return this.validation.history(u.id, kind);
  }
}

@Module({ providers: [ValidationService], controllers: [ValidationController] })
export class ValidationModule {}
