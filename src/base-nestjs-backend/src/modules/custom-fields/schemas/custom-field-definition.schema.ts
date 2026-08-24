import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../shared/base/base.schema';
import { CustomFieldTypeEnum } from '../enums/custom-field-type.enum';

@Schema({ timestamps: true })
export class CustomFieldDefinition {
  @Prop({ required: true })
  module: string;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true, enum: CustomFieldTypeEnum })
  fieldType: CustomFieldTypeEnum;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ default: false })
  required: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const CustomFieldDefinitionSchema =
  SchemaFactory.createForClass(CustomFieldDefinition);
CustomFieldDefinitionSchema.add(BaseSchema);
CustomFieldDefinitionSchema.index({ module: 1 });
CustomFieldDefinitionSchema.index(
  { module: 1, key: 1 },
  { unique: true, partialFilterExpression: { deleted: false } },
);
