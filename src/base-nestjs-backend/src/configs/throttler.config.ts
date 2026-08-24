import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { THROTTLER_CONFIGS } from '../shared/constants/throttler.constant';

/**
 * Throttler (Rate Limiting) Module Configuration
 *
 * Only the DEFAULT throttler is registered globally (500 req/min).
 * STRICT and CLIENT limits are applied per-route via @Throttle() decorator
 * overriding the default context — this prevents all named throttlers
 * from applying to every route simultaneously.
 */
export const throttlerConfig = ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    throttlers: [
      {
        name: THROTTLER_CONFIGS.DEFAULT.NAME,
        ttl: configService.get<number>(
          'THROTTLE_DEFAULT_TTL',
          THROTTLER_CONFIGS.DEFAULT.TTL,
        ),
        limit: configService.get<number>(
          'THROTTLE_DEFAULT_LIMIT',
          THROTTLER_CONFIGS.DEFAULT.LIMIT,
        ),
      },
    ],
  }),
});
