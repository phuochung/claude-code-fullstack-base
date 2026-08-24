import { Global, Module } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { SlackService } from './services/slack.service';
import { UtilsService } from './utils.service';

@Global()
@Module({
  providers: [LoggerService, SlackService, UtilsService],
  exports: [LoggerService, SlackService, UtilsService],
})
export class SharedModule {}
