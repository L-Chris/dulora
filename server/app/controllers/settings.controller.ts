import Koa from 'koa';
import { Body, Ctx, Get, JsonController, Post } from 'routing-controllers';
import { Inject, Service } from 'typedi';
import { SearchService } from '../modules/search/application/search.service';
import { SettingsService } from '../modules/settings/application/settings.service';
import { validateDto } from '../shared/validate';
import { SearchQueryDto, SettingsUpdateDto } from './dtos';

@Service()
@JsonController('/search')
export class SearchController {
  @Inject(() => SearchService)
  private searchService!: SearchService;

  @Get('/')
  async search(@Ctx() ctx: Koa.Context) {
    const raw = ctx.query.q;
    const limit = ctx.query.limit;
    const dto = await validateDto(SearchQueryDto, {
      q: Array.isArray(raw) ? raw[0] : raw,
      ...(limit !== undefined ? { limit: Array.isArray(limit) ? limit[0] : limit } : {}),
    });
    return this.searchService.search(dto.q, dto.limit ?? 50);
  }
}

@Service()
@JsonController('/settings')
export class SettingsController {
  @Inject(() => SettingsService)
  private settings!: SettingsService;

  @Get('/')
  get() {
    return this.settings.get();
  }

  @Post('/')
  async update(@Body() body: unknown) {
    const dto = await validateDto(SettingsUpdateDto, body);
    return this.settings.update(dto.timezone);
  }
}
