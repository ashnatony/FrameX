import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Pixazo Service - FREE Image Generation using Flux 1 Schnell
 * 
 * API Documentation: https://gateway.pixazo.ai/flux-1-schnell/v1/
 * Model: Flux 1 Schnell (FREE tier)
 * 
 * Features:
 * - Text-to-Image generation optimized for sketch-style storyboards
 * - Retry mechanism with exponential backoff (5 retries)
 * - Polling system for async generation (60 attempts, 2s intervals)
 * - Batch processing (3 scenes at a time) to respect rate limits
 * 
 * API Key: Loaded from environment variable PIXAZO_API_KEY
 */

interface ImageGenerationRequest {
  prompt: string;
  num_steps?: number;
  seed?: number;
  height?: number;
  width?: number;
}

interface ImageGenerationResponse {
  output?: string;
  requestId?: string;
  status?: string;
  message?: string;
}

interface StatusCheckResponse {
  status: string;
  output?: string;
  completedAt?: number;
}

@Injectable()
export class PixazoService {
  private readonly baseUrl = 'https://gateway.pixazo.ai';
  private readonly apiKey: string;
  private readonly maxRetries = 5;
  private readonly retryDelay = 3000; // 3 seconds
  private readonly pollInterval = 2000; // 2 seconds
  private readonly maxPollAttempts = 60; // 2 minutes total (60 * 2s)

  constructor(private readonly httpService: HttpService) {
    this.apiKey = process.env.PIXAZO_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️  PIXAZO_API_KEY not found in environment variables');
    }
  }

  /**
   * Generate a sketch-style storyboard image using Flux 1 Schnell (FREE)
   */
  async generateSketchImage(
    description: string,
    sceneNumber: number,
  ): Promise<string> {
    if (!this.apiKey) {
      throw new HttpException(
        'Pixazo API not configured. Please set PIXAZO_API_KEY',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Enhance prompt for sketch-style storyboard
    const sketchPrompt = this.createSketchPrompt(description, sceneNumber);
    
    console.log(`🎨 Generating sketch for Scene ${sceneNumber}...`);

    try {
      // Step 1: Submit generation request with retry
      const imageUrl = await this.submitGenerationRequest(sketchPrompt);
      
      if (!imageUrl) {
        throw new Error('No image URL received from Pixazo API');
      }

      console.log(`✅ Scene ${sceneNumber} - Image generated: ${imageUrl.substring(0, 50)}...`);
      
      return imageUrl;

    } catch (error) {
      console.error(`❌ Error generating sketch for Scene ${sceneNumber}:`, error.message);
      throw new HttpException(
        `Failed to generate sketch for Scene ${sceneNumber}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a sketch-style prompt optimized for storyboard visuals
   */
  private createSketchPrompt(description: string, sceneNumber: number): string {
    return `Professional storyboard sketch, black and white pencil drawing, hand-drawn style, 
comic panel layout, cinematic composition, film storyboard aesthetic, rough sketch with shading, 
scene ${sceneNumber}: ${description}. 
Style: traditional animation storyboard, sketch lines, professional artist quality, 
movie pre-production art, clean linework`;
  }

  /**
   * Submit image generation request to Pixazo Flux 1 Schnell API
   */
  private async submitGenerationRequest(prompt: string): Promise<string> {
    const requestBody: ImageGenerationRequest = {
      prompt,
      num_steps: 4, // Flux Schnell is optimized for 1-4 steps
      height: 768,
      width: 1024, // Landscape for storyboard
      seed: Math.floor(Math.random() * 1000000),
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries} to submit generation request...`);

        const response = await firstValueFrom(
          this.httpService.post<ImageGenerationResponse>(
            `${this.baseUrl}/flux-1-schnell/v1/getData`,
            requestBody,
            {
              headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': this.apiKey,
                'Cache-Control': 'no-cache',
              },
              timeout: 30000, // 30 second timeout for image generation
            },
          ),
        );

        const data = response.data;

        // Handle success (synchronous response)
        if (data.output) {
          console.log(`✅ Image response received`);
          return data.output;
        }

        throw new Error('Invalid response format from Pixazo API: ' + JSON.stringify(data));

      } catch (error) {
        lastError = error;
        console.warn(`⚠️  Attempt ${attempt} failed:`, error.response?.data || error.message);

        // Don't retry on client errors (400, 401, 403)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw new Error(`API Error: ${error.response.data?.message || error.message}`);
        }

        // Wait before retry with exponential backoff
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }



  /**
   * Process multiple scenes concurrently with rate limiting
   */
  async generateMultipleSketchImages(
    scenes: Array<{ sceneNumber: number; description: string }>,
  ): Promise<Array<{ sceneNumber: number; imageUrl: string | null; error?: string }>> {
    console.log(`🎬 Starting batch generation for ${scenes.length} scenes...`);

    const results: Array<{ sceneNumber: number; imageUrl: string | null; error?: string }> = [];
    const batchSize = 3; // Process 3 scenes at a time to avoid rate limits

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < scenes.length; i += batchSize) {
      const batch = scenes.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(scenes.length / batchSize)}`);

      const batchPromises = batch.map(async (scene) => {
        try {
          const imageUrl = await this.generateSketchImage(
            scene.description,
            scene.sceneNumber,
          );
          return { sceneNumber: scene.sceneNumber, imageUrl };
        } catch (error) {
          console.error(`❌ Scene ${scene.sceneNumber} failed:`, error.message);
          // Return placeholder or null on failure
          return {
            sceneNumber: scene.sceneNumber,
            imageUrl: null,
            error: error.message,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < scenes.length) {
        console.log('⏳ Waiting 2s before next batch...');
        await this.sleep(2000);
      }
    }

    const successCount = results.filter(r => r.imageUrl).length;
    console.log(`\n✨ Batch complete: ${successCount}/${scenes.length} images generated successfully`);

    return results;
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
