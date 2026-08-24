import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomFieldDefinitionRepository } from '../custom-field-definition.repository';
import { CreateCustomFieldDefinitionDto } from '../dto/create-custom-field-definition.dto';
import { UpdateCustomFieldDefinitionDto } from '../dto/update-custom-field-definition.dto';
import { CustomFieldDefinitionResponseDto } from '../dto/custom-field-definition-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomFieldDefinitionAdminService {
  constructor(
    private readonly customFieldDefinitionRepository: CustomFieldDefinitionRepository,
  ) {}

  async create(
    dto: CreateCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinitionResponseDto> {
    const existing = await this.customFieldDefinitionRepository.findOne({
      module: dto.module,
      key: dto.key,
      deleted: false,
    });
    if (existing) {
      throw new BadRequestException('admin.custom_field_definition.key_is_existing');
    }
    const result = await this.customFieldDefinitionRepository.create(dto);
    return plainToInstance(CustomFieldDefinitionResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async findByModule(module: string): Promise<CustomFieldDefinitionResponseDto[]> {
    const items = await this.customFieldDefinitionRepository.findAll(
      { module, deleted: false },
      { sort: { order: 1 } },
    );
    return items.map((item) =>
      plainToInstance(CustomFieldDefinitionResponseDto, item, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findById(_id: string): Promise<CustomFieldDefinitionResponseDto | null> {
    const result = await this.customFieldDefinitionRepository.findById(_id);
    if (!result) return null;
    return plainToInstance(CustomFieldDefinitionResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    _id: string,
    dto: UpdateCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinitionResponseDto> {
    const result = await this.customFieldDefinitionRepository.updateById(_id, dto);
    if (!result) {
      throw new BadRequestException('admin.custom_field_definition.not_found');
    }
    return plainToInstance(CustomFieldDefinitionResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async remove(_id: string): Promise<boolean> {
    const result = await this.customFieldDefinitionRepository.deleteById(_id);
    if (!result) {
      throw new BadRequestException('admin.custom_field_definition.not_found');
    }
    return true;
  }
}
