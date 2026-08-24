import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import configuration from './configs/config.config';
import { ConfigModule } from '@nestjs/config';
import { i18nConfig } from './configs/i18n.config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { mongooseConfig } from './configs/mongoose.config';
import { throttlerConfig } from './configs/throttler.config';
import { ThrottlerBehindProxyGuard } from './shared/guards/throttler-behind-proxy.guard';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { TagModule } from './modules/tag/tag.module';
import { BlogModule } from './modules/blog/blog.module';
import { StorageModule } from './modules/storage/storage.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { CustomerModule } from './modules/customer/customer.module';
import { StatisticModule } from './modules/statistic/statistic.module';
import { SharedModule } from './shared/shared.module';
import { DevModule } from './modules/dev/dev.module';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    i18nConfig,
    mongooseConfig,
    throttlerConfig,

    SharedModule,
    AuthModule,
    UsersModule,
    CategoryModule,
    TagModule,
    BlogModule,
    StorageModule,
    CustomFieldsModule,
    CustomerModule,
    StatisticModule,
    DevModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  onModuleInit() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (this.connection.readyState === 1) {
      console.log('✅ MongoDB connection established successfully');
    } else {
      console.error('❌ MongoDB connection failed');
    }

    this.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    this.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB connection disconnected');
    });
  }
}
