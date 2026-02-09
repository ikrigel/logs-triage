# Quick Vercel Deployment (5 Minutes)

## 🚀 Deploy in 5 Minutes

### Step 1: Get API Key (1 min)
```
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (keep it handy)
```

### Step 2: Connect to Vercel (1 min)
```
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Paste: https://github.com/ikrigel/logs-triage
4. Click "Import"
```

### Step 3: Add Environment Variable (1 min)
```
1. In Vercel: Settings → Environment Variables
2. Add name: GOOGLE_GENERATIVE_AI_API_KEY
3. Add value: (your key from Step 1)
4. Click "Save"
```

### Step 4: Deploy (1 min)
```
1. Click "Deploy" button
2. Wait for build to complete
3. Vercel will show your live URL
```

### Step 5: Test It (1 min)
```
1. Open your Vercel URL
2. Click "Run Triage"
3. Select Log Set 1
4. See results!
```

---

## 📱 Your Live App

After deployment, you'll get a URL like:
```
https://logs-triage-abc123.vercel.app
```

This URL:
- ✅ Is live globally (CDN-backed)
- ✅ Auto-scales with traffic
- ✅ Has HTTPS/SSL
- ✅ Supports custom domain
- ✅ Can push updates instantly

---

## 🔄 Update Your App

After deployment, any commit to `master` auto-deploys:

```bash
# Make changes locally
git add .
git commit -m "Fix bug or add feature"
git push origin master

# Vercel automatically redeploys!
# Check: https://vercel.com/dashboard → your project
```

---

## 🛠️ Troubleshooting

### API Key Error?
- Check API key is valid at https://aistudio.google.com/app/apikey
- Verify key is in Vercel environment variables
- Redeploy: `vercel --prod --force`

### Page Not Loading?
- Check Vercel deployment logs
- Verify build completed successfully
- Clear browser cache

### Tickets Not Saving?
- Normal! Vercel serverless is stateless
- To persist: Use Vercel Postgres or Firebase
- See: DEPLOYMENT.md for options

---

## 📚 Full Documentation

For more details, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [README.md](README.md) - Project overview
- [CLAUDE.md](CLAUDE.md) - Architecture guide

---

## ✨ What You Get

After deployment:
- ✅ Live AI agent on the internet
- ✅ Modern web dashboard
- ✅ Full REST API
- ✅ Global CDN performance
- ✅ Auto-scaling infrastructure
- ✅ HTTPS/SSL certificates
- ✅ 24/7 uptime monitoring

---

## 🎯 Next Steps

1. **Share your app** - Send URL to team
2. **Add custom domain** - In Vercel settings
3. **Enable authentication** - Vercel Auth or third-party
4. **Setup CI/CD** - Auto-deploy on push
5. **Persist data** - Upgrade to database backend

---

**That's it! Your app is live! 🎉**

Questions? See DEPLOYMENT.md for detailed guide.
