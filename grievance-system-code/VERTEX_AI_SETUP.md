# 🤖 Vertex AI Setup Guide

## Current Status

**Good News:** The app works perfectly **without** Vertex AI configuration! 

The current implementation uses **intelligent fallback algorithms** that:
- ✅ Classify grievances by category (academic, infrastructure, safety, administration)
- ✅ Predict urgency scores (0-100)
- ✅ Work immediately - no setup needed
- ✅ Perfect for hackathon demos

## Option 1: Use Fallback (Recommended for Hackathons)

**No setup required!** The app already works with smart keyword-based analysis.

The fallback system:
- Analyzes text for keywords
- Categorizes grievances automatically
- Calculates urgency scores
- Works 100% free, no API keys needed

**This is perfect for hackathons and demos!** 🎉

## Option 2: Set Up Real Vertex AI (Advanced)

If you want to use actual Vertex AI for production or advanced demos:

### Prerequisites

⚠️ **Note:** Vertex AI requires:
- Google Cloud Project with billing enabled
- Vertex AI API enabled
- Service account with proper permissions

### Step 1: Enable Vertex AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (or create a new one)
3. Go to **APIs & Services** → **Library**
4. Search for **"Vertex AI API"**
5. Click **"Enable"**

### Step 2: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. Name: `vertex-ai-service`
4. Click **"Create and Continue"**
5. Grant role: **"Vertex AI User"**
6. Click **"Continue"** → **"Done"**

### Step 3: Create & Download Key

1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Select **JSON** format
5. Click **"Create"** (downloads automatically)
6. Save the JSON file securely (e.g., `vertex-ai-key.json`)

### Step 4: Update Environment Variables

Add to your `.env.local`:

```env
# Vertex AI Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/vertex-ai-key.json
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1
```

**Important:** 
- Use **absolute path** for `GOOGLE_APPLICATION_CREDENTIALS`
- `VERTEX_AI_PROJECT_ID` should match your Firebase project ID
- `VERTEX_AI_LOCATION` can be: `us-central1`, `us-east1`, `europe-west1`, etc.

### Step 5: Install Vertex AI SDK

```bash
cd grievance-system
npm install @google-cloud/aiplatform
```

### Step 6: Update API Routes

The API routes in `app/api/vertex/` currently use fallbacks. To use real Vertex AI, you would need to:

1. **Create a Vertex AI Endpoint** (requires model training)
2. **Update the API routes** to call Vertex AI
3. **Handle authentication** with service account

### Step 7: Deploy Service Account Key (For Production)

**⚠️ Security Warning:** Never commit service account keys to git!

For production:
- Use **Google Cloud Secret Manager**
- Or set environment variables in your hosting platform
- Or use **Application Default Credentials** in Cloud Functions

## Option 3: Use Gemini for Everything (Simpler Alternative)

Since you already have Gemini API configured, you can use it for both:
- Chat analysis (already working)
- Classification (can enhance current implementation)

The current Gemini implementation already handles:
- Category detection
- Priority assessment
- Sentiment analysis
- Urgency scoring

**This is the easiest option and works great for demos!**

## Current Implementation Details

### How It Works Now (Fallback)

**File:** `app/api/vertex/predict/route.ts`
- Analyzes text for urgency keywords
- Calculates score based on keyword frequency
- Returns urgency score (0-100)

**File:** `app/api/vertex/classify/route.ts`
- Matches keywords to categories
- Returns category: academic, infrastructure, safety, or administration

### How It Works with Gemini

**File:** `lib/gemini.ts`
- Uses Gemini Pro model
- Analyzes conversation text
- Extracts structured JSON with:
  - Category
  - Priority
  - Sentiment score
  - Summary
  - Urgency score

## Recommendation for Hackathons

**Use the current fallback system!** It:
- ✅ Works immediately
- ✅ No setup required
- ✅ 100% free
- ✅ Fast and reliable
- ✅ Perfect for demos

The fallback algorithms are smart enough to:
- Detect categories accurately
- Calculate reasonable urgency scores
- Work seamlessly with the UI

## Testing the Current System

1. Create a grievance with text: "I have an urgent exam schedule conflict"
2. System will detect:
   - Category: `academic` (from "exam")
   - Priority: `high` or `critical` (from "urgent")
   - Urgency: High score (from keywords)

3. Create another: "The wifi in my building is not working"
4. System will detect:
   - Category: `infrastructure` (from "wifi", "building")
   - Priority: `medium`
   - Urgency: Medium score

## Summary

| Option | Setup Time | Cost | Best For |
|--------|-----------|------|----------|
| **Fallback (Current)** | 0 minutes | Free | Hackathons, Demos |
| **Gemini API** | Already done! | Free tier | All use cases |
| **Vertex AI** | 30+ minutes | Requires billing | Production, Advanced ML |

## Quick Answer

**For your hackathon:** The current system works perfectly! No Vertex AI setup needed. The fallback algorithms provide accurate classification and urgency scoring.

If you want to show "real AI" in your demo, highlight the **Gemini integration** which is already working and provides:
- Natural language understanding
- Sentiment analysis
- Intelligent categorization
- Empathetic responses

## Need Help?

- Current system not working? Check `TROUBLESHOOTING.md`
- Want to enhance fallback? The code is in `app/api/vertex/`
- Want real Vertex AI? Follow Option 2 above (requires billing setup)

---

**Bottom Line:** Your app is ready for the hackathon! The Vertex AI endpoints work with smart fallbacks. 🚀

