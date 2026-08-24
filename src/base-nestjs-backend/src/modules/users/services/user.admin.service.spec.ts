import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserAdminService } from './user.admin.service';
import { UserRepository } from '../user.repository';
import { UserRoleEnum } from '../enums/user-role.enum';
import { UserStatusEnum } from '../enums/user-status.enum';

jest.mock('bcrypt');

describe('UserAdminService', () => {
  let service: UserAdminService;
  let userRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      paginate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAdminService,
        { provide: UserRepository, useValue: userRepository },
      ],
    }).compile();

    service = module.get<UserAdminService>(UserAdminService);
  });

  describe('create', () => {
    const createUserDto = {
      email: 'Test@Email.com',
      name: 'Test User',
      password: 'password123',
      phoneNumber: '0123456789',
      role: 2,
    };

    it('should create a new user successfully', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        _id: 'user-123',
        ...createUserDto,
      } as any);

      const result = await service.create(createUserDto as any);

      expect(result).toBeDefined();
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when email already exists', async () => {
      // First call: email check returns existing user
      userRepository.findOne.mockResolvedValueOnce({ _id: 'existing' } as any);

      await expect(service.create(createUserDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when phone number already exists', async () => {
      // First call: email check returns null
      userRepository.findOne.mockResolvedValueOnce(null);
      // Second call: phone check returns existing user
      userRepository.findOne.mockResolvedValueOnce({ _id: 'existing' } as any);

      await expect(service.create(createUserDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Test',
        email: 'test@test.com',
      };
      userRepository.findById.mockResolvedValue(mockUser as any);

      const result = await service.findById('user-123');

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // The SUPPER_ADMIN account belongs to the developer, not the shop. It must
  // never appear in the dashboard's user table.
  describe('getPaging', () => {
    const emptyPage = { docs: [], totalDocs: 0 };

    /** The `role` clause of the filter the service handed to paginate(). */
    const roleFilter = (): unknown => {
      const [filter] = userRepository.paginate.mock.calls[0] as [
        Record<string, unknown>,
      ];
      return filter.role;
    };

    it('excludes supper admins when no role filter is given', async () => {
      userRepository.paginate.mockResolvedValue(emptyPage);

      await service.getPaging({} as any);

      expect(roleFilter()).toEqual({ $ne: UserRoleEnum.SUPPER_ADMIN });
    });

    it('returns nothing when the supper admin role is asked for directly', async () => {
      userRepository.paginate.mockResolvedValue(emptyPage);

      await service.getPaging({ role: UserRoleEnum.SUPPER_ADMIN } as any);

      // `$in: []` matches no document — an empty page, not everyone else.
      expect(roleFilter()).toEqual({ $in: [] });
    });

    /** Same string-vs-number hazard as the assignability guard, and here the
     *  else-branch would hand `"1"` to Mongoose, which casts it happily. */
    it('excludes the supper admin when the role arrives as a string', async () => {
      userRepository.paginate.mockResolvedValue(emptyPage);

      await service.getPaging({
        role: String(UserRoleEnum.SUPPER_ADMIN),
      } as any);

      expect(roleFilter()).toEqual({ $in: [] });
    });

    it('filters by any other requested role', async () => {
      userRepository.paginate.mockResolvedValue(emptyPage);

      await service.getPaging({ role: UserRoleEnum.MANAGER } as any);

      expect(roleFilter()).toBe(UserRoleEnum.MANAGER);
    });
  });

  describe('update', () => {
    // update() reads the target first (the lockout guard needs its current
    // role/status), so the target lookup is always findOne call #1.
    const mockTarget = (user: Record<string, unknown> | null) =>
      userRepository.findOne.mockResolvedValueOnce(user as any);

    it('should update user successfully', async () => {
      mockTarget({ _id: 'user-123', role: UserRoleEnum.MANAGER });
      userRepository.findOne.mockResolvedValue(null);
      userRepository.updateById.mockResolvedValue({
        _id: 'user-123',
        name: 'Updated',
      } as any);

      const result = await service.update(
        'user-123',
        { name: 'Updated' } as any,
        'actor-1',
      );

      expect(result).toBeDefined();
    });

    it('should throw when email already taken by another user', async () => {
      mockTarget({ _id: 'user-123', role: UserRoleEnum.MANAGER });
      userRepository.findOne.mockResolvedValueOnce({
        _id: 'other-user',
      } as any);

      await expect(
        service.update(
          'user-123',
          { email: 'taken@test.com' } as any,
          'actor-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when user not found during update', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { name: 'Updated' } as any, 'actor-1'),
      ).rejects.toThrow(BadRequestException);
      expect(userRepository.updateById).not.toHaveBeenCalled();
    });

    // SUPPER_ADMIN is the developer's account and is invisible to this module.
    describe('supper admin is untouchable', () => {
      const superAdmin = {
        _id: 'dev-1',
        role: UserRoleEnum.SUPPER_ADMIN,
        status: UserStatusEnum.VERIFIED,
      };

      it('refuses to edit a supper admin at all', async () => {
        mockTarget(superAdmin);

        await expect(
          service.update('dev-1', { name: 'Renamed' } as any, 'actor-1'),
        ).rejects.toThrow(BadRequestException);
        expect(userRepository.updateById).not.toHaveBeenCalled();
      });

      it('refuses to promote anyone into the supper admin role', async () => {
        mockTarget({ _id: 'user-123', role: UserRoleEnum.MANAGER });

        await expect(
          service.update(
            'user-123',
            { role: UserRoleEnum.SUPPER_ADMIN } as any,
            'actor-1',
          ),
        ).rejects.toThrow(BadRequestException);
        expect(userRepository.updateById).not.toHaveBeenCalled();
      });

      /**
       * The DTO's `@IsEnum` also accepts the enum *name*, so the guard cannot
       * rest on a strict compare against a number it may never receive.
       */
      it('refuses a supper admin role arriving as a string', async () => {
        mockTarget({ _id: 'user-123', role: UserRoleEnum.MANAGER });

        await expect(
          service.update(
            'user-123',
            { role: String(UserRoleEnum.SUPPER_ADMIN) } as any,
            'actor-1',
          ),
        ).rejects.toThrow(BadRequestException);
        expect(userRepository.updateById).not.toHaveBeenCalled();
      });
    });

    /**
     * B4's other half: a self-delete is refused, so the remaining way to lock
     * the shop out in one click is a self-PATCH — disable yourself, or drop to
     * a role that can no longer reach this screen.
     */
    describe('self-write lockout guard', () => {
      const self = {
        _id: 'actor-1',
        role: UserRoleEnum.ADMIN,
        status: UserStatusEnum.VERIFIED,
      };

      it('rejects blocking your own account', async () => {
        mockTarget(self);

        await expect(
          service.update(
            'actor-1',
            { status: UserStatusEnum.BLOCKED } as any,
            'actor-1',
          ),
        ).rejects.toThrow(BadRequestException);
        expect(userRepository.updateById).not.toHaveBeenCalled();
      });

      it('rejects demoting yourself', async () => {
        mockTarget(self);

        await expect(
          service.update(
            'actor-1',
            { role: UserRoleEnum.MANAGER } as any,
            'actor-1',
          ),
        ).rejects.toThrow(BadRequestException);
        expect(userRepository.updateById).not.toHaveBeenCalled();
      });

      /** Hex ids are case-insensitive; the guard must not be. */
      it('still recognises you through a differently-cased id', async () => {
        mockTarget({ ...self, _id: '507f1f77bcf86cd799439011' });

        await expect(
          service.update(
            '507F1F77BCF86CD799439011',
            { role: UserRoleEnum.MANAGER } as any,
            '507f1f77bcf86cd799439011',
          ),
        ).rejects.toThrow(BadRequestException);
        expect(userRepository.updateById).not.toHaveBeenCalled();
      });

      it('allows editing your own name', async () => {
        mockTarget(self);
        userRepository.findOne.mockResolvedValue(null);
        userRepository.updateById.mockResolvedValue({
          _id: 'actor-1',
          name: 'Me',
        } as any);

        await expect(
          service.update('actor-1', { name: 'Me' } as any, 'actor-1'),
        ).resolves.toBeDefined();
      });

      /** Only *changes* are refused — echoing the current values back is a
       *  no-op, and the form does exactly that. */
      it('allows a self-save that repeats the current role and status', async () => {
        mockTarget(self);
        userRepository.findOne.mockResolvedValue(null);
        userRepository.updateById.mockResolvedValue({ _id: 'actor-1' } as any);

        await expect(
          service.update(
            'actor-1',
            {
              role: UserRoleEnum.ADMIN,
              status: UserStatusEnum.VERIFIED,
            } as any,
            'actor-1',
          ),
        ).resolves.toBeDefined();
      });

      it("still lets an admin change someone else's role", async () => {
        mockTarget({ _id: 'user-123', role: UserRoleEnum.MANAGER });
        userRepository.findOne.mockResolvedValue(null);
        userRepository.updateById.mockResolvedValue({ _id: 'user-123' } as any);

        await expect(
          service.update(
            'user-123',
            { role: UserRoleEnum.ADMIN } as any,
            'actor-1',
          ),
        ).resolves.toBeDefined();
      });
    });
  });

  describe('delete', () => {
    it('should soft delete user successfully', async () => {
      userRepository.findOne.mockResolvedValue({
        _id: 'user-123',
        role: UserRoleEnum.MANAGER,
      } as any);
      userRepository.deleteById.mockResolvedValue({ _id: 'user-123' } as any);

      await expect(
        service.delete('user-123', 'actor-1'),
      ).resolves.not.toThrow();
    });

    it('should throw when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('invalid-id', 'actor-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.deleteById).not.toHaveBeenCalled();
    });

    // B4: half of the two-click lockout.
    it('rejects deleting yourself', async () => {
      await expect(service.delete('actor-1', 'actor-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.deleteById).not.toHaveBeenCalled();
    });

    /** Hex ids are case-insensitive; the self-delete compare must be too. */
    it('rejects deleting yourself through a differently-cased id', async () => {
      await expect(
        service.delete('507F1F77BCF86CD799439011', '507f1f77bcf86cd799439011'),
      ).rejects.toThrow(BadRequestException);
      expect(userRepository.deleteById).not.toHaveBeenCalled();
    });

    it('refuses to delete a supper admin', async () => {
      userRepository.findOne.mockResolvedValue({
        _id: 'dev-1',
        role: UserRoleEnum.SUPPER_ADMIN,
        status: UserStatusEnum.VERIFIED,
      } as any);

      await expect(service.delete('dev-1', 'actor-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.deleteById).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('refuses to create a supper admin', async () => {
      await expect(
        service.create({
          email: 'x@y.z',
          name: 'X',
          password: 'password123',
          role: UserRoleEnum.SUPPER_ADMIN,
        } as any),
      ).rejects.toThrow(BadRequestException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  // The takeover route: without this, any ADMIN could reset the developer's
  // password and sign in as them.
  describe('resetPassword guard', () => {
    it('refuses to reset a supper admin password', async () => {
      userRepository.findById.mockResolvedValue({
        _id: 'dev-1',
        role: UserRoleEnum.SUPPER_ADMIN,
      } as any);

      await expect(
        service.resetPassword('dev-1', { newPassword: 'new-pw' }),
      ).rejects.toThrow(BadRequestException);
      expect(userRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('findById guard', () => {
    it('reports a supper admin as not found', async () => {
      userRepository.findById.mockResolvedValue({
        _id: 'dev-1',
        role: UserRoleEnum.SUPPER_ADMIN,
      } as any);

      await expect(service.findById('dev-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password when old password is valid', async () => {
      const mockUser = { _id: 'user-123', password: 'hashed-old-pw' };
      userRepository.findOne.mockResolvedValue(mockUser as any);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      userRepository.updateById.mockResolvedValue({} as any);

      const result = await service.changePassword('user-123', {
        oldPassword: 'old-password',
        newPassword: 'new-password',
      });

      expect(result).toBe(true);
      expect(userRepository.updateById).toHaveBeenCalledWith('user-123', {
        password: 'new-password',
      });
      // The password field is select:false — it must be selected explicitly.
      expect(userRepository.findOne).toHaveBeenCalledWith(
        { _id: 'user-123', deleted: false },
        { select: '+password' },
      );
    });

    it('should throw when old password is incorrect', async () => {
      const mockUser = { _id: 'user-123', password: 'hashed-old-pw' };
      userRepository.findOne.mockResolvedValue(mockUser as any);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(
        service.changePassword('user-123', {
          oldPassword: 'wrong',
          newPassword: 'new-password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('invalid-id', {
          oldPassword: 'old',
          newPassword: 'new',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      userRepository.findById.mockResolvedValue({ _id: 'user-123' } as any);
      userRepository.updateById.mockResolvedValue({} as any);

      await expect(
        service.resetPassword('user-123', { newPassword: 'new-pw' }),
      ).resolves.not.toThrow();
    });

    it('should throw when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-id', { newPassword: 'new-pw' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
