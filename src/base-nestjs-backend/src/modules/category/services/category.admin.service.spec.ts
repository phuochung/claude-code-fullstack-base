import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { CategoryAdminService } from './category.admin.service';
import { CategoryRepository } from '../category.repository';
import { Blog } from '../../blog/schemas/blog.schema';

describe('CategoryAdminService', () => {
  let service: CategoryAdminService;
  let categoryRepository: Record<string, jest.Mock>;
  let blogModel: { countDocuments: jest.Mock };

  beforeEach(async () => {
    categoryRepository = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(true),
      paginate: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
    };
    blogModel = { countDocuments: jest.fn().mockResolvedValue(0) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryAdminService,
        { provide: CategoryRepository, useValue: categoryRepository },
        { provide: getModelToken(Blog.name), useValue: blogModel },
      ],
    }).compile();

    service = module.get<CategoryAdminService>(CategoryAdminService);
  });

  describe('remove — in-use guard', () => {
    it('deletes a category nothing references', async () => {
      await expect(service.remove('cat-1')).resolves.toBe(true);
      expect(categoryRepository.deleteById).toHaveBeenCalledWith('cat-1');
    });

    it('refuses to delete a category that still holds blogs', async () => {
      blogModel.countDocuments.mockResolvedValue(2);

      await expect(service.remove('cat-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(categoryRepository.deleteById).not.toHaveBeenCalled();
    });

    it('reports the count so the admin knows what is in the way', async () => {
      blogModel.countDocuments.mockResolvedValue(2);

      await expect(service.remove('cat-1')).rejects.toMatchObject({
        response: {
          message: 'admin.category.has_blogs',
          args: { count: 2 },
        },
      });
    });

    it('only counts live blogs', async () => {
      await service.remove('cat-1');

      expect(blogModel.countDocuments).toHaveBeenCalledWith({
        category: 'cat-1',
        deleted: false,
      });
    });
  });
});
