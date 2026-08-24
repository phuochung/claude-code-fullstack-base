// src/modules/custom-fields/schemas/custom-field-value.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { BaseSchema } from '../../../shared/base/base.schema';

@Schema({ timestamps: true })
export class CustomFieldValue {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ required: true })
  module: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'CustomFieldDefinition', required: true })
  fieldDefinitionId: Types.ObjectId;

  @Prop({ type: SchemaTypes.Mixed })
  value: any;
}

export const CustomFieldValueSchema =
  SchemaFactory.createForClass(CustomFieldValue);
CustomFieldValueSchema.add(BaseSchema);
CustomFieldValueSchema.index({ entityId: 1 });
CustomFieldValueSchema.index(
  { entityId: 1, fieldDefinitionId: 1 },
  { unique: true, partialFilterExpression: { deleted: false } },
);
