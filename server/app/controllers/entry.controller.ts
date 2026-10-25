import Koa from 'koa';
import {
  Body,
  Ctx,
  Delete,
  Get,
  JsonController,
  Param,
  Post,
  Put,
} from 'routing-controllers';
import { Inject, Service } from 'typedi';
import { EntryService } from '../modules/entries/application/entry.service';
import { validateDto } from '../shared/validate';
import { CalendarQueryDto, EntryCreateDto, EntryListQueryDto, EntryUpdateDto } from './dtos';

// 注意：不使用 @QueryParams()（依赖 emitDecoratorMetadata，esbuild/tsx 下不可用），
// 统一从 @Ctx() 手动读取 ctx.query 再走 validateDto。
function queryObject(ctx: Koa.Context): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(ctx.query)) {
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return out;
}

@Service()
@JsonController('/entries')
export class EntryController {
  @Inject(() => EntryService)
  private entries!: EntryService;

  @Get('/')
  async list(@Ctx() ctx: Koa.Context) {
    const dto = await validateDto(EntryListQueryDto, queryObject(ctx));
    return this.entries.list({
      from: dto.from,
      to: dto.to,
      tagId: dto.tagId,
      mood: dto.mood,
      page: dto.page ?? 1,
      pageSize: dto.pageSize ?? 20,
    });
  }

  @Get('/:id')
  async get(@Param('id') id: string) {
    return this.entries.get(id);
  }

  @Post('/')
  async create(@Body() body: unknown) {
    const dto = await validateDto(EntryCreateDto, body);
    return this.entries.create(dto);
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = await validateDto(EntryUpdateDto, body);
    return this.entries.update(id, {
      ...(dto.date !== undefined ? { date: dto.date } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.content !== undefined ? { content: dto.content } : {}),
      ...(dto.mood !== undefined ? { mood: dto.mood === '' ? null : dto.mood } : {}),
      ...(dto.weather !== undefined ? { weather: dto.weather === '' ? null : dto.weather } : {}),
      ...(dto.tagIds !== undefined ? { tagIds: dto.tagIds } : {}),
    });
  }

  @Delete('/:id')
  async remove(@Param('id') id: string) {
    await this.entries.remove(id);
    return { deleted: true };
  }
}

@Service()
@JsonController('/calendar')
export class CalendarController {
  @Inject(() => EntryService)
  private entries!: EntryService;

  @Get('/')
  async calendar(@Ctx() ctx: Koa.Context) {
    const dto = await validateDto(CalendarQueryDto, queryObject(ctx));
    return this.entries.calendar(dto.year, dto.month);
  }
}
