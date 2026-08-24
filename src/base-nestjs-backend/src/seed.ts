// seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedAdminService } from './modules/users/seeds/seed-admin.service';
import mongoose from 'mongoose';

async function bootstrap() {
  mongoose.set('debug', true);
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedAdminService);
  await seedService.initAdmin();
  await app.close();
}
bootstrap().catch((err) => console.error(err));
