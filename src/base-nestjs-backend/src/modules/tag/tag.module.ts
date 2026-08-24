import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagAdminService } from './services/tag.admin.service';
import { TagAdminController } from './controllers/tag.admin.controller';
import { Tag, TagSchema } from './schemas/tag.schema';
import { TagRepository } from './tag.repository';
import { Blog, BlogSchema } from '../blog/schemas/blog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      // Read-only, for the delete guard's usage count. Registered by schema
      // rather than by importing BlogModule (which already depends on tags),
      // keeping the dependency one-directional and avoiding a cycle.
      { name: Blog.name, schema: BlogSchema },
    ]),
  ],
  controllers: [TagAdminController],
  providers: [TagAdminService, TagRepository],
  exports: [TagAdminService],
})
export class TagModule {}
