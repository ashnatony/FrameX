import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { parseSRT } from '../utils/srt-parser';

@Injectable()
export class MovieService {
  constructor(
    private readonly aiService: AiService,
  ) {}

  async generateScriptFromSubtitle(movieName: string, srtContent: string): Promise<string> {
    try {
      // Step 1: Parse SRT content
      console.log('📝 Parsing subtitle...');
      const transcript = parseSRT(srtContent);
      
      if (!transcript || transcript.length < 100) {
        throw new HttpException(
          'Subtitle content is too short or invalid',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log(`✅ Extracted ${transcript.length} characters of transcript`);

      // Step 2: Generate script using Gemini AI
      console.log('🤖 Generating script with Gemini AI...');
      const script = await this.aiService.generateScript(transcript, movieName);

      console.log('✨ Script generated successfully!');
      return script;
    } catch (error) {
      console.error('❌ Error in generateScriptFromSubtitle:', error.message);
      throw error;
    }
  }

  async generateCombinedScript(movieData: Array<{ name: string; content: string }>): Promise<string> {
    try {
      console.log(`📝 Parsing ${movieData.length} subtitle files...`);
      
      const moviesWithTranscripts = movieData.map((movie) => {
        const transcript = parseSRT(movie.content);
        
        if (!transcript || transcript.length < 100) {
          throw new HttpException(
            `Subtitle content for "${movie.name}" is too short or invalid`,
            HttpStatus.BAD_REQUEST,
          );
        }

        console.log(`✅ ${movie.name}: Extracted ${transcript.length} characters`);
        
        return {
          name: movie.name,
          transcript,
        };
      });

      // Step 2: Generate combined script using Gemini AI
      console.log('🤖 Generating combined script with Gemini AI...');
      const script = await this.aiService.generateCombinedScript(moviesWithTranscripts);

      console.log('✨ Combined script generated successfully!');
      return script;
    } catch (error) {
      console.error('❌ Error in generateCombinedScript:', error.message);
      throw error;
    }
  }

  async generateComicStoryboard(movieName: string, srtContent: string): Promise<any> {
    try {
      // Step 1: Generate the script first
      console.log('📝 Generating script from subtitle...');
      const script = await this.generateScriptFromSubtitle(movieName, srtContent);

      // Step 2: Generate comic scenes from the script
      console.log('🎨 Creating comic storyboard with 12 scenes...');
      const comicStoryboard = await this.aiService.generateComicScenes(script, movieName);

      console.log('✨ Comic storyboard generated successfully!');
      return {
        script,
        storyboard: comicStoryboard,
      };
    } catch (error) {
      console.error('❌ Error in generateComicStoryboard:', error.message);
      throw error;
    }
  }

  async generateCombinedComicStoryboard(movieData: Array<{ name: string; content: string }>): Promise<any> {
    try {
      // Step 1: Generate the combined script first
      console.log('📝 Generating combined script from subtitles...');
      const script = await this.generateCombinedScript(movieData);

      // Step 2: Generate comic scenes from the combined script
      const combinedMovieName = movieData.map(m => m.name).join(' & ');
      console.log('🎨 Creating comic storyboard with 12 scenes...');
      const comicStoryboard = await this.aiService.generateComicScenes(script, combinedMovieName);

      console.log('✨ Comic storyboard generated successfully!');
      return {
        script,
        storyboard: comicStoryboard,
      };
    } catch (error) {
      console.error('❌ Error in generateCombinedComicStoryboard:', error.message);
      throw error;
    }
  }
}
