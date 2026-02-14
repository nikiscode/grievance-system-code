import { NextRequest, NextResponse } from 'next/server';

// Vertex AI Chat API endpoint
// This provides enhanced conversational AI responses using Vertex AI
export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check if Vertex AI is configured
    const hasVertexAI = process.env.GOOGLE_APPLICATION_CREDENTIALS && 
                       process.env.VERTEX_AI_PROJECT_ID;

    if (hasVertexAI) {
      try {
        // Import Vertex AI SDK (only if credentials are available)
        const { VertexAI } = await import('@google-cloud/vertexai');
        
        const vertexAI = new VertexAI({
          project: process.env.VERTEX_AI_PROJECT_ID!,
          location: process.env.VERTEX_AI_LOCATION || 'us-central1',
        });

        const model = vertexAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
        });

        // Build conversation context
        const conversationContext = conversationHistory
          .slice(-10) // Last 10 messages
          .map((msg: any) => `${msg.sender === 'user' ? 'Student' : 'Assistant'}: ${msg.text}`)
          .join('\n');

        // Detect intent for fine-tuning
        let intentContext = '';
        let categoryInfo = '';
        let priorityInfo = '';
        
        try {
          const { detectIntent } = await import('@/lib/chat-actions');
          const intent = detectIntent(message, conversationHistory);
          
          if (intent.intent === 'report_urgent') {
            intentContext = 'URGENT: This is a critical/safety issue. Respond with urgency and empathy.';
          } else if (intent.intent === 'create_grievance') {
            intentContext = 'The user is ready to create a grievance. Guide them through the process.';
          } else if (intent.intent === 'add_details') {
            intentContext = 'The user is providing additional details. Acknowledge and ask for more if needed.';
          } else if (intent.intent === 'ask_question') {
            intentContext = 'The user is asking a question. Provide helpful, accurate information.';
          }
          
          if (intent.extractedInfo?.category) {
            categoryInfo = `Detected category: ${intent.extractedInfo.category}. `;
          }
          if (intent.extractedInfo?.priority) {
            priorityInfo = `Detected priority: ${intent.extractedInfo.priority}. `;
          }
        } catch {
          // Continue without intent detection
        }

        const prompt = `You are an intelligent, empathetic grievance system assistant with action-oriented capabilities. You're having a conversation with a student who is reporting a grievance.

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}Student's latest message: "${message}"

${intentContext ? `Context: ${intentContext}\n` : ''}${categoryInfo}${priorityInfo}

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

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        
        const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 
                        'I understand your concern. Could you provide more details?';

        return NextResponse.json({ 
          response: response.trim(),
          source: 'vertex-ai'
        });
      } catch (vertexError: any) {
        console.error('Vertex AI error:', vertexError);
        // Fall through to fallback
      }
    }

    // Fallback: Use intelligent keyword-based responses
    const lowerText = message.toLowerCase();
    const isFirstMessage = conversationHistory.length === 0;
    
    let fallbackResponse = '';
    
    if (isFirstMessage || conversationHistory.length <= 2) {
      if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('help')) {
        fallbackResponse = "Hello! I'm here to help you file a grievance. Could you please describe the issue you're experiencing? I'll guide you through the process.";
      } else {
        fallbackResponse = "I understand you're facing an issue. Could you tell me more about what happened? The more details you provide, the better I can help you create an effective grievance report.";
      }
    } else if (lowerText.includes('exam') || lowerText.includes('grade') || lowerText.includes('course') || lowerText.includes('professor')) {
      fallbackResponse = "I see this is related to academic matters. This is important. Can you tell me which course or professor is involved, and what specific issue occurred?";
    } else if (lowerText.includes('building') || lowerText.includes('room') || lowerText.includes('wifi') || lowerText.includes('facility')) {
      fallbackResponse = "I understand you're experiencing infrastructure issues. Where exactly is this happening? This will help us route your grievance to the right department quickly.";
    } else if (lowerText.includes('safety') || lowerText.includes('security') || lowerText.includes('harassment') || lowerText.includes('threat')) {
      fallbackResponse = "Safety concerns are our top priority. Are you currently safe? If this is an emergency, please contact campus security immediately. Otherwise, please share more details so we can address this urgently.";
    } else if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('emergency')) {
      fallbackResponse = "I understand this is urgent. Let me help you get this resolved quickly. Can you provide specific details about when this occurred and who might be involved?";
    } else if (lowerText.includes('?') || lowerText.includes('what') || lowerText.includes('how')) {
      fallbackResponse = "That's a great question. Let me help clarify that for you. Could you also share what specific issue you're experiencing so I can provide the most relevant information?";
    } else if (conversationHistory.length > 2) {
      fallbackResponse = "Thank you for that additional information. This helps me understand the situation better. Is there anything else you'd like to add, or would you like me to help you create a formal grievance report now?";
    } else {
      fallbackResponse = "I appreciate you sharing this with me. To help you better, could you provide a bit more detail about when this happened and how it has affected you?";
    }

    return NextResponse.json({ 
      response: fallbackResponse,
      source: 'fallback'
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate response',
      response: "I apologize, but I encountered an error. Please try again or use the manual form.",
      source: 'error'
    }, { status: 500 });
  }
}

