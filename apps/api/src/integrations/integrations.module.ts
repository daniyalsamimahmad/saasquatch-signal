import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Connection status for the settings screen: which live integrations are
 * configured on this deployment (keys themselves never leave the server).
 */
@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
class IntegrationsController {
  @Get('status')
  status() {
    return {
      apollo: {
        configured: !!process.env.APOLLO_API_KEY,
        capability: 'Company enrichment by domain (free plan)',
      },
      hunter: {
        configured: !!process.env.HUNTER_API_KEY,
        capability: 'People + work emails by domain (50/mo free)',
      },
      email: {
        configured: true,
        mode: process.env.BREVO_API_KEY ? 'brevo' : 'simulated',
        capability: process.env.BREVO_API_KEY
          ? 'Real sending via Brevo'
          : 'Simulated transport (full pipeline, no real delivery)',
      },
      ai: {
        configured: !!process.env.GEMINI_API_KEY || !!process.env.GROQ_API_KEY,
        mode: process.env.GEMINI_API_KEY ? 'gemini' : process.env.GROQ_API_KEY ? 'groq' : 'off',
        capability: 'Personalized email + LinkedIn copy, NL search, campaign generation',
      },
      zerobounce: {
        configured: !!process.env.ZEROBOUNCE_API_KEY,
        capability: 'Deep mailbox-level email verification (100/mo free)',
      },
    };
  }
}

@Module({ controllers: [IntegrationsController] })
export class IntegrationsModule {}
