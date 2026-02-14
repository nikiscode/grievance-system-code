import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
);

export interface GrievanceAnalysis {
  category: 'academic' | 'infrastructure' | 'safety' | 'administration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sentimentScore: number;
  summary: string;
  urgencyScore: number;
}

export async function analyzeGrievanceFromChat(
  conversation: string
): Promise<GrievanceAnalysis> {
  // Fallback if no API key (for demo mode)
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY === 'your-gemini-api-key') {
    console.log('Gemini API not configured, using fallback analysis');
    return analyzeGrievanceFallback(conversation);
  }

  const prompt = `You are an expert grievance classification system. Analyze the following conversation and extract structured information.

Conversation:
${conversation}

Extract and return ONLY a valid JSON object with this exact structure:
{
  "category": "academic" | "infrastructure" | "safety" | "administration",
  "priority": "low" | "medium" | "high" | "critical",
  "sentimentScore": 0.0-1.0,
  "summary": "Brief summary of the grievance",
  "urgencyScore": 0-100
}

CATEGORY CLASSIFICATION RULES (CRITICAL - Be precise):
- **academic**: Issues about courses, exams, grades, professors, teachers, assignments, homework, lectures, syllabus, academic policies, study materials, library, academic calendar, registration, enrollment, transcripts, degrees, scholarships, academic misconduct
- **infrastructure**: Issues about buildings, rooms, facilities, wifi, internet, electricity, power, water, plumbing, heating, cooling, air conditioning, maintenance, repairs, broken equipment, elevators, doors, windows, parking, transportation, campus facilities, dormitories, cafeterias
- **safety**: Issues about security, harassment, bullying, threats, danger, unsafe conditions, violence, assault, emergency, fire, medical emergency, suspicious activity, personal safety, campus safety, security guards, lighting, dark areas, emergency exits
- **administration**: ONLY use this for general administrative matters like paperwork, forms, fees, payments, billing, records, documents, general policies, office hours, appointments, general inquiries that don't fit other categories

IMPORTANT:
- Analyze the MAIN issue being described
- Look for specific keywords and context
- If multiple categories are mentioned, choose the PRIMARY concern
- Only use "administration" if it's clearly administrative paperwork/policy, NOT if it's about academic/infrastructure/safety issues
- Be specific and accurate - don't default to administration

Priority rules:
- critical: Safety issues, emergencies, immediate threats
- high: Urgent academic/infrastructure issues affecting learning
- medium: Standard issues that need attention
- low: Minor concerns

Return ONLY the JSON, no additional text.`;

  // Try different model names - prioritize models that work with v1beta API
  // Note: v1beta API supports: gemini-pro, gemini-1.5-flash-latest, gemini-1.5-pro-latest
  // Models like gemini-1.5-flash and gemini-1.5-pro (without -latest) may not work
  const modelsToTry = [
    'gemini-pro',  // Most stable and widely available in v1beta
    'gemini-1.5-flash-latest',  // Works with v1beta
    'gemini-1.5-pro-latest',  // Works with v1beta
  ];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]) as GrievanceAnalysis;
        console.log(`Successfully analyzed with ${modelName}`);
        return analysis;
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error(`Gemini analysis error with ${modelName}:`, errorMessage);
      // If it's a 404 (model not found) or not supported, try next model
      if (errorMessage.includes('404') || 
          errorMessage.includes('not found') || 
          errorMessage.includes('not supported') ||
          errorMessage.includes('is not found for API version')) {
        continue; // Try next model
      }
      // For other errors (rate limit, auth, etc.), try next model too
      // Only break if it's a critical error that won't be fixed by trying another model
      if (!errorMessage.includes('quota') && !errorMessage.includes('permission')) {
        continue;
      }
      break;
    }
  }
  
  // Fallback to rule-based analysis if all models fail
  console.log('All Gemini models failed, using fallback analysis');
  return analyzeGrievanceFallback(conversation);
}

// Fallback analysis when Gemini API is not available
function analyzeGrievanceFallback(conversation: string): GrievanceAnalysis {
  const lowerText = conversation.toLowerCase();
  
  // Comprehensive keyword lists for better categorization
  const academicKeywords = [
    'exam', 'grade', 'course', 'professor', 'teacher', 'lecture', 'assignment', 'homework',
    'syllabus', 'academic', 'study', 'class', 'subject', 'curriculum', 'semester', 'term',
    'registration', 'enrollment', 'transcript', 'degree', 'scholarship', 'tuition', 'gpa',
    'academic misconduct', 'plagiarism', 'cheating', 'library', 'textbook', 'study material'
  ];
  
  const infrastructureKeywords = [
    'building', 'room', 'wifi', 'internet', 'facility', 'electricity', 'power', 'water',
    'plumbing', 'heating', 'cooling', 'air conditioning', 'ac', 'maintenance', 'repair',
    'broken', 'equipment', 'elevator', 'door', 'window', 'parking', 'transportation',
    'campus', 'dormitory', 'dorm', 'cafeteria', 'canteen', 'restroom', 'bathroom',
    'toilet', 'shower', 'furniture', 'chair', 'desk', 'table', 'light', 'bulb'
  ];
  
  const safetyKeywords = [
    'safety', 'security', 'harassment', 'threat', 'danger', 'unsafe', 'violence', 'assault',
    'emergency', 'fire', 'medical', 'suspicious', 'personal safety', 'campus safety',
    'security guard', 'lighting', 'dark', 'emergency exit', 'alarm', 'bullying', 'abuse',
    'stalking', 'theft', 'robbery', 'vandalism', 'fight', 'weapon', 'drug', 'alcohol'
  ];
  
  const administrationKeywords = [
    'paperwork', 'form', 'document', 'fee', 'payment', 'billing', 'record', 'office',
    'appointment', 'general inquiry', 'policy', 'procedure', 'administrative', 'bureaucracy'
  ];
  
  // Score-based category detection
  let academicScore = academicKeywords.filter(kw => lowerText.includes(kw)).length;
  let infraScore = infrastructureKeywords.filter(kw => lowerText.includes(kw)).length;
  let safetyScore = safetyKeywords.filter(kw => lowerText.includes(kw)).length;
  let adminScore = administrationKeywords.filter(kw => lowerText.includes(kw)).length;
  
  // Category detection with scoring
  let category: 'academic' | 'infrastructure' | 'safety' | 'administration' = 'administration';
  
  // Safety has highest priority
  if (safetyScore > 0 && safetyScore >= Math.max(academicScore, infraScore, adminScore)) {
    category = 'safety';
  } else if (academicScore > 0 && academicScore >= Math.max(infraScore, adminScore)) {
    category = 'academic';
  } else if (infraScore > 0 && infraScore >= adminScore) {
    category = 'infrastructure';
  } else if (adminScore > 0) {
    category = 'administration';
  } else {
    // If no keywords found, try to infer from context
    if (lowerText.includes('professor') || lowerText.includes('teacher') || lowerText.includes('class')) {
      category = 'academic';
    } else if (lowerText.includes('building') || lowerText.includes('room') || lowerText.includes('wifi')) {
      category = 'infrastructure';
    } else if (lowerText.includes('security') || lowerText.includes('harassment') || lowerText.includes('threat')) {
      category = 'safety';
    } else {
      category = 'administration';
    }
  }
  
  // Priority detection
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('emergency') || lowerText.includes('immediate')) {
    priority = 'critical';
  } else if (lowerText.includes('important') || lowerText.includes('asap')) {
    priority = 'high';
  } else if (lowerText.includes('minor') || lowerText.includes('low priority')) {
    priority = 'low';
  }
  
  // Sentiment score (simple heuristic)
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'frustrated', 'angry', 'disappointed'];
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied'];
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const sentimentScore = Math.max(0, Math.min(1, 0.5 - (negativeCount * 0.15) + (positiveCount * 0.1)));
  
  // Urgency score
  const urgencyKeywords = ['urgent', 'critical', 'immediate', 'emergency', 'asap', 'important'];
  const keywordCount = urgencyKeywords.filter(kw => lowerText.includes(kw)).length;
  const urgencyScore = Math.min(100, 30 + (keywordCount * 15) + (conversation.length > 200 ? 10 : 0));
  
  // Summary
  const sentences = conversation.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const summary = sentences.slice(0, 2).join('. ').trim() || 'Student has raised a concern that requires attention.';
  
  return {
    category,
    priority,
    sentimentScore,
    summary: summary.length > 200 ? summary.substring(0, 200) + '...' : summary,
    urgencyScore,
  };
}

// Enhanced chat response using Vertex AI if available, otherwise Gemini, with fallback
export async function generateEmpatheticResponse(
  grievanceText: string,
  conversationHistory: Array<{ text: string; sender: 'user' | 'system' }> = []
): Promise<string> {
  // Try Vertex AI first (if configured)
  try {
    const vertexResponse = await fetch('/api/vertex/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: grievanceText,
        conversationHistory: conversationHistory.map(msg => ({
          text: msg.text,
          sender: msg.sender,
        }))
      }),
    });

    if (vertexResponse.ok) {
      const data = await vertexResponse.json();
      if (data.response && data.source === 'vertex-ai') {
        return data.response;
      }
    }
  } catch (error) {
    // Fall through to Gemini
    console.log('Vertex AI not available, using Gemini');
  }
  // Build conversation context
  const conversationContext = conversationHistory
    .slice(-6) // Last 6 messages for context
    .map(msg => `${msg.sender === 'user' ? 'Student' : 'Assistant'}: ${msg.text}`)
    .join('\n');

  // Fallback if no API key
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY === 'your-gemini-api-key') {
    return generateContextualFallbackResponse(grievanceText, conversationHistory);
  }

  // Detect intent for better fine-tuning (dynamic import to avoid circular dependencies)
  let intent: { intent: string; extractedInfo?: any } = { intent: 'general' };
  try {
    const { detectIntent } = await import('./chat-actions');
    intent = detectIntent(grievanceText, conversationHistory);
  } catch (error) {
    console.log('Could not detect intent, using default');
  }
  
  // Fine-tuned prompt based on intent
  let intentContext = '';
  if (intent.intent === 'report_urgent') {
    intentContext = 'URGENT: This is a critical/safety issue. Respond with urgency and empathy.';
  } else if (intent.intent === 'create_grievance') {
    intentContext = 'The user is ready to create a grievance. Guide them through the process.';
  } else if (intent.intent === 'add_details') {
    intentContext = 'The user is providing additional details. Acknowledge and ask for more if needed.';
  } else if (intent.intent === 'ask_question') {
    intentContext = 'The user is asking a question. Provide helpful, accurate information.';
  }
  
  const prompt = `You are an intelligent, empathetic grievance system assistant with action-oriented capabilities. You're having a conversation with a student who is reporting a grievance.

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}Student's latest message: "${grievanceText}"

${intentContext ? `Context: ${intentContext}\n` : ''}${intent.extractedInfo?.category ? `Detected category: ${intent.extractedInfo.category}\n` : ''}${intent.extractedInfo?.priority ? `Detected priority: ${intent.extractedInfo.priority}\n` : ''}

Generate a natural, action-oriented response (2-4 sentences) that:
- Acknowledges their specific concern with empathy (don't be generic)
- Shows genuine understanding of their situation
- Provides actionable guidance or asks relevant follow-up questions
- Suggests next steps when appropriate (e.g., "Would you like me to help you create a formal grievance?")
- Is warm, professional, and helpful
- Varies your responses - never repeat the same phrases

FINE-TUNING GUIDELINES:
- If they're describing a problem: Ask specific clarifying questions (who, what, when, where)
- If they're asking questions: Provide clear, helpful answers
- If they seem ready: Suggest creating the grievance ("I can help you create a formal grievance now")
- If urgent/safety: Express urgency and offer immediate help
- Always be conversational and natural, not robotic

Return only the response text, no quotes or formatting.`;

  // Try different model names - prioritize models that work with v1beta API
  const modelsToTry = [
    'gemini-pro',  // Most stable and widely available in v1beta
    'gemini-1.5-flash-latest',  // Works with v1beta
    'gemini-1.5-pro-latest',  // Works with v1beta
  ];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      console.log(`Successfully generated response with ${modelName}`);
      return result.response.text().trim();
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error(`Gemini response generation error with ${modelName}:`, errorMessage);
      // If it's a 404 (model not found) or not supported, try next model
      if (errorMessage.includes('404') || 
          errorMessage.includes('not found') || 
          errorMessage.includes('not supported') ||
          errorMessage.includes('is not found for API version')) {
        continue; // Try next model
      }
      // For other errors (rate limit, auth, etc.), try next model too
      if (!errorMessage.includes('quota') && !errorMessage.includes('permission')) {
        continue;
      }
      break;
    }
  }
  
  // Fallback to contextual response
  console.log('All Gemini models failed, using fallback response');
  return generateContextualFallbackResponse(grievanceText, conversationHistory);
}

// Generate contextual fallback responses
function generateContextualFallbackResponse(
  grievanceText: string,
  conversationHistory: Array<{ text: string; sender: 'user' | 'system' }> = []
): string {
  const lowerText = grievanceText.toLowerCase();
  const isFirstMessage = conversationHistory.length === 0;
  
  // Detect what the user is talking about
  if (isFirstMessage || conversationHistory.length <= 2) {
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('help')) {
      return "Hello! I'm here to help you file a grievance. Could you please describe the issue you're experiencing? I'll guide you through the process.";
    }
    return "I understand you're facing an issue. Could you tell me more about what happened? The more details you provide, the better I can help you create an effective grievance report.";
  }

  // Academic issues
  if (lowerText.includes('exam') || lowerText.includes('grade') || lowerText.includes('course') || lowerText.includes('professor') || lowerText.includes('teacher')) {
    return "I see this is related to academic matters. This is important. Can you tell me which course or professor is involved, and what specific issue occurred?";
  }

  // Infrastructure issues
  if (lowerText.includes('building') || lowerText.includes('room') || lowerText.includes('wifi') || lowerText.includes('facility') || lowerText.includes('maintenance')) {
    return "I understand you're experiencing infrastructure issues. Where exactly is this happening? This will help us route your grievance to the right department quickly.";
  }

  // Safety issues
  if (lowerText.includes('safety') || lowerText.includes('security') || lowerText.includes('harassment') || lowerText.includes('threat') || lowerText.includes('unsafe')) {
    return "Safety concerns are our top priority. Are you currently safe? If this is an emergency, please contact campus security immediately. Otherwise, please share more details so we can address this urgently.";
  }

  // Urgent keywords
  if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('emergency') || lowerText.includes('immediate')) {
    return "I understand this is urgent. Let me help you get this resolved quickly. Can you provide specific details about when this occurred and who might be involved?";
  }

  // Questions
  if (lowerText.includes('?') || lowerText.includes('what') || lowerText.includes('how') || lowerText.includes('when') || lowerText.includes('where')) {
    return "That's a great question. Let me help clarify that for you. Could you also share what specific issue you're experiencing so I can provide the most relevant information?";
  }

  // Follow-up responses
  if (conversationHistory.length > 2) {
    return "Thank you for that additional information. This helps me understand the situation better. Is there anything else you'd like to add, or would you like me to help you create a formal grievance report now?";
  }

  // Default contextual response
  return "I appreciate you sharing this with me. To help you better, could you provide a bit more detail about when this happened and how it has affected you?";
}

export async function summarizeGrievanceHistory(
  messages: Array<{ text: string; sender: string; timestamp: any }>
): Promise<string> {
  // Fallback if no API key
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY === 'your-gemini-api-key') {
    return 'Unable to generate summary at this time.';
  }

  const conversationText = messages
    .map((msg) => `${msg.sender}: ${msg.text}`)
    .join('\n');

  const prompt = `Summarize this grievance conversation history in 3-4 sentences:

${conversationText}

Focus on:
- The main issue raised
- Key points discussed
- Current status/outcome
- Any action items

Return only the summary text.`;

  // Try different model names - prioritize models that work with v1beta API
  const modelsToTry = [
    'gemini-pro',  // Most stable and widely available in v1beta
    'gemini-1.5-flash-latest',  // Works with v1beta
    'gemini-1.5-pro-latest',  // Works with v1beta
  ];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      console.log(`Successfully generated summary with ${modelName}`);
      return result.response.text().trim();
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error(`Gemini summarization error with ${modelName}:`, errorMessage);
      // If it's a 404 (model not found) or not supported, try next model
      if (errorMessage.includes('404') || 
          errorMessage.includes('not found') || 
          errorMessage.includes('not supported') ||
          errorMessage.includes('is not found for API version')) {
        continue; // Try next model
      }
      // For other errors (rate limit, auth, etc.), try next model too
      if (!errorMessage.includes('quota') && !errorMessage.includes('permission')) {
        continue;
      }
      break;
    }
  }
  
  return 'Unable to generate summary at this time.';
}

