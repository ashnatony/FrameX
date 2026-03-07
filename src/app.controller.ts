import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';

@Controller()
export class AppController {
  @Get()
  getWelcome(@Res() res: Response) {
    const htmlPath = join(process.cwd(), 'framex-comic.html');
    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    }
    return res.status(404).json({ message: 'framex-comic.html not found' });
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
