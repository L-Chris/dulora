import { Body, Delete, Get, JsonController, Param, Post, Put } from 'routing-controllers';
import { Inject, Service } from 'typedi';
import { TagService } from '../modules/tags/application/tag.service';
import { validateDto } from '../shared/validate';
import { TagCreateDto, TagUpdateDto } from './dtos';

@Service()
@JsonController('/tags')
export class TagController {
  @Inject(() => TagService)
  private tags!: TagService;

  @Get('/')
  list() {
    return this.tags.list();
  }

  @Post('/')
  async create(@Body() body: unknown) {
    const dto = await validateDto(TagCreateDto, body);
    return this.tags.create(dto.name, dto.color ?? null);
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = await validateDto(TagUpdateDto, body);
    return this.tags.update(id, dto.name, dto.color ?? null);
  }

  @Delete('/:id')
  async remove(@Param('id') id: string) {
    await this.tags.remove(id);
    return { deleted: true };
  }
}
