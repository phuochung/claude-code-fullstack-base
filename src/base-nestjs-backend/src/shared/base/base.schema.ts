import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

@Schema({ timestamps: true, autoCreate: true }) // adds createdAt and updatedAt automatically
export class BaseSchemaClass {
  _id: string;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: false })
  createdBy?: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: false })
  deletedBy?: Types.ObjectId;

  @Prop({ type: Date, required: false })
  deletedAt?: Date;
}

const BaseSchema = SchemaFactory.createForClass(BaseSchemaClass);
BaseSchema.plugin(mongoosePaginate);
export { BaseSchema };
