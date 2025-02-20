import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // Enable CORS with credentials
   app.enableCors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true, // Allow cookies
});
  try {
    await app.listen(process.env.PORT ?? 3000);

    console.log(`Application is running on port ${process.env.PORT ?? 3000}`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${process.env.PORT ?? 3000} is already in use. Please try a different port.`);
      process.exit(1);
    }
    throw error;
    
  }
}
bootstrap();

