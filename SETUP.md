# ScreenX Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Get API Keys

#### OpenSubtitles API Key
1. Go to https://www.opensubtitles.com/en/consumers
2. Sign up for a free account
3. Create a new application to get your API key
4. Copy the API key

#### Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 3. Configure Environment Variables

Open the `.env` file and add your API keys:

```env
OPENSUBTITLES_API_KEY=your_actual_opensubtitles_key_here
GEMINI_API_KEY=your_actual_gemini_key_here
PORT=3000
```

### 4. Start the Server

```bash
npm run start:dev
```

The server will start at `http://localhost:3000`

## 🧪 Testing the API

### Method 1: Web Interface
1. Open `test-client.html` in your browser
2. Enter a movie name
3. Click "Generate Script"

### Method 2: Command Line
```bash
node test-api.js "The Matrix"
```

### Method 3: Using cURL
```bash
curl -X POST http://localhost:3000/movie/generate-script ^
  -H "Content-Type: application/json" ^
  -d "{\"movieName\": \"The Matrix\"}"
```

### Method 4: Using Postman
1. Create a POST request to `http://localhost:3000/movie/generate-script`
2. Set Content-Type to `application/json`
3. Body (raw JSON):
```json
{
  "movieName": "The Matrix"
}
```

## 📁 Project Structure

```
src/
├── movie/
│   ├── movie.controller.ts    # HTTP endpoints
│   ├── movie.service.ts        # Main business logic
│   └── movie.module.ts         # Module definition
├── subtitles/
│   └── subtitles.service.ts    # OpenSubtitles API integration
├── ai/
│   └── ai.service.ts           # Gemini AI integration
├── utils/
│   └── srt-parser.ts           # SRT subtitle parser
├── app.module.ts               # Root application module
└── main.ts                     # Application entry point
```

## 🔧 Available Scripts

```bash
# Development mode (with auto-reload)
npm run start:dev

# Production build
npm run build

# Production mode
npm run start:prod

# Format code
npm run format

# Lint code
npm run lint
```

## 🎯 How It Works

1. **User Input**: User provides a movie name
2. **Subtitle Search**: System searches OpenSubtitles API for matching subtitles
3. **Download**: Downloads the subtitle file in SRT format
4. **Parse**: Extracts text content from SRT file
5. **AI Generation**: Sends transcript to Gemini AI with prompt
6. **Response**: Returns 200-400 word generated script

## ⚠️ Troubleshooting

### "No subtitles found"
- Try a more specific or different movie name
- Check if the movie exists on OpenSubtitles.com
- Try popular movies first (The Matrix, Inception, etc.)

### "Failed to generate script"
- Verify your Gemini API key is correct
- Check your internet connection
- Ensure you haven't exceeded API rate limits

### "API key not configured"
- Make sure `.env` file exists
- Verify API keys are set correctly
- Restart the server after updating `.env`

### Server won't start
- Make sure port 3000 is not in use
- Check if all dependencies are installed
- Look for error messages in the console

## 📝 Example Response

```json
{
  "movieName": "The Matrix",
  "script": "INT. NEO'S APARTMENT - NIGHT\n\nThomas Anderson, a computer programmer by day and hacker by night, sits before multiple computer screens. A mysterious message appears: \"Follow the white rabbit.\"\n\n[Script continues for 200-400 words...]",
  "timestamp": "2026-03-06T10:30:00.000Z"
}
```

## 🔐 Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secret
- The `.gitignore` file already excludes `.env`
- Use environment variables in production

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [OpenSubtitles API Docs](https://opensubtitles.stoplight.io/docs/opensubtitles-api)
- [Gemini API Documentation](https://ai.google.dev/docs)

## 🤝 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify your API keys are valid
3. Check the console for detailed error messages
4. Ensure all dependencies are installed correctly
