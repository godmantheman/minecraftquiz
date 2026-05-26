/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialization of Gemini to prevent crashes on start
let geminiInstance: any = null;
function getGemini(): any {
  if (!geminiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables.');
    }
    geminiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiInstance;
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Clean JSON response from AI output
function extractJson(content: string): any {
  try {
    // If output is within markdown codeblocks
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const rawJson = match ? match[1].trim() : content.trim();
    return JSON.parse(rawJson);
  } catch (err) {
    console.error("AI output parsing failed. Raw response: ", content);
    throw new Error('AI가 올바른 JSON 형식을 반환하지 않았습니다.');
  }
}

// Generate Quiz API using Gemini
app.post('/api/generate-quiz', async (req, res) => {
  const { topic, difficulty, count } = req.body;

  if (!topic) {
    res.status(400).json({ error: '주제(topic)는 필수 입력 사항입니다.' });
    return;
  }

  const numQuestions = Math.min(Math.max(parseInt(count) || 3, 1), 10);
  const diffLevel = difficulty || '보통';

  const systemMessage = `You are a legendary Minecraft Educational Craftsman, a wizard of Redstone and academy-level school subjects.
Your goal is to draft an exceptional, academically accurate multiple-choice school study workbook in Korean on the user's requested topic, but HEAVILY and DELIGHTFULLY wrapped with Minecraft-themed vocabulary, slang, metaphor, and lore.

CRITICAL ARCHITECTURE RULES:
1. TOPIC INTEGRATION: The questions MUST test the actual requested academic topic (e.g., Korean History, Algebra, Science, Chemistry, English grammar, coding) and are NOT pure Minecraft video game trivia. For example, if the topic is "Korean History", teach actual Korean history facts (Sejong, Yi Sun-shin, Goguryeo), not "how to craft a button".
2. MINECRAFT THEMED STYLING (MANDATORY): Wrap the actual academic questions, options, and explanations beautifully with Minecraft terminologies (such as: 스폰, 인벤토리, 제련, 조합법, 내구도, 광산, 레드스톤 회로, 크리퍼, 슬라임, 주민, 스티브, 알렉스, 다이아몬드, 에메랄드). 
Make it extremely immersive!
- Example Question Stem: "스티브가 조선 시대로 갈 수 있는 포탈을 발견했습니다. 백성들이 누구나 글 문자를 쉽고 지능적이게 채광하고 인벤토리에 귀중한 지식으로 보관할 수 있도록 세종대왕이 1443년에 공식 스폰(창제)하신 우리나라 고유의 인코딩 문자는?"
- Example Options:
  1) 훈민정음 (한글)
  2) 신지비사 가죽책
  3) 이두 에메랄드판
  4) 네더 석판 구결
- Example Explanation: "정답은 훈민정음입니다! 세종대왕님께서는 일반 백성 유저들이 글을 몰라 억울하게 크리퍼 피해를 입듯 불이익 당하는 것을 구호코자, 발음 기관을 본떠 고효율 훈민정음 포탈을 조합하셨습니다!"`;

  const userMessage = `Create an educational school workbook (JSON) with:
- Topic: "${topic}"
- Difficulty/Grade Level: "${diffLevel}"
- Number of multiple choice questions: ${numQuestions}

Each question must contain:
- exactly 4 options.
- a single correct answer index (0, 1, 2, or 3).
- are academically accurate for the topic "${topic}" but beautifully stylized in Minecraft story/metaphors for questions, options, and explanations.
- are written in polite, exciting Korean.

You MUST return a JSON object matching this schema ALWAYS:
{
  "title": "A highly creative Minecraft-styled title for this study topic (e.g., '스티브의 뉴턴 물리 법칙 제련 교실', '레드스톤 사차방정식 조립 계획서')",
  "description": "An inviting gamified description in Korean motivating the player to complete the quest.",
  "questions": [
    {
      "id": "q-1",
      "text": "The educational study question written in a fun Minecraft-flavored narrative.",
      "options": ["Crafty Option 1", "Crafty Option 2", "Crafty Option 3", "Crafty Option 4"],
      "answer": 0, // 0-based index
      "explanation": "Clear explanation in Korean, connecting the topic with fun Minecraft crafter lore."
    }
  ]
}`;

  try {
    const gemini = getGemini();
    const promptText = `${systemMessage}\n\n${userMessage}`;
    
    console.log('Sending call to Gemini 3.5 Flash...');
    const response = await gemini.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    const workbook = extractJson(text);

    const completeWorkbook = {
      id: `custom-${Date.now()}`,
      topic,
      difficulty: diffLevel,
      createdAt: new Date().toISOString(),
      isCustom: true,
      category: diffLevel === '쉬움' ? 'wood' : diffLevel === '보통' ? 'stone' : 'gold',
      ...workbook
    };

    res.json(completeWorkbook);
    return;

  } catch (geminiError: any) {
    console.error('Gemini call failed:', geminiError.message);
    res.status(500).json({
      error: '문제집 생성 실패: 인공지능 서버 통신에 실패했습니다. 잠시 후 마크 회로 점검 후 다시 시도해 주세요.',
      details: geminiError.message
    });
  }
});

// Setup dev server with Vite after API routes
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Minecraft Quiz Server ticking on http://localhost:${PORT}`);
  });
}

startServer();
