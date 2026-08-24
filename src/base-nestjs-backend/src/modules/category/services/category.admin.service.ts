import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PaginateResult } from 'mongoose';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryRepository } from '../category.repository';
import { COMMON_CONSTANTS } from 'src/shared/constants/constant';
import { CommonPaginateDto } from 'src/shared/dto/common-paginate.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { plainToInstance } from 'class-transformer';
import { BaseSchemaClass } from 'src/shared/base/base.schema';
import { Blog } from '../../blog/schemas/blog.schema';
import { buildKeywordFilter } from '../../../shared/utils/regex.util';

@Injectable()
export class CategoryAdminService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    // Read-only: the delete guard's usage count. See CategoryModule for why the
    // schema is registered there instead of importing the owning module.
    @InjectModel(Blog.name)
    private readonly blogModel: Model<Blog & BaseSchemaClass>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const existingCategory = await this.categoryRepository.findOne({
      nameVi: createCategoryDto.nameVi,
      deleted: false,
    });
    if (existingCategory) {
      throw new BadRequestException('admin.category.name_vi_is_existing');
    }

    const result = await this.categoryRepository.create(createCategoryDto);
    return plainToInstance(CategoryResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async getPaging(
    queryDto: CommonPaginateDto,
    module?: string,
  ): Promise<PaginateResult<CategoryResponseDto>> {
    const {
      page = 1,
      limit = COMMON_CONSTANTS.ITEMS_PER_PAGE,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      keyword,
    } = queryDto;

    const filter: FilterQuery<any> = { deleted: false };

    if (module) {
      filter.module = module;
    }

    const keywordFilter = buildKeywordFilter(keyword, ['nameVi']);
    if (keywordFilter) {
      filter.$or = keywordFilter;
    }

    const result = await this.categoryRepository.paginate(filter, {
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return {
      ...result,
      docs: result.docs.map((category) =>
        plainToInstance(CategoryResponseDto, category, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  async getAll(module?: string): Promise<CategoryResponseDto[]> {
    const filter: FilterQuery<any> = { deleted: false };
    if (module) filter.module = module;
    const categories = await this.categoryRepository.findAll(filter);
    return categories.map((category) =>
      plainToInstance(CategoryResponseDto, category, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findById(id: string): Promise<CategoryResponseDto | null> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      return null;
    }
    return plainToInstance(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    _id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.updateById(
      _id,
      updateCategoryDto,
    );

    if (!category) {
      throw new BadRequestException('admin.category.not_found');
    }

    return plainToInstance(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  async remove(_id: string): Promise<boolean> {
    // A blog whose category is deleted points at nothing: it drops out of
    // category listings and its detail page loses its breadcrumb, with no
    // on-screen explanation. Block the delete and name the count — moving the
    // blogs out first is the admin's call, not a cascade we can guess.
    const blogCount = await this.blogModel.countDocuments({
      category: _id,
      deleted: false,
    });
    if (blogCount > 0) {
      throw new BadRequestException({
        message: 'admin.category.has_blogs',
        args: { count: blogCount },
      });
    }

    const category = await this.categoryRepository.deleteById(_id);

    if (!category) {
      throw new BadRequestException('admin.category.not_found');
    }

    return true;
  }
}
