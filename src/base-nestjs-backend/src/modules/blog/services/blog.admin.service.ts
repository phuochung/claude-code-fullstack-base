import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, FilterQuery, PaginateResult, Types } from 'mongoose';
import { CreateBlogDto } from '../dto/create-blog.dto';
import { UpdateBlogDto } from '../dto/update-blog.dto';
import { QueryBlogDto } from '../dto/query-blog.dto';
import { BlogStatusEnum } from '../enums/blog-status.enum';
import { BlogRepository } from '../blog.repository';
import { CommonPaginateDto } from 'src/shared/dto/common-paginate.dto';
import { FileMetadataRepository } from '../../storage/file-metadata.repository';
import { UtilsService } from '../../../shared/utils.service';
import { GcsService } from '../../storage/services/gcs.service';
import { Blog, BlogSection } from '../schemas/blog.schema';
import { BlogResponseDto } from '../dto/blog-response.dto';
import { plainToInstance } from 'class-transformer';
import { LoggerService } from 'src/shared/services/logger.service';
import { buildKeywordFilter } from '../../../shared/utils/regex.util';

@Injectable()
export class BlogAdminService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly blogRepository: BlogRepository,
    private readonly fileMetadataRepository: FileMetadataRepository,
    private readonly utilsService: UtilsService,
    private readonly gcsService: GcsService,
    private readonly loggerService: LoggerService,
    private readonly jwtService: JwtService,
  ) {}

  generatePreviewToken(blogId: string, userId: string): string {
    return this.jwtService.sign(
      { sub: userId, role: 'admin', previewBlogId: blogId },
      { expiresIn: '10m' }, // Token valid for 10 minutes
    );
  }

  validateBeforeCreate(): boolean {
    // Add any validation logic here if needed
    return true;
  }

  async create(userId: string, createBlogDto: CreateBlogDto) {
    const slug = this.utilsService.slugify(createBlogDto.title);
    const slugExist = await this.blogRepository.findOne({
      slug,
      deleted: false,
    });
    if (slugExist) {
      throw new BadRequestException('admin.blog.title_is_existing');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const { bannerFileMetadata, category, tags, sections, ...restDto } =
        createBlogDto;

      const blogData: Partial<Blog> = {
        ...restDto,
        language: createBlogDto.language || 'vi',
        slug,
        user: new Types.ObjectId(userId),
        status: createBlogDto.status || BlogStatusEnum.DRAFT,
        category: new Types.ObjectId(category),
        tags: tags?.map((tag) => new Types.ObjectId(tag)) || [],
        sections:
          sections?.map((section) => ({
            ...section,
            fileMetadata: section.fileMetadata
              ? new Types.ObjectId(section.fileMetadata)
              : undefined,
          })) || [],
      };

      if (bannerFileMetadata) {
        blogData.bannerFileMetadata = new Types.ObjectId(bannerFileMetadata);
      }

      const blogCreated = await this.blogRepository.create(blogData, session);
      const setBlogPromises: Promise<any>[] = [];
      if (createBlogDto && createBlogDto.bannerFileMetadata) {
        setBlogPromises.push(
          this.fileMetadataRepository.updateById(
            createBlogDto.bannerFileMetadata,
            {
              blog: blogCreated._id,
            },
            session,
          ),
        );
      }
      if (createBlogDto && createBlogDto.sections) {
        createBlogDto.sections.forEach((section) => {
          if (section.fileMetadata) {
            setBlogPromises.push(
              this.fileMetadataRepository.updateById(
                section.fileMetadata,
                {
                  blog: blogCreated._id,
                },
                session,
              ),
            );
          }
        });
      }

      await Promise.all(setBlogPromises);
      await session.commitTransaction();
      return blogCreated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getPaging(
    queryDto: CommonPaginateDto & QueryBlogDto,
  ): Promise<PaginateResult<BlogResponseDto>> {
    const {
      keyword,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      lang,
    } = queryDto;
    let { statuses, categories, tagIds = [] } = queryDto;

    const filter: FilterQuery<Blog> = { deleted: false };

    if (lang) {
      filter.language = lang;
    }

    const keywordFilter = buildKeywordFilter(keyword, ['title', 'excerpt']);
    if (keywordFilter) {
      filter.$or = keywordFilter;
    }

    if (statuses && typeof statuses === 'string') {
      statuses = [statuses];
    }
    if (statuses && statuses.length > 0) {
      filter.status = { $in: statuses.map((s) => Number(s)) };
    }

    if (categories && typeof categories === 'string') {
      categories = [categories];
    }
    if (categories && categories.length > 0) {
      filter.category = { $in: categories.map((c) => new Types.ObjectId(c)) };
    }

    if (tagIds && typeof tagIds === 'string') {
      tagIds = [tagIds];
    }
    if (tagIds && tagIds.length > 0) {
      filter.tags = { $in: tagIds.map((id) => new Types.ObjectId(id)) };
    }

    const result = await this.blogRepository.paginate(filter, {
      page,
      limit,
      sortBy,
      sortOrder,
      populate: [
        { path: 'category', select: 'nameVi nameEn' },
        { path: 'tags', select: 'nameVi nameEn' },
        { path: 'user', select: 'name email' },
      ],
      lean: true,
    });
    return {
      ...result,
      docs: result.docs.map((blog) =>
        plainToInstance(BlogResponseDto, blog, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  async findOne(_id: string): Promise<BlogResponseDto> {
    const blog = await this.blogRepository.findOne(
      { _id, deleted: false },
      {
        populate: [
          { path: 'category', select: 'nameVi nameEn' },
          { path: 'tags', select: 'nameVi nameEn' },
          { path: 'user', select: 'name email' },
          { path: 'bannerFileMetadata', select: 'url' },
          { path: 'sections.fileMetadata', select: 'url' },
        ],
        lean: true,
      },
    );

    if (!blog) {
      throw new BadRequestException('admin.blog.not_found');
    }

    return plainToInstance(BlogResponseDto, blog, {
      excludeExtraneousValues: true,
    });
  }

  async update(_id: string, updateBlogDto: UpdateBlogDto): Promise<boolean> {
    const oldBlog = await this.blogRepository.findById(_id);
    if (!oldBlog) {
      throw new BadRequestException('admin.blog.not_found');
    }

    if (updateBlogDto.title) {
      const slug = this.utilsService.slugify(updateBlogDto.title);
      const slugExist = await this.blogRepository.findOne({
        deleted: false,
        slug,
        _id: { $ne: _id },
      });

      if (slugExist) {
        throw new BadRequestException('admin.blog.title_is_existing');
      }
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    const filesToDelete: string[] = [];

    let deletedFileMetadatas: any[] = [];

    try {
      const { bannerFileMetadata, category, tags, sections, ...restDto } =
        updateBlogDto;

      const updateData: Partial<Blog> = { ...restDto };

      if (updateBlogDto.title) {
        const slug = this.utilsService.slugify(updateBlogDto.title);
        updateData.slug = slug;
      }

      if (category) {
        updateData.category = new Types.ObjectId(category);
      }

      if (tags) {
        updateData.tags = tags.map((t) => new Types.ObjectId(t));
      }

      if (bannerFileMetadata) {
        updateData.bannerFileMetadata = new Types.ObjectId(bannerFileMetadata);
      }

      if (sections) {
        updateData.sections = sections.map((section) => ({
          ...section,
          fileMetadata: section.fileMetadata
            ? new Types.ObjectId(section.fileMetadata)
            : undefined,
        })) as BlogSection[];
      }

      await this.blogRepository.updateById(_id, updateData, session);

      // Handle File Metadata Updates (Associate new files with this blog)
      const setFilePromises: Promise<any>[] = [];
      if (bannerFileMetadata) {
        setFilePromises.push(
          this.fileMetadataRepository.updateById(
            bannerFileMetadata,
            { blog: new Types.ObjectId(_id) },
            session,
          ),
        );
      }
      if (sections) {
        sections.forEach((section) => {
          if (section.fileMetadata) {
            setFilePromises.push(
              this.fileMetadataRepository.updateById(
                section.fileMetadata,
                { blog: new Types.ObjectId(_id) },
                session,
              ),
            );
          }
        });
      }
      await Promise.all(setFilePromises);

      // COMPARE AND IDENTIFY FILES TO DELETE
      // 1. Banner
      if (updateBlogDto.bannerFileMetadata !== undefined) {
        const oldBannerId = oldBlog.bannerFileMetadata?.toString();
        const newBannerId = updateBlogDto.bannerFileMetadata;

        if (oldBannerId && newBannerId && oldBannerId !== newBannerId) {
          filesToDelete.push(oldBannerId);
        }
      }

      // 2. Sections
      if (updateBlogDto.sections) {
        const oldFileIds = new Set<string>();
        oldBlog.sections.forEach((s) => {
          if (s.fileMetadata) {
            oldFileIds.add(s.fileMetadata.toString());
          }
        });

        const newFileIds = new Set<string>();
        updateBlogDto.sections.forEach((s) => {
          if (s.fileMetadata) {
            newFileIds.add(s.fileMetadata);
          }
        });

        oldFileIds.forEach((id) => {
          if (!newFileIds.has(id)) {
            filesToDelete.push(id);
          }
        });
      }

      // Mark files as deleted in DB within transaction
      if (filesToDelete.length > 0) {
        deletedFileMetadatas = await Promise.all(
          filesToDelete.map((fileId) =>
            this.fileMetadataRepository.updateById(
              fileId,
              { deleted: true, deletedAt: new Date(), blog: null },
              session,
            ),
          ),
        );
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    // POST-COMMIT: Cleanup GCS files
    if (deletedFileMetadatas.length > 0) {
      for (const fileMeta of deletedFileMetadatas) {
        try {
          if (fileMeta) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const subPath = fileMeta.subPath as string;
            if (subPath) {
              await this.gcsService
                .deleteFile(subPath)
                .catch((e) => this.loggerService.error(e));
            }
          }
        } catch (e) {
          this.loggerService.error(`Failed to cleanup file from GCS`);
          this.loggerService.error(e);
        }
      }
    }

    return true;
  }

  async publish(_id: string, userId: string): Promise<boolean> {
    const blog = await this.blogRepository.findById(_id);
    if (!blog) {
      throw new BadRequestException('admin.blog.not_found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (blog.status === BlogStatusEnum.PUBLISHED) {
      throw new BadRequestException('admin.blog.publish_already');
    }

    await this.blogRepository.updateById(_id, {
      status: BlogStatusEnum.PUBLISHED,
      publishedAt: new Date(),
      publishBy: new Types.ObjectId(userId),
    });

    return true;
  }

  async setTmpHide(_id: string, userId: string): Promise<boolean> {
    const blog = await this.blogRepository.findById(_id);
    if (!blog) {
      throw new BadRequestException('admin.blog.not_found');
    }

    await this.blogRepository.updateById(_id, {
      status: BlogStatusEnum.TMP_HIDE,
      tmpHideAt: new Date(),
      tmpHideBy: new Types.ObjectId(userId),
    });

    return true;
  }

  async remove(_id: string): Promise<boolean> {
    const blog = await this.blogRepository.findById(_id);
    if (!blog) {
      throw new BadRequestException('admin.blog.not_found');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    const filesToDelete: string[] = [];

    let deletedFileMetadatas: any[] = [];

    try {
      // Collect all file IDs
      if (blog.bannerFileMetadata) {
        filesToDelete.push(blog.bannerFileMetadata.toString());
      }
      if (blog.sections) {
        blog.sections.forEach((s) => {
          if (s.fileMetadata) {
            filesToDelete.push(s.fileMetadata.toString());
          }
        });
      }

      await this.blogRepository.deleteByIdPermanently(_id, session);

      // Delete file metadata from DB
      if (filesToDelete.length > 0) {
        deletedFileMetadatas = await Promise.all(
          filesToDelete.map((fid) =>
            this.fileMetadataRepository.updateById(
              fid,
              { deleted: true, deletedAt: new Date(), blog: null },
              session,
            ),
          ),
        );
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    // POST-COMMIT: Delete from GCS
    if (deletedFileMetadatas.length > 0) {
      for (const fileMeta of deletedFileMetadatas) {
        try {
          if (fileMeta) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const subPath = fileMeta.subPath as string;
            if (subPath) {
              await this.gcsService
                .deleteFile(subPath)
                .catch((e) => this.loggerService.error(e));
            }
          }
        } catch (e) {
          this.loggerService.error(`Failed to cleanup file from GCS`);
          this.loggerService.error(e);
        }
      }
    }

    return true;
  }
}
