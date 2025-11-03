import { Button } from "@/components/ui/button";
import { Wallet, Sun, Moon, BookOpen, LogOut, Languages } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useLanguage } from "@/contexts/LanguageContext";
import baiLogo from "@assets/frame-avatar.png";

export default function StreamHeader() {
  const [isDark, setIsDark] = useState(false);
  const { address, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { language, setLanguage, t } = useLanguage();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-border bg-background/95 backdrop-blur-xl shadow-sm">
      <div className="flex h-20 items-center justify-between px-6 md:px-8 gap-4">
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="relative flex items-center gap-3">
            <div className="relative h-14 w-14 rounded-full overflow-hidden bg-card shadow-md">
              <img src={baiLogo} alt="BAI Live - BNB Chain AI" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-[Space_Grotesk] text-foreground flex items-center gap-2">
                {t('header.title')}
              </h1>
              <p className="text-xs text-muted-foreground font-semibold">{t('header.subtitle')}</p>
              <p className="text-[10px] text-muted-foreground/80 font-medium italic mt-0.5">{t('header.tagline')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center flex-1 gap-3">
          <Button
            variant="default"
            asChild
            className="gap-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg rounded-xl px-6 py-2.5 hover:scale-105"
            data-testid="button-learn-more"
          >
            <a 
              href="https://x.com/cz_binance/status/1984835928301719768"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpen className="h-5 w-5" />
              <span>{t('header.learnMore')}</span>
            </a>
          </Button>
          <Button
            variant="default"
            asChild
            className="gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-bold transition-all shadow-lg rounded-xl px-6 py-2.5 hover:scale-105"
            data-testid="button-twitter-main"
          >
            <a
              href="https://x.com/BaiLiveBNB"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaXTwitter className="h-5 w-5" />
              <span className="hidden sm:inline">Follow @BaiLiveBNB</span>
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            data-testid="button-language-toggle"
            className="hover-elevate active-elevate-2 h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground"
            title={language === 'en' ? '中文' : 'English'}
          >
            <Languages className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
            className="hover-elevate active-elevate-2 h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {address ? (
            <div className="flex items-center gap-2">
              <div className="bg-green-500/10 border-2 border-green-500 px-4 py-2 rounded-xl">
                <span className="text-sm font-bold text-green-600">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={disconnectWallet}
                data-testid="button-disconnect-wallet"
                className="hover-elevate active-elevate-2 h-10 w-10 rounded-lg text-red-500"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              className="gap-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-md rounded-xl px-5 py-2"
              data-testid="button-connect-wallet"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              <Wallet className="h-5 w-5" />
              <span className="hidden sm:inline">
                {isConnecting ? t('header.connecting') : t('header.connectWallet')}
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
