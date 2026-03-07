import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { PixazoModule } from '../pixazo/pixazo.module';

@Module({
  imports: [PixazoModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
