const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const geminiAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testPipeline() {
  try {
    console.log('1. Asking Gemini for an actor image URL...');
    const model = geminiAi.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Give me a direct, public, working image URL showing the face of the Malayalam actor Jayasurya (who plays Shaji Pappan in the movie Aadu). 
Return ONLY the raw URL starting with http, and absolutely nothing else.`;
    
    const result = await model.generateContent(prompt);
    const imageUrl = result.response.text().trim();
    console.log('Gemini returned URL:', imageUrl);

    if (!imageUrl.startsWith('http')) {
      throw new Error('Gemini did not return a valid URL.');
    }

    console.log('\n2. Testing Pixazo API with the image parameter...');
    const pixazoUrl = 'https://gateway.pixazo.ai/flux-1-schnell/v1/getData';
    
    // We will guess common Img2Img parameters for Flux: image, image_url, init_image
    const payloads = [
      { prompt: "Comic book illustration of this man", image_url: imageUrl, num_steps: 4 },
      { prompt: "Comic book illustration of this man", image: imageUrl, num_steps: 4 },
      { prompt: "Comic book illustration of this man", init_image: imageUrl, num_steps: 4 }
    ];

    for (let i = 0; i < payloads.length; i++) {
      try {
        console.log(`Testing payload variant ${i + 1}...`);
        const res = await axios.post(pixazoUrl, payloads[i], {
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.PIXAZO_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });
        console.log(`SUCCESS with variant ${i + 1}! returned:`, res.data);
      } catch (e) {
        console.log(`Failed variant ${i + 1}:`, e.response?.data || e.message);
      }
    }

  } catch (err) {
    console.error('Test Failed:', err.message);
  }
}

testPipeline();
