import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users, TrendingUp, Wifi, WifiOff, Lock } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useChatHTTP } from "@/hooks/useChatHTTP";
import { useWallet } from "@/contexts/WalletContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage as ChatMessageType } from "@shared/schema";
import gigglesLogo from '@assets/image-removebg-preview (30)_1759978567238.png';

export default function ChatPanel() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: "1",
      message: t('chat.welcomeMessage'),
      sender: "cz",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const { address } = useWallet();
  const { toast } = useToast();
  
  // Function to play next audio from queue
  const playNextAudio = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    const audioBase64 = audioQueueRef.current.shift()!;
    isPlayingRef.current = true;

    try {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      currentAudioRef.current = audio;

      const handleEnded = () => {
        window.dispatchEvent(new CustomEvent('czAudioEnded'));
        currentAudioRef.current = null;
        isPlayingRef.current = false;
        // Play next audio in queue
        playNextAudio();
      };

      audio.addEventListener('ended', handleEnded);

      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        window.dispatchEvent(new CustomEvent('czAudioEnded'));
        currentAudioRef.current = null;
        isPlayingRef.current = false;
        // Try next audio in queue even if this one failed
        playNextAudio();
      });
    } catch (error) {
      console.error('Error creating audio:', error);
      window.dispatchEvent(new CustomEvent('czAudioEnded'));
      isPlayingRef.current = false;
      // Try next audio in queue even if this one failed
      playNextAudio();
    }
  }, []);

  // Callback for handling messages from HTTP hook
  const handleMessage = useCallback((message: any) => {
    if (message.type === 'user_message') {
      setMessages(prev => [...prev, message.data]);
    } else if (message.type === 'cz_message') {
      setMessages(prev => [...prev, message.data]);
      
      // Clear any pending fallback timeout
      if (fallbackTimeoutRef.current !== null) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
      
      // Add audio to queue if available
      if (message.data.audioBase64) {
        audioQueueRef.current.push(message.data.audioBase64);
        playNextAudio();
      } else {
        // No audio available (TTS failed or disabled), return to idle after short delay
        fallbackTimeoutRef.current = window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent('czAudioEnded'));
          fallbackTimeoutRef.current = null;
        }, 2000);
      }
    } else if (message.type === 'error') {
      toast({
        variant: "destructive",
        title: t('toast.rateLimitTitle'),
        description: message.data.message,
      });
    }
  }, [toast, t, playNextAudio]);

  const { isConnected, sendMessage, isSending } = useChatHTTP({ onMessage: handleMessage });

  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      if (updatedMessages.length > 0 && updatedMessages[0].id === "1") {
        updatedMessages[0] = {
          ...updatedMessages[0],
          message: t('chat.welcomeMessage')
        };
      }
      return updatedMessages;
    });
  }, [language, t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup fallback timeout, audio, and queue on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current !== null) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      audioQueueRef.current = [];
      isPlayingRef.current = false;
    };
  }, []);

  const handleSend = () => {
    if (!input.trim() || !isConnected || !address || isSending) return;

    sendMessage({
      content: input,
      username: `${address.slice(0, 6)}...${address.slice(-4)}`,
      language: language as 'en' | 'zh',
      walletAddress: address
    });

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-background border-l-2 border-border shadow-lg">
      <img 
        src={gigglesLogo} 
        alt="Giggles Academy" 
        className="absolute top-1/3 right-8 w-32 h-32 opacity-15 pointer-events-none animate-pulse z-0"
      />
      <img 
        src={gigglesLogo} 
        alt="Giggles Academy" 
        className="absolute bottom-1/4 left-8 w-28 h-28 opacity-12 pointer-events-none animate-pulse z-0"
      />
      
      <div className="border-b-2 border-border bg-background px-6 py-5 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight font-[Space_Grotesk]">
              {t('chat.title')}
            </h2>
            {isConnected ? (
              <div className="flex items-center gap-2 bg-green-500 px-3 py-1.5 rounded-full shadow-sm">
                <Wifi className="h-3.5 w-3.5 text-white" data-testid="status-connected" />
                <span className="text-xs font-bold text-white">{t('chat.connected')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-full shadow-sm">
                <WifiOff className="h-3.5 w-3.5 text-white animate-pulse" data-testid="status-disconnected" />
                <span className="text-xs font-bold text-white">{t('chat.offline')}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full" data-testid="viewer-count">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground tabular-nums">1</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-5 relative z-10">
        <div ref={scrollRef} className="space-y-4 py-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} {...msg} />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t-2 border-border bg-background p-5 relative z-10">
        <div className="flex items-center gap-3">
          {!address && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
              <div className="text-center">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">{t('chat.connectWalletMessage')}</p>
              </div>
            </div>
          )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={!address ? t('chat.placeholderNoWallet') : isConnected ? t('chat.placeholderConnected') : t('chat.placeholderConnecting')}
            className="flex-1 bg-card border-2 border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary text-foreground placeholder:text-muted-foreground rounded-xl h-11 px-4 font-medium"
            data-testid="input-chat"
            disabled={!isConnected || !address}
          />
          <Button 
            onClick={handleSend}
            size="icon"
            disabled={!input.trim() || !isConnected || !address || isSending}
            data-testid="button-send"
            className="h-11 w-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
