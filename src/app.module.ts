import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MovieModule } from './movie/movie.module';
import { PixazoModule } from './pixazo/pixazo.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 10,
    }),
    PixazoModule,
    MovieModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
