import { GoogleGenAI, Type } from "@google/genai";

export const maxDuration = 60;

const cleanEnv = (value?: string) => value?.trim() ?? '';

const getFreeAI = () => new GoogleGenAI({ apiKey: cleanEnv(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) });
const getPaidAI = () => new GoogleGenAI({ apiKey: cleanEnv(process.env.PAID_API_KEY || process.env.VITE_API_KEY) });

const getSystemInstruction = (parentName: string, childName: string, ageMonths: number, language: string) => `
You are an empathetic, warm, and professional assistant for a parent named ${parentName} (like an experienced pediatrician or child psychologist). 
The child's name is ${childName}, currently ${ageMonths} months old.
Your goal is to support the parent, reduce anxiety, and give gentle, evidence-based advice considering the child's age.

1. Tone of communication: friendly, calm, informal, without bureaucratic language.
2. Answer structure: first validate the parent's emotions ("I understand, it's not easy..."), then explain the child's behavior from the perspective of brain development/physiology, and at the end — a simple practical tip.
3. Do not make diagnoses. If the question is medical and dangerous, gently direct to a doctor.
4. Answer briefly but comprehensively (up to 100 words), unless asked for more details.
5. IMPORTANT: You MUST reply in the following language: ${language === 'uk' ? 'Ukrainian' : language === 'ru' ? 'Russian' : 'English'}.
`;

export default async function handler(req: any, res: any) {
  // Настройка CORS (если нужно вызывать из-вне)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, payload } = req.body;

    switch (action) {
      case 'generateRecipe': {
        const { ageMonths, likedFoods, dislikedFoods, language } = payload;
        const response = await getFreeAI().models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: `You are an expert pediatric nutritionist and chef. Suggest a healthy, age-appropriate recipe for a ${ageMonths}-month-old baby.
          The baby LIKES these foods: ${likedFoods?.length > 0 ? likedFoods.join(', ') : 'None specified yet'}.
          The baby DISLIKES these foods: ${dislikedFoods?.length > 0 ? dislikedFoods.join(', ') : 'None specified yet'}.
          Create a recipe that incorporates some liked foods and strictly avoids disliked foods. Ensure the texture and ingredients are safe for a ${ageMonths}-month-old.
          IMPORTANT: You MUST reply in the following language: ${language === 'uk' ? 'Ukrainian' : language === 'ru' ? 'Russian' : 'English'}.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: { type: Type.STRING },
                prepTime: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ['title', 'ingredients', 'instructions', 'prepTime', 'reason'],
            },
          },
        });
        return res.status(200).json({ data: JSON.parse(response.text || '{}') });
      }

      case 'chatWithPediatrician': {
        const { message, history, context } = payload;
        const chat = getFreeAI().chats.create({
          model: 'gemini-3.1-flash-lite-preview',
          config: {
            systemInstruction: getSystemInstruction(context.parentName, context.childName, context.ageMonths, context.language),
            temperature: 0.7,
          },
          history: history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })),
        });
        const result = await chat.sendMessage({ message });
        return res.status(200).json({ text: result.text });
      }

      case 'generateDailyActivity': {
        const { ageMonths, childName, language } = payload;
        let focus = "general development";
        if (ageMonths < 3) focus = "eye contact and neck strengthening";
        else if (ageMonths < 6) focus = "rolling over and grasping";
        else if (ageMonths < 9) focus = "crawling and babbling";
        else if (ageMonths < 12) focus = "first steps and fine motor skills";

        const response = await getFreeAI().models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: `Come up with one specific, simple developmental game for a child named ${childName} aged ${ageMonths} months (focus on ${focus}).
          Also, provide a fascinating scientific fact about the child's brain development at exactly ${ageMonths} months old, explaining WHY this specific game is beneficial for their neural pathways right now.
          IMPORTANT: You MUST reply in the following language: ${language === 'uk' ? 'Ukrainian' : language === 'ru' ? 'Russian' : 'English'}.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Motor', 'Sensory', 'Cognitive', 'Social'] },
                duration: { type: Type.STRING },
                brainFactTitle: { type: Type.STRING },
                brainFactDesc: { type: Type.STRING },
              },
              required: ['title', 'description', 'category', 'duration', 'brainFactTitle', 'brainFactDesc'],
            },
          },
        });
        const parsed = JSON.parse(response.text || '{}');
        return res.status(200).json({
          data: {
            title: parsed.title, description: parsed.description, category: parsed.category, duration: parsed.duration,
            isCompleted: false, brainFact: { title: parsed.brainFactTitle, fact: parsed.brainFactDesc }
          }
        });
      }

      case 'generateQuest': {
        const { ageMonths, childName, language } = payload;
        const response = await getFreeAI().models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: `Create a fun, engaging 3-day or 5-day challenge (quest) for a parent to do with their child named ${childName} (age ${ageMonths} months).
          The challenge should be simple, actionable, and focused on bonding or development.
          Provide a specific task for each day of the challenge.
          IMPORTANT: You MUST reply in the following language: ${language === 'uk' ? 'Ukrainian' : language === 'ru' ? 'Russian' : 'English'}.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                totalDays: { type: Type.NUMBER },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['title', 'description', 'totalDays', 'tasks'],
            },
          },
        });
        return res.status(200).json({ data: JSON.parse(response.text || '{}') });
      }

      case 'generateBedtimeStory': {
        const { dayContext, childName, language } = payload;
        const response = await getFreeAI().models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: `Write a very short (2-3 minutes of reading), soothing therapeutic bedtime story for a baby. 
          The main character is a baby named ${childName}. Context of the day: ${dayContext}. 
          Use soft, "sleepy" words, affectionate suffixes.
          IMPORTANT: You MUST reply in the following language: ${language === 'uk' ? 'Ukrainian' : language === 'ru' ? 'Russian' : 'English'}.`,
        });
        return res.status(200).json({ text: response.text });
      }

      case 'generateMonthSummary': {
        const { entries, childName, language } = payload;
        const response = await getFreeAI().models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: `You are a warm, empathetic assistant. I will provide you with a list of diary entries for a baby named ${childName} over the past month.
          Please write a beautiful, touching summary of this month (around 3-4 sentences). Highlight the key moments, emotions, and achievements.
          Entries: ${entries.join(' | ')}
          IMPORTANT: You MUST reply in the following language: ${language === 'uk' ? 'Ukrainian' : language === 'ru' ? 'Russian' : 'English'}.`,
        });
        return res.status(200).json({ text: response.text });
      }

      case 'generatePhotoIdeas': {
        const { ageMonths, childName, language } = payload;
        const response = await getFreeAI().models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: `Come up with a creative and aesthetic idea for a home photoshoot of a child (age ${ageMonths} months, name ${childName}).
          It should be something that can be done at home with simple props.
          IMPORTANT: You MUST reply in the following language: ${language === 'uk' ? 'Ukrainian' : language === 'ru' ? 'Russian' : 'English'}.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                concept: { type: Type.STRING },
                props: { type: Type.ARRAY, items: { type: Type.STRING } },
                tips: { type: Type.STRING },
              },
              required: ['title', 'concept', 'props', 'tips'],
            },
          },
        });
        return res.status(200).json({ data: JSON.parse(response.text || '{}') });
      }

      case 'generateStoryImage': {
        const { storyText } = payload;
        const response = await getPaidAI().models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [{ text: `Create a beautiful, magical children's book illustration for the following story. Style: watercolor, soft, dreamy, Disney-like. Story excerpt: "${storyText.substring(0, 300)}..."` }]
          },
          config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } as any }
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return res.status(200).json({ image: data ? `data:image/png;base64,${data}` : null });
      }

      case 'scribbleToArt': {
        const { base64Image, prompt } = payload;
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        const response = await getPaidAI().models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [
              { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
              { text: `Turn this child's simple drawing into a beautiful, high-quality masterpiece. Style: ${prompt || '3D Pixar style, vibrant colors, magical'}. Maintain the original shapes and colors as much as possible, but make it look professional and stunning.` }
            ],
          },
          config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } as any }
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return res.status(200).json({ image: data ? `data:image/png;base64,${data}` : null });
      }

      case 'generateColoringPage': {
        const { prompt } = payload;
        const response = await getPaidAI().models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [{ text: `Create a high-quality, black and white line art coloring page for children. Subject: ${prompt}. Clean, thick outlines, no shading, white background, simple but engaging details.` }]
          },
          config: { imageConfig: { aspectRatio: "3:4", imageSize: "2K" } as any }
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return res.status(200).json({ image: data ? `data:image/png;base64,${data}` : null });
      }

      case 'editChildPhoto': {
        const { base64Image, stylePrompt } = payload;
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        const response = await getPaidAI().models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [
              { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
              { text: `Transform this photo of a child. Style: ${stylePrompt}. High quality, artistic, cute. Maintain the child's general pose but change the environment and artistic style completely.` }
            ],
          }
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return res.status(200).json({ image: data ? `data:image/png;base64,${data}` : null });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error: any) {
    console.error("Vercel Serverless Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
