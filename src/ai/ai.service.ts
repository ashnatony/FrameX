import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PixazoService } from '../pixazo/pixazo.service';

/**
 * AI Service - Orchestrates text and image generation
 * 
 * Architecture:
 * - Text/Script Generation: Google Gemini 2.5 Flash (LLM)
 * - Image Generation: Pixazo Flux 1 Schnell API (FREE - Sketch-style storyboards)
 * 
 * NO IMAGEN - Completely removed due to cost
 */
@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private readonly pixazoService: PixazoService) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use Gemini 2.5 Flash for text/script generation only
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
      const moviesArray = (movies && Array.isArray(movies)) ? movies : [];
      const combinedContent = moviesArray.map((movie, index) => {
        const truncated = movie.transcript.length > maxTranscriptPerMovie
          ? movie.transcript.substring(0, maxTranscriptPerMovie) + '...'
          : movie.transcript;
        
        return `
=== MOVIE ${index + 1}: ${movie.name || 'Unknown'} ===
${truncated}
`;
      }).join('\n\n');

      const prompt = `
You are a professional movie story writer. You have been provided with subtitles from ${moviesArray.length} related movies: ${moviesArray.map(m => m.name || 'Unknown').join(' and ') || 'the provided script'}.

Create a comprehensive 500-800 word story summary that:
- Covers the complete narrative arc across all ${moviesArray.length} movies
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

  async generateComicScenes(script: string, movieName: string, characterImages?: Array<{ name: string; mimeType: string; buffer: Buffer }>): Promise<any> {
    if (!this.model) {
      throw new HttpException(
        'Gemini AI not configured. Please set GEMINI_API_KEY in environment variables',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Analyze character reference images if provided
      let characterReferenceSection = '';
      if (characterImages && characterImages.length > 0) {
        console.log(`🖼️  Analyzing ${characterImages.length} character reference image(s) with Gemini Vision...`);
        const characterDescriptions = await this.analyzeCharacterImages(characterImages);

        // Always ensure Pinky (the goat) has an accurate hardcoded description
        if (!characterDescriptions['Pinky']) {
          characterDescriptions['Pinky'] = 'A small, completely white domestic goat with no horns whatsoever, soft fluffy white fur all over its body, small dark hooves, gentle brown eyes, and a short white tail. Pinky is the beloved pet goat of the group and appears throughout the movie as a small, innocent, hornless white goat.';
        }

        if (Object.keys(characterDescriptions).length > 0) {
          characterReferenceSection = `
CHARACTER REFERENCE DICTIONARY (EXTREMELY IMPORTANT - USE THESE EXACT DESCRIPTIONS):
The following characters were identified from uploaded reference photos. You MUST use the exact visual details provided below for EVERY scene these characters appear in:
${Object.entries(characterDescriptions).map(([name, desc]) => `- ${name}: ${desc}`).join('\n')}

For any character NOT listed above, use your knowledge of the movie to describe their appearance in similar detail.
`;
        }
      } else {
        characterReferenceSection = `
CRITICAL INSTRUCTION FOR VISUAL LIKENESS: 
You must identify the actual real-world actors who played these characters in the movie: "${movieName}". 
DO NOT just use their name in the visual description. Image generators often fail with just names.
Instead, explicitly describe their EXACT physical facial features, body type, and iconic costume from the movie in every scene description.
`;
      }

      const prompt = `
You are a professional comic book artist and storyboard creator. Based on the following movie story summary for "${movieName}", 
create a detailed comic book storyboard with EXACTLY 12 scenes.

Story Summary:
${script}
${characterReferenceSection}

Your task:
1. Divide the story into EXACTLY 12 key scenes that tell the complete story
2. For each scene, provide:
   - Scene number (1-12)
   - A clear, visual description of what's happening using the character details above (suitable for creating an illustration)
   - The key dialogue or narration for that scene (2-3 sentences max)
   - The emotional tone/mood of the scene
   - Key visual elements (characters, setting, actions)

Format your response as a JSON array with this structure:
[
  {
    "sceneNumber": 1,
    "title": "Brief scene title",
    "description": "Detailed visual description for illustration",
    "dialogue": "Key dialogue or narration",
    "mood": "emotional tone",
    "visualElements": ["element1", "element2", "element3"]
  },
  ...repeat for all 12 scenes...
]

Make sure:
- Each scene is visually distinct and captures a key story moment
- Scenes flow chronologically from beginning to end
- Descriptions are vivid and specific, incorporating the character details above
- The 12 scenes together tell the complete story arc
- CRITICAL: Ensure your output is STRICTLY valid JSON. Do NOT use unescaped double quotes inside the string values. Use single quotes instead.

Return ONLY the JSON array, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let scenesText = response.text();

      // Clean up the response to extract JSON
      scenesText = scenesText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const scenes = JSON.parse(scenesText);

      if (!Array.isArray(scenes) || scenes.length !== 12) {
        throw new Error('Expected 12 scenes but got ' + (Array.isArray(scenes) ? scenes.length : 'invalid format'));
      }

      console.log('🎨 Starting Pixazo image generation for 12 scenes...');
      
      // Prepare scenes for batch generation
      const sceneDescriptions = scenes.map(scene => ({
        sceneNumber: scene.sceneNumber,
        description: scene.description,
      }));

      // Generate all images using Pixazo batch processing
      const imageResults = await this.pixazoService.generateMultipleComicImages(sceneDescriptions);

      // Map images back to scenes
      const scenesWithImages = scenes.map(scene => {
        const imageResult = imageResults.find(r => r.sceneNumber === scene.sceneNumber);
        return {
          ...scene,
          imageUrl: imageResult?.imageUrl || null,
          imageError: imageResult?.error || null,
        };
      });

      console.log('✅ Pixazo image generation completed!');

      // Group scenes into 6 frames (2 scenes per frame)
      const frames = [];
      for (let i = 0; i < 12; i += 2) {
        frames.push({
          frameNumber: Math.floor(i / 2) + 1,
          scene1: scenesWithImages[i],
          scene2: scenesWithImages[i + 1],
        });
      }

      return {
        movieName,
        totalScenes: 12,
        totalFrames: 6,
        frames,
      };

    } catch (error) {
      console.error('Error generating comic scenes with Gemini:', error.message);
      throw new HttpException(
        'Failed to generate comic scenes: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Use Gemini Vision to analyze uploaded actor reference images.
   * Returns a map of { characterName -> detailed appearance description }.
   */
  private async analyzeCharacterImages(
    characterImages: Array<{ name: string; mimeType: string; buffer: Buffer }>,
  ): Promise<Record<string, string>> {
    const descriptions: Record<string, string> = {};

    for (const charImage of characterImages) {
      try {
        console.log(`🔍 Analyzing image for character: "${charImage.name}"...`);

        const imagePart = {
          inlineData: {
            data: charImage.buffer.toString('base64'),
            mimeType: charImage.mimeType,
          },
        };

        const analysisPrompt = `You are a visual description expert helping an AI image generator create hyper-accurate comic book panels of specific real people.
Analyze this reference photo extremely carefully and write a rich, DETAILED description of exactly 10 sentences about this person's visual appearance.

Each sentence should focus on one specific aspect:
1. Overall impression: approximate age, gender, ethnicity, and general vibe
2. Skin: exact skin tone, texture, complexion (e.g., warm medium-brown skin, olive complexion)
3. Face shape: jaw shape, cheekbones, face length, overall face structure
4. Eyes: exact eye color, shape, size, eyelid fold, eyebrow thickness and arch
5. Nose and mouth: nose shape, lip thickness, any notable features
6. Hair: exact color, length, texture, style, any parting or styling details
7. Facial hair: EXACT description of mustache/beard/stubble style, color, density, shape - or confirm clean-shaven
8. Body build and posture: height impression, body frame, shoulder width, overall physique
9. Clothing: describe EVERY visible item of clothing with exact colors, patterns, fabric type, fit
10. Accessories and extras: glasses style/color, jewellery, hats, tattoos, or anything distinctive

Return ONLY the 10 sentences of description as a continuous paragraph, no labels, no other text.`;

        const result = await this.model.generateContent([analysisPrompt, imagePart]);
        const description = result.response.text().trim();

        console.log(`✅ Character "${charImage.name}": ${description.substring(0, 80)}...`);
        descriptions[charImage.name] = description;

      } catch (error) {
        console.warn(`⚠️  Could not analyze image for "${charImage.name}": ${error.message}`);
      }
    }

    return descriptions;
  }

  /**
   * Generates a comic storyboard directly from a pre-defined set of scenes.
   * Skips Gemini text generation and goes straight to Pixazo image generation.
   */
  async generateComicFromScenes(scenes: any[], movieName: string, characterImages?: Array<{ name: string; mimeType: string; buffer: Buffer }>): Promise<any> {
    try {
      let characterDescriptions: Record<string, string> = {};

      if (characterImages && characterImages.length > 0) {
        console.log(`🖼️  Analyzing ${characterImages.length} character reference image(s) with Gemini Vision...`);
        characterDescriptions = await this.analyzeCharacterImages(characterImages);
      }

      // Always ensure Pinky (the goat) has an accurate hardcoded description
      if (!characterDescriptions['Pinky']) {
        characterDescriptions['Pinky'] = 'A small, completely white domestic goat with no horns whatsoever, soft fluffy white fur all over its body, small dark hooves, gentle brown eyes, and a short white tail. Pinky is the beloved pet goat of the group and appears throughout the movie as a small, innocent, hornless white goat.';
      }

      console.log('🎨 Starting Pixazo image generation for preset scenes...');
      
      // Inject character descriptions into scene descriptions for the image generator
      const sceneDescriptions = scenes.map(scene => {
        let enhancedDescription = scene.description;
        
        // Match characters in description and append their visual details
        Object.entries(characterDescriptions).forEach(([name, desc]) => {
          if (enhancedDescription.toLowerCase().includes(name.toLowerCase())) {
            enhancedDescription += ` Character ${name} looks like: ${desc}`;
          }
        });

        return {
          sceneNumber: scene.sceneNumber,
          description: enhancedDescription,
        };
      });

      const imageResults = await this.pixazoService.generateMultipleComicImages(sceneDescriptions);

      const scenesWithImages = scenes.map(scene => {
        const imageResult = imageResults.find(img => img.sceneNumber === scene.sceneNumber);
        return {
          ...scene,
          imageUrl: imageResult?.imageUrl || null,
          imageError: imageResult?.error || null,
        };
      });

      // Group scenes into 6 frames (2 scenes per frame)
      const frames = [];
      for (let i = 0; i < 12; i += 2) {
        frames.push({
          frameNumber: Math.floor(i / 2) + 1,
          scene1: scenesWithImages[i],
          scene2: scenesWithImages[i + 1],
        });
      }

      return {
        movieName,
        totalScenes: 12,
        totalFrames: 6,
        frames,
      };
    } catch (error) {
      console.error('Error in generateComicFromScenes:', error.message);
      throw new HttpException(
        'Failed to generate comic from preset: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
