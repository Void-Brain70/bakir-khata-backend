import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    console.log('Server timezone:', new Date().toLocaleString());
    return (
      'Welcome to the Bakir Khata API! ' +
      `server time: ${new Date().toLocaleString()}`
    );
  }
}
