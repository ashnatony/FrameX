# ScreenX Quick Reference

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Configure API keys in .env file
# OPENSUBTITLES_API_KEY=your_key
# GEMINI_API_KEY=your_key

# Start development server
npm run start:dev

# Test the API
node test-api.js "The Matrix"
# OR
.\test-api.ps1 -MovieName "Inception"
```

## 📍 Important URLs

- **Server**: http://localhost:3000
- **Test Client**: Open `test-client.html` in browser
- **OpenSubtitles**: https://www.opensubtitles.com/en/consumers
- **Gemini API**: https://makersuite.google.com/app/apikey

## 🎯 API Usage

### cURL
```bash
curl -X POST http://localhost:3000/movie/generate-script ^
  -H "Content-Type: application/json" ^
  -d "{\"movieName\": \"The Matrix\"}"
```

### PowerShell
```powershell
$body = @{ movieName = "The Matrix" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/movie/generate-script" `
  -Method Post -ContentType "application/json" -Body $body
```

### JavaScript
```javascript
fetch('http://localhost:3000/movie/generate-script', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ movieName: 'The Matrix' })
})
.then(res => res.json())
.then(data => console.log(data));
```

## 📂 Key Files

```
src/
├── movie/
│   ├── movie.controller.ts  ← API endpoints
│   └── movie.service.ts      ← Main logic
├── subtitles/
│   └── subtitles.service.ts  ← OpenSubtitles API
├── ai/
│   └── ai.service.ts         ← Gemini AI
└── utils/
    └── srt-parser.ts         ← Parse subtitles
```

## ⚡ Common Issues

| Problem | Solution |
|---------|----------|
| "No subtitles found" | Try a different/popular movie name |
| "API key not configured" | Add keys to `.env` file |
| "Connection refused" | Start server: `npm run start:dev` |
| "Port in use" | Change PORT in `.env` |

## 🎬 Movie Suggestions for Testing

Popular movies with good subtitle availability:
- The Matrix
- Inception
- Interstellar
- The Dark Knight
- Pulp Fiction
- Fight Club
- The Shawshank Redemption
- Forrest Gump
- The Godfather
- Avatar

## 📊 Project Stats

- **Lines of Code**: ~800
- **Files**: 14 source files
- **Dependencies**: 10 main packages
- **APIs Used**: 2 (OpenSubtitles, Gemini)
- **Frameworks**: NestJS, Express

## 🛠️ Development Commands

```bash
# Start with auto-reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Format code
npm run format

# Lint code
npm run lint
```

## 📝 Example Response

```json
{
  "movieName": "The Matrix",
  "script": "INT. NEO'S APARTMENT - NIGHT\n\nThe screen glows in the darkness. Thomas Anderson, known online as Neo, stares at cascading green code. A message appears: \"The Matrix has you.\" His life as a software developer by day and hacker by night is about to change forever...\n\n[Continues for 200-400 words]",
  "timestamp": "2026-03-06T10:30:00.000Z"
}
```

## 🔐 Security Checklist

- [ ] API keys added to `.env`
- [ ] `.env` not committed to git
- [ ] `.gitignore` includes `.env`
- [ ] API keys kept secret
- [ ] CORS enabled for local testing

## 📚 Documentation Files

- `README.md` - Project overview
- `SETUP.md` - Detailed setup instructions
- `ARCHITECTURE.md` - System architecture & flow
- `QUICK_REFERENCE.md` - This file!

## 🎓 Learning Resources

- [NestJS Docs](https://docs.nestjs.com/)
- [OpenSubtitles API](https://opensubtitles.stoplight.io/)
- [Gemini AI Docs](https://ai.google.dev/docs)
- [SRT Format](https://en.wikipedia.org/wiki/SubRip)
