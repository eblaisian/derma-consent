import './sentry';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  // Raise JSON body limit from the 100KB default — encrypted consent payloads
  // include a high-DPI signature PNG inside the AES ciphertext, which can exceed
  // 100KB on mobile devices with 2-3× devicePixelRatio.
  const rawBodyHandler = (req: express.Request & { rawBody?: Buffer }, _res: express.Response, buf: Buffer) => {
    req.rawBody = buf;
  };
  app.use(express.json({ limit: '5mb', verify: rawBodyHandler }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  app.useLogger(app.get(Logger));

  app.use(
    helmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          objectSrc: ["'none'"],
        },
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Secret', 'stripe-signature'],
  });

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`Backend running on http://localhost:${port}`);
}

bootstrap();
