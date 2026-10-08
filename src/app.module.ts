import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { GuestSessionModule } from './guest-session/guest-session.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { validationSchema } from './config/configuration';
import { CategoriesModule } from './categories/categories.module';
import { AdvertisementsModule } from './advertisements/advertisements.module';
import { ApiLogModule } from './api-log/api-log.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('BREVO_SMTP_HOST'),
          port: configService.get<number>('BREVO_SMTP_PORT'),
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get<string>('BREVO_SMTP_USER'),
            pass: configService.get<string>('BREVO_SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get<string>('EMAIL_FROM'),
        },
      }),
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLER_TTL') || 60,
          limit: configService.get<number>('THROTTLER_LIMIT') || 10,
        },
      ],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    AuthModule,
    UsersModule,
    VerificationModule,
    GuestSessionModule,
    CategoriesModule,
    AdvertisementsModule,
    ApiLogModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }