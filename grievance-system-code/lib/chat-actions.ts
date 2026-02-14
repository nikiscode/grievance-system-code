// Action-based chat system with intent detection and action suggestions

export interface ChatAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  icon?: string;
  handler: () => void | Promise<void>;
}

export interface ChatIntent {
  intent: 'create_grievance' | 'add_details' | 'check_status' | 'ask_question' | 'report_urgent' | 'general';
  confidence: number;
  suggestedActions: string[];
  extractedInfo?: {
    category?: 'academic' | 'infrastructure' | 'safety' | 'administration';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    urgency?: number;
  };
}

// Detect user intent from message
export function detectIntent(
  message: string,
  conversationHistory: Array<{ text: string; sender: 'user' | 'system' }> = []
): ChatIntent {
  const lowerText = message.toLowerCase();
  const conversationLength = conversationHistory.length;
  
  // Check for urgent/safety keywords
  const urgentKeywords = ['urgent', 'critical', 'emergency', 'immediate', 'asap', 'now', 'help'];
  const urgentSafetyKeywords = ['safety', 'security', 'harassment', 'threat', 'danger', 'unsafe', 'violence'];
  const isUrgent = urgentKeywords.some(kw => lowerText.includes(kw)) || 
                   urgentSafetyKeywords.some(kw => lowerText.includes(kw));
  
  // Check for question intent
  const questionKeywords = ['?', 'what', 'how', 'when', 'where', 'why', 'who', 'can', 'could', 'should'];
  const isQuestion = questionKeywords.some(kw => lowerText.includes(kw)) || message.includes('?');
  
  // Check for create grievance intent
  const createKeywords = ['file', 'submit', 'create', 'report', 'grievance', 'complaint', 'issue'];
  const wantsToCreate = createKeywords.some(kw => lowerText.includes(kw)) && conversationLength > 2;
  
  // Check for add details intent
  const detailKeywords = ['more', 'also', 'additionally', 'further', 'another', 'also'];
  const wantsDetails = detailKeywords.some(kw => lowerText.includes(kw)) || conversationLength > 4;
  
  // Extract category with comprehensive keyword matching
  const academicKeywords = ['exam', 'grade', 'course', 'professor', 'teacher', 'lecture', 'assignment', 'academic', 'class', 'study'];
  const infrastructureKeywords = ['building', 'room', 'wifi', 'internet', 'facility', 'electricity', 'water', 'maintenance', 'repair', 'broken'];
  const safetyKeywords = ['safety', 'security', 'harassment', 'threat', 'danger', 'unsafe', 'violence', 'emergency', 'assault'];
  
  let academicScore = academicKeywords.filter(kw => lowerText.includes(kw)).length;
  let infraScore = infrastructureKeywords.filter(kw => lowerText.includes(kw)).length;
  let safetyScore = safetyKeywords.filter(kw => lowerText.includes(kw)).length;
  
  let category: 'academic' | 'infrastructure' | 'safety' | 'administration' | undefined;
  
  if (safetyScore > 0 && safetyScore >= Math.max(academicScore, infraScore)) {
    category = 'safety';
  } else if (academicScore > 0 && academicScore >= infraScore) {
    category = 'academic';
  } else if (infraScore > 0) {
    category = 'infrastructure';
  } else {
    category = 'administration';
  }
  
  // Determine priority
  let priority: 'low' | 'medium' | 'high' | 'critical' | undefined;
  if (isUrgent || urgentSafetyKeywords.some(kw => lowerText.includes(kw))) {
    priority = 'critical';
  } else if (urgentKeywords.some(kw => lowerText.includes(kw))) {
    priority = 'high';
  } else {
    priority = 'medium';
  }
  
  // Calculate urgency score
  let urgency = 30;
  if (isUrgent) urgency += 30;
  if (urgentSafetyKeywords.some(kw => lowerText.includes(kw))) urgency += 25;
  if (message.length > 200) urgency += 10;
  urgency = Math.min(urgency, 100);
  
  // Determine main intent
  let intent: ChatIntent['intent'];
  let confidence = 0.5;
  const suggestedActions: string[] = [];
  
  if (isUrgent && urgentSafetyKeywords.some(kw => lowerText.includes(kw))) {
    intent = 'report_urgent';
    // Lower confidence initially - need more details before auto-creating
    confidence = conversationLength > 2 ? 0.9 : 0.7; // Higher confidence only after some conversation
    suggestedActions.push('create_grievance', 'contact_security');
  } else if (wantsToCreate || conversationLength > 3) {
    intent = 'create_grievance';
    confidence = 0.8;
    suggestedActions.push('create_grievance', 'add_details');
  } else if (wantsDetails) {
    intent = 'add_details';
    confidence = 0.7;
    suggestedActions.push('add_details', 'create_grievance');
  } else if (isQuestion) {
    intent = 'ask_question';
    confidence = 0.75;
    suggestedActions.push('provide_info');
  } else {
    intent = 'general';
    confidence = 0.6;
    if (conversationLength > 2) {
      suggestedActions.push('create_grievance');
    }
  }
  
  return {
    intent,
    confidence,
    suggestedActions,
    extractedInfo: {
      category,
      priority,
      urgency,
    },
  };
}

// Generate action suggestions based on intent
export function generateActionSuggestions(
  intent: ChatIntent,
  conversationHistory: Array<{ text: string; sender: 'user' | 'system' }> = []
): Array<{ id: string; label: string; description: string; type: 'primary' | 'secondary' }> {
  const actions: Array<{ id: string; label: string; description: string; type: 'primary' | 'secondary' }> = [];
  const conversationLength = conversationHistory.length;
  
  switch (intent.intent) {
    case 'create_grievance':
      if (conversationLength > 2) {
        actions.push({
          id: 'create_grievance',
          label: 'Create Grievance',
          description: 'Convert this conversation into a formal grievance',
          type: 'primary',
        });
      }
      if (conversationLength < 4) {
        actions.push({
          id: 'add_details',
          label: 'Add More Details',
          description: 'Provide additional information about your issue',
          type: 'secondary',
        });
      }
      break;
      
    case 'report_urgent':
      actions.push({
        id: 'create_grievance',
        label: 'Create Urgent Grievance',
        description: 'File this as an urgent grievance immediately',
        type: 'primary',
      });
      actions.push({
        id: 'contact_security',
        label: 'Contact Security',
        description: 'If this is an emergency, contact campus security',
        type: 'secondary',
      });
      break;
      
    case 'add_details':
      actions.push({
        id: 'add_details',
        label: 'Continue Conversation',
        description: 'Keep adding details to your grievance',
        type: 'secondary',
      });
      if (conversationLength > 3) {
        actions.push({
          id: 'create_grievance',
          label: 'Create Grievance Now',
          description: 'You have enough information to create the grievance',
          type: 'primary',
        });
      }
      break;
      
    case 'ask_question':
      actions.push({
        id: 'provide_info',
        label: 'Get Help',
        description: 'I can answer questions about the grievance process',
        type: 'secondary',
      });
      break;
      
    default:
      if (conversationLength > 1) {
        actions.push({
          id: 'create_grievance',
          label: 'Create Grievance',
          description: 'Ready to file your grievance?',
          type: 'primary',
        });
      }
  }
  
  return actions;
}

