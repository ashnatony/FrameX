// Test script to list available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyCNQh3EmKJ2P6MHQDAEEi1YAfp-FTMRan8';

async function listModels() {
  console.log('🔍 Listing available Gemini models...\n');
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  try {
    const models = await genAI.listModels();
    
    console.log('✅ Available models:\n');
    
    for await (const model of models) {
      console.log(`📦 ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
