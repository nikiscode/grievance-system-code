# ✅ Next Steps - You're Almost Done!

You've added Firebase and Gemini configs. Here's what to do next:

## Option 1: Quick Test (Skip Rules for Now)

The app will work in **test mode** without deploying rules. Let's test it first:

### 1. Restart Dev Server

```bash
# Stop current server (Ctrl+C if running)
# Then restart:
cd grievance-system
npm run dev
```

### 2. Test the App

1. Open: http://localhost:3000
2. Click "Sign up" 
3. Create a test account:
   - Email: `student@test.com`
   - Password: `test123`
   - Role: Student
4. Try creating a grievance!

## Option 2: Deploy Security Rules (Recommended)

### Install Firebase CLI (if not installed)

**Option A: Using npm (may need sudo)**
```bash
sudo npm install -g firebase-tools
```

**Option B: Using Homebrew (Mac)**
```bash
brew install firebase-cli
```

**Option C: Use npx (no install needed)**
```bash
npx firebase-tools login
```

### Deploy Rules

```bash
cd grievance-system

# Login to Firebase
firebase login
# OR if using npx:
npx firebase-tools login

# Connect to your project
firebase use --add
# Select your project from the list

# Deploy security rules
firebase deploy --only firestore:rules,storage:rules
```

## 🎯 What to Do Right Now

**For quick demo/testing:**
1. ✅ Restart dev server: `npm run dev`
2. ✅ Open http://localhost:3000
3. ✅ Sign up and test!

**For production setup:**
1. Install Firebase CLI (see above)
2. Run `firebase login`
3. Run `firebase use --add` (select your project)
4. Run `firebase deploy --only firestore:rules,storage:rules`

## 🚨 Important Notes

- **Test mode** works fine for demos (no rules needed)
- **Security rules** are required for production
- App will work without deploying rules (Firestore/Storage in test mode)
- Rules deployment is optional for hackathon demos

## ✅ Checklist

- [x] Firebase config added to `.env.local`
- [x] Gemini API key added to `.env.local`
- [ ] Dev server restarted
- [ ] Test account created
- [ ] App tested
- [ ] (Optional) Security rules deployed

## 🎬 Quick Demo Flow

1. **Sign up as Student** → Create grievance via chat
2. **Sign up as Authority** → View and respond
3. **Sign up as Admin** → View analytics

You're ready to go! 🚀

