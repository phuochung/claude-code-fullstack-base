import { Module } from '@nestjs/common';
import { AuthAdminService } from './services/auth.admin.service';
import { PassportModule } from '@nestjs/passport';
import { LocalAdminStrategy } from './strategies/local.admin.strategy';
import { AuthAdminController } from './controllers/auth.admin.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { getJwtSecret, JWT_CONSTANTS } from '../../shared/constants/constant';
import { JwtAdminStrategy } from './strategies/jwt.admin.strategy';

@Module({
  controllers: [AuthAdminController],
  providers: [AuthAdminService, LocalAdminStrategy, JwtAdminStrategy],
  imports: [
    PassportModule,
    UsersModule,
    JwtModule.registerAsync({
      // Async so the secret is resolved after ConfigModule has loaded .env
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: JWT_CONSTANTS.EXPIRE },
      }),
    }),
  ],
})
export class AuthModule {}
