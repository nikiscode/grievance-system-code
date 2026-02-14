# Quick Setup Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Google Cloud account with billing enabled
- [ ] Firebase project created at https://console.firebase.google.com

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd grievance-system
npm install
cd functions && npm install && cd ..
```

### 2. Firebase Login & Init

```bash
firebase login
firebase init
```

**Select:**
- ✅ Firestore
- ✅ Functions
- ✅ Hosting
- ✅ Storage

**When prompted:**
- Use existing project (select your Firebase project)
- For Firestore: Use default rules file (firestore.rules)
- For Functions: TypeScript, ESLint: Yes
- For Hosting: Use existing .next directory (or create new)
- For Storage: Use default rules file (storage.rules)

### 3. Configure Environment Variables

Create `.env.local` file:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Firebase project credentials:
- Get API keys from Firebase Console → Project Settings → General
- Get Gemini API key from https://makersuite.google.com/app/apikey

### 4. Enable Required APIs

Go to [Google Cloud Console](https://console.cloud.google.com/apis/library):

Enable these APIs:
- ✅ Cloud Firestore API
- ✅ Firebase Authentication API
- ✅ Cloud Storage API
- ✅ Cloud Functions API
- ✅ Generative Language API (Gemini)
- ✅ Vertex AI API

### 5. Configure Firebase Authentication

In Firebase Console → Authentication → Sign-in method:

Enable:
- ✅ Email/Password
- ✅ Google

### 6. Deploy Security Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

### 7. Build & Deploy Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 8. Run Locally (Development)

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Firebase emulators (optional)
firebase emulators:start
```

Visit: http://localhost:3000

### 9. Deploy to Production

```bash
# Build Next.js app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Testing the Application

### Create Test Users

1. **Student Account:**
   - Go to `/login/signup`
   - Email: `student@test.com`
   - Password: `student123`
   - Role: Student

2. **Authority Account:**
   - Go to `/login/signup`
   - Email: `authority@test.com`
   - Password: `authority123`
   - Role: Authority
   - Department: `Computer Science`

3. **Admin Account:**
   - Go to `/login/signup`
   - Email: `admin@test.com`
   - Password: `admin123`
   - Role: Admin

### Test Workflow

1. **As Student:**
   - Login with student account
   - Create grievance via chat or form
   - Track grievance status
   - Send follow-up messages

2. **As Authority:**
   - Login with authority account
   - View assigned grievances
   - Accept and respond to grievances
   - Update status (In Review → Action Taken → Resolved)

3. **As Admin:**
   - Login with admin account
   - View analytics dashboard
   - See all grievances and users
   - Monitor SLA escalations

## Troubleshooting

### Issue: "Firebase: Error (auth/api-key-not-valid)"
**Solution:** Check your `.env.local` file has correct API keys

### Issue: "Gemini API error"
**Solution:** 
- Verify Gemini API key is correct
- Check API is enabled in Google Cloud Console
- Ensure billing is enabled

### Issue: "Functions deployment fails"
**Solution:**
- Ensure Node.js 18+ is installed
- Run `cd functions && npm install && npm run build`
- Check Firebase project ID matches

### Issue: "Firestore rules deployment fails"
**Solution:**
- Verify Firestore is enabled in Firebase Console
- Check syntax in `firestore.rules`

## Next Steps

- Customize SLA rules in `functions/index.ts`
- Configure auto-assignment logic
- Set up Cloud Scheduler for SLA checks
- Enable FCM for push notifications
- Add more AI features with Vertex AI

## Support

Refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)

