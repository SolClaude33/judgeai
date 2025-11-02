import { useState, useCallback, useEffect, useRef } from 'react';
import type { EmotionType } from '@shared/schema';

interface ChatMessage {
  type: 'user_message' | 'cz_message' | 'error' | 'case_analytics';
  data: any;
}

interface SendMessageOptions {
  content: string;
  username?: string;
  language: 'en' | 'zh';
  walletAddress?: string;
}

interface UseChatHTTPOptions {
  onMessage: (message: ChatMessage) => void;
}

interface PendingResponse {
  sequenceId: number;
  messages: ChatMessage[];
}

export function useChatHTTP({ onMessage }: UseChatHTTPOptions) {
  const [isConnected] = useState(true); // Always connected for HTTP
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('idle');
  const [isSending, setIsSending] = useState(false);
  
  // Store callback in ref to prevent hooks count changes
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  
  // Track request sequence for ordered message delivery
  const nextSequenceIdRef = useRef(0);
  const lastProcessedSequenceRef = useRef(-1);
  const pendingResponsesRef = useRef<Map<number, PendingResponse>>(new Map());

  // Process pending responses in order
  const processPendingResponses = useCallback(() => {
    while (true) {
      const nextExpectedId = lastProcessedSequenceRef.current + 1;
      const pendingResponse = pendingResponsesRef.current.get(nextExpectedId);
      
      if (!pendingResponse) {
        // No response with the next sequence ID yet, stop processing
        break;
      }
      
      // Process all messages for this sequence ID in order
      pendingResponse.messages.forEach(msg => onMessageRef.current(msg));
      
      // Mark as processed and remove from pending
      lastProcessedSequenceRef.current = nextExpectedId;
      pendingResponsesRef.current.delete(nextExpectedId);
    }
  }, []);

  // Queue a response with its sequence ID
  const queueResponse = useCallback((sequenceId: number, messages: ChatMessage[]) => {
    pendingResponsesRef.current.set(sequenceId, { sequenceId, messages });
    processPendingResponses();
  }, [processPendingResponses]);

  const sendMessage = useCallback(async (options: SendMessageOptions) => {
    if (isSending) return;
    
    setIsSending(true);
    setCurrentEmotion('idle');

    // Assign sequence ID to this request
    const sequenceId = nextSequenceIdRef.current++;

    // Immediately emit user message for instant feedback (optimistic UI) - NOT queued
    const userMessage = {
      id: Date.now().toString(),
      message: options.content,
      sender: 'user' as const,
      username: options.username || 'Anonymous',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onMessageRef.current({
      type: 'user_message',
      data: userMessage
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: options.content,
          username: options.username,
          language: options.language,
          walletAddress: options.walletAddress,
        }),
      });

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        
        // Try to parse JSON, but handle cases where response might not be JSON
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { error: text || 'Failed to send message' };
          }
        } catch (parseError) {
          // If parsing fails, create a safe error object
          errorData = { error: 'Server error: Invalid response format' };
        }
        
        // Handle rate limiting - queue error message in sequence
        if (response.status === 429) {
          queueResponse(sequenceId, [{
            type: 'error',
            data: { message: errorData.error || 'Please wait before sending another message.' }
          }]);
          setIsSending(false);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Parse JSON response with error handling
      let data;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          throw new Error(`Invalid response format: ${text.substring(0, 100)}`);
        }
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      // Queue CZ response and analytics in order
      setTimeout(() => {
        setCurrentEmotion(data.czMessage.emotion || 'idle');
        
        const responsesToQueue: ChatMessage[] = [{
          type: 'cz_message',
          data: data.czMessage
        }];

        // If analytics available, add to queue
        if (data.analytics) {
          responsesToQueue.push({
            type: 'case_analytics',
            data: data.analytics
          });
        }

        // Queue server responses in order (user message already shown)
        queueResponse(sequenceId, responsesToQueue);
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      queueResponse(sequenceId, [{
        type: 'error',
        data: { 
          message: error instanceof Error ? error.message : 'Failed to send message' 
        }
      }]);
    } finally {
      setIsSending(false);
    }
  }, [isSending, queueResponse]);

  const sendEmotion = useCallback((emotion: EmotionType) => {
    setCurrentEmotion(emotion);
  }, []);

  // Setup audio ended listener with proper cleanup
  useEffect(() => {
    const handleAudioEnded = () => {
      setCurrentEmotion('idle');
    };

    window.addEventListener('czAudioEnded', handleAudioEnded);

    return () => {
      window.removeEventListener('czAudioEnded', handleAudioEnded);
    };
  }, []);

  return { 
    isConnected, 
    sendMessage, 
    currentEmotion, 
    sendEmotion,
    isSending 
  };
}
