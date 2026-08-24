import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { COMMON_CONSTANTS } from '../shared/constants/constant';
import { ConfigService } from '@nestjs/config';

export const i18nConfig = I18nModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    // Read FALLBACK_LANGUAGE here (not in constant.ts) so the .env file loaded
    // by ConfigModule is already in effect — constants evaluate at import time,
    // before dotenv runs.
    fallbackLanguage:
      configService.get<string>('FALLBACK_LANGUAGE') || COMMON_CONSTANTS.LANG,
    loaderOptions: {
      path: path.join(configService.getOrThrow('ROOT_PATH'), '/i18n/'),
      // File watching is a dev convenience only — translations are baked
      // into the image in production.
      watch: process.env.NODE_ENV !== 'production',
    },
  }),
  resolvers: [
    { use: QueryResolver, options: ['lang'] },
    AcceptLanguageResolver,
    new HeaderResolver(['x-lang']),
  ],
  inject: [ConfigService],
});
