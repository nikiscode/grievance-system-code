import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

// Fallback urgency prediction function
function predictUrgencyFallback(text: string): number {
  const urgencyKeywords = ['urgent', 'critical', 'immediate', 'emergency', 'asap', 'important', 'urgently'];
  const lowerText = text.toLowerCase();
  
  let urgencyScore = 30; // Base score
  
  // Keyword-based scoring
  urgencyKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      urgencyScore += 15;
    }
  });
  
  // Length-based scoring (longer grievances might be more detailed/urgent)
  if (text.length > 200) urgencyScore += 10;
  if (text.length > 500) urgencyScore += 5;
  
  // Safety-related keywords increase urgency
  const safetyKeywords = ['safety', 'security', 'harassment', 'threat', 'danger', 'unsafe', 'violence'];
  if (safetyKeywords.some(kw => lowerText.includes(kw))) {
    urgencyScore += 20;
  }
  
  // Cap at 100
  return Math.min(urgencyScore, 100);
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Check if Vertex AI is configured
    const projectId = process.env.VERTEX_AI_PROJECT_ID;
    const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

    // If Vertex AI is not configured, use fallback
    if (!projectId) {
      console.log('Vertex AI not configured, using fallback urgency prediction');
      const urgencyScore = predictUrgencyFallback(text);
      return NextResponse.json({ urgencyScore, source: 'fallback' });
    }

    try {
      // Initialize Vertex AI
      const vertexAI = new VertexAI({
        project: projectId,
        location: location,
      });

      // Use Gemini model via Vertex AI
      const model = vertexAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const prompt = `Analyze the following grievance text and predict an urgency score from 0 to 100.

Grievance text:
"${text}"

Scoring guidelines:
- 0-30: Low urgency - routine matters, non-critical issues
- 31-50: Medium urgency - important but not time-sensitive
- 51-70: High urgency - needs attention soon
- 71-85: Very high urgency - requires immediate attention
- 86-100: Critical urgency - emergency situations, safety issues, time-sensitive matters

Consider factors like:
- Use of urgent/critical language
- Safety or security concerns
- Time sensitivity mentioned
- Severity of the issue
- Impact on students/staff

Respond with ONLY a number between 0 and 100 representing the urgency score.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      
      // Extract number from response
      const match = responseText.match(/\d+/);
      let urgencyScore = match ? parseInt(match[0], 10) : null;
      
      // Validate and clamp the score
      if (urgencyScore === null || isNaN(urgencyScore)) {
        urgencyScore = predictUrgencyFallback(text);
      } else {
        urgencyScore = Math.max(0, Math.min(100, urgencyScore));
      }

      return NextResponse.json({ urgencyScore, source: 'vertex-ai' });
    } catch (vertexError: any) {
      console.error('Vertex AI prediction error:', vertexError?.message || vertexError);
      // Fallback to keyword-based prediction
      const urgencyScore = predictUrgencyFallback(text);
      return NextResponse.json({ urgencyScore, source: 'fallback', error: vertexError?.message });
    }
  } catch (error) {
    console.error('Prediction error:', error);
    // Final fallback - try to get text from request if possible
    try {
      const body = await request.json();
      const urgencyScore = predictUrgencyFallback(body.text || '');
      return NextResponse.json({ urgencyScore, source: 'fallback' });
    } catch {
      return NextResponse.json({ urgencyScore: 50, source: 'fallback' });
    }
  }
}

