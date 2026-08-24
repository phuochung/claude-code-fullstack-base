import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BlogAdminService } from '../services/blog.admin.service';
import { CreateBlogDto } from '../dto/create-blog.dto';
import { UpdateBlogDto } from '../dto/update-blog.dto';
import { QueryBlogDto } from '../dto/query-blog.dto';
import { JwtAuthAdminGuard } from '../../../modules/auth/guards/jwt-auth.admin.guard';
import { CommonPaginateDto } from 'src/shared/dto/common-paginate.dto';
import { UserRequest } from '../../../shared/decorators/user.decorator';
import { BlogResponseDto } from '../dto/blog-response.dto';
import { PaginateResult } from 'mongoose';

@UseGuards(JwtAuthAdminGuard)
@Controller('admin/blogs')
export class BlogAdminController {
  constructor(private readonly blogAdminService: BlogAdminService) {}

  @Post('validate-create')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateBeforeCreate(@Body() createBlogDto: CreateBlogDto): boolean {
    return this.blogAdminService.validateBeforeCreate();
  }

  @Post()
  async create(
    @UserRequest() user: { userId: string },
    @Body() createBlogDto: CreateBlogDto,
  ): Promise<BlogResponseDto> {
    const blog = await this.blogAdminService.create(user.userId, createBlogDto);
    return blog as unknown as BlogResponseDto;
  }

  @Get()
  async getPaging(
    @Query() queryDto: CommonPaginateDto & QueryBlogDto,
  ): Promise<PaginateResult<BlogResponseDto>> {
    const result = await this.blogAdminService.getPaging(queryDto);
    return result;
  }

  @Get(':id/preview-token')
  getPreviewToken(
    @UserRequest() user: { userId: string },
    @Param('id') id: string,
  ) {
    return {
      token: this.blogAdminService.generatePreviewToken(id, user.userId),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BlogResponseDto> {
    const blog = await this.blogAdminService.findOne(id);
    return blog as unknown as BlogResponseDto;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogAdminService.update(id, updateBlogDto);
  }

  @Patch(':id/publish')
  publish(@UserRequest() user: { userId: string }, @Param('id') id: string) {
    return this.blogAdminService.publish(id, user.userId);
  }

  @Patch(':id/tmp-hide')
  setTmpHide(@UserRequest() user: { userId: string }, @Param('id') id: string) {
    return this.blogAdminService.setTmpHide(id, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogAdminService.remove(id);
  }
}
