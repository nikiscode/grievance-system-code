# Create Demo Data for Hackathon

After setting up Firebase, you can create demo data directly from the app:

## Option 1: Manual Creation (Recommended)

1. **Sign up as Student** → Create 3-5 grievances
2. **Sign up as Authority** → Accept and respond to grievances
3. **Sign up as Admin** → View analytics

## Option 2: Firebase Console

1. Go to Firestore Database in Firebase Console
2. Click "Start collection" → Name: `grievances`
3. Add documents with this structure:

```json
{
  "studentId": "student-user-id",
  "anonymous": false,
  "category": "academic",
  "priority": "high",
  "sentimentScore": 0.3,
  "urgencyScore": 75,
  "status": "in_review",
  "title": "Exam Schedule Conflict",
  "description": "I have two exams scheduled at the same time on Monday.",
  "summary": "Student reports exam schedule conflict requiring immediate attention.",
  "messages": [
    {
      "text": "I have two exams scheduled at the same time on Monday.",
      "sender": "student",
      "timestamp": "2024-12-29T10:00:00Z"
    }
  ],
  "createdAt": "2024-12-29T10:00:00Z",
  "slaDeadline": "2024-12-30T10:00:00Z"
}
```

## Quick Demo Accounts

Create these accounts via signup page:

- **Student**: student@demo.com / demo123
- **Authority**: authority@demo.com / demo123  
- **Admin**: admin@demo.com / demo123

Then use these accounts for your demo!

