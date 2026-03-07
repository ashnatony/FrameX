import { Controller, Post, Body, UploadedFile, UploadedFiles, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MovieService } from './movie.service';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post('generate-script')
  @UseInterceptors(FileInterceptor('srtFile'))
  async generateScript(
    @Body('movieName') movieName: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!movieName) {
      throw new HttpException(
        'Movie name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!file) {
      throw new HttpException(
        'SRT file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      console.log(`📽️  Processing request for movie: ${movieName}`);
      console.log(`📁 File uploaded: ${file.originalname} (${file.size} bytes)`);
      
      const srtContent = file.buffer.toString('utf-8');
      const script = await this.movieService.generateScriptFromSubtitle(movieName, srtContent);
      
      return {
        movieName,
        script,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating script:', error.message);
      throw new HttpException(
        error.message || 'Failed to generate script',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-combined-script')
  @UseInterceptors(FilesInterceptor('srtFiles', 10))
  async generateCombinedScript(
    @Body('movieNames') movieNames: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!movieNames) {
      throw new HttpException(
        'Movie names are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!files || files.length === 0) {
      throw new HttpException(
        'At least one SRT file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const movieNamesArray = movieNames.split(',').map(name => name.trim());
      
      console.log(`📽️  Processing ${files.length} movies: ${movieNamesArray.join(', ')}`);
      
      const movieData = files.map((file, index) => {
        console.log(`📁 File ${index + 1}: ${file.originalname} (${file.size} bytes)`);
        return {
          name: movieNamesArray[index] || `Movie ${index + 1}`,
          content: file.buffer.toString('utf-8'),
        };
      });

      const script = await this.movieService.generateCombinedScript(movieData);
      
      return {
        movies: movieNamesArray,
        script,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating combined script:', error.message);
      throw new HttpException(
        error.message || 'Failed to generate combined script',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-comic-storyboard')
  @UseInterceptors(FileInterceptor('srtFile'))
  async generateComicStoryboard(
    @Body('movieName') movieName: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!movieName) {
      throw new HttpException(
        'Movie name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!file) {
      throw new HttpException(
        'SRT file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      console.log(`🎬 Creating comic storyboard for: ${movieName}`);
      console.log(`📁 File uploaded: ${file.originalname} (${file.size} bytes)`);
      
      const srtContent = file.buffer.toString('utf-8');
      const result = await this.movieService.generateComicStoryboard(movieName, srtContent);
      
      return {
        movieName,
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating comic storyboard:', error.message);
      throw new HttpException(
        error.message || 'Failed to generate comic storyboard',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-combined-comic-storyboard')
  @UseInterceptors(FilesInterceptor('srtFiles', 10))
  async generateCombinedComicStoryboard(
    @Body('movieNames') movieNames: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!movieNames) {
      throw new HttpException(
        'Movie names are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!files || files.length === 0) {
      throw new HttpException(
        'At least one SRT file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const movieNamesArray = movieNames.split(',').map(name => name.trim());
      
      console.log(`🎬 Creating combined comic storyboard for: ${movieNamesArray.join(', ')}`);
      
      const movieData = files.map((file, index) => {
        console.log(`📁 File ${index + 1}: ${file.originalname} (${file.size} bytes)`);
        return {
          name: movieNamesArray[index] || `Movie ${index + 1}`,
          content: file.buffer.toString('utf-8'),
        };
      });

      const result = await this.movieService.generateCombinedComicStoryboard(movieData);
      
      return {
        movies: movieNamesArray,
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating combined comic storyboard:', error.message);
      throw new HttpException(
        error.message || 'Failed to generate combined comic storyboard',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test')
  async test() {
    return {
      status: 'ok',
      message: 'ScreenX API is running',
      timestamp: new Date().toISOString(),
    };
  }
}
