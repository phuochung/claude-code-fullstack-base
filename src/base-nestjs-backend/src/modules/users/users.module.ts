import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserRepository } from './user.repository';
import { UserAdminService } from './services/user.admin.service';
import { UserAdminController } from './controllers/user.admin.controller';
import { SeedAdminService } from './seeds/seed-admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserAdminController],
  providers: [UserRepository, UserAdminService, SeedAdminService],
  exports: [UserRepository, SeedAdminService],
})
export class UsersModule {}
