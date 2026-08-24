import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { JwtAuthAdminGuard } from '../auth/guards/jwt-auth.admin.guard';

@UseGuards(JwtAuthAdminGuard)
@Controller('statistic')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get('blogs/top-viewed')
  async getTopViewedBlogs() {
    return this.statisticService.getTopViewedBlogs();
  }

  @Get('blogs/counts')
  async getBlogCountStatistics() {
    return this.statisticService.getBlogCountStatistics();
  }
}
