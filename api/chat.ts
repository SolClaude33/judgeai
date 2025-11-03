import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from "zod";

// Lazy import to avoid loading issues at module initialization
let generateAIResponse: any = null;
async function getGenerateAIResponse() {
  if (!generateAIResponse) {
    try {
      const module = await import("../server/ai-service");
      generateAIResponse = module.generateAIResponse;
    } catch (error) {
      console.error('Failed to import ai-service:', error);
      throw error;
    }
  }
  return generateAIResponse;
}

// Track last message time per user (5 second rate limit)
const userLastMessageTime = new Map<string, number>();
const MESSAGE_COOLDOWN_MS = 5000;

// HTTP endpoint for chat (Vercel-compatible)
const chatRequestSchema = z.object({
  content: z.string().min(1).max(2000),
  username: z.string().optional(),
  language: z.enum(['en', 'zh']).default('en'),
  walletAddress: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Initialize response headers early to prevent issues
  const sendError = (status: number, error: string) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(status).json({ error });
    }
  };

  // Wrap everything in try-catch to prevent FUNCTION_INVOCATION_FAILED
  try {
    console.log('Handler invoked:', req.method, req.url);
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    // Main handler logic
    // Parse request body - handle both JSON string and object
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }
    if (!body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const validatedData = chatRequestSchema.parse(body);
    const { content, username, language, walletAddress } = validatedData;

    // Rate limiting based on wallet address or IP
    const ip = Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : req.headers['x-forwarded-for'];
    const sessionKey = walletAddress || ip || 'unknown';
    const now = Date.now();
    const lastMessageTime = userLastMessageTime.get(String(sessionKey)) || 0;
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage < MESSAGE_COOLDOWN_MS) {
      const remainingTime = Math.ceil((MESSAGE_COOLDOWN_MS - timeSinceLastMessage) / 1000);
      return res.status(429).json({
        error: `Please wait ${remainingTime} seconds before sending another message.`,
        remainingTime
      });
    }

    // Update last message time
    userLastMessageTime.set(String(sessionKey), now);

    // Generate AI response with proper error handling
    let aiResponse;
    try {
      const generateFn = await getGenerateAIResponse();
      aiResponse = await generateFn(content, language);
    } catch (aiError: any) {
      console.error('Error generating AI response:', aiError);
      // Return a safe error response in JSON format
      const errorMessage = language === 'zh' 
        ? '抱歉，AI 服务暂时不可用。请稍后再试。' 
        : 'Sorry, the AI service is temporarily unavailable. Please try again later.';
      
      return res.status(500).json({
        error: errorMessage,
        userMessage: {
          id: Date.now().toString(),
          message: content,
          sender: 'user',
          username: username || 'Anonymous',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        czMessage: {
          id: (Date.now() + 1).toString(),
          message: errorMessage,
          sender: 'cz',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          emotion: 'idle',
        },
        analytics: null,
      });
    }

    // Build response messages
    const userMessage = {
      id: Date.now().toString(),
      message: content,
      sender: 'user' as const,
      username: username || 'Anonymous',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const czMessage = {
      id: (Date.now() + 1).toString(),
      message: aiResponse.message,
      sender: 'cz' as const,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: aiResponse.emotion,
      audioBase64: aiResponse.audioBase64,
    };

    // Return complete response
    return res.status(200).json({
      userMessage,
      czMessage,
      analytics: aiResponse.analytics || null,
    });
  } catch (error: any) {
    console.error('Error in /api/chat handler:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error name:', error?.name);
    
    // Always return valid JSON, even on errors
    if (!res.headersSent) {
      try {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            error: 'Invalid request data', 
            details: error.errors 
          });
        }
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : typeof error === 'string' 
          ? error 
          : 'Internal server error';
        
        return res.status(500).json({ 
          error: errorMessage,
          type: error?.name || 'UnknownError'
        });
      } catch (responseError: any) {
        // If even sending error response fails, log it
        console.error('Failed to send error response:', responseError);
      }
    }
  }
}

