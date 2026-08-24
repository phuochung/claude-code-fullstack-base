import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, UseGuards, Query,
} from '@nestjs/common';
import { PaginateResult } from 'mongoose';
import { JwtAuthAdminGuard } from '../../auth/guards/jwt-auth.admin.guard';
import { CustomerAdminService } from '../services/customer.admin.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CustomerResponseDto } from '../dto/customer-response.dto';
import { CommonPaginateDto } from '../../../shared/dto/common-paginate.dto';

@UseGuards(JwtAuthAdminGuard)
@Controller('admin/customers')
export class CustomerAdminController {
  constructor(private readonly customerAdminService: CustomerAdminService) {}

  @Post()
  create(@Body() dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    return this.customerAdminService.create(dto);
  }

  @Get()
  getPaging(
    @Query() queryDto: CommonPaginateDto,
  ): Promise<PaginateResult<CustomerResponseDto>> {
    return this.customerAdminService.getPaging(queryDto);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<CustomerResponseDto | null> {
    return this.customerAdminService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customerAdminService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.customerAdminService.remove(id);
  }
}
