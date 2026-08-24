import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BlogClientService } from '../services/blog.client.service';
import { CommonPaginateDto } from 'src/shared/dto/common-paginate.dto';
import { QueryBlogDto } from '../dto/query-blog.dto';
import { KeyAuthClientGuard } from '../../auth/guards/key-auth.client.guard';
import { THROTTLER_CONFIGS } from '../../../shared/constants/throttler.constant';

@Throttle({
  [THROTTLER_CONFIGS.DEFAULT.NAME]: {
    ttl: THROTTLER_CONFIGS.CLIENT.TTL,
    limit: THROTTLER_CONFIGS.CLIENT.LIMIT,
  },
})
@UseGuards(KeyAuthClientGuard)
@Controller('client/blogs')
export class BlogClientController {
  constructor(private readonly blogClientService: BlogClientService) {}

  @Get()
  getBlogs(@Query() queryDto: CommonPaginateDto & QueryBlogDto) {
    return this.blogClientService.getBlogs(queryDto);
  }

  @Get(':slug')
  getDetail(
    @Param('slug') slug: string,
    @Query('lang') lang?: string,
    @Query('previewToken') previewToken?: string,
  ) {
    return this.blogClientService.getDetail(slug, lang || 'vi', previewToken);
  }
}
