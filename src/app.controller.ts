import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getWelcome() {
    return {
      message: '🎬 Welcome to ScreenX - Movie Subtitle Script Generator',
      version: '1.0.0',
      endpoints: {
        generateScript: {
          method: 'POST',
          url: '/movie/generate-script',
          description: 'Generate a movie script from subtitle file',
          requiredFields: {
            movieName: 'string - Name of the movie',
            srtFile: 'file - SRT subtitle file to upload'
          }
        },
        test: {
          method: 'POST',
          url: '/movie/test',
          description: 'Test endpoint',
        }
      },
      usage: 'Upload an SRT file using the form at /upload-client.html or use the API directly',
      documentation: 'Send a POST request with multipart/form-data containing movieName and srtFile'
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
