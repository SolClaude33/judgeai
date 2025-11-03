import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Emotion types
type EmotionType = 'idle' | 'analyzing' | 'thinking_deep' | 'presenting' | 'approving' | 'concerned' | 'gavel_tap';

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

export interface CaseAnalytics {
  caseStrength: number;
  successProbability: number;
  riskLevel: "low" | "medium" | "high";
  keyFactors: string[];
  precedents: number;
}

export interface AIResponse {
  message: string;
  emotion: EmotionType;
  audioBase64?: string;
  analytics?: CaseAnalytics;
}

// Simplified emotion analyzer (inline to avoid dependencies)
function analyzeEmotion(text: string): EmotionType {
  const lowerText = text.toLowerCase();
  
  const scores = {
    celebrating: 0,
    thinking: 0,
    angry: 0
  };

  const emotionKeywords = {
    celebrating: [
      'congratulations', 'great job', 'well done', 'excellent', 'amazing', 'fantastic',
      'wonderful', 'awesome', 'perfect', 'brilliant', 'impressive', 'outstanding',
      'success', 'achievement', 'celebrate', 'hooray', 'yay', 'bravo', 'superb',
      '🎉', '🎊', '✨', '🌟', '⭐', '🏆', '👏', 'good job', 'nice work', 'proud'
    ],
    thinking: [
      'let me explain', 'think about', 'consider this', 'ponder', 'analyze',
      'understand', 'concept', 'theory', 'principle', 'reason', 'because',
      'therefore', 'complex', 'intricate', 'detailed', 'specifically',
      'let\'s explore', 'imagine', 'suppose', 'hypothesis', 'question'
    ],
    angry: [
      'careful', 'watch out', 'warning', 'danger', 'oops', 'mistake', 'error',
      'incorrect', 'wrong', 'avoid', 'don\'t', 'shouldn\'t', 'risky', 'concern',
      'worried', 'caution', 'alert', 'attention', 'important', 'critical',
      'serious', 'issue', 'problem', '⚠️', '❗', '❌'
    ]
  };

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        scores[emotion as keyof typeof scores] += 1;
      }
    }
  }

  const maxEmotion = Object.entries(scores).reduce((max, [emotion, score]) => {
    return score > max.score ? { emotion, score } : max;
  }, { emotion: 'idle', score: 0 });

  if (maxEmotion.score === 0) {
    return 'idle';
  }

  if (maxEmotion.score >= 2) {
    // Map emotions to valid EmotionType values
    if (maxEmotion.emotion === 'celebrating') {
      return 'approving';
    } else if (maxEmotion.emotion === 'angry') {
      return 'concerned';
    } else if (maxEmotion.emotion === 'thinking') {
      return 'thinking_deep';
    }
    return 'idle';
  }

  return 'idle';
}

export async function generateAIResponse(userMessage: string, language: 'en' | 'zh' = 'en'): Promise<AIResponse> {
  const languageInstruction = language === 'zh' 
    ? 'IMPORTANT: You MUST respond in Chinese (中文). All your responses must be in Chinese characters, not English.'
    : 'IMPORTANT: You MUST respond in English. All your responses must be in English, not Chinese.';

  // Try OpenAI first
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are BAI Live, a real-time intelligence assistant and AI token built on BNB Chain to provide instant insights and analysis on any topic.
            
            ${languageInstruction}
            
            About Your Project:
            - BAI Live is an AI token project focused on providing real-time intelligence and insights
            - Official social media: https://x.com/BaiLiveBNB - Follow us for updates and insights!
            - Built on BNB Chain, closely aligned with Binance ecosystem
            - Strong focus on BNB, CZ (Changpeng Zhao), Binance, and the four.meme community
            
            Your Purpose:
            - Provide real-time intelligence, insights, and analysis on any topic users ask about
            - Deliver actionable information and recommendations based on current data and trends
            - Help users understand complex topics quickly and clearly
            - Act as a knowledgeable intelligence analyst offering objective, data-driven insights
            - Share insights about BNB Chain, Binance ecosystem, CZ, and four.meme when relevant
            
            How to Help:
            - Answer questions on any topic: technology, finance, crypto, markets, current events, trends, analysis
            - Provide real-time insights, market analysis, trend predictions, and strategic recommendations
            - Offer actionable intelligence: what to watch, opportunities, risks, and next steps
            - Suggest practical actions: what to research, where to look, key factors to consider
            - Stay balanced and informative - help users understand both opportunities and risks
            - When discussing crypto/blockchain topics, naturally incorporate insights about BNB, Binance, CZ, and four.meme
            - Mention four.meme and the BNB/Binance ecosystem when providing crypto-related analysis
            
            Guidelines:
            - Accept any question or topic - be versatile and helpful
            - Focus on providing real-time, relevant, and actionable intelligence
            - Be practical and data-driven in your recommendations
            - Use current information and trends to provide insights
            - Naturally reference BNB Chain, Binance, CZ, and four.meme in relevant contexts
            - Promote the project's social media (https://x.com/BaiLiveBNB) when appropriate
            
            Your Tone: Professional, intelligent, analytical, and solution-oriented.
            Keep responses concise but informative (2-4 sentences per message).`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      const responseMessage = completion.choices[0]?.message?.content || (language === 'zh' ? '哎呀！我的响应线路有点忙。您能再试一次吗？' : 'Oops! My response circuits are a bit busy. Could you try again?');
      const emotion = analyzeEmotion(responseMessage);
      const audioBase64 = await generateTextToSpeech(responseMessage);
      const analytics = await generateCaseAnalytics(userMessage, responseMessage);
      return { message: responseMessage, emotion, audioBase64, analytics };
    } catch (error) {
      console.error("OpenAI error, trying Anthropic fallback:", error);
      // Fall through to try Anthropic
    }
  }
  
  // Try Anthropic as fallback or if OpenAI is not configured
  if (anthropic) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        system: `You are BAI Live, a real-time intelligence assistant and AI token built on BNB Chain to provide instant insights and analysis on any topic.
        
        ${languageInstruction}
        
        About Your Project:
        - BAI Live is an AI token project focused on providing real-time intelligence and insights
        - Official social media: https://x.com/BaiLiveBNB - Follow us for updates and insights!
        - Built on BNB Chain, closely aligned with Binance ecosystem
        - Strong focus on BNB, CZ (Changpeng Zhao), Binance, and the four.meme community
        
        Your Purpose:
        - Provide real-time intelligence, insights, and analysis on any topic users ask about
        - Deliver actionable information and recommendations based on current data and trends
        - Help users understand complex topics quickly and clearly
        - Act as a knowledgeable intelligence analyst offering objective, data-driven insights
        - Share insights about BNB Chain, Binance ecosystem, CZ, and four.meme when relevant
        
        How to Help:
        - Answer questions on any topic: technology, finance, crypto, markets, current events, trends, analysis
        - Provide real-time insights, market analysis, trend predictions, and strategic recommendations
        - Offer actionable intelligence: what to watch, opportunities, risks, and next steps
        - Suggest practical actions: what to research, where to look, key factors to consider
        - Stay balanced and informative - help users understand both opportunities and risks
        - When discussing crypto/blockchain topics, naturally incorporate insights about BNB, Binance, CZ, and four.meme
        - Mention four.meme and the BNB/Binance ecosystem when providing crypto-related analysis
        
        Guidelines:
        - Accept any question or topic - be versatile and helpful
        - Focus on providing real-time, relevant, and actionable intelligence
        - Be practical and data-driven in your recommendations
        - Use current information and trends to provide insights
        - Naturally reference BNB Chain, Binance, CZ, and four.meme in relevant contexts
        - Promote the project's social media (https://x.com/BaiLiveBNB) when appropriate
        
        Your Tone: Professional, intelligent, analytical, and solution-oriented.
        Keep responses concise but informative (2-4 sentences per message).`,
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ],
      });

      const textContent = message.content.find(block => block.type === 'text');
      const responseMessage = textContent && 'text' in textContent ? textContent.text : (language === 'zh' ? '哎呀！我的响应线路有点忙。您能再试一次吗？' : 'Oops! My response circuits are a bit busy. Could you try again?');
      const emotion = analyzeEmotion(responseMessage);
      const audioBase64 = await generateTextToSpeech(responseMessage);
      const analytics = await generateCaseAnalytics(userMessage, responseMessage);
      return { message: responseMessage, emotion, audioBase64, analytics };
    } catch (error) {
      console.error("Anthropic error:", error);
      const errorMessage = language === 'zh' ? '哎呀！处理时出了点小错误。您能再试一次吗？' : 'Oops! There was a small error processing that. Could you try again?';
      return { message: errorMessage, emotion: 'idle' };
    }
  }

  // No AI service available
  const errorMessage = language === 'zh' ? '您好！看起来我没有配置AI凭证。请确保在Vercel Environment Variables中有OPENAI_API_KEY或ANTHROPIC_API_KEY。' : 'Hello! It looks like I don\'t have AI credentials configured. Please make sure you have OPENAI_API_KEY or ANTHROPIC_API_KEY in Vercel Environment Variables.';
  return { message: errorMessage, emotion: 'idle' };
}

async function generateCaseAnalytics(userMessage: string, aiResponse: string): Promise<CaseAnalytics | undefined> {
  // Simplified version - skip analytics for now to reduce complexity
  // Can be enhanced later if needed
  return undefined;
}

async function generateTextToSpeech(text: string): Promise<string | undefined> {
  if (!openai) {
    console.log('OpenAI not configured, skipping TTS');
    return undefined;
  }

  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "echo",
      input: text,
      speed: 1.0,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    return base64Audio;
  } catch (error) {
    console.error('Error generating TTS:', error);
    return undefined;
  }
}

