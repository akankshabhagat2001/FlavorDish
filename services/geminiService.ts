
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { MenuItem, AiRecommendation, DiscoveryResult } from "../types";

/**
 * Smart Recommendations using Gemini 3 Flash
 */
export const getSmartRecommendations = async (userPrompt: string): Promise<AiRecommendation[] | null> => {
  // Always initialize with named parameter and process.env.API_KEY
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

    // Access .text property directly
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return null;
  }
};

/**
 * Enhances menu item descriptions to be more appetizing and creative.
 */
export const enhanceMenuDescriptions = async (menuItems: MenuItem[]): Promise<Record<string, string> | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const itemsJson = JSON.stringify(menuItems.map(i => ({ id: i.id, name: i.name, current: i.description })));
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a world-class food critic and menu designer with deep knowledge of Ahmedabad's culinary scene. Enhance the descriptions for these menu items to be incredibly appetizing, sensory, and descriptive. Highlight textures, aromas, and flavors. Return a JSON array of objects, each with 'id' and 'enhancedDescription'.\n\nItems: ${itemsJson}`,
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
    const enhancedMap: Record<string, string> = {};
    results.forEach((item: { id: string; enhancedDescription: string }) => {
      enhancedMap[item.id] = item.enhancedDescription;
    });
    return enhancedMap;
  } catch (error) {
    console.error("Menu Enhancement Error:", error);
    return null;
  }
};

/**
 * Uses Gemini 2.5 Maps Grounding to find real-world food spots in Ahmedabad.
 */
export const getNearbyFoodDiscovery = async (query: string, latLng: { latitude: number; longitude: number } | null): Promise<DiscoveryResult | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find great food options in Ahmedabad for: "${query}". Provide a helpful description and focus on highly-rated Amdavadi places.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: latLng || { latitude: 23.0225, longitude: 72.5714 } // Ahmedabad coords
          }
        }
      },
    });

    return {
      text: response.text || "",
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
export const connectToLiveSupport = async (callbacks: {
  onopen: () => void;
  onmessage: (message: LiveServerMessage) => void;
  onerror: (e: any) => void;
  onclose: (e: any) => void;
}) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);
  
  let nextStartTime = 0;
  const sources = new Set<AudioBufferSourceNode>();

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
          // Solely rely on sessionPromise resolves
          sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
        callbacks.onopen();
      },
      onmessage: async (message: LiveServerMessage) => {
        callbacks.onmessage(message);
        
        // Extracting audio output bytes
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
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
      systemInstruction: 'You are a friendly Indian food delivery concierge for FlavorDish, specifically helping users in Ahmedabad. You help users check order status, find the best Gujarati dishes or Amdavadi specialties, and handle issues with a warm, professional tone.',
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    }
  });

  return sessionPromise;
};

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
  return {
    data: encodeBase64(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decodeBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
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
