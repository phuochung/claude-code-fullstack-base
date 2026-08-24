import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthAdminService } from '../services/auth.admin.service';

@Injectable()
export class LocalAdminStrategy extends PassportStrategy(
  Strategy,
  'localAdmin',
) {
  constructor(private authAdminService: AuthAdminService) {
    super({ usernameField: 'email' });
  }

  async validate(username: string, password: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.authAdminService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('admin.auth.email_password_invalid');
    }
    return user;
  }
}
