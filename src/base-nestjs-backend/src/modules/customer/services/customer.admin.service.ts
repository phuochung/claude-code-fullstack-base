import { BadRequestException, Injectable } from '@nestjs/common';
import { FilterQuery, PaginateResult } from 'mongoose';
import { CustomerRepository } from '../customer.repository';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CustomerResponseDto } from '../dto/customer-response.dto';
import { CommonPaginateDto } from 'src/shared/dto/common-paginate.dto';
import { CustomFieldValueService } from '../../custom-fields/services/custom-field-value.service';
import { COMMON_CONSTANTS } from 'src/shared/constants/constant';
import { BaseSchemaClass } from 'src/shared/base/base.schema';
import { Customer } from '../schemas/customer.schema';
import { plainToInstance } from 'class-transformer';
import { buildKeywordFilter } from '../../../shared/utils/regex.util';

const MODULE = 'customer';

@Injectable()
export class CustomerAdminService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly customFieldValueService: CustomFieldValueService,
  ) {}

  async create(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const existing = await this.customerRepository.findOne({
      phoneNumber: dto.phoneNumber,
      deleted: false,
    });
    if (existing) {
      throw new BadRequestException('admin.customer.phone_is_existing');
    }

    const { customFields, ...customerData } = dto;
    const customer = await this.customerRepository.create(customerData);
    const id = customer._id.toString();

    if (customFields?.length) {
      await this.customFieldValueService.upsertMany(id, MODULE, customFields);
    }

    const resolvedFields = await this.customFieldValueService.findByEntity(MODULE, id);
    return this.toDto(customer, resolvedFields);
  }

  async getPaging(
    queryDto: CommonPaginateDto,
  ): Promise<PaginateResult<CustomerResponseDto>> {
    const {
      page = 1,
      limit = COMMON_CONSTANTS.ITEMS_PER_PAGE,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      keyword,
    } = queryDto;

    const filter: FilterQuery<any> = { deleted: false };
    const keywordFilter = buildKeywordFilter(keyword, ['name', 'phoneNumber']);
    if (keywordFilter) {
      filter.$or = keywordFilter;
    }

    const result = await this.customerRepository.paginate(filter, {
      page, limit, sortBy, sortOrder,
    });

    const ids = result.docs.map((c: any) => c._id.toString());
    const customFieldMap = ids.length
      ? await this.customFieldValueService.findByEntityIds(MODULE, ids)
      : new Map();

    return {
      ...result,
      docs: result.docs.map((customer) => {
        const id = (customer as any)._id.toString();
        return this.toDto(customer, customFieldMap.get(id) ?? []);
      }),
    };
  }

  async findById(id: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) return null;
    const fields = await this.customFieldValueService.findByEntity(MODULE, id);
    return this.toDto(customer, fields);
  }

  async update(
    _id: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const { customFields, ...customerData } = dto;

    if (customerData.phoneNumber) {
      const duplicate = await this.customerRepository.findOne({
        phoneNumber: customerData.phoneNumber,
        deleted: false,
        _id: { $ne: _id },
      } as any);
      if (duplicate) {
        throw new BadRequestException('admin.customer.phone_is_existing');
      }
    }

    const customer = await this.customerRepository.updateById(_id, customerData);
    if (!customer) {
      throw new BadRequestException('admin.customer.not_found');
    }

    if (customFields?.length) {
      await this.customFieldValueService.upsertMany(_id, MODULE, customFields);
    }

    const fields = await this.customFieldValueService.findByEntity(MODULE, _id);
    return this.toDto(customer, fields);
  }

  async remove(_id: string): Promise<boolean> {
    const result = await this.customerRepository.deleteById(_id);
    if (!result) {
      throw new BadRequestException('admin.customer.not_found');
    }
    return true;
  }

  private toDto(
    customer: Customer & BaseSchemaClass,
    customFields: any[],
  ): CustomerResponseDto {
    const dto = plainToInstance(CustomerResponseDto, customer, {
      excludeExtraneousValues: true,
    });
    dto.customFields = customFields;
    return dto;
  }
}
