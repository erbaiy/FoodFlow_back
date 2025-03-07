import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  
  // Configure helmet with cross-origin resource policy
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // Uncomment if needed
  // app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Enable CORS with comprehensive configuration
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:3005',
      'http://localhost:5173'
      // Add production URLs when needed
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Disposition']
  });

  // Apply CORS headers to static files
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Or match your CORS origins above
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static('uploads'));

  // Try multiple ports if the default one is in use
  const ports = [3005, 3006, 3007, 3008, 3009]; // Try these ports in sequence
  const defaultPort = parseInt(process.env.PORT) || 3005;

  let currentPort = defaultPort;
  let serverStarted = false;

  // First try the default port
  try {
    await app.listen(currentPort);
    serverStarted = true;
    console.log(`Application is running on port ${currentPort}`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${currentPort} is already in use. Trying alternative ports...`,
      );
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
    console.error(
      `Could not find an available port. Please manually specify an open port using the PORT environment variable.`,
    );
    process.exit(1);
  }
}

bootstrap();