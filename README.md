# ScreenX - Movie Subtitle to Script Generator

A NestJS application that searches for movie subtitles using OpenSubtitles API, parses them, and generates a 200-400 word script using Google's Gemini AI.

## Features

- 🎬 Search movie subtitles using OpenSubtitles API
- 📥 Download and parse SRT subtitle files
- 🤖 Generate scripts using Gemini AI
- 🚀 Built with NestJS framework

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenSubtitles API key ([Get one here](https://www.opensubtitles.com/en/consumers))
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your API keys to the `.env` file:
```
OPENSUBTITLES_API_KEY=your_opensubtitles_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`

## API Endpoints

### Generate Script from Movie

**POST** `/movie/generate-script`

Request body:
```json
{
  "movieName": "The Matrix"
}
```

Response:
```json
{
  "movieName": "The Matrix",
  "script": "Generated 200-400 word script based on subtitles..."
}
```

## Project Structure

```
src/
├── movie/
│   ├── movie.controller.ts    # Handles HTTP requests
│   └── movie.service.ts        # Business logic orchestration
├── subtitles/
│   └── subtitles.service.ts    # OpenSubtitles API integration
├── ai/
│   └── ai.service.ts           # Gemini AI integration
├── utils/
│   └── srt-parser.ts           # SRT file parser
├── app.module.ts               # Root module
└── main.ts                     # Application entry point
```

## How It Works

1. User inputs movie name
2. NestJS Controller receives request
3. Search subtitles using OpenSubtitles API
4. Extract file_id from JSON response
5. Download subtitle (.srt)
6. Parse subtitle text
7. Send transcript + prompt to Gemini API
8. Gemini generates 200–400 word script
9. Return script to user

## License

MIT
