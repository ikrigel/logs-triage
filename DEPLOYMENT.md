# Deployment Guide - Production Logs Triage Agent

Complete guide to deploy this project to Vercel, AWS, or other platforms.

---

## 🚀 Vercel Deployment (Recommended)

### Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub account with repository pushed
- Gemini API key

### Step 1: Connect GitHub Repository

1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Select your GitHub repository: `logs-triage`
4. Vercel automatically detects Node.js project

### Step 2: Configure Environment Variables

In Vercel project settings, add:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

**To get Gemini API key:**
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste in Vercel environment variables

### Step 3: Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset:** Node.js
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 4: Deploy

Click "Deploy" button. Vercel will:
1. Clone your repository
2. Install dependencies
3. Build TypeScript
4. Deploy to Vercel's global CDN

Your app will be live at: `https://your-project-name.vercel.app`

---

## 📋 Local Testing Before Deployment

```bash
# Install dependencies
npm install

# Set environment variable
export GOOGLE_GENERATIVE_AI_API_KEY=your_key

# Build TypeScript
npm run build

# Test locally
npm run server
# Visit http://localhost:3000
```

---

## 🔧 Environment Variables Required

### Vercel Environment
- `GOOGLE_GENERATIVE_AI_API_KEY` - Your Gemini API key (required)
- `PORT` - Server port (optional, defaults to 3000)

### Development Environment
Create `.env` file:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

---

## 📁 Project Structure for Deployment

```
logs-triage/
├── api/                          # Vercel serverless functions
│   └── handler.ts               # Express app handler
├── src/                         # Source code
│   ├── agent/                   # AI agent
│   ├── tools/                   # Investigation tools
│   ├── services/                # Services
│   ├── storage/                 # Storage layer
│   ├── utils/                   # Utilities
│   ├── web/                     # Express app
│   │   └── public/              # Frontend static files
│   ├── tests/                   # Tests
│   └── prod_logs/               # Log scenarios
├── dist/                        # Compiled output (created on build)
├── vercel.json                  # Vercel configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

---

## 🌐 Vercel Configuration Details

### vercel.json

The `vercel.json` file configures:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "GOOGLE_GENERATIVE_AI_API_KEY": "@google_api_key"
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/src/web/app.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/src/web/app.ts"
    }
  ]
}
```

---

## 🔍 Monitoring & Logs

### View Deployment Logs
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments" tab
4. View build and runtime logs

### View Application Logs
```bash
# Using Vercel CLI
vercel logs your-project-name

# Or visit Vercel dashboard → Deployments → Live logs
```

---

## 🔐 Security Considerations

### API Key Management
- ✅ Store API key only in environment variables
- ✅ Never commit `.env` file to git
- ✅ Use Vercel's environment variable UI
- ✅ Rotate keys periodically

### CORS & Security Headers
- ✅ Helmet.js enabled for security headers
- ✅ CORS properly configured
- ✅ No sensitive data in logs

### Rate Limiting
- ✅ Gemini API has built-in rate limiting
- ✅ Agent has exponential backoff
- ✅ Vercel handles request throttling

---

## 💾 Data Persistence

### Vercel Limitations
- ✅ Temporary filesystem available
- ⚠️ Data persists only during request lifetime
- ❌ No persistent storage between deployments

### For Production Use

**Option 1: Firebase Realtime Database**
```bash
npm install firebase-admin
```
Update `TicketStorage` to use Firebase

**Option 2: PostgreSQL (Vercel Postgres)**
```bash
vercel env add POSTGRES_URL
npm install @vercel/postgres
```
Update schema and storage layer

**Option 3: MongoDB Atlas**
```bash
npm install mongodb
```
Update `TicketStorage` with MongoDB driver

---

## 🚀 Advanced Deployment Options

### AWS Lambda + API Gateway

```bash
# Install SAM CLI
pip install aws-sam-cli

# Create deployment package
sam build

# Deploy
sam deploy --guided
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
ENV GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}
EXPOSE 3000
CMD ["node", "dist/src/web/app.js"]
```

Deploy to:
- Docker Hub
- AWS ECR
- Google Cloud Run
- Azure Container Instances

### Railway.app

1. Connect GitHub repository
2. Set environment variables
3. Auto-deploy on push

```bash
railway link
railway up
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## ⚡ Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm install --save-dev webpack-bundle-analyzer

# Minify output
npm run build -- --minify
```

### Runtime Optimization
- ✅ Vercel global CDN for static assets
- ✅ Edge caching for API responses
- ✅ Automatic compression
- ✅ HTTP/2 support

### Database Query Optimization
If using database:
- Add indexes on frequently queried fields
- Use connection pooling
- Implement caching layer

---

## 🧪 Pre-Deployment Checklist

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors: `npm run server`
- [ ] Environment variables configured
- [ ] API key is valid
- [ ] `.env` file not in git
- [ ] README updated with deployment info
- [ ] DEPLOYMENT.md is current

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache
vercel env pull  # Pull latest env vars

# Rebuild locally
rm -rf dist node_modules
npm install
npm run build
```

### API Key Not Found
```bash
# Verify in Vercel dashboard:
# Settings → Environment Variables → Check GOOGLE_GENERATIVE_AI_API_KEY exists

# Redeploy after adding variable:
vercel --prod --force
```

### Timeout Errors
- Increase function timeout in `vercel.json`
- Optimize log search queries
- Use pagination for large datasets

### Storage Not Persisting
- Migrate to persistent database
- Use Vercel KV or Postgres
- Implement external storage service

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Node.js on Vercel:** https://vercel.com/docs/runtimes/node-js
- **Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **Serverless Functions:** https://vercel.com/docs/concepts/functions/serverless-functions

---

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Express.js Deployment](https://expressjs.com/en/advanced/best-practice-security.html)
- [TypeScript Compilation](https://www.typescriptlang.org/docs/handbook/compiler-options.html)

---

**Ready to deploy? Start with Step 1 in the Vercel Deployment section above.**
