import { HttpException, InternalServerErrorException, Logger } from "@nestjs/common";

// utils/common.utils.ts
export function parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 900000; // 15 minutes default
  
    const [, value, unit] = match;
    const num = parseInt(value, 10);
  
    switch (unit) {
      case 's':
        return num * 1000;
      case 'm':
        return num * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      default:
        return 900000;
    }
  }
  
  export function handleError(error: Error, logger: Logger): never {
    logger.error(`Error: ${error.message}`, error.stack);
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException('An unexpected error occurred');
  }