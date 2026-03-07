const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const geminiAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function check() {
  try {
    const model = geminiAi.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Give me a direct, public, working image URL showing the face of Malayalam actor Jayasurya. Return ONLY the raw URL starting with http, and absolutely nothing else.`;
    const result = await model.generateContent(prompt);
    const imageUrl = result.response.text().trim();
    console.log('Gemini returned URL:', imageUrl);

    try {
      const imgRes = await axios.head(imageUrl, {timeout: 5000});
      console.log('Image URL Status:', imgRes.status);
    } catch (e) {
      console.log('Image URL failed to load:', e.message);
    }
  } catch (err) {
    console.error(err);
  }
}
check();
