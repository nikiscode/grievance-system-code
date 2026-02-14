# ⚡ Quick Start - Hackathon Demo (5 Minutes)

## 🎯 Fastest Setup Path

### 1. Firebase Setup (2 minutes)

1. Go to https://console.firebase.google.com
2. **Create project** → Name it → Skip Analytics
3. Enable:
   - **Authentication** → Email/Password + Google
   - **Firestore** → Test mode
   - **Storage** → Test mode
4. **Get Config Values:**
   - Click **⚙️ Gear icon** → **"Project settings"**
   - Scroll to **"Your apps"** section
   - Click **`</>` Web** icon (register web app)
   - Copy the config values from the code block
   - If you don't see "Your apps", register a web app first!

### 2. Gemini API (1 minute)

1. Go to https://makersuite.google.com/app/apikey
2. **Create API Key** → Copy it

### 3. Configure (1 minute)

Edit `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key
```

### 4. Deploy Rules (1 minute)

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules,storage:rules
```

### 5. Run!

```bash
npm run dev
```

Open: http://localhost:3000

## 🎬 Demo Script

1. **Sign up** as Student → Create grievance via chat
2. **Sign up** as Authority → View and respond
3. **Sign up** as Admin → Show analytics

## 💡 Pro Tips

- **Pre-create accounts** before demo
- **Create 5-10 sample grievances** for populated dashboard
- **Use two browsers** to show real-time updates
- **Highlight AI features** (chat analysis, auto-categorization)

## ✅ That's It!

Everything works on **FREE tier** - perfect for hackathons! 🚀

