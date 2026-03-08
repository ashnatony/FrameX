import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { parseSRT } from '../utils/srt-parser';
import * as fs from 'fs';
import * as path from 'path';

export interface CharacterImageData {
  name: string;
  buffer: Buffer;
  mimeType: string;
}

@Injectable()
export class MovieService {
  constructor(
    private readonly aiService: AiService,
  ) {}

  async generateScriptFromSubtitle(movieName: string, srtContent: string): Promise<string> {
    try {
      console.log('📝 Parsing subtitle...');
      const transcript = parseSRT(srtContent);
      
      if (!transcript || transcript.length < 100) {
        throw new HttpException(
          'Subtitle content is too short or invalid',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log(`✅ Extracted ${transcript.length} characters of transcript`);
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
        return { name: movie.name, transcript };
      });

      console.log('🤖 Generating combined script with Gemini AI...');
      const script = await this.aiService.generateCombinedScript(moviesWithTranscripts);

      console.log('✨ Combined script generated successfully!');
      return script;
    } catch (error) {
      console.error('❌ Error in generateCombinedScript:', error.message);
      throw error;
    }
  }

  async generateComicStoryboard(movieName: string, srtContent: string, characterImages?: CharacterImageData[]): Promise<any> {
    try {
      console.log('📝 Generating script from subtitle...');
      const script = await this.generateScriptFromSubtitle(movieName, srtContent);

      console.log('🎨 Creating comic storyboard with 12 scenes...');
      const comicStoryboard = await this.aiService.generateComicScenes(script, movieName, characterImages);

      console.log('✨ Comic storyboard generated successfully!');
      return { script, storyboard: comicStoryboard };
    } catch (error) {
      console.error('❌ Error in generateComicStoryboard:', error.message);
      throw error;
    }
  }

  async generateCombinedComicStoryboard(movieData: Array<{ name: string; content: string }>, characterImages?: CharacterImageData[]): Promise<any> {
    try {
      console.log('📝 Generating combined script from subtitles...');
      const script = await this.generateCombinedScript(movieData);

      const combinedMovieName = (movieData && Array.isArray(movieData)) 
        ? movieData.map(m => m.name || 'Unknown Movie').join(' & ') 
        : 'Combined Storyboard';
      console.log('🎨 Creating comic storyboard with 12 scenes...');
      const comicStoryboard = await this.aiService.generateComicScenes(script, combinedMovieName, characterImages);

      console.log('✨ Comic storyboard generated successfully!');
      return { script, storyboard: comicStoryboard };
    } catch (error) {
      console.error('❌ Error in generateCombinedComicStoryboard:', error.message);
      throw error;
    }
  }

  async generatePresetComicStoryboard(presetKey: string, characterImages?: CharacterImageData[]): Promise<any> {
    try {
      console.log(`📂 Loading preset storyboard: ${presetKey}...`);
      
      const presetPath = path.join(process.cwd(), 'public', `${presetKey}.json`);
      if (!fs.existsSync(presetPath)) {
        throw new HttpException(`Preset ${presetKey} not found`, HttpStatus.NOT_FOUND);
      }

      const presetContent = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
      const scenes = presetContent.scenes || presetContent; // Handle both old array and new object format
      const preSummary = presetContent.summary || null;
      
      const movieName = presetKey.replace('-', ' ').toUpperCase();

      console.log('🎨 Creating comic storyboard from preset scenes...');
      const comicStoryboard = await this.aiService.generateComicFromScenes(scenes, movieName, characterImages, preSummary);

      console.log('✨ Preset comic storyboard generated successfully!');
      return { script: preSummary || `Using preset ${presetKey.toUpperCase()} storyboard script provided by user.`, storyboard: comicStoryboard };
    } catch (error) {
      console.error('❌ Error in generatePresetComicStoryboard:', error.message);
      throw error;
    }
  }
}
