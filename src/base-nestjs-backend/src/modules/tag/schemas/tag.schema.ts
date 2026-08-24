import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../shared/base/base.schema';
import { TagModuleEnum } from '../enums/tag-module.enum';

@Schema({ timestamps: true })
export class Tag {
  @Prop({ required: true, enum: TagModuleEnum })
  module: TagModuleEnum;

  @Prop({ required: true })
  nameEn: string;

  @Prop({ required: true })
  nameVi: string;

  @Prop()
  descriptionEn: string;

  @Prop()
  descriptionVi: string;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
TagSchema.add(BaseSchema);
TagSchema.index({ nameEn: 1 });
TagSchema.index({ nameVi: 1 });
TagSchema.index({ module: 1 });
