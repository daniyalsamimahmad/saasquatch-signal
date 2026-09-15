import { Controller, Get, Injectable, Module, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Injectable()
class DashboardService {
  constructor(private prisma: PrismaService) {}

  async stats(userId: string) {
    const [
      companies,
      contacts,
      lists,
      savedLeads,
      campaigns,
      messagesByStatus,
      validations,
      recentMessages,
      creditRows,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.contact.count(),
      this.prisma.list.count({ where: { userId } }),
      this.prisma.listItem.count({ where: { list: { userId } } }),
      this.prisma.campaign.count({ where: { userId } }),
      this.prisma.message.groupBy({
        by: ['status'],
        where: { campaign: { userId } },
        _count: true,
      }),
      this.prisma.validationResult.groupBy({
        by: ['kind', 'verdict'],
        where: { userId },
        _count: true,
      }),
      this.prisma.message.findMany({
        where: { campaign: { userId }, status: { not: 'DRAFT' } },
        include: { contact: { include: { company: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.creditUsage.groupBy({
        by: ['provider'],
        where: { userId },
        _count: true,
      }),
    ]);

    return {
      index: { companies, contacts },
      pipeline: { lists, savedLeads, campaigns },
      messages: Object.fromEntries(
        messagesByStatus.map((m) => [m.status.toLowerCase(), m._count]),
      ),
      validations: validations.map((v) => ({
        kind: v.kind,
        verdict: v.verdict,
        count: v._count,
      })),
      recentMessages,
      creditUsage: Object.fromEntries(creditRows.map((c) => [c.provider, c._count])),
    };
  }
}

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('stats')
  stats(@CurrentUser() u: { id: string }) {
    return this.dashboard.stats(u.id);
  }
}

@Module({ providers: [DashboardService], controllers: [DashboardController] })
export class DashboardModule {}
