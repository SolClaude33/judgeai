# JudgeAI - Legal Analysis AI on BNB Chain

A legal analysis AI assistant built on BNB Chain, providing objective case insights and strategic recommendations.

## Features

- 🤖 AI-powered legal case analysis
- 💬 Real-time chat interface
- 📊 Case analytics dashboard
- 🌐 Multi-language support (English/Chinese)
- 🔐 BNB Chain wallet integration

## Environment Variables

To deploy this application, you need to configure the following environment variables in Vercel:

### Required (at least one):

- `OPENAI_API_KEY` - Your OpenAI API key (for GPT-3.5-turbo and TTS)
- `ANTHROPIC_API_KEY` - Your Anthropic API key (for Claude models, fallback option)

### Optional:

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (production/development)

## Deployment on Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel Dashboard:
   - Go to Settings → Environment Variables
   - Add `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY`
4. Deploy!

The `vercel.json` is already configured with:
- Build command: `npm run build`
- Output directory: `dist/public`
- API routes: `/api/*`

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

- `/api` - Vercel serverless functions
- `/client` - React frontend application
- `/server` - Express backend (for local development)
- `/shared` - Shared TypeScript schemas

## Troubleshooting

### Error: "Unexpected token 'A', 'A server e'... is not valid JSON"

This error occurs when the server returns a non-JSON response. Ensure:
1. API keys are properly configured in Vercel environment variables
2. The server is running correctly
3. Check Vercel logs for detailed error messages

### Error: 500 Internal Server Error

Check:
- API keys are valid and have proper permissions
- Environment variables are set correctly in Vercel
- Check function logs in Vercel dashboard

## License

MIT

