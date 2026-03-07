import { Controller, Post, Body, UploadedFile, UploadedFiles, UseInterceptors, HttpException, HttpStatus, Req, Get } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { MovieService } from './movie.service';
import { Request } from 'express';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  private logRequest(req: Request, endpoint: string) {
    const origin = req.headers.origin || 'unknown origin';
    const host = req.headers.host || 'unknown host';
    console.log(`[${new Date().toISOString()}] 📥 API Call: ${endpoint} | From: ${origin} | Host: ${host}`);
  }

  @Post('generate-script')
  @UseInterceptors(FileInterceptor('srtFile'))
  async generateScript(
    @Body('movieName') movieName: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    this.logRequest(req, 'generate-script');
    if (!movieName) {
      throw new HttpException('Movie name is required', HttpStatus.BAD_REQUEST);
    }
    if (!file) {
      throw new HttpException('SRT file is required', HttpStatus.BAD_REQUEST);
    }
    try {
      console.log(`📽️  Processing request for movie: ${movieName}`);
      const srtContent = file.buffer.toString('utf-8');
      const script = await this.movieService.generateScriptFromSubtitle(movieName, srtContent);
      return { movieName, script, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Error generating script:', error.message);
      throw new HttpException(error.message || 'Failed to generate script', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('generate-combined-script')
  @UseInterceptors(FilesInterceptor('srtFiles', 10))
  async generateCombinedScript(
    @Body('movieNames') movieNames: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    this.logRequest(req, 'generate-combined-script');
    if (!movieNames) {
      throw new HttpException('Movie names are required', HttpStatus.BAD_REQUEST);
    }
    if (!files || files.length === 0) {
      throw new HttpException('At least one SRT file is required', HttpStatus.BAD_REQUEST);
    }
    try {
      const movieNamesArray = movieNames ? movieNames.split(',').map(name => name.trim()) : [];
      const movieData = files.map((file, index) => ({
        name: movieNamesArray[index] || `Movie ${index + 1}`,
        content: file.buffer.toString('utf-8'),
      }));
      const script = await this.movieService.generateCombinedScript(movieData);
      return { movies: movieNamesArray, script, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Error generating combined script:', error.message);
      throw new HttpException(error.message || 'Failed to generate combined script', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('generate-comic-storyboard')
  @UseInterceptors(FileInterceptor('srtFile'))
  async generateComicStoryboard(
    @Body('movieName') movieName: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    this.logRequest(req, 'generate-comic-storyboard');
    if (!movieName) {
      throw new HttpException('Movie name is required', HttpStatus.BAD_REQUEST);
    }
    if (!file) {
      throw new HttpException('SRT file is required', HttpStatus.BAD_REQUEST);
    }
    try {
      console.log(`🎬 Creating comic storyboard for: ${movieName}`);
      const srtContent = file.buffer.toString('utf-8');
      const result = await this.movieService.generateComicStoryboard(movieName, srtContent);
      return { movieName, ...result, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Error generating comic storyboard:', error.message);
      throw new HttpException(error.message || 'Failed to generate comic storyboard', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('generate-combined-comic-storyboard')
  @UseInterceptors(AnyFilesInterceptor())
  async generateCombinedComicStoryboard(
    @Body('movieNames') movieNames: string,
    @Body('characterNames') characterNames: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    this.logRequest(req, 'generate-combined-comic-storyboard');
    if (!movieNames) {
      throw new HttpException('Movie names are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const movieNamesArray = movieNames ? movieNames.split(',').map(n => n.trim()) : [];

      // Separate SRT files from character image files
      const srtFiles = (files || []).filter(f =>
        f.mimetype === 'text/plain' || f.originalname?.endsWith('.srt')
      );
      const imageFiles = (files || []).filter(f =>
        f.mimetype?.startsWith('image/')
      );

      if (srtFiles.length === 0) {
        throw new HttpException('At least one SRT file is required', HttpStatus.BAD_REQUEST);
      }

      console.log(`🎬 Creating combined comic storyboard for: ${(movieNamesArray && movieNamesArray.length > 0) ? movieNamesArray.join(', ') : 'Unknown'}`);
      console.log(`📁 SRT files: ${srtFiles.length}, Character images: ${imageFiles.length}`);

      const movieData = srtFiles.map((file, index) => ({
        name: movieNamesArray[index] || `Movie ${index + 1}`,
        content: file.buffer.toString('utf-8'),
      }));

      // Map character images to their names
      const charNamesArray = characterNames
        ? characterNames.split(',').map(n => n.trim()).filter(Boolean)
        : [];

      const characterImages = imageFiles.map((file, index) => ({
        name: charNamesArray[index] || `Character ${index + 1}`,
        buffer: file.buffer,
        mimeType: file.mimetype,
      }));

      const result = await this.movieService.generateCombinedComicStoryboard(movieData, characterImages);
      return { movies: movieNamesArray, ...result, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Error generating combined comic storyboard:', error.message);
      throw new HttpException(error.message || 'Failed to generate combined comic storyboard', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('generate-preset-comic-storyboard')
  @UseInterceptors(AnyFilesInterceptor())
  async generatePresetComicStoryboard(
    @Body('presetKey') presetKey: string,
    @Body('characterNames') characterNames: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    this.logRequest(req, 'generate-preset-comic-storyboard');
    if (!presetKey) {
      throw new HttpException('Preset key is required', HttpStatus.BAD_REQUEST);
    }

    try {
      console.log(`🎬 Creating preset comic storyboard for: ${presetKey}`);
      
      const imageFiles = (files || []).filter(f =>
        f.mimetype?.startsWith('image/')
      );

      // Map character images to their names
      const charNamesArray = characterNames
        ? characterNames.split(',').map(n => n.trim()).filter(Boolean)
        : [];

      const characterImages = imageFiles.map((file, index) => ({
        name: charNamesArray[index] || `Character ${index + 1}`,
        buffer: file.buffer,
        mimeType: file.mimetype,
      }));

      const result = await this.movieService.generatePresetComicStoryboard(presetKey, characterImages);
      return { ...result, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Error generating preset comic storyboard:', error.message);
      throw new HttpException(error.message || 'Failed to generate preset comic storyboard', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('test')
  async test() {
    return { status: 'ok', message: 'ScreenX API is running', timestamp: new Date().toISOString() };
  }
}
