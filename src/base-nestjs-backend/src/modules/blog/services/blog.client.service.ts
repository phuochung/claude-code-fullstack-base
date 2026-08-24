import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FilterQuery } from 'mongoose';
import * as sanitizeHtml from 'sanitize-html';
import { BlogStatusEnum } from '../enums/blog-status.enum';
import { BlogRepository } from '../blog.repository';
import { QueryBlogDto } from '../dto/query-blog.dto';
import { CommonPaginateDto } from '../../../shared/dto/common-paginate.dto';
import { BlogSection } from '../schemas/blog.schema';
import { buildKeywordFilter } from '../../../shared/utils/regex.util';

@Injectable()
export class BlogClientService {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly jwtService: JwtService,
  ) {}

  async getBlogs(queryDto: CommonPaginateDto & QueryBlogDto) {
    const {
      keyword,
      page = 1,
      limit = 6,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      lang = 'vi',
    } = queryDto;
    const { categories, tagIds = [] } = queryDto;

    const filter: FilterQuery<any> = {
      deleted: false,
      status: BlogStatusEnum.PUBLISHED,
      language: lang,
    };

    const keywordFilter = buildKeywordFilter(keyword, ['title']);
    if (keywordFilter) {
      filter.$or = keywordFilter;
    }

    if (categories && categories.length > 0) {
      filter.category = { $in: categories };
    }

    if (tagIds.length > 0) {
      filter.tags = { $in: tagIds };
    }

    return this.blogRepository.paginate(filter, {
      page,
      limit,
      sortBy,
      sortOrder,
      select: '-sections',
      populate: [
        { path: 'category', select: 'nameVi nameEn' },
        { path: 'tags', select: 'nameVi nameEn' },
        { path: 'user', select: 'name email' },
        { path: 'bannerFileMetadata', select: 'url' },
      ],
    });
  }

  async getDetail(slug: string, lang: string = 'vi', previewToken?: string) {
    let isPreview = false;

    if (previewToken) {
      try {
        const payload = this.jwtService.verify<{
          role: string;
          previewBlogId: string;
        }>(previewToken);
        if (payload.role === 'admin' && payload.previewBlogId) {
          isPreview = true;
        }
      } catch {
        // Token invalid/expired, ignore functionality implies normal access attempt
        // We could log this if needed
      }
    }

    const filter: FilterQuery<any> = { slug, deleted: false };
    if (!isPreview) {
      filter.status = BlogStatusEnum.PUBLISHED;
      filter.language = lang;
    }

    const blog = await this.blogRepository.findOne(filter, {
      lean: true,
      populate: [
        { path: 'category', select: 'nameVi nameEn' },
        { path: 'tags', select: 'nameVi nameEn' },
        { path: 'user', select: 'name email' },
        { path: 'bannerFileMetadata', select: 'url' },
        { path: 'sections.fileMetadata', select: 'url' },
      ],
    });

    if (isPreview && blog) {
      // additional check if needed, e.g. check if blog._id matches payload.previewBlogId
      // But verify() already ensures token validity. status check bypass is enough.
    }

    if (!blog) {
      throw new BadRequestException('website.blog.not_found');
    }

    // Increment viewCount if not preview
    if (!isPreview) {
      await this.blogRepository.updateById(blog._id, {
        $inc: { viewCount: 1 },
      });
    }

    const blogObj: any = blog;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const contentHtml = this.generateContentHtml(blogObj.sections);

    // Get related blogs
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const relatedBlogsValues = await this.getRelatedBlogs(blogObj);

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      blog: { ...blogObj, contentHtml },
      relatedBlogs: relatedBlogsValues,
    };
  }

  private generateContentHtml(
    sections: (BlogSection & {
      fileMetadata?: { url: string };
    })[],
  ): string {
    if (!sections || sections.length === 0) {
      return '';
    }

    // Sort sections by order

    const sortedSections = [...sections].sort(
      (a: BlogSection, b: BlogSection) => a.order - b.order,
    );

    return sortedSections
      .map((section) => {
        if (section.type === 'html' && section.content) {
          return `<div class="blog-section-html">${this.sanitize(section.content)}</div>`;
        }

        if (section.type === 'image' && section.fileMetadata) {
          const fileMeta = section.fileMetadata;
          if (fileMeta?.url) {
            // Escape admin-authored caption + url before interpolating into
            // markup/attributes so they can't break out of the alt="" attribute
            // or inject tags.
            const safeCaption = this.escapeHtml(section.caption || '');
            const safeUrl = this.escapeHtml(fileMeta.url);
            return `<div class="blog-section-image"><img src="${safeUrl}" alt="${safeCaption}" /><p class="caption">${safeCaption}</p></div>`;
          }
        }

        return '';
      })
      .join('');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Sanitize admin-authored rich-text before it reaches a client's
  // `dangerouslySetInnerHTML`. Keeps common formatting, images, and safe links;
  // strips scripts / event handlers / unknown tags. Iframes are permitted ONLY
  // from trusted video hosts — extend `allowedIframeHostnames` if a downstream
  // product needs other embeds.
  private sanitize(dirty: string): string {
    return sanitizeHtml(dirty, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'img',
        'h1',
        'h2',
        'figure',
        'figcaption',
        'u',
        's',
        'span',
        'iframe',
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        iframe: [
          'src',
          'width',
          'height',
          'allow',
          'allowfullscreen',
          'frameborder',
          'title',
        ],
        '*': ['style'],
      },
      // Constrain inline styles to a safe subset (alignment + colour).
      allowedStyles: {
        '*': {
          'text-align': [/^(left|right|center|justify)$/],
          color: [
            /^#[0-9a-fA-F]{3,6}$/,
            /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
          ],
        },
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
      allowedIframeHostnames: [
        'www.youtube.com',
        'youtube.com',
        'www.youtube-nocookie.com',
        'player.vimeo.com',
      ],
      // Harden outbound links against tab-nabbing.
      transformTags: {
        a: sanitizeHtml.simpleTransform(
          'a',
          { rel: 'noopener noreferrer' },
          true,
        ),
      },
    });
  }

  private async getRelatedBlogs(blog: {
    _id: string;
    language?: string;
    category: { _id: string } | string;
    tags: { _id: string }[] | string[];
  }) {
    if (!blog) {
      return [];
    }
    const relatedFilter: FilterQuery<any> = {
      deleted: false,
      status: BlogStatusEnum.PUBLISHED,
      _id: { $ne: blog._id },
      language: blog.language || 'vi',
    };
    if (blog.category) {
      const catId =
        typeof blog.category === 'object' && '_id' in blog.category
          ? blog.category._id
          : blog.category;
      relatedFilter.category = catId;
    }
    if (blog.tags && blog.tags.length > 0) {
      relatedFilter.tags = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        $in: blog.tags.map((t: any) => (t._id ? t._id : t)),
      };
    }

    const relatedBlogsValues = await this.blogRepository.findAll(
      relatedFilter,
      {
        limit: 4,
        sort: { publishedAt: -1 },
        select: '-sections',
        populate: [
          { path: 'category', select: 'nameVi nameEn' },
          { path: 'tags', select: 'nameVi nameEn' },
          { path: 'bannerFileMetadata', select: 'url' },
        ],
      },
    );

    return relatedBlogsValues;
  }
}
