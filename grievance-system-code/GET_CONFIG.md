# 🔍 How to Get Firebase Config (Step-by-Step)

## You Need to Register a Web App First!

The config values only appear **after** you register a web app.

### Detailed Steps:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com
   - Select your project

2. **Open Project Settings**
   - Click the **⚙️ Gear icon** (top left, next to "Project Overview")
   - Click **"Project settings"**

3. **Find "Your apps" Section**
   - Scroll down past "General" tab
   - Look for **"Your apps"** section
   - You'll see platform icons: `</>` Web, iOS, Android, etc.

4. **Register Web App** (If you don't see any apps)
   - Click the **`</>` Web** icon (first one)
   - App nickname: `grievance-system` (or leave blank)
   - **Uncheck** "Also set up Firebase Hosting" (optional)
   - Click **"Register app"**

5. **Copy Config Values**
   - After registering, you'll see a code block with:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   - Copy each value!

6. **Alternative: SDK Setup Section**
   - In Project Settings, look for **"SDK setup and configuration"**
   - Select **"Config"** tab
   - Same values are shown there

## Still Can't Find It?

**Check:**
- Are you in the correct Firebase project?
- Try refreshing the page
- The config appears AFTER registering a web app
- Look in "General" tab too (sometimes shown there)

## Quick Visual Path:

```
Firebase Console
  → ⚙️ Gear Icon (top left)
    → Project settings
      → Scroll down
        → "Your apps" section
          → `</>` Web icon
            → Register app
              → Copy config! ✅
```

