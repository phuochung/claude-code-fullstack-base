import { Injectable } from '@nestjs/common';
import { BlogStatusEnum } from '../blog/enums/blog-status.enum';
import { BlogRepository } from '../blog/blog.repository';

@Injectable()
export class StatisticService {
  constructor(private readonly blogRepository: BlogRepository) {}

  async getTopViewedBlogs() {
    const result = await this.blogRepository.findAll(
      {
        deleted: false,
        status: BlogStatusEnum.PUBLISHED,
      },
      {
        sort: { viewCount: -1 },
        limit: 10,
        select: 'title slug viewCount category status createdAt updatedAt',
        populate: { path: 'category', select: 'nameVi nameEn' },
        lean: true,
      },
    );
    return result;
  }

  async getBlogCountStatistics() {
    const [total, draft, published, tmpHide] = await Promise.all([
      this.blogRepository.count({}),
      this.blogRepository.count({ status: BlogStatusEnum.DRAFT }),
      this.blogRepository.count({ status: BlogStatusEnum.PUBLISHED }),
      this.blogRepository.count({ status: BlogStatusEnum.TMP_HIDE }),
    ]);

    return {
      total,
      draft,
      published,
      tmpHide,
    };
  }
}
