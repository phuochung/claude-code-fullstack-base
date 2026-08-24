import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { validateSecretStrength } from './shared/config/validate-secrets';

async function bootstrap() {
  // Before anything binds a port: a present-but-guessable shared secret is
  // never rejected at request time, so this is the only place it can be caught.
  validateSecretStrength();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable trust proxy for correct IP extraction behind load balancers/proxies
  // This is required for ThrottlerBehindProxyGuard to work correctly.
  // Behind Cloud Run/GCLB set TRUST_PROXY to the number of proxies in front of
  // this service (1 for Cloud Run on its own) so X-Forwarded-For is honoured.
  // Prefer a hop count over `true`: `true` trusts every hop, which lets a
  // client forge the leftmost X-Forwarded-For entry and mint itself unlimited
  // rate-limit quota. Defaults to 'loopback' for local dev.
  const trustProxy = process.env.TRUST_PROXY;
  app.set(
    'trust proxy',
    trustProxy === undefined || trustProxy === ''
      ? 'loopback'
      : trustProxy === 'true'
        ? true
        : /^\d+$/.test(trustProxy)
          ? parseInt(trustProxy, 10)
          : trustProxy,
  );

  // Enable cookie parser for httpOnly cookies
  app.use(cookieParser());

  // Enable validation pipe globally with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS: an explicit origin list is mandatory in production — browsers reject
  // `Access-Control-Allow-Origin: *` combined with credentials, so a missing
  // CORS_ORIGIN would silently break the dashboard. Fail fast instead.
  let allowOrigins: string | string[] = '*';
  if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*') {
    allowOrigins = process.env.CORS_ORIGIN.split(',').map((item) =>
      item.trim(),
    );
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CORS_ORIGIN must be set to an explicit origin list in production',
    );
  }
  console.log('CORS allowed origins:', allowOrigins);
  app.enableCors({
    origin: allowOrigins,
    credentials: true, // Important: allows cookies to be sent
  });
  app.setGlobalPrefix('api');

  // Graceful shutdown (Cloud Run sends SIGTERM): close Mongo connections etc.
  app.enableShutdownHooks();

  // Cloud Run uses PORT environment variable
  const port = process.env.PORT || process.env.APP_PORT || 8080;
  await app.listen(port);
  console.log(`Application is running on: ${port}`);
}
bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
