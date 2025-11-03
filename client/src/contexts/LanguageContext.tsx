import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'header.title': 'BAI Live',
    'header.subtitle': 'The Real-Time Intelligence Feed',
    'header.tagline': '',
    'header.learnMore': 'Learn More',
    'header.connectWallet': 'Connect Wallet',
    'header.connecting': 'Connecting...',
    
    // Chat Panel
    'chat.title': 'Legal Analysis',
    'chat.connected': 'Connected',
    'chat.offline': 'Offline',
    'chat.connectWalletMessage': 'Connect your BNB wallet to start',
    'chat.placeholderNoWallet': 'Connect wallet to begin...',
    'chat.placeholderConnected': 'Describe your legal case...',
    'chat.placeholderConnecting': 'Connecting...',
    'chat.welcomeMessage': "Welcome to BAI Live! I'm your real-time intelligence assistant built on BNB Chain. Get instant insights and analysis on any topic. Connect your BNB wallet to begin!",
    'chat.analyticsReady': 'Case Analytics Ready',
    'chat.viewAnalytics': 'View Case Analysis',
    
    // Toast messages
    'toast.rateLimitTitle': 'Rate Limit',
    'toast.walletNotFoundTitle': 'Wallet Not Found',
    'toast.walletNotFoundDesc': 'Please install MetaMask or another Web3 wallet to continue.',
    'toast.walletConnectedTitle': 'Wallet Connected',
    'toast.walletConnectedDesc': 'Connected to',
    'toast.connectionFailedTitle': 'Connection Failed',
    'toast.walletDisconnectedTitle': 'Wallet Disconnected',
    'toast.walletDisconnectedDesc': 'Your wallet has been disconnected.',
    
    // Animation Controls
    'animation.idle': 'Idle',
    'animation.analyzing': 'Analyzing',
    'animation.thinking_deep': 'Thinking',
    'animation.presenting': 'Presenting',
    'animation.approving': 'Approving',
    'animation.concerned': 'Concerned',
    'animation.gavel_tap': 'Gavel Tap',
    'animation.comingSoon': 'Coming Soon',
    
    // Buttons
    'button.caseAnalytics': 'Case Analytics',
    'button.contractAddress': 'Contract Address',
    
    // Analytics Dashboard
    'analytics.title': 'Legal Case Analytics',
    'analytics.description': 'AI-powered analysis of your legal case based on historical precedents and key decision factors',
    'analytics.exampleCase': 'Example Case',
    'analytics.binanceRegulatory': 'Binance Regulatory Compliance',
    'analytics.noAnalysisTitle': 'No Analysis Yet',
    'analytics.noAnalysisDesc': 'Describe your legal case to receive AI-powered analysis',
    'analytics.caseStrength': 'Case Strength',
    'analytics.basedOnPrecedents': 'Based on historical precedents',
    'analytics.successProbability': 'Success Probability',
    'analytics.estimatedOutcome': 'Estimated outcome likelihood',
    'analytics.riskAssessment': 'Risk Assessment',
    'analytics.overallRisk': 'Overall Risk',
    'analytics.similarPrecedents': 'Similar Precedents',
    'analytics.casesAnalyzed': 'Cases Analyzed',
    'analytics.keyFactors': 'Key Decision Factors',
    'analytics.keyFactorsDesc': 'Critical elements influencing case outcome',
    'analytics.strong': 'Strong',
    'analytics.moderate': 'Moderate',
    'analytics.weak': 'Weak',
    'analytics.low': 'LOW',
    'analytics.medium': 'MEDIUM',
    'analytics.high': 'HIGH',
  },
  zh: {
    // Header
    'header.title': 'BAI Live',
    'header.subtitle': '实时智能信息流',
    'header.tagline': '',
    'header.learnMore': '了解更多',
    'header.connectWallet': '连接钱包',
    'header.connecting': '连接中...',
    
    // Chat Panel
    'chat.title': '法律分析',
    'chat.connected': '在线',
    'chat.offline': '离线',
    'chat.connectWalletMessage': '连接你的BNB钱包开始',
    'chat.placeholderNoWallet': '连接钱包开始...',
    'chat.placeholderConnected': '描述您的法律案件...',
    'chat.placeholderConnecting': '连接中...',
    'chat.welcomeMessage': '欢迎来到BAI Live！我是您在BNB链上的实时智能助手。获取任何主题的即时洞察和分析。连接您的BNB钱包开始！',
    'chat.analyticsReady': '案件分析已准备好',
    'chat.viewAnalytics': '查看案件分析',
    
    // Toast messages
    'toast.rateLimitTitle': '速率限制',
    'toast.walletNotFoundTitle': '未找到钱包',
    'toast.walletNotFoundDesc': '请安装MetaMask或其他Web3钱包以继续。',
    'toast.walletConnectedTitle': '钱包已连接',
    'toast.walletConnectedDesc': '已连接到',
    'toast.connectionFailedTitle': '连接失败',
    'toast.walletDisconnectedTitle': '钱包已断开',
    'toast.walletDisconnectedDesc': '您的钱包已断开连接。',
    
    // Animation Controls
    'animation.idle': '待机',
    'animation.analyzing': '分析中',
    'animation.thinking_deep': '深度思考',
    'animation.presenting': '呈现中',
    'animation.approving': '批准',
    'animation.concerned': '关注',
    'animation.gavel_tap': '敲槌',
    'animation.comingSoon': '即将推出',
    
    // Buttons
    'button.caseAnalytics': '案件分析',
    'button.contractAddress': '合约地址',
    
    // Analytics Dashboard
    'analytics.title': '法律案件分析',
    'analytics.description': '基于历史先例和关键决策因素的AI驱动案件分析',
    'analytics.exampleCase': '示例案件',
    'analytics.binanceRegulatory': '币安合规监管',
    'analytics.noAnalysisTitle': '暂无分析',
    'analytics.noAnalysisDesc': '描述您的法律案件以获得AI驱动的分析',
    'analytics.caseStrength': '案件强度',
    'analytics.basedOnPrecedents': '基于历史先例',
    'analytics.successProbability': '成功概率',
    'analytics.estimatedOutcome': '预计结果可能性',
    'analytics.riskAssessment': '风险评估',
    'analytics.overallRisk': '整体风险',
    'analytics.similarPrecedents': '类似先例',
    'analytics.casesAnalyzed': '分析案件数',
    'analytics.keyFactors': '关键决策因素',
    'analytics.keyFactorsDesc': '影响案件结果的关键要素',
    'analytics.strong': '强',
    'analytics.moderate': '中等',
    'analytics.weak': '弱',
    'analytics.low': '低',
    'analytics.medium': '中',
    'analytics.high': '高',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
