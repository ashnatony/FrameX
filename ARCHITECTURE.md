# ScreenX Architecture & Flow

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           User Interface                         │
│  (Web Browser / API Client / Command Line / Postman)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ POST /movie/generate-script
                             │ { "movieName": "The Matrix" }
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS Application (Port 3000)                │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  MovieController (movie.controller.ts)                     │  │
│  │  - Receives HTTP POST request                              │  │
│  │  - Validates movie name                                    │  │
│  │  - Calls MovieService                                      │  │
│  └───────────────┬───────────────────────────────────────────┘  │
│                  │                                               │
│                  ▼                                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  MovieService (movie.service.ts)                           │  │
│  │  - Orchestrates the entire workflow                        │  │
│  │  - Coordinates between subtitle and AI services           │  │
│  └───────┬───────────────────────────┬───────────────────────┘  │
│          │                           │                           │
│          ▼                           ▼                           │
│  ┌─────────────────┐       ┌─────────────────────────┐          │
│  │ SubtitlesService│       │    AiService            │          │
│  │ (subtitles.     │       │    (ai.service.ts)      │          │
│  │  service.ts)    │       │                         │          │
│  │                 │       │  - Sends transcript     │          │
│  │  - Search subs  │       │    to Gemini AI         │          │
│  │  - Download SRT │       │  - Receives generated   │          │
│  └────────┬────────┘       │    script               │          │
│           │                └───────────┬─────────────┘          │
│           │                            │                         │
│           │                  ┌─────────────────────┐            │
│           │                  │   SRT Parser        │            │
│           │                  │   (srt-parser.ts)   │            │
│           │                  │  - Parses subtitle  │            │
│           │                  │  - Extracts text    │            │
│           │                  └─────────────────────┘            │
└───────────┼────────────────────────────┼──────────────────────┘
            │                            │
            ▼                            ▼
┌────────────────────┐      ┌──────────────────────────┐
│  OpenSubtitles API │      │    Google Gemini API     │
│                    │      │                          │
│  - Search movies   │      │  - Generate AI script    │
│  - Download .srt   │      │  - 200-400 words         │
└────────────────────┘      └──────────────────────────┘
```

## 🔄 Detailed Flow Diagram

```
User Request
    │
    │ "The Matrix"
    ▼
┌──────────────────────────────────────┐
│ 1. MovieController.generateScript()  │
│    - Validates input                 │
│    - movieName: string               │
└───────────────┬──────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────┐
│ 2. MovieService.generateScriptFromMovie()    │
│    - Main orchestration logic                │
└───────────────┬──────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────┐
│ 3. SubtitlesService.searchSubtitles()        │
│    ↓                                         │
│    GET https://api.opensubtitles.com/api/v1/ │
│        subtitles?query=The Matrix            │
│    ↓                                         │
│    Returns: Array of subtitle results       │
│    [{ file_id, language, movie_name, ...}]  │
└───────────────┬──────────────────────────────┘
                │
                │ Extract first result's file_id
                ▼
┌──────────────────────────────────────────────┐
│ 4. SubtitlesService.downloadSubtitle()       │
│    ↓                                         │
│    POST https://api.opensubtitles.com/api/v1/│
│         download { file_id: 123456 }        │
│    ↓                                         │
│    GET download_link                         │
│    ↓                                         │
│    Returns: Raw SRT file content            │
└───────────────┬──────────────────────────────┘
                │
                │ Raw SRT string
                ▼
┌──────────────────────────────────────────────┐
│ 5. parseSRT(srtContent)                      │
│    - Parses SRT format                       │
│    - Removes timestamps                      │
│    - Cleans text (HTML, annotations)         │
│    - Concatenates all dialogue               │
│    ↓                                         │
│    Returns: Clean transcript string          │
└───────────────┬──────────────────────────────┘
                │
                │ Transcript (text only)
                ▼
┌──────────────────────────────────────────────┐
│ 6. AiService.generateScript()                │
│    - Truncate if too long (15000 chars)      │
│    - Build prompt with transcript            │
│    - Call Gemini AI                          │
│    ↓                                         │
│    Gemini API Request:                       │
│    {                                         │
│      model: "gemini-pro"                     │
│      prompt: "Create 200-400 word script..." │
│      content: transcript                     │
│    }                                         │
│    ↓                                         │
│    Returns: Generated script (200-400 words) │
└───────────────┬──────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────┐
│ 7. Return to MovieController                 │
│    {                                         │
│      movieName: "The Matrix",                │
│      script: "INT. NEO'S APARTMENT...",      │
│      timestamp: "2026-03-06T10:30:00.000Z"   │
│    }                                         │
└───────────────┬──────────────────────────────┘
                │
                ▼
            Response to User
```

## 📁 File Responsibilities

### Controllers Layer
- **movie.controller.ts**: HTTP endpoints, request validation, error handling

### Service Layer
- **movie.service.ts**: Main business logic, workflow orchestration
- **subtitles.service.ts**: OpenSubtitles API integration
- **ai.service.ts**: Gemini AI integration

### Utilities
- **srt-parser.ts**: Parse and clean SRT subtitle format

### Configuration
- **app.module.ts**: Root module, dependency injection
- **main.ts**: Application bootstrap, server startup

## 🔌 API Endpoints

### POST /movie/generate-script
Generate a script from movie subtitles

**Request:**
```json
{
  "movieName": "The Matrix"
}
```

**Response:**
```json
{
  "movieName": "The Matrix",
  "script": "Generated 200-400 word script...",
  "timestamp": "2026-03-06T10:30:00.000Z"
}
```

### POST /movie/test
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "message": "ScreenX API is running",
  "timestamp": "2026-03-06T10:30:00.000Z"
}
```

## 🔑 Environment Variables

```env
OPENSUBTITLES_API_KEY=your_key_here
OPENSUBTITLES_API_URL=https://api.opensubtitles.com/api/v1
GEMINI_API_KEY=your_key_here
PORT=3000
```

## 📦 Dependencies

### Core
- `@nestjs/core` - NestJS framework
- `@nestjs/common` - Common utilities
- `@nestjs/platform-express` - HTTP server

### HTTP
- `@nestjs/axios` - HTTP client integration
- `axios` - HTTP requests

### AI
- `@google/generative-ai` - Gemini AI SDK

### Utilities
- `rxjs` - Reactive programming
- `reflect-metadata` - Decorators support
