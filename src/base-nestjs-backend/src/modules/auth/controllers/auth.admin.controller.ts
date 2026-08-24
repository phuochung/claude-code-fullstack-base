import {
  Controller,
  Post,
  UseGuards,
  Request,
  Response,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { Throttle } from '@nestjs/throttler';
import { LocalAuthAdminGuard } from '../guards/local-auth.admin.guard';
import { AuthAdminService } from '../services/auth.admin.service';
import { THROTTLER_CONFIGS } from '../../../shared/constants/throttler.constant';
import {
  COMMON_CONSTANTS,
  JWT_CONSTANTS,
} from '../../../shared/constants/constant';

@Controller('admin/auth')
export class AuthAdminController {
  constructor(private readonly authAdminService: AuthAdminService) {}

  @Throttle({
    [THROTTLER_CONFIGS.DEFAULT.NAME]: {
      ttl: THROTTLER_CONFIGS.STRICT.TTL,
      limit: THROTTLER_CONFIGS.STRICT.LIMIT,
    },
  })
  @UseGuards(LocalAuthAdminGuard) // auth function, validate user first
  @Post('/login')
  async login(
    @Request() req: { user: { _id: string } },
    @Response() res: ExpressResponse,
    @Headers('x-client-type') clientType?: string,
  ) {
    const userId = req && req.user && req.user._id ? req.user._id : null;
    if (!userId) {
      throw new UnauthorizedException('admin.auth.email_password_invalid');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await this.authAdminService.login(userId);

    // Set httpOnly cookie for dashboard (web browsers)
    // Dashboard sends: x-client-type: dashboard
    // Mobile/Web sends: x-client-type: web (or nothing)
    const isDashboard = clientType === 'dashboard';

    if (isDashboard) {
      // For dashboard: Set secure httpOnly cookie
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      res.cookie(COMMON_CONSTANTS.COOKIE_NAME, result.accessToken, {
        httpOnly: true,
        secure: true,
        // 'lax', not 'none'. 'none' switches off the browser's own CSRF
        // protection, and is only needed when the dashboard and the API are on
        // genuinely different registrable domains. Deploy them as siblings
        // (app.example.com + api.example.com) and 'lax' works — it is also
        // what fixes login on Safari/iOS, which blocks third-party cookies.
        // A product that must go cross-domain has to change this here AND in
        // clearCookie below, and should keep JsonOnlyGuard on its writes.
        sameSite: 'lax',
        // Derived from the same constant as the JWT expiry — never drifts.
        maxAge: JWT_CONSTANTS.COOKIE_MAX_AGE_MS,
        path: '/',
      });
    }

    return res.json({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  @Post('/logout')
  logout(@Response() res: ExpressResponse) {
    // Clear cookie if it exists
    res.clearCookie(COMMON_CONSTANTS.COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      // Must match the login cookie exactly or logout stops clearing it.
      sameSite: 'lax',
      path: '/',
    });
    return res.json(true);
  }
}
