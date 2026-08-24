import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PaginateResult } from 'mongoose';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { TagRepository } from '../tag.repository';
import { CommonPaginateDto } from 'src/shared/dto/common-paginate.dto';
import { TagResponseDto } from '../dto/tag-response.dto';
import { plainToInstance } from 'class-transformer';
import { BaseSchemaClass } from 'src/shared/base/base.schema';
import { Blog } from '../../blog/schemas/blog.schema';
import { buildKeywordFilter } from '../../../shared/utils/regex.util';

@Injectable()
export class TagAdminService {
  constructor(
    private readonly tagRepository: TagRepository,
    // Read-only: the delete guard's usage count. See TagModule for why the
    // schema is registered there instead of importing the owning module.
    @InjectModel(Blog.name)
    private readonly blogModel: Model<Blog & BaseSchemaClass>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<TagResponseDto> {
    const existingTag = await this.tagRepository.findOne({
      nameVi: createTagDto.nameVi,
    });
    if (existingTag) {
      throw new BadRequestException('admin.tag.name_vi_is_existing');
    }

    const tag = await this.tagRepository.create(createTagDto);
    return plainToInstance(TagResponseDto, tag, {
      excludeExtraneousValues: true,
    });
  }

  async getPaging(
    queryDto: CommonPaginateDto,
    module?: string,
  ): Promise<PaginateResult<TagResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      keyword,
    } = queryDto;

    const filter: FilterQuery<any> = { deleted: false };

    if (module) {
      filter.module = module;
    }

    const keywordFilter = buildKeywordFilter(keyword, ['nameEn', 'nameVi']);
    if (keywordFilter) {
      filter.$or = keywordFilter;
    }

    const result = await this.tagRepository.paginate(filter, {
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return {
      ...result,
      docs: result.docs.map((tag) =>
        plainToInstance(TagResponseDto, tag, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  async getAll(module?: string): Promise<TagResponseDto[]> {
    const filter: FilterQuery<any> = { deleted: false };
    if (module) filter.module = module;
    const tags = await this.tagRepository.findAll(filter);
    return tags.map((tag) =>
      plainToInstance(TagResponseDto, tag, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findById(id: string): Promise<TagResponseDto> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      throw new BadRequestException('admin.tag.not_found');
    }
    return plainToInstance(TagResponseDto, tag, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    _id: string,
    updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    const tag = await this.tagRepository.updateById(_id, updateTagDto);
    if (!tag) {
      throw new BadRequestException('admin.tag.not_found');
    }
    return plainToInstance(TagResponseDto, tag, {
      excludeExtraneousValues: true,
    });
  }

  async remove(_id: string): Promise<boolean> {
    // Deleting a tag strips it from every blog that carries it — listings and
    // filters quietly lose entries, with nothing on screen to say why. Block
    // the delete and name the count; untagging first is the admin's call, not
    // a cascade we can guess.
    //
    // Counted regardless of `tag.module`: the module is what the pickers offer,
    // not a guarantee about what is already stored, and a guard that trusts it
    // would miss exactly the mis-tagged rows it exists to catch.
    const blogCount = await this.blogModel.countDocuments({
      tags: _id,
      deleted: false,
    });
    if (blogCount > 0) {
      throw new BadRequestException({
        message: 'admin.tag.in_use_blogs',
        args: { count: blogCount },
      });
    }

    const result = await this.tagRepository.deleteById(_id);
    if (!result) {
      throw new BadRequestException('admin.tag.not_found');
    }
    return true;
  }
}
