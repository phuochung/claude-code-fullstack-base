import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TagAdminService } from '../services/tag.admin.service';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { JwtAuthAdminGuard } from '../../../modules/auth/guards/jwt-auth.admin.guard';
import { CommonPaginateDto } from 'src/shared/dto/common-paginate.dto';
import { TagResponseDto } from '../dto/tag-response.dto';
import { PaginateResult } from 'mongoose';

@UseGuards(JwtAuthAdminGuard)
@Controller('admin/tags')
export class TagAdminController {
  constructor(private readonly tagAdminService: TagAdminService) {}

  @Post()
  create(@Body() createTagDto: CreateTagDto): Promise<TagResponseDto> {
    return this.tagAdminService.create(createTagDto);
  }

  @Get()
  getPaging(
    @Query() queryDto: CommonPaginateDto,
    @Query('module') module?: string,
  ): Promise<PaginateResult<TagResponseDto>> {
    return this.tagAdminService.getPaging(queryDto, module);
  }

  @Get('all')
  getAll(@Query('module') module?: string): Promise<TagResponseDto[]> {
    return this.tagAdminService.getAll(module);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<TagResponseDto> {
    return this.tagAdminService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return this.tagAdminService.update(id, updateTagDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.tagAdminService.remove(id);
  }
}
