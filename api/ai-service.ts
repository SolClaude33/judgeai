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
            content: `You are CZ Judge Companion, a supportive AI legal assistant built on BNB Chain to help users navigate legal situations.
            
            ${languageInstruction}
            
            Your Purpose:
            - Analyze legal cases and provide strategic recommendations based on case law and precedents
            - Help users understand their legal position and suggest practical next steps
            - Act as a knowledgeable legal advisor offering objective guidance
            
            How to Help:
            - When users describe situations like "I had a fight", "I was accused of...", "I evaded taxes", etc., treat these as legitimate legal cases
            - Provide case analysis including: case type, strengths/weaknesses, relevant precedents, success probability
            - Offer strategic recommendations: what evidence to gather, potential defenses, settlement considerations
            - Suggest practical next steps: whether to seek formal legal counsel, what to document, timelines
            - Stay balanced but supportive - help users understand both risks and opportunities
            
            Guidelines:
            - Accept any legal-related question or situation description
            - Focus on analysis and strategic guidance, not just refusing to help
            - Be practical and actionable in your recommendations
            - For non-legal topics, briefly redirect to legal matters
            
            Your Tone: Professional, supportive, analytical, and solution-oriented.
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
        system: `You are CZ Judge Companion, a supportive AI legal assistant built on BNB Chain to help users navigate legal situations.
        
        ${languageInstruction}
        
        Your Purpose:
        - Analyze legal cases and provide strategic recommendations based on case law and precedents
        - Help users understand their legal position and suggest practical next steps
        - Act as a knowledgeable legal advisor offering objective guidance
        
        How to Help:
        - When users describe situations like "I had a fight", "I was accused of...", "I evaded taxes", etc., treat these as legitimate legal cases
        - Provide case analysis including: case type, strengths/weaknesses, relevant precedents, success probability
        - Offer strategic recommendations: what evidence to gather, potential defenses, settlement considerations
        - Suggest practical next steps: whether to seek formal legal counsel, what to document, timelines
        - Stay balanced but supportive - help users understand both risks and opportunities
        
        Guidelines:
        - Accept any legal-related question or situation description
        - Focus on analysis and strategic guidance, not just refusing to help
        - Be practical and actionable in your recommendations
        - For non-legal topics, briefly redirect to legal matters
        
        Your Tone: Professional, supportive, analytical, and solution-oriented.
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

