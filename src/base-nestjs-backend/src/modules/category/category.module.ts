import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryAdminService } from './services/category.admin.service';
import { CategoryAdminController } from './controllers/category.admin.controller';
import { Category, CategorySchema } from './schemas/category.schema';
import { CategoryRepository } from './category.repository';
import { Blog, BlogSchema } from '../blog/schemas/blog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      // Read-only, for the delete guard's usage count. Registered by schema
      // rather than by importing BlogModule (which already depends on
      // categories), keeping the dependency one-directional.
      { name: Blog.name, schema: BlogSchema },
    ]),
  ],
  controllers: [CategoryAdminController],
  providers: [CategoryAdminService, CategoryRepository],
  exports: [CategoryAdminService],
})
export class CategoryModule {}
