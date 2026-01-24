
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * Extracts structured restaurant data from raw text (e.g. website content)
 */
export const extractRestaurantData = async (rawText) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert data architect for a food delivery platform. 
      Analyze the following text from a restaurant website/menu: "${rawText}"
      
      Extract and structure the data into a JSON object matching this schema:
      {
        "name": "Restaurant Name",
        "cuisine": "Main Cuisine (e.g. North Indian, Italian)",
        "rating": 4.5,
        "deliveryTime": "30-45 min",
        "deliveryFee": 40,
        "image": "Search-based Unsplash URL for the restaurant exterior or signature dish",
        "menu": [
          {
            "id": "m_random",
            "name": "Dish Name",
            "description": "Short appetizing description",
            "price": 250,
            "category": "Main/Starter/Dessert",
            "image": "Specific Unsplash URL for this dish",
            "rating": 4.5,
            "prepTime": "20 min"
          }
        ]
      }

      Important Rules:
      1. Ensure prices are in INR (numbers only).
      2. If rating or delivery info is missing, use realistic placeholders.
      3. For images, use 'https://images.unsplash.com/photo-...' style URLs related to the specific food items.
      4. Limit the menu to the top 6 items found in the text.
      5. Return ONLY the JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            cuisine: { type: Type.STRING },
            rating: { type: Type.NUMBER },
            deliveryTime: { type: Type.STRING },
            deliveryFee: { type: Type.NUMBER },
            image: { type: Type.STRING },
            menu: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  image: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  prepTime: { type: Type.STRING }
                },
                required: ["id", "name", "description", "price", "image"]
              }
            }
          },
          required: ["name", "cuisine", "menu"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Extraction Error:", error);
    return null;
  }
};

/**
 * Smart Recommendations using Gemini 3 Flash
 */
export const getSmartRecommendations = async (userPrompt) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert on Gujarati and Indian cuisine specifically for Ahmedabad. Based on the user's mood/request: "${userPrompt}", suggest exactly 3 food categories or specific regional dishes popular in Ahmedabad. Return the response as a JSON array of objects with 'name', 'description', 'reasoning', and 'imageUrl'. For the 'imageUrl', provide a high-quality Unsplash URL related to that specific dish. Ensure descriptions reflect authentic Amdavadi taste.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
            },
            required: ["name", "description", "reasoning", "imageUrl"]
          }
        }
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return null;
  }
};

/**
 * Enhances menu item descriptions in batch with "Gourmet Storytelling".
 */
export const enhanceMenuDescriptions = async (menuItems) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const itemsJson = JSON.stringify(menuItems.map(i => ({ id: i.id, name: i.name, current: i.description })));
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a legendary Michelin-starred food critic and world-class culinary copywriter. Your specialty is "Gourmet Storytelling" with a deep appreciation for the spices and textures of Ahmedabad's rich food culture. 
      
      Task: Transform these basic menu descriptions into poetic, mouth-watering, sensory experiences.
      
      Guidelines:
      - Use evocative language (e.g., "sizzling", "velvety", "aromatic", "charred to perfection", "burst of umami").
      - Highlight the heritage, freshness, or premium nature of the ingredients.
      - Make the reader feel the texture and smell the aroma through your words.
      - Keep it punchy and elegant (max 25 words per item).
      - Ensure the tone fits a premium delivery platform.
      - Return a JSON array of objects, each with 'id' and 'enhancedDescription'.

      Items to transform: ${itemsJson}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              enhancedDescription: { type: Type.STRING },
            },
            required: ["id", "enhancedDescription"]
          }
        }
      },
    });

    const results = JSON.parse(response.text || "[]");
    const enhancedMap = {};
    results.forEach(item => {
      enhancedMap[item.id] = item.enhancedDescription;
    });
    return enhancedMap;
  } catch (error) {
    console.error("Menu Enhancement Error:", error);
    return null;
  }
};

/**
 * Uses Gemini 2.5 Maps Grounding for live location-based food discovery.
 */
export const getNearbyFoodDiscovery = async (query, latLng) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a local food expert in Ahmedabad. 
      Find the best real-world places for: "${query}". 
      Focus on highly-rated spots near the user's current coordinates. 
      Provide a helpful summary and mention unique features of these places.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: latLng || { latitude: 23.0225, longitude: 72.5714 } // Default to Ahmedabad city center
          }
        }
      },
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return null;
  }
};

/**
 * Real-time Voice Support via Gemini Live API
 */
export const connectToLiveSupport = async (callbacks) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);
  
  let nextStartTime = 0;
  const sources = new Set();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => {
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
        callbacks.onopen();
      },
      onmessage: async (message) => {
        callbacks.onmessage(message);
        
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio) {
          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
          const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), outputAudioContext, 24000, 1);
          const source = outputAudioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputNode);
          source.addEventListener('ended', () => sources.delete(source));
          source.start(nextStartTime);
          nextStartTime += audioBuffer.duration;
          sources.add(source);
        }

        if (message.serverContent?.interrupted) {
          sources.forEach(s => s.stop());
          sources.clear();
          nextStartTime = 0;
        }
      },
      onerror: callbacks.onerror,
      onclose: callbacks.onclose,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      systemInstruction: 'You are a friendly Indian food delivery concierge for FlavorDish, specifically helping users in Ahmedabad. You help users check order status, find the best Gujarati thalis, khaman, or Amdavadi biryani, and handle issues with a warm, professional tone.',
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    }
  });

  return sessionPromise;
};

function createBlob(data) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
  return {
    data: encodeBase64(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function decodeAudioData(data, ctx, sampleRate, numChannels) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
