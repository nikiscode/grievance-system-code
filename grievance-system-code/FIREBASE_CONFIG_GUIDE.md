# 🔧 How to Get Firebase Config Values

If you don't see config values, you need to **register a web app** first!

## Step-by-Step Guide

### Step 1: Go to Project Settings

1. In Firebase Console, click the **⚙️ Gear icon** (top left)
2. Click **"Project settings"**

### Step 2: Scroll to "Your apps" Section

1. Scroll down until you see **"Your apps"** section
2. You'll see icons for different platforms:
   - `</>` Web (HTML)
   - `< >` iOS
   - `< >` Android
   - `</>` Unity

### Step 3: Register Web App

1. Click the **`</>` Web** icon (first one, for HTML/JavaScript)
2. A popup will appear: **"Add Firebase to your web app"**
3. **App nickname** (optional): `grievance-system` or leave blank
4. **Check the box**: "Also set up Firebase Hosting" (optional, can skip)
5. Click **"Register app"**

### Step 4: Copy Config Values

After registering, you'll see a code block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

### Step 5: Copy to .env.local

Copy each value to your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC... (from apiKey)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

## 📸 Visual Guide

The config values appear in **Project Settings** → **Your apps** → **Web app** section.

If you don't see "Your apps" section:
- Make sure you're in the correct project
- Try refreshing the page
- The section should be below "General" and "Usage and billing"

## ✅ Quick Checklist

- [ ] Clicked ⚙️ Gear icon
- [ ] Clicked "Project settings"
- [ ] Scrolled to "Your apps" section
- [ ] Clicked `</>` Web icon
- [ ] Registered the app
- [ ] Copied config values
- [ ] Pasted to `.env.local`

## 🆘 Still Can't Find It?

**Alternative Method:**

1. Go to **Project Settings**
2. Look for **"SDK setup and configuration"** section
3. Select **"Config"** tab (not "npm")
4. You'll see the same config values there!

Or check the **"General"** tab - sometimes config is shown there too.

