// schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../shared/base/base.schema';
import { UserRoleEnum } from '../enums/user-role.enum';
import { UserStatusEnum } from '../enums/user-status.enum';
import * as bcrypt from 'bcrypt';
import { COMMON_CONSTANTS } from '../../../shared/constants/constant';

@Schema()
export class User {
  @Prop({ required: true })
  email: string;

  @Prop()
  emailLower: string;

  @Prop({ select: false })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: UserRoleEnum.GUEST })
  role: number;

  @Prop({ default: UserStatusEnum.PENDING })
  status: number;

  @Prop()
  phoneNumber: string;

  @Prop()
  lastActiveAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.add(BaseSchema);
UserSchema.index(
  { emailLower: 1 },
  { unique: true, partialFilterExpression: { deleted: false } },
);
UserSchema.index({ role: 1 });

UserSchema.pre('save', function () {
  this.emailLower = this.email.toLowerCase();

  if (this.password && this.isModified('password')) {
    this.password = encryptPassword(this.password);
  }
});

UserSchema.pre('findOneAndUpdate', function () {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const update = this.getUpdate() as any;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (update.password) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    update.password = encryptPassword(update.password);
  }
});

function encryptPassword(password: string): string {
  return bcrypt.hashSync(password, COMMON_CONSTANTS.SALT_ROUND);
}
