# 💬 Chat Interface User Guide

## Overview

The Chat Interface is an AI-powered conversational system that helps you file grievances naturally through conversation. It automatically analyzes your concerns, categorizes them, and creates a formal grievance request when you've provided enough information.

## 🚀 Key Features

- **Natural Conversation**: Chat naturally - no forms to fill
- **Auto-Categorization**: AI automatically detects category (Academic, Infrastructure, Safety, Administration)
- **Smart Priority Detection**: System identifies urgent issues automatically
- **Auto-Creation**: Grievance is created automatically when enough info is gathered
- **Context-Aware**: AI remembers your conversation and asks relevant follow-up questions
- **Action Suggestions**: Smart action buttons appear based on your conversation

## 📖 How to Use

### Step 1: Start a Conversation

Simply start typing your concern. The AI will greet you and guide you through the process.

**Example:**
```
You: Hello, I have an issue with my exam grades
AI: Hello! I'm here to help you file a grievance. I understand you're concerned about your exam grades. 
    Could you tell me more about what happened? Which course or exam are you referring to?
```

### Step 2: Provide Details

The more details you provide, the better the AI can help you. Be specific about:
- **What** happened
- **When** it occurred
- **Where** it happened
- **Who** is involved
- **How** it affected you

**Example:**
```
You: My professor gave me a failing grade on my final exam, but I believe I answered all questions correctly. 
     This happened last week in the Computer Science 101 course.

AI: I understand this is a serious academic concern. This affects your course grade and academic standing. 
    Have you had a chance to review your exam paper with the professor? Also, do you have any evidence 
    or documentation that supports your claim?
```

### Step 3: Auto-Creation

Once you've provided enough information (usually 4-6 messages), the system will automatically:
1. Analyze your conversation
2. Categorize your grievance
3. Determine priority
4. Create the grievance
5. Redirect you to track your grievance

**You'll see:**
```
AI: Great! I have enough information. Creating your grievance now...
    ✓ Grievance created successfully!
```

## 📝 Example Conversations

### Example 1: Academic Issue

```
You: Hi, I need help with a grade issue

AI: Hello! I'm here to help you file a grievance. I understand you're concerned about a grade issue. 
    Could you tell me more about what happened? Which course or exam are you referring to?

You: My professor in Math 201 gave me a C grade, but I scored 95% on all assignments and exams. 
     This doesn't make sense.

AI: I see this is related to academic matters. This is important. Can you tell me which course or 
    professor is involved, and what specific issue occurred? Also, have you tried discussing this 
    with your professor directly?

You: Yes, I emailed Professor Smith three times but got no response. The course is Math 201, 
     and I have all my graded papers showing 95% scores.

AI: Thank you for that additional information. This helps me understand the situation better. 
    I can help you create a formal grievance report now.

[System automatically creates grievance]
✓ Grievance created successfully!
```

**Result:**
- Category: Academic
- Priority: Medium
- Status: Submitted
- Auto-created after 4 messages

---

### Example 2: Urgent Safety Issue

```
You: I need to report a safety issue urgently

AI: Safety concerns are our top priority. Are you currently safe? If this is an emergency, 
    please contact campus security immediately. Otherwise, please share more details so we 
    can address this urgently.

You: There's broken glass in the hallway of Building A, third floor. Students could get hurt.

AI: I understand this is urgent. Let me help you get this resolved quickly. Can you provide 
    specific details about when this occurred and who might be involved? Also, is anyone 
    currently at risk?

You: It happened this morning around 9 AM. No one is hurt yet, but it's a busy hallway and 
     someone could step on it.

AI: Great! I have enough information. Creating your grievance now...
    ✓ Grievance created successfully!
```

**Result:**
- Category: Safety
- Priority: Critical (auto-detected from "urgent" and "safety")
- Status: Submitted
- Auto-created after 3 messages (urgent issues create faster)

---

### Example 3: Infrastructure Problem

```
You: The wifi in my dormitory has been down for 3 days

AI: I understand you're experiencing infrastructure issues. Where exactly is this happening? 
    This will help us route your grievance to the right department quickly.

You: Building B, Room 205. I can't attend my online classes because of this.

AI: I see this is affecting your ability to attend classes, which makes this more urgent. 
    Have you reported this to the IT department or building maintenance? Also, are other 
    students in your building experiencing the same issue?

You: Yes, I called IT support twice but they said it's a building infrastructure issue. 
     My roommate also can't connect. We both have important online exams this week.

AI: Thank you for that additional information. This helps me understand the situation better. 
    Is there anything else you'd like to add, or would you like me to help you create a 
    formal grievance report now?

[System automatically creates grievance]
✓ Grievance created successfully!
```

**Result:**
- Category: Infrastructure
- Priority: High (affects academic work)
- Status: Submitted
- Auto-created after 5 messages

---

### Example 4: Asking Questions First

```
You: How does the grievance process work?

AI: That's a great question. Let me help clarify that for you. The grievance process works as follows:
    1. You describe your concern (we're doing this now)
    2. The system categorizes and prioritizes your issue
    3. Your grievance is assigned to the appropriate authority
    4. You can track the status and communicate with the authority
    5. The issue is resolved and you're notified
    
    Could you also share what specific issue you're experiencing so I can provide the most 
    relevant information?

You: I want to know if I can file a grievance about a professor's behavior

AI: Yes, you can file a grievance about a professor's behavior. This would typically fall under 
    either Academic or Safety categories depending on the nature of the behavior. Could you 
    describe what happened?

You: My professor made inappropriate comments during class that made me uncomfortable.

AI: I understand this is a serious concern. This type of issue is important and needs to be 
    addressed. Can you provide more details about when this occurred, what was said, and 
    how it made you feel?

[Conversation continues...]
```

**Result:**
- System answers questions first
- Then guides user to provide details
- Creates grievance when enough information is gathered

---

## 💡 Best Practices

### ✅ DO:

1. **Be Specific**: Provide concrete details
   - ❌ "I have a problem with my grade"
   - ✅ "Professor Johnson gave me a D in Chemistry 101, but I scored 92% on all exams"

2. **Include Context**: Mention when, where, who
   - ❌ "The wifi is broken"
   - ✅ "The wifi in Building C, Room 312 has been down since Monday morning"

3. **Express Urgency**: If it's urgent, say so
   - ✅ "This is urgent - I have an exam tomorrow"
   - ✅ "This is a safety issue that needs immediate attention"

4. **Answer Follow-up Questions**: The AI asks questions to help you
   - ✅ Respond to clarify details
   - ✅ Provide additional information when asked

5. **Be Honest**: Provide accurate information
   - ✅ Describe what actually happened
   - ✅ Include relevant facts

### ❌ DON'T:

1. **Don't Be Vague**: Avoid generic statements
   - ❌ "Something is wrong"
   - ❌ "I have a complaint"

2. **Don't Skip Details**: More information = better grievance
   - ❌ "The room is broken"
   - ✅ "The air conditioning in Room 205 hasn't worked for 2 weeks"

3. **Don't Rush**: Take time to explain clearly
   - ❌ "Problem. Fix it."
   - ✅ "I'm experiencing an issue with..."

4. **Don't Use Abbreviations**: Spell things out for clarity
   - ❌ "Prof. S. gave me bad grade in CS101"
   - ✅ "Professor Smith gave me a failing grade in Computer Science 101"

---

## 🎯 When Grievances Are Auto-Created

The system automatically creates your grievance when:

1. **Explicit Request**: You say "file grievance", "submit complaint", etc.
2. **Urgent Issues**: Safety/security concerns (immediate action)
3. **Sufficient Information**: 6+ meaningful messages with details
4. **Clear Intent**: System detects you want to file (not just asking questions)

### Timing Examples:

- **Urgent Safety**: 2-3 messages → Auto-creates immediately
- **Academic Issue**: 4-6 messages → Auto-creates after details gathered
- **Infrastructure**: 5-7 messages → Auto-creates when location/details provided
- **Questions First**: 8-10 messages → Answers questions, then creates when ready

---

## 🔘 Action Buttons

The AI may suggest actions during your conversation:

### Primary Actions (Blue):
- **Create Grievance**: Convert conversation to formal grievance
- **Create Urgent Grievance**: For urgent/safety issues

### Secondary Actions (Gray):
- **Add More Details**: Continue providing information
- **Get Help**: Get information about the process
- **Contact Security**: For emergencies

**Tip**: Click these buttons to take quick actions!

---

## 📊 What Happens After Creation

1. **Grievance Created**: System analyzes and categorizes
2. **Auto-Assignment**: Assigned to appropriate authority
3. **Tracking**: You're redirected to track page
4. **Notifications**: You'll receive updates on status
5. **Communication**: You can chat with the assigned authority

---

## 🆘 Troubleshooting

### Issue: Grievance not auto-creating

**Solution**: 
- Provide more specific details
- Answer the AI's follow-up questions
- Wait for 6+ messages if it's not urgent

### Issue: Wrong category detected

**Solution**:
- Be more specific about the issue type
- Use clear keywords (e.g., "exam", "building", "safety")
- The system learns from your conversation

### Issue: Want to add more details after creation

**Solution**:
- Go to the track page
- Use the conversation feature to add details
- Authority can see all messages

### Issue: Need to edit before submitting

**Solution**:
- The system auto-creates, but you can:
  - Add details in the track page conversation
  - Contact the assigned authority
  - File a new grievance if needed

---

## 🎓 Tips for Best Results

1. **Start with Context**: "I have an issue with..." or "I need to report..."
2. **Be Descriptive**: More details = better categorization
3. **Mention Impact**: How does this affect you?
4. **Include Evidence**: If you have documents, mention them
5. **Follow the Flow**: Answer AI questions naturally
6. **Trust the Process**: Let the AI guide you

---

## 📱 Example Quick Start

**Quick Academic Grievance:**
```
You: I got an unfair grade in Physics 201
AI: [Asks for details]
You: Professor gave me C, but I scored 95% on all tests
AI: [Asks follow-up]
You: I have all my graded papers as proof
[Auto-creates grievance]
```

**Quick Infrastructure Grievance:**
```
You: The air conditioning in my room is broken
AI: [Asks for location]
You: Building D, Room 401, broken for 2 weeks
AI: [Asks about impact]
You: It's too hot to study, affecting my grades
[Auto-creates grievance]
```

**Quick Safety Grievance:**
```
You: Urgent: There's a safety hazard in the library
AI: [Asks for details]
You: Broken glass on floor, second floor, near entrance
[Auto-creates urgent grievance immediately]
```

---

## 🎉 Summary

The Chat Interface makes filing grievances:
- ✅ **Easy**: Just chat naturally
- ✅ **Fast**: Auto-creates when ready
- ✅ **Smart**: Auto-categorizes and prioritizes
- ✅ **Helpful**: Guides you through the process
- ✅ **Efficient**: No redundant steps

**Just start chatting and let the AI guide you!** 🚀

