import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkModels() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No API key found in .env.local');
    return;
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    console.log('Fetching models...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    const availableModels = data.models?.map((m: any) => m.name).filter((n: string) => n.includes('gemini'));
    console.log('Available Gemini Models:', availableModels);
    
    // Now test a 3.x model
    let targetModel = 'gemini-3.5-flash';
    if (!availableModels.some((m: string) => m.includes(targetModel))) {
       targetModel = availableModels.find((m: string) => m.includes('flash') && !m.includes('lite') && !m.includes('preview')) || availableModels[0];
    }
    
    console.log(`Testing model: ${targetModel}`);
    
    const chat = ai.chats.create({
      model: targetModel,
      config: {
        systemInstruction: 'You are a helpful assistant.'
      }
    });
    
    const reply = await chat.sendMessage({
      message: 'Hello, this is a test!'
    });
    console.log('Reply:', reply.text);
    
  } catch(e) {
    console.error('Error:', e);
  }
}

checkModels();
