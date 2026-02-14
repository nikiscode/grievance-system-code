import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

// Enhanced fallback classification function with comprehensive keyword matching
function classifyFallback(text: string): 'academic' | 'infrastructure' | 'safety' | 'administration' {
  const lowerText = text.toLowerCase();
  
  // Comprehensive keyword lists
  const academicKeywords = [
    'exam', 'grade', 'course', 'assignment', 'professor', 'teacher', 'lecture', 'syllabus',
    'academic', 'study', 'class', 'subject', 'curriculum', 'semester', 'term', 'registration',
    'enrollment', 'transcript', 'degree', 'scholarship', 'tuition', 'gpa', 'homework',
    'academic misconduct', 'plagiarism', 'cheating', 'library', 'textbook', 'study material'
  ];
  
  const infraKeywords = [
    'building', 'room', 'facility', 'wifi', 'internet', 'electricity', 'power', 'water',
    'plumbing', 'heating', 'cooling', 'air conditioning', 'ac', 'maintenance', 'infrastructure',
    'repair', 'broken', 'equipment', 'elevator', 'door', 'window', 'parking', 'transportation',
    'campus', 'dormitory', 'dorm', 'cafeteria', 'canteen', 'restroom', 'bathroom', 'toilet',
    'shower', 'furniture', 'chair', 'desk', 'table', 'light', 'bulb'
  ];
  
  const safetyKeywords = [
    'safety', 'security', 'harassment', 'threat', 'danger', 'unsafe', 'emergency', 'violence',
    'assault', 'fire', 'medical', 'suspicious', 'personal safety', 'campus safety',
    'security guard', 'lighting', 'dark', 'emergency exit', 'alarm', 'bullying', 'abuse',
    'stalking', 'theft', 'robbery', 'vandalism', 'fight', 'weapon', 'drug', 'alcohol'
  ];
  
  const adminKeywords = [
    'paperwork', 'form', 'document', 'fee', 'payment', 'billing', 'record', 'office',
    'appointment', 'general inquiry', 'policy', 'procedure', 'administrative', 'bureaucracy'
  ];
  
  // Score-based classification
  const academicScore = academicKeywords.filter(kw => lowerText.includes(kw)).length;
  const infraScore = infraKeywords.filter(kw => lowerText.includes(kw)).length;
  const safetyScore = safetyKeywords.filter(kw => lowerText.includes(kw)).length;
  const adminScore = adminKeywords.filter(kw => lowerText.includes(kw)).length;
  
  // Safety has highest priority
  if (safetyScore > 0 && safetyScore >= Math.max(academicScore, infraScore, adminScore)) {
    return 'safety';
  } else if (academicScore > 0 && academicScore >= Math.max(infraScore, adminScore)) {
    return 'academic';
  } else if (infraScore > 0 && infraScore >= adminScore) {
    return 'infrastructure';
  } else if (adminScore > 0) {
    return 'administration';
  }
  
  // Fallback: try to infer from common words
  if (lowerText.includes('professor') || lowerText.includes('teacher') || lowerText.includes('class') || lowerText.includes('course')) {
    return 'academic';
  } else if (lowerText.includes('building') || lowerText.includes('room') || lowerText.includes('wifi') || lowerText.includes('facility')) {
    return 'infrastructure';
  } else if (lowerText.includes('security') || lowerText.includes('harassment') || lowerText.includes('threat') || lowerText.includes('emergency')) {
    return 'safety';
  }
  
  // Last resort: administration
  return 'administration';
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
      console.log('Vertex AI not configured, using fallback classification');
      const category = classifyFallback(text);
      return NextResponse.json({ category, source: 'fallback' });
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

      const prompt = `You are an expert grievance classification system. Analyze the following text and classify it into ONE category: academic, infrastructure, safety, or administration.

Grievance text:
"${text}"

CATEGORY DEFINITIONS (Be precise and accurate):

**academic**: Issues about courses, exams, grades, professors, teachers, assignments, homework, lectures, syllabus, academic policies, study materials, library, academic calendar, registration, enrollment, transcripts, degrees, scholarships, academic misconduct, plagiarism, cheating

**infrastructure**: Issues about buildings, rooms, facilities, wifi, internet, electricity, power, water, plumbing, heating, cooling, air conditioning, maintenance, repairs, broken equipment, elevators, doors, windows, parking, transportation, campus facilities, dormitories, cafeterias, restrooms

**safety**: Issues about security, harassment, bullying, threats, danger, unsafe conditions, violence, assault, emergency, fire, medical emergency, suspicious activity, personal safety, campus safety, security guards, lighting, dark areas, emergency exits, alarms

**administration**: ONLY use for general administrative matters like paperwork, forms, fees, payments, billing, records, documents, general policies, office hours, appointments, general inquiries that don't fit other categories

CRITICAL RULES:
- Analyze the MAIN issue being described
- Look for specific keywords and context
- If multiple categories are mentioned, choose the PRIMARY concern
- Only use "administration" if it's clearly administrative paperwork/policy, NOT if it's about academic/infrastructure/safety issues
- Be specific and accurate - don't default to administration
- Safety issues take priority over others

Respond with ONLY the category name (one word): academic, infrastructure, safety, or administration.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase().trim() || '';
      
      // Extract category from response
      let category: 'academic' | 'infrastructure' | 'safety' | 'administration' = 'administration';
      
      if (responseText.includes('academic')) {
        category = 'academic';
      } else if (responseText.includes('infrastructure')) {
        category = 'infrastructure';
      } else if (responseText.includes('safety')) {
        category = 'safety';
      } else {
        // If response is unclear, use fallback
        category = classifyFallback(text);
      }

      return NextResponse.json({ category, source: 'vertex-ai' });
    } catch (vertexError: any) {
      console.error('Vertex AI classification error:', vertexError?.message || vertexError);
      // Fallback to keyword-based classification
      const category = classifyFallback(text);
      return NextResponse.json({ category, source: 'fallback', error: vertexError?.message });
    }
  } catch (error) {
    console.error('Classification error:', error);
    // Final fallback - try to get text from request if possible
    try {
      const body = await request.json();
      const category = classifyFallback(body.text || '');
      return NextResponse.json({ category, source: 'fallback' });
    } catch {
      return NextResponse.json({ category: 'administration', source: 'fallback' });
    }
  }
}

