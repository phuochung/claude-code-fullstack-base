import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../shared/base/base.schema';
import { CustomerGenderEnum } from '../enums/customer-gender.enum';
import { CustomerSourceEnum } from '../enums/customer-source.enum';

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop()
  email: string;

  @Prop({ enum: CustomerGenderEnum })
  gender: CustomerGenderEnum;

  @Prop({ enum: CustomerSourceEnum })
  source: CustomerSourceEnum;

  @Prop()
  address: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.add(BaseSchema);
CustomerSchema.index({ name: 1 });
CustomerSchema.index(
  { phoneNumber: 1 },
  { unique: true, partialFilterExpression: { deleted: false } },
);
