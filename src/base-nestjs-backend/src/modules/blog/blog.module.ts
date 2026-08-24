import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { getJwtSecret, JWT_CONSTANTS } from '../../shared/constants/constant';
import { BlogAdminService } from './services/blog.admin.service';
import { BlogAdminController } from './controllers/blog.admin.controller';
import { BlogClientController } from './controllers/blog.client.controller';
import { BlogClientService } from './services/blog.client.service';
import { Blog, BlogSchema } from './schemas/blog.schema';
import { BlogRepository } from './blog.repository';
import { StorageModule } from '../storage/storage.module';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    StorageModule,
    SharedModule,
    JwtModule.registerAsync({
      // Async so the secret is resolved after ConfigModule has loaded .env
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: JWT_CONSTANTS.EXPIRE },
      }),
    }),
  ],
  controllers: [BlogAdminController, BlogClientController],
  providers: [BlogAdminService, BlogClientService, BlogRepository],
  exports: [BlogAdminService, BlogRepository],
})
export class BlogModule {}
