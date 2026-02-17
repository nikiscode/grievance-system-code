##Grievance System

# AI-Powered Student Grievance Redressal System

A fully functional, end-to-end grievance management system built with Next.js, Firebase, and Google AI technologies (Gemini & Vertex AI).

## 🚀 Quick Start for Hackathons

**Need a quick demo setup?** Check out **[HACKATHON_SETUP.md](./HACKATHON_SETUP.md)** for a 5-minute free tier setup guide!

- ✅ 100% FREE (no credit card required)
- ✅ Works with Firebase Spark Plan (free forever)
- ✅ Gemini API free tier included
- ✅ Perfect for hackathon demonstrations

## 📚 Documentation

- **[💬 Chat Interface Guide](./CHAT_INTERFACE_GUIDE.md)** - Complete guide with examples on using the AI chat interface
- [Quick Start Guide](./QUICK_START.md) - Get started in 5 minutes
- [Firebase Setup](./FIREBASE_CONFIG_GUIDE.md) - Firebase configuration
- [Vertex AI Setup](./VERTEX_AI_SETUP.md) - Optional Vertex AI integration

## 🎯 Features

### Student Capabilities
- ✅ Login/Signup with Firebase Auth (Email + Google Sign-In)
- ✅ Raise grievances via:
  - **Chat interface** powered by Gemini AI
  - **Manual form** submission
- ✅ Anonymous grievance option
- ✅ Upload files/images as attachments
- ✅ Track grievance status in real-time
- ✅ Chat-based follow-ups with authorities
- ✅ Receive notifications

### Authority Capabilities
- ✅ Login and view assigned grievances
- ✅ Chat/respond to grievances
- ✅ Change status (In Review → Action Taken → Resolved)
- ✅ Upload official responses
- ✅ SLA countdown view
- ✅ Auto-assignment of grievances

### Admin Capabilities
- ✅ Manage users & roles
- ✅ Define SLA rules
- ✅ Auto-assignment rules
- ✅ View comprehensive analytics dashboard
- ✅ Escalation control
- ✅ System-wide statistics

### AI Capabilities
- ✅ **Gemini AI Integration**:
  - Convert chat conversations → structured grievance JSON
  - Detect category, priority, and sentiment
  - Generate empathetic system responses
  - Summarize grievance history

- ✅ **Vertex AI Integration**:
  - Text classification (Academic, Infrastructure, Safety, Administration)
  - Predict urgency score (0-100)
  - ML-based priority assignment

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| Backend | Firebase Cloud Functions |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| AI | Gemini API |
| ML | Vertex AI |
| Hosting | Firebase Hosting |
| Analytics | Google Cloud |

## 📁 Project Structure

```
grievance-system/
├── app/
│   ├── login/              # Authentication pages
│   ├── dashboard/         # Student dashboard
│   ├── grievance/
│   │   ├── chat/          # Chat interface
│   │   ├── create/        # Create grievance
│   │   └── track/         # Track grievance status
│   ├── admin/             # Admin dashboard
│   └── authority/         # Authority dashboard
├── components/            # Reusable React components
├── lib/
│   ├── firebase.ts        # Firebase configuration
│   ├── gemini.ts          # Gemini AI integration
│   ├── vertex.ts          # Vertex AI integration
│   └── auth.tsx           # Authentication context
├── functions/             # Cloud Functions
│   └── index.ts           # Auto-assignment, SLA escalation
├── firestore.rules        # Security rules
├── storage.rules          # Storage security rules
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Google Cloud account with billing enabled
- Firebase project created

### 1. Clone and Install

```bash
cd grievance-system
npm install
cd functions && npm install && cd ..
```

### 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting
# - Storage
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### 4. Enable APIs

Enable the following APIs in Google Cloud Console:
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Cloud Functions
- Gemini API
- Vertex AI API

### 5. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 6. Deploy Cloud Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 7. Build and Deploy Frontend

```bash
# Build Next.js app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 8. Local Development

```bash
# Run Next.js dev server
npm run dev

# Run Firebase emulators (optional)
firebase emulators:start
```

## 🔐 Demo Credentials

### Test Accounts

**Student:**
- Email: `student@test.com`
- Password: `student123`

**Authority:**
- Email: `authority@test.com`
- Password: `authority123`

**Admin:**
- Email: `admin@test.com`
- Password: `admin123`

> **Note:** Create these accounts through the signup page or Firebase Console.

## 📊 Firestore Schema

### Users Collection
```typescript
{
  uid: string;
  email: string;
  role: "student" | "authority" | "admin";
  department?: string;
  name?: string;
}
```

### Grievances Collection
```typescript
{
  id: string;
  studentId: string | null;  // null if anonymous
  anonymous: boolean;
  category: "academic" | "infrastructure" | "safety" | "administration";
  priority: "low" | "medium" | "high" | "critical";
  sentimentScore: number;  // 0.0 - 1.0
  urgencyScore: number;    // 0 - 100
  status: "submitted" | "in_review" | "action_taken" | "resolved";
  assignedTo?: string;     // authority UID
  title?: string;
  description: string;
  summary: string;
  messages: Array<{
    text: string;
    sender: string;
    timestamp: Timestamp;
  }>;
  attachments: string[];    // Storage URLs
  createdAt: Timestamp;
  slaDeadline: Timestamp;
  escalated?: boolean;
}
```

## 🤖 AI Integration Details

### Gemini AI
- **Purpose**: Natural language understanding, sentiment analysis, conversation-to-grievance conversion
- **Models Used**: `gemini-pro`
- **Key Functions**:
  - `analyzeGrievanceFromChat()`: Extracts structured data from conversations
  - `generateEmpatheticResponse()`: Creates polite system responses
  - `summarizeGrievanceHistory()`: Summarizes conversation threads

### Vertex AI
- **Purpose**: ML-based classification and urgency prediction
- **Implementation**: Cloud Functions endpoint
- **Key Functions**:
  - `classifyGrievanceCategory()`: Categorizes grievances
  - `predictUrgencyScore()`: Predicts urgency (0-100)

## ⏱️ SLA & Escalation

- **SLA Deadlines**:
  - Critical: 24 hours
  - High: 48 hours
  - Medium: 72 hours
  - Low: 120 hours
  - Safety category: Maximum 24 hours

- **Auto-escalation**: Cloud Function runs every hour to check for overdue grievances
- **Notifications**: Sent to admins when SLA is exceeded

## 🔒 Security

- **Firestore Rules**: Role-based access control
  - Students see only their grievances
  - Authorities see assigned grievances
  - Admins see everything

- **Storage Rules**: File upload restrictions (10MB limit)

- **Authentication**: Firebase Auth with email/password and Google Sign-In

## 📱 Features in Detail

### Chat Interface
- Gemini-powered conversational interface
- Real-time message exchange
- Automatic conversion to structured grievance
- File attachment support

### Analytics Dashboard
- Total grievances count
- Resolution rate
- Category distribution
- Priority breakdown
- User statistics
- Department heatmap

### Status Tracking
- Visual timeline
- SLA countdown
- Real-time updates
- Notification system

## 🛠️ Development

### Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Building for Production

```bash
npm run build
npm start
```

## 📝 Notes

- All AI features are fully functional (not mocked)
- Production-ready code quality
- No TODOs or placeholders
- Fully responsive design
- Dark mode support

## 🎨 UI/UX

- Modern, clean Google-style design
- Gemini-inspired chat interface
- Mobile responsive
- Dark/Light mode toggle
- Accessible components

## 📄 License

This project is built for educational/demonstration purposes.

## 🤝 Support

For issues or questions, please refer to the Firebase and Google Cloud documentation.

---

**Built with ❤️ using Google Technologies**
