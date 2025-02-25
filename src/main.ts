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
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );
  
  // Enable CORS with credentials
  // Update this to be more flexible with the frontend URL
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3005'], // Allow multiple origins
    credentials: true,
  });
  
  app.use('/uploads', express.static('uploads'));

  // Try multiple ports if the default one is in use
  const ports = [3005, 3006, 3007, 3008, 3009]; // Try these ports in sequence
  const defaultPort = parseInt(process.env.PORT) || 3005; // Change default to 3005
  
  let currentPort = defaultPort;
  let serverStarted = false;
  
  // First try the default port
  try {
    await app.listen(currentPort);
    serverStarted = true;
    console.log(`Application is running on port ${currentPort}`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${currentPort} is already in use. Trying alternative ports...`);
    } else {
      throw error;
    }
  }
  
  // If default port failed, try alternatives
  if (!serverStarted) {
    for (const port of ports) {
      if (port === defaultPort) continue; // Skip if it's the already-tried default port
      
      try {
        await app.listen(port);
        console.log(`Application is running on port ${port}`);
        serverStarted = true;
        break;
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use.`);
        } else {
          throw error;
        }
      }
    }
  }
  
  if (!serverStarted) {
    console.error(`Could not find an available port. Please manually specify an open port using the PORT environment variable.`);
    process.exit(1);
  }
}

bootstrap();