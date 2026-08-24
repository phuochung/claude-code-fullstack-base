import { Injectable } from '@nestjs/common';
import { CustomFieldValueRepository } from '../custom-field-value.repository';
import { SetCustomFieldValueDto } from '../dto/set-custom-field-value.dto';
import { CustomFieldValueResponseDto } from '../dto/custom-field-value-response.dto';
import { Types } from 'mongoose';

@Injectable()
export class CustomFieldValueService {
  constructor(
    private readonly customFieldValueRepository: CustomFieldValueRepository,
  ) {}

  async upsertMany(
    entityId: string,
    module: string,
    items: SetCustomFieldValueDto[],
  ): Promise<void> {
    await Promise.all(
      items.map(async (item) => {
        const existing = await this.customFieldValueRepository.findOne({
          entityId: new Types.ObjectId(entityId),
          fieldDefinitionId: new Types.ObjectId(item.definitionId),
          deleted: false,
        });

        if (existing) {
          await this.customFieldValueRepository.updateById(
            existing._id.toString(),
            { value: item.value },
          );
        } else {
          await this.customFieldValueRepository.create({
            entityId: new Types.ObjectId(entityId),
            module,
            fieldDefinitionId: new Types.ObjectId(item.definitionId),
            value: item.value,
          } as any);
        }
      }),
    );
  }

  async findByEntity(
    module: string,
    entityId: string,
  ): Promise<CustomFieldValueResponseDto[]> {
    const values = await this.customFieldValueRepository.findAllWithPopulate({
      entityId: new Types.ObjectId(entityId),
      module,
      deleted: false,
    });

    return values.map((v: any) => ({
      key: v.fieldDefinitionId?.key,
      label: v.fieldDefinitionId?.label,
      fieldType: v.fieldDefinitionId?.fieldType,
      value: v.value,
    }));
  }

  async findByEntityIds(
    module: string,
    entityIds: string[],
  ): Promise<Map<string, CustomFieldValueResponseDto[]>> {
    const values = await this.customFieldValueRepository.findAllWithPopulate({
      entityId: { $in: entityIds.map((id) => new Types.ObjectId(id)) },
      module,
      deleted: false,
    });

    const map = new Map<string, CustomFieldValueResponseDto[]>();
    for (const v of values as any[]) {
      const key = v.entityId.toString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        key: v.fieldDefinitionId?.key,
        label: v.fieldDefinitionId?.label,
        fieldType: v.fieldDefinitionId?.fieldType,
        value: v.value,
      });
    }
    return map;
  }
}
