import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security middleware
  app.use(cookieParser());
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS configuration
  const allowedOrigins = [
    'http://localhost:3001',
    'http://localhost:3000', 
    'http://localhost:3005',
    'http://localhost:5173'
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Disposition']
  });

  // Static files CORS
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', allowedOrigins.join(','));
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static('uploads'));

  // Server startup
  const port = 3005; // Changed port to 3005
  
  try {
    await app.listen(port);
    console.log(`Application is running on port ${port}`);
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
