import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const nodeEnv = configService.get<string>('NODE_ENV');
  const port = configService.get<number>('PORT') || 3000;

  app.enableCors({
    origin: nodeEnv === 'production'
      ? process.env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com']
      : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(port, () => {
    console.log(`Application running on port ${port} in ${nodeEnv} mode`);
  });
}

bootstrap();