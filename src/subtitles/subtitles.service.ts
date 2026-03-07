import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface SubtitleSearchResult {
  file_id: number;
  language: string;
  movie_name: string;
  release_name: string;
  download_count: number;
}

@Injectable()
export class SubtitlesService {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.apiKey = process.env.OPENSUBTITLES_API_KEY;
    this.apiUrl = process.env.OPENSUBTITLES_API_URL || 'https://api.opensubtitles.com/api/v1';

    if (!this.apiKey) {
      console.warn('⚠️  OPENSUBTITLES_API_KEY not found in environment variables');
    }
  }

  async searchSubtitles(movieName: string): Promise<SubtitleSearchResult[]> {
    try {
      console.log(`🔑 Using API Key: ${this.apiKey?.substring(0, 10)}...`);
      console.log(`🌐 API URL: ${this.apiUrl}/subtitles`);
      console.log(`🎬 Searching for: ${movieName}`);
      
      // Lowercase the query to avoid redirects
      const normalizedQuery = movieName.toLowerCase();
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/subtitles`, {
          params: {
            query: normalizedQuery,
            languages: 'en',
          },
          headers: {
            'Api-Key': this.apiKey,
            'User-Agent': 'ScreenX v1.0',
            'Accept': 'application/json',
          },
        }),
      );

      console.log(`✅ Response status: ${response.status}`);
      console.log(`📊 Results found: ${response.data?.data?.length || 0}`);

      if (!response.data || !response.data.data) {
        throw new HttpException(
          'No subtitles found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Map the response to our interface
      const results = response.data.data.map((item: any) => ({
        file_id: item.attributes?.files?.[0]?.file_id || item.id,
        language: item.attributes?.language || 'en',
        movie_name: item.attributes?.feature_details?.movie_name || movieName,
        release_name: item.attributes?.release || 'Unknown',
        download_count: item.attributes?.download_count || 0,
      }));

      return results;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('❌ Error searching subtitles:', error.message);
      console.error('📋 Error details:', {
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      throw new HttpException(
        'Failed to search subtitles: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async downloadSubtitle(fileId: number): Promise<string> {
    try {
      // Step 1: Get download link
      const downloadResponse = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/download`,
          {
            file_id: fileId,
          },
          {
            headers: {
              'Api-Key': this.apiKey,
              'Content-Type': 'application/json',
              'User-Agent': 'ScreenX v1.0',
              'Accept': 'application/json',
            },
            timeout: 15000,
          },
        ),
      );

      if (!downloadResponse.data || !downloadResponse.data.link) {
        throw new HttpException(
          'Failed to get download link',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const downloadLink = downloadResponse.data.link;

      // Step 2: Download the actual subtitle file
      const subtitleResponse = await firstValueFrom(
        this.httpService.get(downloadLink, {
          responseType: 'text',
        }),
      );

      return subtitleResponse.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Error downloading subtitle:', error.message);
      throw new HttpException(
        'Failed to download subtitle: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
