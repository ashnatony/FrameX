# Pixazo Integration Guide - FrameX

## 🎨 Overview
FrameX uses **Pixazo Flux 1 Schnell API** for FREE sketch-style storyboard image generation.

**❌ Google Imagen REMOVED** - Paid model, replaced with free Pixazo API.

## 🔑 API Configuration

### Environment Variables
Add to `.env` file:
```properties
PIXAZO_API_KEY=bfc527e3a1274921aacffa1f9c993cab
```

### API Endpoints
- **Base URL**: `https://gateway.pixazo.ai/flux-1-schnell/v1/`
- **Generate Image**: `POST /getDataBatch`
- **Check Status**: `POST /checkStatus`

## 📚 Official Documentation

### Flux 1 Schnell (FREE) - Text to Image (Batch)

#### Request Format
```http
POST https://gateway.pixazo.ai/flux-1-schnell/v1/getDataBatch
Content-Type: application/json
Ocp-Apim-Subscription-Key: YOUR_API_KEY
Cache-Control: no-cache

{
  "prompt": "Professional storyboard sketch...",
  "num_steps": 4,
  "seed": 15,
  "height": 768,
  "width": 1024
}
```

#### Response
```json
{
  "requestId": "18a36237-f8b2-4c8d-9a3b-d5e8a9f12c45",
  "status": "queued",
  "message": "Request queued. Result will be sent to the provided webhook URL.",
  "pollingEndpoint": "/checkStatus"
}
```

#### Status Check
```http
POST https://gateway.pixazo.ai/flux-1-schnell/v1/checkStatus
Content-Type: application/json
Ocp-Apim-Subscription-Key: YOUR_API_KEY

{
  "requestId": "18a36237-f8b2-4c8d-9a3b-d5e8a9f12c45"
}
```

#### Status Response
```json
{
  "status": "completed",
  "output": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/flux-schnell-cf/prompt-1768311018384-879091.png",
  "completedAt": 1768311019767
}
```

## 🏗️ Implementation Architecture

### Service Layer: `pixazo.service.ts`

```typescript
// Key Features:
- Retry mechanism: 5 attempts with exponential backoff
- Polling system: 60 attempts, 2s intervals (2 min timeout)
- Batch processing: 3 scenes concurrently
- Sketch-optimized prompts
```

### Public Methods

#### 1. `generateSketchImage(description, sceneNumber)`
Generates a single sketch image with retry and polling.

```typescript
const imageUrl = await pixazoService.generateSketchImage(
  "A hero standing on a cliff at sunset",
  1
);
// Returns: "https://pub-582b2...png"
```

#### 2. `generateMultipleSketchImages(scenes)`
Batch process multiple scenes with rate limiting.

```typescript
const scenes = [
  { sceneNumber: 1, description: "Hero on cliff" },
  { sceneNumber: 2, description: "Villain approaches" }
];

const results = await pixazoService.generateMultipleSketchImages(scenes);
// Returns: [
//   { sceneNumber: 1, imageUrl: "https://...", error: null },
//   { sceneNumber: 2, imageUrl: "https://...", error: null }
// ]
```

## 🎯 Prompt Engineering

### Sketch-Style Optimization
The service automatically enhances prompts for storyboard aesthetics:

```typescript
private createSketchPrompt(description: string, sceneNumber: number): string {
  return `Professional storyboard sketch, black and white pencil drawing, 
hand-drawn style, comic panel layout, cinematic composition, 
film storyboard aesthetic, rough sketch with shading, 
scene ${sceneNumber}: ${description}. 
Style: traditional animation storyboard, sketch lines, 
professional artist quality, movie pre-production art, clean linework`;
}
```

**Input**: "A hero standing on a cliff"
**Enhanced**: "Professional storyboard sketch, black and white pencil drawing, hand-drawn style, comic panel layout, cinematic composition, film storyboard aesthetic, rough sketch with shading, scene 1: A hero standing on a cliff. Style: traditional animation storyboard, sketch lines, professional artist quality, movie pre-production art, clean linework"

**Result**: Non-photorealistic sketch suitable for storyboards

## 🔄 Retry & Polling Strategy

### Retry Mechanism (Request Submission)
```typescript
Configuration:
- Max Retries: 5
- Initial Delay: 3 seconds
- Backoff: Exponential (3s * 2^attempt)
- No Retry On: 400-403 errors (client errors)
- Retry On: 500+ errors (server errors)

Flow:
1. Attempt 1: Immediate
2. Attempt 2: Wait 3s
3. Attempt 3: Wait 6s
4. Attempt 4: Wait 12s
5. Attempt 5: Wait 24s
```

### Polling Strategy (Status Check)
```typescript
Configuration:
- Poll Interval: 2 seconds
- Max Polls: 60 attempts
- Total Timeout: 2 minutes

States:
- "queued" → Keep polling
- "processing" → Keep polling
- "completed" → Return imageUrl
- "failed" → Throw error
```

## 📦 Batch Processing

### Rate Limiting
To respect free tier limits and avoid overwhelming the API:

```typescript
Configuration:
- Batch Size: 3 scenes concurrently
- Batch Delay: 2 seconds between batches

Example (12 scenes):
Batch 1: Scenes 1, 2, 3 (concurrent)
  → Wait 2s
Batch 2: Scenes 4, 5, 6 (concurrent)
  → Wait 2s
Batch 3: Scenes 7, 8, 9 (concurrent)
  → Wait 2s
Batch 4: Scenes 10, 11, 12 (concurrent)
```

**Total Time**: ~3-5 minutes for 12 scenes

## 🔗 Integration with AI Service

### `ai.service.ts` Flow

```typescript
// 1. Generate scene descriptions with Gemini
const scenes = await generateComicScenes(transcript);
// Returns: [
//   { sceneNumber: 1, description: "...", dialogue: "..." },
//   ...
// ]

// 2. Extract descriptions for Pixazo
const sceneDescriptions = scenes.map(s => ({
  sceneNumber: s.sceneNumber,
  description: s.description
}));

// 3. Generate images with Pixazo
const imageResults = await pixazoService.generateMultipleSketchImages(sceneDescriptions);

// 4. Map results back to scenes
const scenesWithImages = scenes.map(scene => {
  const imageResult = imageResults.find(r => r.sceneNumber === scene.sceneNumber);
  return {
    ...scene,
    imageUrl: imageResult?.imageUrl || null,
    imageError: imageResult?.error || null
  };
});
```

## 🎨 Image Specifications

### Output Format
- **Size**: 1024x768 (landscape)
- **Style**: Black & white pencil sketch
- **Format**: PNG
- **Aspect Ratio**: 4:3 (storyboard-friendly)
- **Steps**: 4 (optimized for Flux Schnell)

### CDN Hosting
Images are hosted on Pixazo's CDN:
```
https://pub-582b7213209642b9b995c96c95a30381.r2.dev/flux-schnell-cf/prompt-{timestamp}-{id}.png
```

## 🛠️ Error Handling

### Graceful Degradation
```typescript
// Failed images return null with error message
{
  sceneNumber: 5,
  imageUrl: null,
  error: "Polling timeout after 60 attempts"
}

// Script generation continues
// Frontend displays placeholder
```

### Error Types
1. **API Key Missing**: Throws on service initialization
2. **Request Failed**: Retries 5 times, then returns null
3. **Polling Timeout**: Returns null after 2 minutes
4. **Rate Limit**: Handled by batch processing
5. **Invalid Response**: Throws with error message

## 📊 Logging

### Console Output Example
```
🎨 Generating sketch for Scene 1...
🔄 Attempt 1/5 to submit generation request...
📋 Async request queued: 18a36237-f8b2-4c8d-9a3b-d5e8a9f12c45
🔍 Polling for Scene 1 result...
⏳ Scene 1 - Status: processing (Poll 1/60)
⏳ Scene 1 - Status: processing (Poll 2/60)
✅ Scene 1 completed after 3 polls
✅ Scene 1 - Image generated: https://pub-582b7213209642b9b995c96c95a30381...
```

## 🚀 Performance Optimization

### Best Practices
1. **Use Batch Processing**: Process multiple scenes concurrently
2. **Respect Rate Limits**: 2-second delays between batches
3. **Handle Failures Gracefully**: Continue processing on error
4. **Log Everything**: Track request IDs for debugging
5. **Set Timeouts**: Prevent infinite polling

### Metrics
- **Request Time**: ~500ms per request
- **Generation Time**: ~10-30s per image
- **Batch Time**: ~40-60s per batch of 3
- **Total Time (12 scenes)**: ~3-5 minutes

## 🔍 Troubleshooting

### Issue: 401 Unauthorized
```
Solution: Check PIXAZO_API_KEY in .env
Verify key is valid in Pixazo dashboard
```

### Issue: Timeout Errors
```
Solution: 
- Check internet connection
- Increase maxPollAttempts in pixazo.service.ts
- Verify Pixazo API status
```

### Issue: Rate Limit Errors
```
Solution:
- Reduce batchSize from 3 to 2
- Increase batch delay from 2s to 5s
```

### Issue: No Images Generated
```
Solution:
1. Check console logs for specific errors
2. Verify API key has quota
3. Test with single scene first
4. Check Pixazo API status page
```

## 📝 Code Changes Summary

### Removed (Imagen)
```typescript
❌ import { GoogleAIFileManager } from '@google/generative-ai/server';
❌ private imagenAI: any;
❌ private async generateImageWithRetry(...)
```

### Added (Pixazo)
```typescript
✅ import { PixazoService } from '../pixazo/pixazo.service';
✅ constructor(private readonly pixazoService: PixazoService)
✅ await this.pixazoService.generateMultipleSketchImages(...)
```

## 🔗 Module Dependencies

```
AppModule
  ├── PixazoModule
  │   └── PixazoService (uses HttpService)
  ├── AiModule
  │   └── AiService (uses PixazoService + Gemini)
  └── MovieModule
      └── MovieService (uses AiService)
```

## 💰 Cost Comparison

| Service | Model | Cost per Image |
|---------|-------|----------------|
| Google Imagen | imagen-4.0-fast | $0.02-0.04 |
| **Pixazo Flux 1 Schnell** | **flux-1-schnell** | **$0.00 (FREE)** |

**Savings for 12 images**: $0.24 - $0.48 per generation

## 📚 Additional Resources

- **Pixazo Dashboard**: https://gateway.pixazo.ai
- **API Documentation**: https://gateway.pixazo.ai/flux-1-schnell/v1/
- **Flux Model**: Black Forest Labs Flux 1 Schnell
- **Support**: https://pixazo.ai/contact

## ✅ Testing Checklist

- [ ] PIXAZO_API_KEY configured in .env
- [ ] Server starts without errors
- [ ] Single image generation works
- [ ] Batch generation (12 scenes) completes
- [ ] Images display in frontend
- [ ] Error handling works (null imageUrl on failure)
- [ ] Retry mechanism activates on errors
- [ ] Polling completes within 2 minutes
- [ ] Console logs show progress
- [ ] Script still displays if some images fail
