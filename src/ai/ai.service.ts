import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
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
  private readonly fallbackModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-pro',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro-latest'
  ];

  private readonly safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  constructor(private readonly pixazoService: PixazoService) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Safe generation with automatic model fallback for quota issues.
   */
  private async safeGenerateContent(prompt: string | any[]): Promise<string> {
    if (!this.genAI) {
      throw new HttpException('Gemini AI not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let lastError: any = null;

    for (const modelName of this.fallbackModels) {
      try {
        console.log(`🤖 Attempting [${modelName}]...`);
        const model = this.genAI.getGenerativeModel({ 
          model: modelName,
          safetySettings: this.safetySettings
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        lastError = error;
        const msg = error.message || '';
        if (msg.includes('429') || msg.includes('Quota') || msg.includes('404') || msg.includes('not found')) {
          console.warn(`⚠️  Model [${modelName}] unavailable or throttled. Trying next...`);
          continue;
        }
        throw error; 
      }
    }
    
    throw new HttpException(
      `All Gemini models failed. Last error: ${lastError?.message || 'Unknown'}`,
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  async generateScript(transcript: string, movieName: string): Promise<string> {
    if (!this.genAI) {
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

      const script = await this.safeGenerateContent(prompt);

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
    if (!this.genAI) {
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

      const script = await this.safeGenerateContent(prompt);

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
    if (!this.genAI) {
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

        // ALWAYS enforce Shaji Pappan's signature style (Actor: Jayasurya)
        const shajiStyle = 'looks exactly like actor Jayasurya, wearing a iconic black shirt and a vibrant red mundu (dhoti), thick black handlebar mustache, rugged confident facial features, cinematic lighting';
        if (!characterDescriptions['Shaji Pappan']) {
          characterDescriptions['Shaji Pappan'] = `Shaji Pappan, ${shajiStyle}.`;
        } else if (!characterDescriptions['Shaji Pappan'].toLowerCase().includes('red mundu')) {
          characterDescriptions['Shaji Pappan'] = `${characterDescriptions['Shaji Pappan']}, ${shajiStyle}.`;
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

      let scenesText = await this.safeGenerateContent(prompt);

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

      console.log('🤖 Generating 300-word story summary...');
      const summary = await this.generateSummaryFromScenes(scenes, movieName);

      return {
        movieName,
        summary,
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
    console.log(`🔍 Analyzing ${characterImages.length} characters in parallel...`);
    
    const analysisPromises = characterImages.map(async (charImage) => {
      try {
        const imagePart = {
          inlineData: {
            data: charImage.buffer.toString('base64'),
            mimeType: charImage.mimeType,
          },
        };

        const analysisPrompt = `You are a visual description expert helping an AI image generator create hyper-accurate comic book panels of specific real people.
Analyze this reference photo extremely carefully and extract a list of precise, technical visual keywords (feature tokens) describing this person.

Focus on these categories:
- Face: exact shape, skin tone, prominent features, eye shape/color.
- Hair: exact color, length, texture, style.
- Facial Hair: EXACT style, color, density (or clean-shaven).
- Physique: body build, shoulder width.
- Clothing: colors, fabric type, items.
- Accessories: glasses, jewellery, hats.

Return ONLY a comma-separated list of 15-20 descriptive keywords (tokens), e.g., "sharp jawline, warm olive skin, thick dark eyebrows, messy black hair, salt and pepper stubble, athletic build, red cotton shirt, silver wire glasses". 
Do not use full sentences. No intro or outro text. Output tokens only:`;

        const description = (await this.safeGenerateContent([analysisPrompt, imagePart])).trim();
        console.log(`✅ Character "${charImage.name}" analysis complete.`);
        return { name: charImage.name, description };
      } catch (error) {
        console.warn(`⚠️  Could not analyze image for "${charImage.name}": ${error.message}`);
        return { name: charImage.name, description: `Appearance of ${charImage.name} (description generation failed).` };
      }
    });

    const results = await Promise.all(analysisPromises);
    const descriptions: Record<string, string> = {};
    results.forEach(res => {
      descriptions[res.name] = res.description;
    });

    return descriptions;
  }

  /**
   * Generates a comic storyboard directly from a pre-defined set of scenes.
   * Skips Gemini text generation and goes straight to Pixazo image generation.
   */
  async generateComicFromScenes(scenes: any[], movieName: string, characterImages?: Array<{ name: string; mimeType: string; buffer: Buffer }>, preGeneratedSummary?: string): Promise<any> {
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

      // ALWAYS enforce Shaji Pappan's signature style (Actor: Jayasurya)
      const shajiStyle = 'looks exactly like actor Jayasurya, wearing a iconic black shirt and a vibrant red mundu (dhoti), thick black handlebar mustache, rugged confident facial features, cinematic lighting';
      if (!characterDescriptions['Shaji Pappan']) {
        characterDescriptions['Shaji Pappan'] = `Shaji Pappan, ${shajiStyle}.`;
      } else if (!characterDescriptions['Shaji Pappan'].toLowerCase().includes('red mundu')) {
        characterDescriptions['Shaji Pappan'] = `${characterDescriptions['Shaji Pappan']}, ${shajiStyle}.`;
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

      console.log('🤖 Handling story summary...');
      const summary = preGeneratedSummary || await this.generateSummaryFromScenes(scenes, movieName);

      return {
        movieName,
        summary,
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

  /**
   * Generates a cohesive 200-400 word summary based on a list of storyboard scenes.
   */
  async generateSummaryFromScenes(scenes: any[], movieName: string): Promise<string> {
    if (!this.genAI) {
      throw new HttpException('Gemini AI not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const scenesInfo = scenes.map(s => `Scene ${s.sceneNumber}: ${s.title}\nDescription: ${s.description}\nDialogue: ${s.dialogue}`).join('\n\n');

      const prompt = `
You are a professional movie story writer. Based on the following 12 storyboard scenes from the movie "${movieName}", 
write a cohesive and engaging story summary that connects these moments into a complete narrative.

 storyboard scenes:
${scenesInfo}

Requirements:
- Length: approximately 300 words (250-350 range).
- Tone: Engaging and cinematic.
- Content: Connect the scenes into a smooth story flow.
- Format: Plain text paragraphs.

Write the 300-word story summary now:`;

      const resultText = await this.safeGenerateContent(prompt);
      console.log(`✅ Summary generated successfully (${resultText.split(' ').length} words)`);
      return resultText;
    } catch (error) {
      console.error(`❌ Error generating summary for ${movieName}:`, error.message);
      if (error.response) {
        console.error('API Response Error:', JSON.stringify(error.response.data));
      }
      return `Story summary for ${movieName} (automated generation failed: ${error.message}). Displaying scene-based fallback.`;
    }
  }
}
