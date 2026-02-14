# 🚀 Hackathon Demo Setup (100% FREE)

Quick setup guide for hackathon demonstration using **FREE tiers only**.

## ✅ What's FREE (No Credit Card Required)

- ✅ **Firebase Spark Plan** (Free Forever)
  - 50K reads/day, 20K writes/day
  - 1GB storage
  - 10GB bandwidth/month
  - Perfect for demos!

- ✅ **Gemini API** (Free Tier)
  - 60 requests/minute
  - 1,500 requests/day
  - Free for hackathons!

- ✅ **Firebase Hosting** (Free)
  - 10GB storage
  - 360MB/day transfer
  - Custom domain support

## 🎯 Quick Setup (5 Minutes)

### Step 1: Create Firebase Project (FREE)

1. Go to https://console.firebase.google.com
2. Click **"Add project"** or **"Create a project"**
3. Project name: `grievance-demo` (or any name)
4. **Disable Google Analytics** (not needed for demo)
5. Click **"Create project"** → Wait 30 seconds

### Step 2: Enable Services (All FREE)

#### A. Authentication
1. Left sidebar → **"Authentication"** → **"Get started"**
2. **"Sign-in method"** tab
3. Enable **"Email/Password"** → Toggle ON → Save
4. Enable **"Google"** → Toggle ON → Select email → Save

#### B. Firestore Database
1. Left sidebar → **"Firestore Database"** → **"Create database"**
2. Select **"Start in test mode"** (we'll deploy rules later)
3. Choose location: **"us-central1"** (or nearest)
4. Click **"Enable"** → Wait 1 minute

#### C. Storage
1. Left sidebar → **"Storage"** → **"Get started"**
2. Select **"Start in test mode"**
3. Use same location as Firestore
4. Click **"Done"**

### Step 3: Get Firebase Config

1. Gear icon ⚙️ → **"Project settings"**
2. Scroll to **"Your apps"** → Click **"</> Web"** icon
3. If no app: Click **"Add app"** → **"Web"** → Register
4. **Copy the config values** (you'll see a code block)

### Step 4: Get Gemini API Key (FREE)

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click **"Create API Key"**
4. Copy the API key (starts with `AIza...`)

### Step 5: Update .env.local

Open `.env.local` and paste your values:

```env
# Firebase (from Step 3)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Gemini API (from Step 4)
NEXT_PUBLIC_GEMINI_API_KEY=AIza...your-gemini-key
```

### Step 6: Deploy Security Rules

```bash
cd grievance-system
firebase login
firebase use --add  # Select your project
firebase deploy --only firestore:rules,storage:rules
```

### Step 7: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## 🎬 Demo Flow for Hackathon

### 1. **Student Demo** (2 minutes)
- Sign up as Student
- Create grievance via Chat (AI-powered)
- Show AI analyzing and categorizing
- Create another via Form
- Track status

### 2. **Authority Demo** (1 minute)
- Login as Authority
- View assigned grievances
- Accept and respond
- Update status

### 3. **Admin Demo** (1 minute)
- Login as Admin
- Show analytics dashboard
- Show category distribution
- Show resolution metrics

## 💡 Demo Tips

1. **Pre-create accounts** before demo:
   - student@demo.com / password123
   - authority@demo.com / password123
   - admin@demo.com / password123

2. **Use demo data**:
   - Create 5-10 sample grievances before presentation
   - Shows populated dashboard

3. **Highlight AI features**:
   - Show chat interface analyzing text
   - Show automatic categorization
   - Show sentiment analysis

4. **Show real-time updates**:
   - Open in two browsers
   - Update in one, show change in other

## 🆓 Free Tier Limits (More than enough for demo!)

- **Firestore**: 50K reads/day (demo uses ~100-500)
- **Storage**: 1GB (demo uses ~10-50MB)
- **Gemini**: 1,500 requests/day (demo uses ~20-50)
- **Hosting**: 10GB (demo uses ~50MB)

## 🚨 If Something Doesn't Work

### App shows "Firebase error"
- Check `.env.local` has correct values
- Restart dev server after updating `.env.local`

### Gemini API error
- Check API key is correct
- Free tier has rate limits (60/min) - wait 1 minute

### Can't deploy rules
- Make sure you're logged in: `firebase login`
- Make sure project is selected: `firebase use --add`

## 📱 Mobile Demo

The app is fully responsive! Open on phone:
- Same URL: `http://localhost:3000`
- Or deploy to Firebase Hosting for public URL

## 🎯 Quick Deploy for Public Demo

```bash
# Build
npm run build

# Deploy to Firebase Hosting (FREE)
firebase deploy --only hosting
```

You'll get a public URL like: `https://your-project.web.app`

## ✅ Checklist Before Hackathon

- [ ] Firebase project created
- [ ] Authentication enabled (Email + Google)
- [ ] Firestore created
- [ ] Storage enabled
- [ ] `.env.local` configured
- [ ] Security rules deployed
- [ ] Test accounts created
- [ ] Sample grievances added
- [ ] App tested end-to-end
- [ ] Demo flow practiced

## 🎉 You're Ready!

Everything is **100% FREE** and perfect for hackathon demos. No credit card needed!

**Total setup time: 5-10 minutes**

Good luck with your hackathon! 🚀

