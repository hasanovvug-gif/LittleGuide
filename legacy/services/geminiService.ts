import { DailyActivity, Quest } from "../types";

export interface RecipeSuggestion {
  title: string;
  ingredients: string[];
  instructions: string;
  prepTime: string;
  reason: string;
}

export interface PhotoIdea {
  title: string;
  concept: string;
  props: string[];
  tips: string;
}

const callGeminiAPI = async (action: string, payload: any) => {
  const isDev = import.meta.env.DEV;
  // В локальной разработке vite dev server работает на порту 5173, а vercel API может не поддерживаться Vite без плагинов.
  // Но так как мы будем использовать `vercel dev` для разработки бэкенда, маршрут будет доступен по `/api/gemini`.
  const baseUrl = ''; 
  
  const response = await fetch(`${baseUrl}/api/gemini`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'API Error');
  }

  return response.json();
};

export const generateRecipe = async (ageMonths: number, likedFoods: string[], dislikedFoods: string[], language: string): Promise<RecipeSuggestion | null> => {
  try {
    const res = await callGeminiAPI('generateRecipe', { ageMonths, likedFoods, dislikedFoods, language });
    return res.data;
  } catch (error) {
    console.error("Gemini Recipe Error:", error);
    return null;
  }
};

export const chatWithPediatrician = async (
  message: string, 
  history: { role: 'user' | 'model'; text: string }[],
  context: { parentName: string; childName: string; ageMonths: number; language: string }
) => {
  try {
    const res = await callGeminiAPI('chatWithPediatrician', { message, history, context });
    return res.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return context.language === 'uk' ? "Вибачте, зараз я трохи втомився. Спробуйте запитати мене трохи пізніше." : 
           context.language === 'ru' ? "Извини, сейчас я немного устал. Попробуй спросить меня чуть позже." : 
           "Sorry, I'm a bit tired right now. Try asking me a little later.";
  }
};

export const generateDailyActivity = async (ageMonths: number, childName: string, language: string): Promise<DailyActivity> => {
  try {
    const res = await callGeminiAPI('generateDailyActivity', { ageMonths, childName, language });
    return res.data;
  } catch (error) {
    console.error("Gemini Activity Error:", error);
    return {
      title: language === 'uk' ? "Гра в хованки з хустинкою" : language === 'ru' ? "Игра в прятки с платочком" : "Peek-a-boo with a scarf",
      description: language === 'uk' ? `Накрийте улюблену іграшку хустинкою і запитайте 'Де ведмедик?'. Це розвиває розуміння постійності об'єктів.` : 
                   language === 'ru' ? `Накройте любимую игрушку платком и спросите 'Где мишка?'. Это развивает понимание постоянства объектов.` : 
                   `Cover a favorite toy with a scarf and ask 'Where is the bear?'. This develops object permanence.`,
      category: "Cognitive",
      duration: "5 min",
      isCompleted: false,
      brainFact: {
        title: language === 'uk' ? "Розвиток пам'яті" : language === 'ru' ? "Развитие памяти" : "Memory Development",
        fact: language === 'uk' ? "У цьому віці мозок активно формує нейронні зв'язки, що відповідають за розпізнавання об'єктів." : 
              language === 'ru' ? "В этом возрасте мозг активно формирует нейронные связи, отвечающие за распознавание объектов." : 
              "At this age, the brain is actively forming neural connections responsible for object recognition."
      }
    };
  }
};

export const generateQuest = async (ageMonths: number, childName: string, language: string): Promise<Omit<Quest, 'id' | 'currentDay' | 'color' | 'isCompletedToday'>> => {
  try {
    const res = await callGeminiAPI('generateQuest', { ageMonths, childName, language });
    return res.data;
  } catch (error) {
    console.error("Gemini Quest Error:", error);
    return {
      title: language === 'uk' ? "Тиждень без екранів" : language === 'ru' ? "Неделя без экранов" : "Screen-free week",
      description: language === 'uk' ? "Фокус на живому спілкуванні." : language === 'ru' ? "Фокус на живом общении." : "Focus on live communication.",
      totalDays: 3,
      tasks: [
        language === 'uk' ? "Почитайте книгу разом 15 хвилин." : language === 'ru' ? "Почитайте книгу вместе 15 минут." : "Read a book together for 15 minutes.",
        language === 'uk' ? "Побудуйте вежу з кубиків." : language === 'ru' ? "Постройте башню из кубиков." : "Build a tower with blocks.",
        language === 'uk' ? "Пограйте в хованки." : language === 'ru' ? "Поиграйте в прятки." : "Play hide and seek."
      ]
    };
  }
};

export const generateBedtimeStory = async (dayContext: string, childName: string, language: string): Promise<string> => {
  try {
    const res = await callGeminiAPI('generateBedtimeStory', { dayContext, childName, language });
    return res.text;
  } catch (error) {
    return language === 'uk' ? "Сьогодні казки відпочивають, але завтра обов'язково будуть нові..." : 
           language === 'ru' ? "Сегодня сказки отдыхают, но завтра обязательно будут новые..." : 
           "Today the stories are resting, but tomorrow there will definitely be new ones...";
  }
};

export const generateMonthSummary = async (entries: string[], childName: string, language: string): Promise<string> => {
  try {
    const res = await callGeminiAPI('generateMonthSummary', { entries, childName, language });
    return res.text;
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return language === 'uk' ? "Не вдалося згенерувати підсумок." : 
           language === 'ru' ? "Не удалось сгенерировать итог." : 
           "Failed to generate summary.";
  }
};

export const generatePhotoIdeas = async (ageMonths: number, childName: string, language: string): Promise<PhotoIdea> => {
  try {
    const res = await callGeminiAPI('generatePhotoIdeas', { ageMonths, childName, language });
    return res.data;
  } catch (error) {
    console.error("Gemini Photo Error:", error);
    return {
      title: language === 'uk' ? "Затишна ковдра" : language === 'ru' ? "Уютное одеялко" : "Cozy Blanket",
      concept: language === 'uk' ? "Сфотографуйте малюка зверху на фактурному пледі з улюбленою іграшкою." : 
               language === 'ru' ? "Сфотографируйте малыша сверху на фактурном пледе с любимой игрушкой." : 
               "Photograph the baby from above on a textured blanket with a favorite toy.",
      props: language === 'uk' ? ["Плед великої в'язки", "М'яка іграшка", "Денне світло"] : 
             language === 'ru' ? ["Плед крупной вязки", "Мягкая игрушка", "Дневной свет"] : 
             ["Chunky knit blanket", "Soft toy", "Daylight"],
      tips: language === 'uk' ? "Знімайте від вікна, щоб світло падало збоку — це створить гарний об'єм." : 
            language === 'ru' ? "Снимайте от окна, чтобы свет падал сбоку — это создаст красивый объем." : 
            "Shoot from the window so the light falls from the side — this will create beautiful volume."
    };
  }
};

export const generateStoryImage = async (storyText: string): Promise<string | null> => {
  try {
    const res = await callGeminiAPI('generateStoryImage', { storyText });
    return res.image;
  } catch (error) {
    console.error("Gemini Story Image Error:", error);
    return null;
  }
};

export const scribbleToArt = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    const res = await callGeminiAPI('scribbleToArt', { base64Image, prompt });
    return res.image;
  } catch (error) {
    console.error("Gemini Scribble Error:", error);
    throw error;
  }
};

export const generateColoringPage = async (prompt: string): Promise<string | null> => {
  try {
    const res = await callGeminiAPI('generateColoringPage', { prompt });
    return res.image;
  } catch (error) {
    console.error("Gemini Coloring Page Error:", error);
    throw error;
  }
};

export const editChildPhoto = async (base64Image: string, stylePrompt: string): Promise<string | null> => {
  try {
    const res = await callGeminiAPI('editChildPhoto', { base64Image, stylePrompt });
    return res.image;
  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    throw error;
  }
};