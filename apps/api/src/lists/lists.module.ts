import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  Injectable,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class CreateListDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsIn(['people', 'companies'])
  kind!: 'people' | 'companies';
}

class RenameListDto {
  @IsString()
  @MaxLength(120)
  name!: string;
}

class AddItemsDto {
  @IsOptional()
  @IsArray()
  contactIds?: string[];

  @IsOptional()
  @IsArray()
  companyIds?: string[];
}

@Injectable()
class ListsService {
  constructor(private prisma: PrismaService) {}

  async all(userId: string) {
    return this.prisma.list.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async one(userId: string, id: string) {
    const list = await this.prisma.list.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: { contact: { include: { company: true } }, company: true },
          orderBy: { addedAt: 'desc' },
        },
      },
    });
    if (!list) throw new NotFoundException('List not found');
    return list;
  }

  create(userId: string, dto: CreateListDto) {
    return this.prisma.list.create({ data: { userId, ...dto } });
  }

  async rename(userId: string, id: string, name: string) {
    const { count } = await this.prisma.list.updateMany({
      where: { id, userId },
      data: { name },
    });
    if (!count) throw new NotFoundException('List not found');
    return { ok: true };
  }

  async remove(userId: string, id: string) {
    const { count } = await this.prisma.list.deleteMany({ where: { id, userId } });
    if (!count) throw new NotFoundException('List not found');
    return { ok: true };
  }

  async addItems(userId: string, id: string, dto: AddItemsDto) {
    const list = await this.prisma.list.findFirst({ where: { id, userId } });
    if (!list) throw new NotFoundException('List not found');

    let added = 0;
    for (const contactId of dto.contactIds ?? []) {
      const result = await this.prisma.listItem.createMany({
        data: [{ listId: id, contactId }],
        skipDuplicates: true,
      });
      added += result.count;
    }
    for (const companyId of dto.companyIds ?? []) {
      const result = await this.prisma.listItem.createMany({
        data: [{ listId: id, companyId }],
        skipDuplicates: true,
      });
      added += result.count;
    }
    await this.prisma.list.update({ where: { id }, data: { updatedAt: new Date() } });
    return { added };
  }

  async removeItem(userId: string, id: string, itemId: string) {
    const list = await this.prisma.list.findFirst({ where: { id, userId } });
    if (!list) throw new NotFoundException('List not found');
    await this.prisma.listItem.deleteMany({ where: { id: itemId, listId: id } });
    return { ok: true };
  }
}

@ApiTags('lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lists')
class ListsController {
  constructor(private lists: ListsService) {}

  @Get()
  all(@CurrentUser() u: { id: string }) {
    return this.lists.all(u.id);
  }

  @Post()
  create(@CurrentUser() u: { id: string }, @Body() dto: CreateListDto) {
    return this.lists.create(u.id, dto);
  }

  @Get(':id')
  one(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.lists.one(u.id, id);
  }

  @Patch(':id')
  rename(
    @CurrentUser() u: { id: string },
    @Param('id') id: string,
    @Body() dto: RenameListDto,
  ) {
    return this.lists.rename(u.id, id, dto.name);
  }

  @Delete(':id')
  remove(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.lists.remove(u.id, id);
  }

  @Post(':id/items')
  addItems(
    @CurrentUser() u: { id: string },
    @Param('id') id: string,
    @Body() dto: AddItemsDto,
  ) {
    return this.lists.addItems(u.id, id, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @CurrentUser() u: { id: string },
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.lists.removeItem(u.id, id, itemId);
  }
}

@Module({ providers: [ListsService], controllers: [ListsController] })
export class ListsModule {}
