import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAuth(): string {
    return 'Hello World! This is the Auth Service';
  }
}
