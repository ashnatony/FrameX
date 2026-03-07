import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use the latest Gemini 2.5 Flash model
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
  }

  async generateScript(transcript: string, movieName: string): Promise<string> {
    if (!this.model) {
      throw new HttpException(
        'Gemini AI not configured. Please set GEMINI_API_KEY in environment variables',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Truncate transcript if it's too long (to avoid token limits)
      const maxTranscriptLength = 30000;
      const truncatedTranscript = transcript.length > maxTranscriptLength
        ? transcript.substring(0, maxTranscriptLength) + '...'
        : transcript;

      const prompt = `
You are a professional movie story writer. Based on the following movie subtitles from "${movieName}", 
create a clear and engaging 300-500 word story summary that explains the complete plot.

Your summary should:
- Be 300-500 words in length
- Tell the story in chronological order from beginning to end
- Focus on the main characters and their goals
- Explain the central conflict and how it's resolved
- Include key plot twists and memorable moments
- Be written in clear, engaging prose (NOT screenplay format)
- Capture the tone and genre of the movie
- Make sense to someone who hasn't seen the movie

Movie Subtitles:
${truncatedTranscript}

Write a complete story summary now:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const script = response.text();

      if (!script || script.length < 100) {
        throw new HttpException(
          'Generated script is too short or invalid',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return script;
    } catch (error) {
      console.error('Error generating script with Gemini:', error.message);
      throw new HttpException(
        'Failed to generate script: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateCombinedScript(movies: Array<{ name: string; transcript: string }>): Promise<string> {
    if (!this.model) {
      throw new HttpException(
        'Gemini AI not configured. Please set GEMINI_API_KEY in environment variables',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Prepare combined transcripts with clear separation
      const maxTranscriptPerMovie = 20000;
      const combinedContent = movies.map((movie, index) => {
        const truncated = movie.transcript.length > maxTranscriptPerMovie
          ? movie.transcript.substring(0, maxTranscriptPerMovie) + '...'
          : movie.transcript;
        
        return `
=== MOVIE ${index + 1}: ${movie.name} ===
${truncated}
`;
      }).join('\n\n');

      const prompt = `
You are a professional movie story writer. You have been provided with subtitles from ${movies.length} related movies: ${movies.map(m => m.name).join(' and ')}.

Create a comprehensive 500-800 word story summary that:
- Covers the complete narrative arc across all ${movies.length} movies
- Explains how the story flows from one movie to the next
- Introduces main characters and their development
- Describes the central conflicts and how they evolve
- Highlights key plot points and memorable moments from each movie
- Shows the connections and continuity between the movies
- Explains how the overall story concludes
- Is written in clear, engaging prose (NOT screenplay format)
- Makes sense to someone who hasn't seen the movies

Movies and Subtitles:
${combinedContent}

Write a complete combined story summary now:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const script = response.text();

      if (!script || script.length < 200) {
        throw new HttpException(
          'Generated combined script is too short or invalid',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return script;
    } catch (error) {
      console.error('Error generating combined script with Gemini:', error.message);
      throw new HttpException(
        'Failed to generate combined script: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
