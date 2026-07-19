import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiLog } from './entities/api-log.entity';
import { ApiLogInterceptor } from './api-log.interceptor';
import { ApiLogCleanupService } from './api-log-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiLog])],
  providers: [
    ApiLogCleanupService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiLogInterceptor,
    },
  ],
  exports: [TypeOrmModule],
})
export class ApiLogModule {}
