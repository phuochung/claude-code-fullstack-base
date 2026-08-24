import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../users/user.repository';
import { UserStatusEnum } from '../../users/enums/user-status.enum';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRoleEnum } from 'src/modules/users/enums/user-role.enum';

@Injectable()
export class AuthAdminService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne(
      {
        emailLower: email.toLowerCase(),
        deleted: false,
        status: UserStatusEnum.VERIFIED,
        role: {
          $in: [
            UserRoleEnum.SUPPER_ADMIN,
            UserRoleEnum.ADMIN,
            UserRoleEnum.MANAGER,
            UserRoleEnum.STAFF,
          ],
        },
      },
      { select: '+password' },
    );
    if (user && bcrypt.compareSync(password, user.password)) {
      return { _id: user._id };
    }

    return null;
  }

  async login(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('admin.auth.email_password_invalid');
    }

    const payload = { userId: user._id, email: user.email, name: user.name };
    return {
      user: payload,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async updateLastActive(userId: string | undefined): Promise<boolean> {
    if (!userId) {
      return false;
    }
    await this.userRepository.updateById(userId, {
      lastActiveAt: new Date(),
    });
    return true;
  }
}
