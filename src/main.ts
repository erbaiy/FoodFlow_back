import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  // app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        transform: true, // Transform payloads to DTO instances
        forbidNonWhitelisted: true, // Throw errors if non-whitelisted values are provided
        transformOptions: { enableImplicitConversion: true }
    })
);
  // Enable CORS with credentials
   app.enableCors({
   origin: 'http://localhost:3001', // Your frontend URL
   credentials: true, // Allow cookies
   });
   app.use('/uploads', express.static('uploads'));

  try {
    await app.listen(process.env.PORT ?? 3001);

    console.log(`Application is running on port ${process.env.PORT ?? 3001}`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${process.env.PORT ?? 3000} is already in use. Please try a different port.`);
      process.exit(1);
    }
    throw error;
    
  }
}
bootstrap();

