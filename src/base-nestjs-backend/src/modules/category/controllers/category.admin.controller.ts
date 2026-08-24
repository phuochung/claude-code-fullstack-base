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
import { CategoryAdminService } from '../services/category.admin.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { JwtAuthAdminGuard } from '../../../modules/auth/guards/jwt-auth.admin.guard';
import { CommonPaginateDto } from 'src/shared/dto/common-paginate.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { PaginateResult } from 'mongoose';

@UseGuards(JwtAuthAdminGuard)
@Controller('admin/categories')
export class CategoryAdminController {
  constructor(private readonly categoryAdminService: CategoryAdminService) {}

  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryAdminService.create(createCategoryDto);
  }

  @Get()
  getPaging(
    @Query() queryDto: CommonPaginateDto,
    @Query('module') module?: string,
  ): Promise<PaginateResult<CategoryResponseDto>> {
    return this.categoryAdminService.getPaging(queryDto, module);
  }

  @Get('all')
  getAll(@Query('module') module?: string): Promise<CategoryResponseDto[]> {
    return this.categoryAdminService.getAll(module);
  }

  @Get(':id')
  findById(@Param('id') _id: string): Promise<CategoryResponseDto | null> {
    return this.categoryAdminService.findById(_id);
  }

  @Patch(':id')
  update(
    @Param('id') _id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryAdminService.update(_id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') _id: string): Promise<boolean> {
    return this.categoryAdminService.remove(_id);
  }
}
