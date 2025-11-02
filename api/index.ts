import express, { type Request, Response, NextFunction } from "express";
import { generateAIResponse } from "../server/ai-service";
import { z } from "zod";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

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

app.post('/chat', async (req, res) => {
  try {
    const validatedData = chatRequestSchema.parse(req.body);
    const { content, username, language, walletAddress } = validatedData;

    // Rate limiting based on wallet address or IP
    const sessionKey = walletAddress || req.ip || 'unknown';
    const now = Date.now();
    const lastMessageTime = userLastMessageTime.get(sessionKey) || 0;
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage < MESSAGE_COOLDOWN_MS) {
      const remainingTime = Math.ceil((MESSAGE_COOLDOWN_MS - timeSinceLastMessage) / 1000);
      return res.status(429).json({
        error: `Please wait ${remainingTime} seconds before sending another message.`,
        remainingTime
      });
    }

    // Update last message time
    userLastMessageTime.set(sessionKey, now);

    // Generate AI response with proper error handling
    let aiResponse;
    try {
      aiResponse = await generateAIResponse(content, language);
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
    return res.json({
      userMessage,
      czMessage,
      analytics: aiResponse.analytics || null,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    
    // Always return valid JSON, even on errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.errors 
      });
    }
    
    // Ensure we always return valid JSON
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Error handler - ensure all errors return valid JSON
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  // Ensure response headers are set correctly
  if (!res.headersSent) {
    res.status(status).json({ 
      error: message,
      status 
    });
  }
});

// Export the Express app as Vercel serverless function
export default app;
