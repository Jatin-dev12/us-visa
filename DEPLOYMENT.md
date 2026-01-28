# 🚀 Deployment Guide - US Visa Bot

## Running Locally

### 1. Start the Web Server
```bash
npm run server
```

### 2. Open Dashboard
Open your browser and go to: **http://localhost:3000**

### 3. Use the Dashboard
- Enter your current booked date
- Optionally set target date and minimum date
- Check "Dry Run" to test without booking
- Click "Start Bot" to begin monitoring
- View real-time logs and available dates

---

## 🌐 Free Hosting Platforms

### ⭐ Recommended: Render.com (Best for Node.js)

**Pros:**
- Free tier available
- Easy deployment from GitHub
- Automatic HTTPS
- Good uptime
- Supports background processes

**Steps:**
1. Push your code to GitHub
2. Go to https://render.com
3. Sign up and create new "Web Service"
4. Connect your GitHub repo
5. Set build command: `npm install`
6. Set start command: `npm run server`
7. Add environment variables from your .env file
8. Deploy!

**Free Tier:** 750 hours/month, sleeps after 15 min inactivity

---

### 🔷 Railway.app

**Pros:**
- $5 free credit monthly
- Very easy deployment
- No sleep mode
- Great for long-running bots

**Steps:**
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Add environment variables
6. Deploy automatically

**Free Tier:** $5 credit/month (enough for ~500 hours)

---

### 🟣 Fly.io

**Pros:**
- Good free tier
- Supports long-running processes
- Multiple regions
- No sleep mode

**Steps:**
1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
2. Run: `fly launch`
3. Follow prompts
4. Set secrets: `fly secrets set EMAIL=your@email.com PASSWORD=yourpass`
5. Deploy: `fly deploy`

**Free Tier:** 3 shared VMs, 160GB bandwidth/month

---

### 🟢 Heroku (Classic Option)

**Pros:**
- Well-known platform
- Easy to use
- Good documentation

**Cons:**
- Free tier removed (starts at $5/month)

**Steps:**
1. Install Heroku CLI
2. `heroku create your-visa-bot`
3. `git push heroku main`
4. `heroku config:set EMAIL=your@email.com`
5. Set other env variables

---

### 🔴 Glitch.com

**Pros:**
- Completely free
- No credit card needed
- Easy remix/deploy

**Cons:**
- Sleeps after 5 minutes inactivity
- Limited resources

**Steps:**
1. Go to https://glitch.com
2. Click "New Project" → "Import from GitHub"
3. Paste your repo URL
4. Add .env file with your credentials
5. Project runs automatically

---

### 💻 Self-Hosting Options

#### VPS Providers (Paid but Cheap):
- **DigitalOcean**: $4/month droplet
- **Linode**: $5/month
- **Vultr**: $2.50/month
- **Hetzner**: €4/month (cheapest)

#### Free VPS (Limited):
- **Oracle Cloud**: Always free tier (2 VMs)
- **Google Cloud**: $300 credit for 90 days
- **AWS**: Free tier for 12 months

---

## 📝 Important Notes

### For 24/7 Bot Operation:
1. **Render.com** or **Railway.app** are best
2. They won't sleep if you keep the bot running
3. Set up a cron job to ping your app every 10 minutes

### Environment Variables Needed:
```
EMAIL=your@email.com
PASSWORD=yourpassword
COUNTRY_CODE=ca
SCHEDULE_ID=72252955
FACILITY_ID=94
REFRESH_DELAY=3
```

### Keep-Alive Trick:
Add this to your server.js to prevent sleeping:
```javascript
// Ping self every 10 minutes
setInterval(() => {
    fetch('http://your-app-url.com/api/status')
        .catch(err => console.log('Ping failed'));
}, 600000);
```

---

## 🎯 My Recommendation

**For your use case (24/7 monitoring):**

1. **Best Free Option**: Railway.app
   - $5 credit = ~500 hours/month
   - No sleep mode
   - Easy deployment

2. **Best Paid Option**: Hetzner VPS (€4/month)
   - Full control
   - 24/7 uptime
   - Can run multiple bots

3. **Easiest Option**: Render.com
   - Free tier
   - Just connect GitHub
   - Auto-deploy on push

---

## 🔧 Quick Deploy Commands

### Railway:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Render:
Just connect GitHub repo in dashboard

### Fly.io:
```bash
fly launch
fly deploy
```

Choose the platform that fits your needs best! 🚀
