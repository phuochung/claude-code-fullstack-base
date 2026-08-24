import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { TagAdminService } from './tag.admin.service';
import { TagRepository } from '../tag.repository';
import { Blog } from '../../blog/schemas/blog.schema';

describe('TagAdminService', () => {
  let service: TagAdminService;
  let tagRepository: Record<string, jest.Mock>;
  let blogModel: { countDocuments: jest.Mock };

  beforeEach(async () => {
    tagRepository = {
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
        TagAdminService,
        { provide: TagRepository, useValue: tagRepository },
        { provide: getModelToken(Blog.name), useValue: blogModel },
      ],
    }).compile();

    service = module.get<TagAdminService>(TagAdminService);
  });

  describe('remove — in-use guard', () => {
    it('deletes a tag nothing references', async () => {
      await expect(service.remove('tag-1')).resolves.toBe(true);
      expect(tagRepository.deleteById).toHaveBeenCalledWith('tag-1');
    });

    it('refuses to delete a tag still attached to blogs', async () => {
      blogModel.countDocuments.mockResolvedValue(3);

      await expect(service.remove('tag-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(tagRepository.deleteById).not.toHaveBeenCalled();
    });

    it('reports the count so the admin knows what is in the way', async () => {
      blogModel.countDocuments.mockResolvedValue(3);

      await expect(service.remove('tag-1')).rejects.toMatchObject({
        response: {
          message: 'admin.tag.in_use_blogs',
          args: { count: 3 },
        },
      });
    });

    it('only counts live blogs — a soft-deleted one is not in the way', async () => {
      await service.remove('tag-1');

      expect(blogModel.countDocuments).toHaveBeenCalledWith({
        tags: 'tag-1',
        deleted: false,
      });
    });
  });
});
