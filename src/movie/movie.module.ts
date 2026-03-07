import { Module } from '@nestjs/common';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { AiService } from '../ai/ai.service';

@Module({
  controllers: [MovieController],
  providers: [MovieService, AiService],
})
export class MovieModule {}
