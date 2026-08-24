import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Query,
} from '@nestjs/common';
import { JwtAuthAdminGuard } from '../../auth/guards/jwt-auth.admin.guard';
import { CustomFieldDefinitionAdminService } from '../services/custom-field-definition.admin.service';
import { CreateCustomFieldDefinitionDto } from '../dto/create-custom-field-definition.dto';
import { UpdateCustomFieldDefinitionDto } from '../dto/update-custom-field-definition.dto';
import { CustomFieldDefinitionResponseDto } from '../dto/custom-field-definition-response.dto';
import { QueryCustomFieldDefinitionDto } from '../dto/query-custom-field-definition.dto';

@UseGuards(JwtAuthAdminGuard)
@Controller('admin/custom-field-definitions')
export class CustomFieldDefinitionAdminController {
  constructor(
    private readonly customFieldDefinitionAdminService: CustomFieldDefinitionAdminService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinitionResponseDto> {
    return this.customFieldDefinitionAdminService.create(dto);
  }

  @Get()
  findByModule(
    @Query() query: QueryCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinitionResponseDto[]> {
    return this.customFieldDefinitionAdminService.findByModule(query.module);
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
  ): Promise<CustomFieldDefinitionResponseDto | null> {
    return this.customFieldDefinitionAdminService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinitionResponseDto> {
    return this.customFieldDefinitionAdminService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.customFieldDefinitionAdminService.remove(id);
  }
}
