import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    var response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Hello World!',
        // location: ret.data.trim()
      }),
    };
    return response;
  }
}
