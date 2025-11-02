# $JUDAI - CZ Judge Companion

## Overview
$JUDAI - CZ Judge Companion is a bilingual (English/Chinese) AI legal assistant application featuring an AI-powered 3D avatar in a professional courtroom setting. Built on BNB Chain, it provides supportive legal guidance and strategic recommendations by analyzing user-described cases against historical precedents. The AI actively helps users understand their legal position and suggests practical next steps. The platform intelligently detects legal case descriptions from natural language chat, generating analytics such as case strength, success probability, risk assessment, similar precedents count, and key decision factors, displayed conditionally on a dashboard.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18, TypeScript, Vite, and Wouter. UI components use Shadcn/ui and Radix UI, styled with Tailwind CSS, supporting dark/light modes with a professional legal color scheme (Binance gold). A `LanguageContext` provides bilingual support (English/Chinese), with preferences persisted locally. State management includes HTTP-based chat hook for serverless compatibility, React hooks for local state, React Query for API data, and `WalletContext` for BNB wallet authentication.

The 3D visualization (`CZ3DViewer`) is a Three.js implementation loading a GLB model of a seated avatar (`Legal_Tech_Avatar`) with an IDLE animation loop, positioned for optimal framing. A professional courtroom background image provides context. The renderer is optimized for performance. Audio playback uses a FIFO queue system to prevent overlapping responses.

### Backend Architecture
The backend is an Express.js server managing HTTP requests for serverless deployment (Vercel-compatible, no WebSocket). It supports dual AI providers (OpenAI GPT-3.5-turbo and Anthropic Claude Haiku) with fallback. The AI assistant is a supportive legal advisor that actively helps users analyze cases, providing strategic recommendations, practical next steps, and evidence gathering guidance. It accepts real-world legal situations (disputes, accusations, tax issues, etc.) and offers actionable analysis rather than refusing to help. Its personality is professional, supportive, and solution-oriented.

The system uses keyword-based heuristic analysis to detect valid legal case descriptions (requiring a minimum of 2 legal keywords). Upon detection, it generates case analytics including strength (20-95%), success probability (15-90%), risk level (low/medium/high), 3-5 key decision factors, and 5-25 similar precedents. Analytics are only generated for legitimate legal discussions. Data persistence is managed with Drizzle ORM, PostgreSQL (via Neon), and Zod for schema validation. Real-time communication orchestrates client connections, messages, AI responses, case analytics, and session tracking.

### Feature Specifications
- **BNB Wallet Authentication**: Requires BNB Chain wallet connection (MetaMask/Web3) to send messages, managed by `WalletContext`.
- **HTTP-Based Architecture**: Serverless-compatible HTTP POST endpoint (/api/chat) with sequence-based message queueing for ordered delivery.
- **Text-to-Speech Narration**: AI responses are narrated using OpenAI TTS (`tts-1`, voice: "echo"). Audio is generated server-side, base64-encoded, and auto-played, with avatar animation synced to audio duration.
- **Rate Limiting**: A 5-second cooldown between user messages with real-time feedback.
- **Contract Address Display**: Displays announcement message that contract address will be revealed on Twitter @CZJUDGEAI.
- **Legal Avatar Animation**: Features a single IDLE animation loop. Other emotion-based animations are present but disabled with "Coming Soon" tooltips.
- **Bilingual Support**: Comprehensive English/Chinese translation system with a toggle, `localStorage` persistence, and translations covering all UI components and AI responses.
- **Conditional Case Analytics**: An analytics dashboard displays only when the AI detects a valid legal case discussion. It shows case strength, success probability, risk assessment, similar precedents count, and key decision factors. A default example case is pre-loaded, and the dashboard is always accessible.
- **Professional Visual Design**: Binance gold (#F0B90B) primary and accent colors throughout. A Binance-branded courtroom background image provides legal context, and dark mode is fully supported.
- **Predefined Case Examples**: A panel with 4 example cases (Binance regulatory compliance, smart contract dispute, crypto fraud, account freezing dispute) auto-populates the analytics dashboard when selected.
- **External Links**: "Learn More" links to a CZ tweet about AI judges, and a Twitter/X button links to @CZJUDGEAI.

## External Dependencies

**AI Services:**
- OpenAI API (GPT-3.5-turbo, TTS-1)
- Anthropic API (Claude Haiku)

**Database:**
- PostgreSQL (via Neon serverless driver)

**UI & Styling:**
- Google Fonts: Inter, Space Grotesk, JetBrains Mono
- Radix UI component primitives
- Tailwind CSS

**Development Tools:**
- Replit-specific plugins (runtime error handling, banners, Cartographer)

## Recent Updates

### November 2, 2025
- **Updated Courtroom Background**: Replaced courtroom background with new branded image featuring "$JUDAI" logo, "CZ JUDGE COMPANION" text, and Binance branding
  - Image: `image_1762078602247.png`
  - Maintains 20-unit width and Z: -3.5 positioning
  - Warm brown/gold color scheme matching legal aesthetic
- **Dynamic Welcome Message Translation**: Fixed welcome message to update instantly when language toggles
  - Added useEffect in ChatPanel to watch language changes
  - Message with id="1" now updates dynamically while preserving timestamp
- **Avatar Orientation Correction**: Adjusted avatar rotation from -0.15 to +0.15 radians for proper forward-facing view
  - Oscillation range maintained at ±0.05 radians for natural idle movement
- **Lighting Optimization**: Reduced colored point light intensities to minimize warm tint
  - Blue point light: 0.6 → 0.3 intensity
  - Gold point light: 0.5 → 0.25 intensity
  - Maintains adequate scene illumination while preserving background colors
- **AI Prompt Rewrite**: Transformed AI from restrictive analyzer to supportive legal assistant
  - Removed "Never provide actual legal advice" restriction
  - Now actively helps with real legal situations: disputes, accusations, tax issues, etc.
  - Provides strategic recommendations, evidence gathering guidance, practical next steps
  - Changed from refusing to help to offering actionable case analysis
  - Tone shifted from "objective tool" to "supportive legal advisor"
- **Background Repositioning**: Moved courtroom background 2.5 units to the right (X: 0 → 2.5)
  - Better displays "$JUDAI" branding text
  - Maintains 20-unit width, Z: -3.5 positioning
- **Asset Cleanup**: Removed all unused animation files and previous project assets
  - Deleted old .glb, .fbx, .zip files from attached_assets
  - Removed unused animations from client/public and server/public
  - Only legal-avatar-idle.glb remains (the active animation)
- **Metadata Update**: Updated page title and SEO tags to emphasize "$JUDAI" branding
  - Title: "$JUDAI - CZ Judge Companion | AI Legal Assistant on BNB Chain"
  - Description emphasizes "supportive AI legal assistant" and "strategic recommendations"
  - Open Graph and Twitter cards updated to match new positioning
- **Twitter Button Redesign**: Moved Twitter button to center header for better visibility
  - Removed small icon-only button from right side controls
  - Added prominent blue Twitter button next to "Learn More" in center
  - Shows "Follow @CZJUDGEAI" text (responsive, hidden on mobile)
  - Uses Twitter brand color (#1DA1F2) with hover effects
- **Clickable Analytics Button**: Implemented chat notification when case analytics are generated
  - WebSocket listens for 'case_analytics' messages
  - Inserts clickable button in chat: "View Case Analysis"
  - Button opens analytics panel (Sheet component) when clicked
  - Added translations in both English and Chinese
  - Schema updated to support system messages and analytics button flag
- **Background Position Adjustment**: Moved courtroom background further left (X: 2.5 → 1.0)
  - Better displays "$JUDAI" branding without avatar obstruction
  - Maintains optimal positioning for courtroom scene
- **OpenAI TTS Confirmed**: Text-to-Speech system properly configured
  - Uses OpenAI API with model "tts-1" and voice "echo"
  - Converts responses to base64 audio for playback
  - Now functional with paid API
- **Natural Language Case Detection**: Massively improved analytics detection for real-world usage
  - Expanded legal keywords to include natural language in 3 languages (Spanish, English, Chinese)
  - Added everyday phrases: "tuve una pelea", "I hit someone", "我打了人", "robé", "crashed", "evadí impuestos"
  - Reduced detection threshold from 2 keywords to just 1 keyword
  - Implemented smart detection: generates analytics if AI response contains legal terminology
  - Now detects natural conversational messages, not just technical legal jargon
  - Covers common situations: fights/assault, theft/robbery, accidents, taxes, employment, family law
- **Vercel Deployment Refactoring**: Complete HTTP architecture for serverless deployment
  - Removed WebSocket in favor of HTTP POST /api/chat endpoint
  - Implemented sequence-based message queueing to guarantee ordered delivery even with concurrent requests
  - User messages display instantly (optimistic UI) while server responses queue by sequence ID
  - processPendingResponses() ensures messages appear in send order regardless of HTTP response timing
  - Callback-based message system prevents loss during rapid sends
  - Used useRef for callback stability to prevent React hooks count errors
- **Binance Gold Branding**: Complete color scheme update from blue to Binance gold (#F0B90B)
  - Primary color changed from navy blue (hsl 218) to Binance gold (hsl 45 94% 50%)
  - Updated all color tokens: primary, secondary, accent, sidebar, charts, ring/focus
  - Applied consistently across light mode (hsl 45 94% 50%) and dark mode (hsl 45 94% 55%)
  - Gold now appears on all borders, buttons, highlights, and interactive elements
  - No blue (hue 218) colors remain in the palette
- **Updated Branding Assets**: New CZ/Binance preview images and favicon
  - Open Graph image: image_1762081927138.png (CZ avatar with gold branding)
  - Favicon: image_1762081896656.png (CZ avatar logo)
  - Both files copied to client/public/ directory
  - HTML meta tags updated to reference new assets
- **Contract Address Update**: Changed displayed text to announce future Twitter reveal
  - Replaced hardcoded contract address with message: "Contract Address will be announced on our Twitter @CZJUDGEAI"
  - Clickable Twitter link with gold highlight on hover
  - Removed copy-to-clipboard functionality (no longer needed)
- **AI-Powered Context-Specific Analytics**: Complete rewrite of analytics generation system
  - Removed random/generic analytics generation
  - Now uses OpenAI GPT-3.5-turbo (or Anthropic Claude Haiku) to analyze EACH specific legal situation
  - AI generates analytics tailored to case type:
    - Family disputes: factors mention witnesses, injuries, domestic violence, family testimony
    - Tax evasion: factors mention IRS, documentation, statute of limitations, voluntary disclosure
    - Contract disputes: factors mention breach terms, contract validity, damages
    - Regulatory: factors mention compliance, regulatory framework, cooperation
  - Added robust validation: numeric range clamping (strength 20-95%, probability 15-90%, precedents 5-25)
  - Auto-corrects risk level to match success probability (low >65%, medium 35-65%, high <35%)
  - Logging when AI returns malformed analytics or corrections needed
  - Only generates analytics when truly relevant (legal case detected)
  - Performance: ~6-10 seconds per message (dual AI calls: response + analytics)
- **Vercel API Endpoint Fix**: Corrected serverless function routing for production deployment
  - Changed route in api/index.ts from `/api/chat` to `/chat`
  - Vercel automatically maps api/index.ts to `/api/`, so internal routes must be relative
  - Frontend calls `/api/chat` → Vercel rewrites to `/api` (executes api/index.ts) → Express handles `/chat`
  - Resolved "Unexpected token" JSON parsing errors from incorrect route mapping