// Client-side functions that call the Vertex AI API routes
// The actual Vertex AI integration happens server-side in the API routes

export interface VertexAIResponse {
  source: 'vertex-ai' | 'fallback';
  error?: string;
}

export async function predictUrgencyScore(
  text: string
): Promise<number> {
  try {
    const response = await fetch('/api/vertex/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Vertex AI prediction failed');
    }

    const data = await response.json();
    return data.urgencyScore || 50;
  } catch (error) {
    console.error('Vertex AI prediction error:', error);
    // Fallback: simple heuristic
    const urgencyKeywords = ['urgent', 'critical', 'immediate', 'emergency', 'asap'];
    const lowerText = text.toLowerCase();
    const keywordCount = urgencyKeywords.filter(kw => lowerText.includes(kw)).length;
    return Math.min(50 + keywordCount * 15, 100);
  }
}

export async function classifyGrievanceCategory(
  text: string
): Promise<'academic' | 'infrastructure' | 'safety' | 'administration'> {
  try {
    const response = await fetch('/api/vertex/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Vertex AI classification failed');
    }

    const data = await response.json();
    return data.category || 'administration';
  } catch (error) {
    console.error('Vertex AI classification error:', error);
    // Enhanced fallback: comprehensive keyword-based classification
    const lowerText = text.toLowerCase();
    
    const academicKeywords = ['exam', 'grade', 'course', 'professor', 'teacher', 'lecture', 'assignment', 'academic', 'class', 'study'];
    const infrastructureKeywords = ['building', 'room', 'wifi', 'internet', 'facility', 'electricity', 'water', 'maintenance', 'repair', 'broken'];
    const safetyKeywords = ['safety', 'security', 'harassment', 'threat', 'danger', 'unsafe', 'violence', 'emergency', 'assault'];
    
    let academicScore = academicKeywords.filter(kw => lowerText.includes(kw)).length;
    let infraScore = infrastructureKeywords.filter(kw => lowerText.includes(kw)).length;
    let safetyScore = safetyKeywords.filter(kw => lowerText.includes(kw)).length;
    
    if (safetyScore > 0 && safetyScore >= Math.max(academicScore, infraScore)) {
      return 'safety';
    } else if (academicScore > 0 && academicScore >= infraScore) {
      return 'academic';
    } else if (infraScore > 0) {
      return 'infrastructure';
    }
    
    return 'administration';
  }
}

