import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CustomFieldDefinition,
  CustomFieldDefinitionSchema,
} from './schemas/custom-field-definition.schema';
import {
  CustomFieldValue,
  CustomFieldValueSchema,
} from './schemas/custom-field-value.schema';
import { CustomFieldDefinitionRepository } from './custom-field-definition.repository';
import { CustomFieldValueRepository } from './custom-field-value.repository';
import { CustomFieldDefinitionAdminService } from './services/custom-field-definition.admin.service';
import { CustomFieldValueService } from './services/custom-field-value.service';
import { CustomFieldDefinitionAdminController } from './controllers/custom-field-definition.admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomFieldDefinition.name, schema: CustomFieldDefinitionSchema },
      { name: CustomFieldValue.name, schema: CustomFieldValueSchema },
    ]),
  ],
  controllers: [CustomFieldDefinitionAdminController],
  providers: [
    CustomFieldDefinitionRepository,
    CustomFieldValueRepository,
    CustomFieldDefinitionAdminService,
    CustomFieldValueService,
  ],
  exports: [CustomFieldValueService, CustomFieldDefinitionAdminService],
})
export class CustomFieldsModule {}
