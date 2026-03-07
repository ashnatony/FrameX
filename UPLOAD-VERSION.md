# ScreenX - Updated: SRT Upload Version

## ✅ Changes Made

### Removed:
- ❌ OpenSubtitles API integration
- ❌ Subtitle download functionality
- ❌ Complex API authentication

### Added:
- ✅ Direct SRT file upload
- ✅ Simpler workflow
- ✅ File upload UI

## 🚀 How to Use

### 1. Start the Server
```bash
npm run start:dev
```

### 2. Open Upload Client
- Open `upload-client.html` in your browser
- Or visit: `file:///C:/Users/ashna/OneDrive/Desktop/ScreenX/upload-client.html`

### 3. Upload and Generate
1. **Enter movie name**: e.g., "Aadu 1" or "Aadu 2"
2. **Upload SRT file**: Click "Choose File" and select your .srt subtitle file
3. **Generate**: Click "✨ Generate Script"
4. **Wait**: It will take 30-60 seconds to generate the script

## 📁 Your SRT Files

Place your subtitle files anywhere, then upload them through the web interface:
- `aadu-1.srt`
- `aadu-2.srt`

## 🔧 API Endpoint

**POST** `/movie/generate-script`

**Content-Type**: `multipart/form-data`

**Form Fields**:
- `movieName` (string): Name of the movie
- `srtFile` (file): The .srt subtitle file

**Response**:
```json
{
  "movieName": "Aadu 1",
  "script": "Generated 200-400 word script...",
  "timestamp": "2026-03-07T00:00:00.000Z"
}
```

## 🎯 Workflow

```
User → Upload SRT file + Movie name
  ↓
NestJS receives file
  ↓
Parse SRT content
  ↓
Extract transcript text
  ↓
Send to Gemini AI
  ↓
Generate 200-400 word script
  ↓
Return script to user
```

## 📦 Dependencies

- `@nestjs/core` - Framework
- `@nestjs/platform-express` - HTTP server & file upload
- `multer` - File upload middleware
- `@google/generative-ai` - Gemini AI SDK

## 💡 Benefits of This Approach

✅ **Simpler**: No external API dependencies
✅ **Faster**: No network delays from downloading subtitles
✅ **Reliable**: No API rate limits or connection issues
✅ **Offline**: Works without OpenSubtitles API
✅ **Control**: You choose exactly which subtitle files to use

## 🔑 Environment Variables

Only need Gemini API key now:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

## 🧪 Testing

1. Get any SRT subtitle file
2. Open `upload-client.html`
3. Upload the file and generate script

Easy! 🎬✨
