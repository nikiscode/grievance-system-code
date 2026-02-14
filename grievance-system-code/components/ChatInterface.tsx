'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, AlertCircle, FileText, Plus, HelpCircle } from 'lucide-react';
import { analyzeGrievanceFromChat, generateEmpatheticResponse } from '@/lib/gemini';
import { detectIntent, generateActionSuggestions, type ChatIntent } from '@/lib/chat-actions';

interface Message {
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
  intent?: ChatIntent;
}

interface ChatInterfaceProps {
  onConvertToGrievance?: (conversation: string, analysis: any) => void;
  initialMessages?: Message[];
  autoCreate?: boolean; // Auto-create grievance when enough info is gathered
  onGrievanceCreated?: (grievanceId: string) => void; // Callback when grievance is auto-created
}

export default function ChatInterface({ 
  onConvertToGrievance, 
  initialMessages = [],
  autoCreate = true, // Default to auto-create
  onGrievanceCreated
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [grievanceCreated, setGrievanceCreated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoCreateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCreatingRef = useRef<boolean>(false);

  useEffect(() => {
    if (messages.length === 0) {
      // Add welcome message
      const welcomeText = autoCreate
        ? "Hello! I'm here to help you file a grievance. Please describe your concern, and I'll automatically create a formal grievance request once I have enough information."
        : "Hello! I'm here to help you with your grievance. Please describe your concern, and I'll assist you in creating a formal grievance request.";
      
      setMessages([{
        text: welcomeText,
        sender: 'system',
        timestamp: new Date(),
      }]);
    }
  }, [autoCreate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    // Don't allow sending if grievance already created or is being created
    if (!input.trim() || loading || grievanceCreated || isCreatingRef.current) return;

    const userInput = input.trim();
    
    // Detect intent from user message - use current messages state
    const conversationHistory = messages.map(msg => ({
      text: msg.text,
      sender: msg.sender,
    }));
    const intent = detectIntent(userInput, conversationHistory);
    
    const userMessage: Message = {
      text: userInput,
      sender: 'user',
      timestamp: new Date(),
      intent,
    };

    // Add user message immediately to preserve it
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Generate fine-tuned contextual response using conversation history and intent
      const response = await generateEmpatheticResponse(userInput, conversationHistory);
      const systemMessage: Message = {
        text: response,
        sender: 'system',
        timestamp: new Date(),
        intent,
      };
      
      setMessages((prev) => {
        const newMessages = [...prev, systemMessage];
        
        // Auto-create grievance if conditions are met (after state update)
        if (autoCreate && !grievanceCreated && !isCreatingRef.current && onConvertToGrievance) {
          // Build conversation history for checking
          const fullConversationHistory = newMessages.map(msg => ({
            text: msg.text,
            sender: msg.sender,
          }));
          
          const shouldAutoCreate = shouldAutoCreateGrievance(intent, newMessages.length, fullConversationHistory);
          if (shouldAutoCreate) {
            // Clear any existing timeout to prevent multiple creations
            if (autoCreateTimeoutRef.current) {
              clearTimeout(autoCreateTimeoutRef.current);
            }
            
            // Wait a bit for user to see the response, then auto-create
            autoCreateTimeoutRef.current = setTimeout(() => {
              // Double-check before creating
              if (!grievanceCreated && !isCreatingRef.current) {
                handleAutoCreateGrievance(newMessages);
              }
              autoCreateTimeoutRef.current = null;
            }, 2000); // Increased delay to give user time to add more details
          }
        }
        
        return newMessages;
      });
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        text: 'I apologize, but I encountered an error. Please try again or use the manual form.',
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  // Determine if grievance should be auto-created
  const shouldAutoCreateGrievance = (intent: ChatIntent, messageCount: number, conversationHistory: Array<{ text: string; sender: 'user' | 'system' }>): boolean => {
    // Don't auto-create if already created
    if (grievanceCreated) return false;
    
    // Count user messages (not system messages) to ensure we have enough user input
    const userMessageCount = conversationHistory.filter(msg => msg.sender === 'user').length;
    
    // Auto-create if:
    // 1. User explicitly wants to create AND has provided at least 2 user messages
    if (intent.intent === 'create_grievance' && intent.confidence >= 0.8 && userMessageCount >= 2) {
      return true;
    }
    
    // 2. Urgent/safety issue BUT only if user has provided at least 2 messages with details
    // (First message is usually just "I need to report..." - need more details)
    if (intent.intent === 'report_urgent' && intent.confidence >= 0.9 && userMessageCount >= 2) {
      // Check if user has provided actual details, not just the initial report
      const userMessages = conversationHistory.filter(msg => msg.sender === 'user');
      const hasDetails = userMessages.some(msg => {
        const text = msg.text.toLowerCase();
        // Check if message has actual content beyond just reporting intent
        const isJustReporting = text.match(/^(i need to|i want to|i have to|i would like to) (report|file|submit|create)/i);
        const hasActualContent = msg.text.length > 40 && // Substantial message
          (text.includes('happened') || 
           text.includes('where') || 
           text.includes('when') || 
           text.includes('who') ||
           text.includes('location') ||
           text.includes('building') ||
           text.includes('room') ||
           text.includes('floor') ||
           text.includes('danger') ||
           text.includes('broken') ||
           text.includes('glass') ||
           text.includes('hazard'));
        return !isJustReporting && hasActualContent;
      });
      
      // Also check if we have at least one message with location/context details
      const hasLocationDetails = userMessages.some(msg => {
        const text = msg.text.toLowerCase();
        return text.includes('building') || 
               text.includes('room') || 
               text.includes('floor') || 
               text.includes('location') ||
               text.includes('where');
      });
      
      return hasDetails && (hasLocationDetails || userMessageCount >= 3);
    }
    
    // 3. Enough conversation has happened (6+ total messages, 3+ user messages)
    if (messageCount >= 6 && userMessageCount >= 3 && intent.intent !== 'ask_question') {
      return true;
    }
    
    return false;
  };
  
  // Auto-create grievance
  const handleAutoCreateGrievance = async (currentMessages: Message[]) => {
    // Double-check conditions before creating - use ref to prevent race conditions
    if (grievanceCreated || isCreatingRef.current || currentMessages.length < 2 || !onConvertToGrievance) {
      return;
    }
    
    // Check if we have enough user messages
    const userMessages = currentMessages.filter(msg => msg.sender === 'user');
    if (userMessages.length < 2) {
      // Not enough user input yet, wait for more
      return;
    }
    
    // Prevent multiple simultaneous creations
    if (loading) {
      return;
    }
    
    // Set flags immediately to prevent duplicate calls
    isCreatingRef.current = true;
    setGrievanceCreated(true);
    setLoading(true);
    
    // Clear any pending timeout
    if (autoCreateTimeoutRef.current) {
      clearTimeout(autoCreateTimeoutRef.current);
      autoCreateTimeoutRef.current = null;
    }
    
    try {
      // Use the latest messages state to ensure we have all messages
      const latestMessages = [...currentMessages];
      const conversation = latestMessages
        .map((msg) => `${msg.sender === 'user' ? 'Student' : 'System'}: ${msg.text}`)
        .join('\n');

      const analysis = await analyzeGrievanceFromChat(conversation);
      
      // Show confirmation message - use functional update to ensure we have latest state
      const confirmationMessage: Message = {
        text: 'Great! I have enough information. Creating your grievance now...',
        sender: 'system',
        timestamp: new Date(),
      };
      
      setMessages((prev) => {
        // Ensure we don't lose any messages
        const allMessages = [...prev];
        if (!allMessages.find(m => m.text === confirmationMessage.text && m.sender === 'system')) {
          allMessages.push(confirmationMessage);
        }
        return allMessages;
      });
      
      // Create the grievance - this will redirect, so messages are preserved in the grievance
      await onConvertToGrievance(conversation, analysis);
      
    } catch (error) {
      console.error('Error auto-creating grievance:', error);
      // Reset flags on error so user can try again
      isCreatingRef.current = false;
      setGrievanceCreated(false);
      const errorMessage: Message = {
        text: 'I encountered an error while creating your grievance. You can continue adding details and try again.',
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages((prev) => {
        // Preserve all existing messages
        const allMessages = [...prev];
        if (!allMessages.find(m => m.text === errorMessage.text)) {
          allMessages.push(errorMessage);
        }
        return allMessages;
      });
    } finally {
      setLoading(false);
      // Note: isCreatingRef stays true on success to prevent re-creation
      // It will be reset on error or component unmount
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoCreateTimeoutRef.current) {
        clearTimeout(autoCreateTimeoutRef.current);
      }
    };
  }, []);
  
  const handleActionClick = async (actionId: string) => {
    try {
      if (actionId === 'create_grievance') {
        await handleConvertToGrievance();
      } else if (actionId === 'add_details') {
        setInput('I would like to add more details: ');
        // Focus on input
        setTimeout(() => {
          const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement | null;
          if (inputElement) {
            inputElement.focus();
          }
        }, 100);
      } else if (actionId === 'contact_security') {
        const securityMessage: Message = {
          text: 'If this is an emergency, please contact campus security immediately at the emergency number. For non-emergency safety concerns, I can help you file a grievance that will be prioritized.',
          sender: 'system',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, securityMessage]);
      } else if (actionId === 'provide_info') {
        const infoMessage: Message = {
          text: 'I\'m here to help! I can assist you with: filing grievances, understanding the process, checking status, and answering questions. What would you like to know?',
          sender: 'system',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, infoMessage]);
      }
    } catch (error) {
      console.error('Error handling action:', error);
    }
  };

  const handleConvertToGrievance = async () => {
    // Prevent multiple creations - check both state and ref
    if (messages.length < 2 || grievanceCreated || isCreatingRef.current || loading || !onConvertToGrievance) return;

    // Set flags immediately to prevent duplicate calls
    isCreatingRef.current = true;
    setGrievanceCreated(true);
    setLoading(true);
    
    // Clear any pending auto-create timeout
    if (autoCreateTimeoutRef.current) {
      clearTimeout(autoCreateTimeoutRef.current);
      autoCreateTimeoutRef.current = null;
    }

    try {
      const conversation = messages
        .map((msg) => `${msg.sender === 'user' ? 'Student' : 'System'}: ${msg.text}`)
        .join('\n');

      const analysis = await analyzeGrievanceFromChat(conversation);
      
      if (onConvertToGrievance) {
        onConvertToGrievance(conversation, analysis);
      }
    } catch (error) {
      console.error('Error converting to grievance:', error);
      // Reset flags on error so user can try again
      isCreatingRef.current = false;
      setGrievanceCreated(false);
    } finally {
      setLoading(false);
      // Note: isCreatingRef stays true on success to prevent re-creation
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {message.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
                {/* Show action suggestions for system messages */}
                {message.sender === 'system' && message.intent && (() => {
                  try {
                    const conversationUpToThisPoint = messages.slice(0, messages.indexOf(message) + 1).map(m => ({
                      text: m.text,
                      sender: m.sender,
                    }));
                    const actions = generateActionSuggestions(message.intent, conversationUpToThisPoint);
                    if (actions.length > 0) {
                      return (
                        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggested actions:</p>
                          <div className="flex flex-wrap gap-2">
                            {actions.map((action) => (
                              <button
                                key={action.id}
                                onClick={() => handleActionClick(action.id)}
                                disabled={loading}
                                className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center ${
                                  action.type === 'primary'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200'
                                } disabled:opacity-50`}
                              >
                                {action.type === 'primary' && <FileText className="w-3 h-3 mr-1" />}
                                {action.type === 'secondary' && <Plus className="w-3 h-3 mr-1" />}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  } catch (err) {
                    console.error('Error generating action suggestions:', err);
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {messages.length > 2 && !grievanceCreated && !autoCreate && (
          <button
            onClick={handleConvertToGrievance}
            disabled={loading}
            className="w-full mb-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          >
            Create Grievance
          </button>
        )}
        {messages.length >= 4 && !grievanceCreated && autoCreate && (
          <div className="w-full mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs text-center">
            💡 Keep adding details. Your grievance will be created automatically when ready.
          </div>
        )}
        {grievanceCreated && (
          <div className="w-full mb-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium text-center">
            ✓ Grievance created successfully! Redirecting to track page...
          </div>
        )}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={grievanceCreated ? "Grievance created - redirecting..." : "Type your message..."}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={loading || grievanceCreated}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || grievanceCreated}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

