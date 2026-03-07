import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PixazoService } from './pixazo.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [PixazoService],
  exports: [PixazoService],
})
export class PixazoModule {}
