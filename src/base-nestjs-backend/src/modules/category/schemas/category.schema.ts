import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../shared/base/base.schema';
import { CategoryModuleEnum } from '../enums/category-module.enum';

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, enum: CategoryModuleEnum })
  module: CategoryModuleEnum;

  @Prop({ required: true })
  nameEn: string;

  @Prop({ required: true })
  nameVi: string;

  @Prop()
  descriptionEn: string;

  @Prop()
  descriptionVi: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.add(BaseSchema);
CategorySchema.index({ nameEn: 1 });
CategorySchema.index({ nameVi: 1 });
CategorySchema.index({ module: 1 });
