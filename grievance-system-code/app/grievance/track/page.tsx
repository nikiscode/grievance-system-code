'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import ChatInterface from '@/components/ChatInterface';
import { format } from 'date-fns';
import { Clock, CheckCircle, AlertCircle, MessageSquare, Paperclip, ExternalLink, Download, File, User, Mail, Phone, GraduationCap, Users } from 'lucide-react';

interface Message {
  text: string;
  sender: string;
  timestamp: any;
}

interface Grievance {
  id: string;
  title?: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  summary: string;
  createdAt: any;
  slaDeadline?: any;
  messages: Message[];
  assignedTo?: string;
  attachments?: string[];
  anonymous?: boolean;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  studentYear?: string;
  studentClass?: string;
}

export default function TrackGrievancePage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const grievanceId = searchParams.get('id');
  
  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Helper function to get timestamp as number
  const getTime = (ts: any): number => {
    if (!ts) return 0;
    if (ts.toDate) return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts === 'number') return ts;
    return 0;
  };

  // Helper to normalize and merge messages from main doc + subcollection
  const mergeAndSortMessages = (
    docMessages: any[] | undefined,
    subcollectionMessages: Message[]
  ): Message[] => {
    const baseMessages: Message[] = Array.isArray(docMessages)
      ? docMessages.map((m: any) => ({
          text: m.text || '',
          sender: m.sender || m.senderRole || 'student',
          timestamp: m.timestamp,
        }))
      : [];

    // Combine all messages
    const all = [...baseMessages, ...subcollectionMessages];

    // Remove duplicates based on text and timestamp (in case same message exists in both)
    const uniqueMessages = all.filter((msg, index, self) => 
      index === self.findIndex((m) => 
        m.text === msg.text && 
        Math.abs(getTime(m.timestamp) - getTime(msg.timestamp)) < 1000 // Within 1 second
      )
    );

    // Sort chronologically
    return uniqueMessages.sort((a, b) => getTime(a.timestamp) - getTime(b.timestamp));
  };

  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (grievanceId) {
      loadGrievance();
    } else {
      // No grievance ID provided, stop loading and show error
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grievanceId, user, authLoading, router]);

  const loadGrievance = async () => {
    if (!grievanceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'grievances', grievanceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const grievanceData: Grievance = { 
          id: docSnap.id, 
          title: data.title,
          description: data.description || '',
          category: data.category || 'administration',
          priority: data.priority || 'medium',
          status: data.status || 'submitted',
          summary: data.summary || data.description || '',
          createdAt: data.createdAt,
          slaDeadline: data.slaDeadline,
          assignedTo: data.assignedTo,
          attachments: data.attachments || [],
          anonymous: data.anonymous || false,
          studentName: data.studentName || null,
          studentEmail: data.studentEmail || null,
          studentPhone: data.studentPhone || null,
          studentYear: data.studentYear || null,
          studentClass: data.studentClass || null,
          messages: []
        };
        
        // Load messages from subcollection
        let subcollectionMessages: Message[] = [];
        try {
          const messagesQuery = query(
            collection(db, 'grievances', grievanceId, 'messages'),
            orderBy('timestamp', 'asc')
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          subcollectionMessages = messagesSnapshot.docs.map((msgDoc) => {
            const msgData = msgDoc.data();
            return {
              text: msgData.text || '',
              sender: msgData.senderRole || msgData.sender || 'student',
              timestamp: msgData.timestamp,
            };
          });
        } catch (error: any) {
          // If subcollection query fails (missing index), try without orderBy
          if (error.code === 'failed-precondition') {
            try {
              const messagesQuery = query(
                collection(db, 'grievances', grievanceId, 'messages')
              );
              const messagesSnapshot = await getDocs(messagesQuery);
              subcollectionMessages = messagesSnapshot.docs.map((msgDoc) => {
                const msgData = msgDoc.data();
                return {
                  text: msgData.text || '',
                  sender: msgData.senderRole || msgData.sender || 'student',
                  timestamp: msgData.timestamp,
                };
              });
            } catch (retryError) {
              console.log('Could not load messages from subcollection:', retryError);
            }
          } else {
            console.log('Error loading messages from subcollection:', error?.message || error);
          }
        }

        // Merge messages from main document and subcollection
        grievanceData.messages = mergeAndSortMessages(data.messages, subcollectionMessages);
        
        // If no messages found, ensure we have an empty array
        if (!grievanceData.messages || grievanceData.messages.length === 0) {
          grievanceData.messages = [];
        }
        
        setGrievance(grievanceData);
      } else {
        setGrievance(null);
      }
    } catch (error) {
      console.error('Error loading grievance:', error);
      setGrievance(null);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !grievanceId || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'grievances', grievanceId, 'messages'), {
        text: newMessage,
        sender: user?.uid,
        senderRole: userRole?.role || 'student',
        timestamp: serverTimestamp(),
      });

      // Reload the entire grievance to get all messages (main doc + subcollection)
      await loadGrievance();
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {grievanceId ? 'Grievance not found' : 'No Grievance ID provided'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {grievanceId 
                ? 'The grievance you are looking for does not exist or you do not have permission to view it.'
                : 'Please provide a grievance ID in the URL (e.g., /grievance/track?id=...)'}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safely handle timestamp conversions
  const getCreatedAtDate = () => {
    if (!grievance.createdAt) return new Date();
    if (grievance.createdAt.toDate) return grievance.createdAt.toDate();
    if (grievance.createdAt instanceof Date) return grievance.createdAt;
    if (typeof grievance.createdAt === 'number') return new Date(grievance.createdAt);
    return new Date();
  };

  const getSLADeadlineDate = () => {
    if (!grievance.slaDeadline) return null;
    if (grievance.slaDeadline.toDate) return grievance.slaDeadline.toDate();
    if (grievance.slaDeadline instanceof Date) return grievance.slaDeadline;
    if (typeof grievance.slaDeadline === 'number') return new Date(grievance.slaDeadline);
    return null;
  };

  const slaDeadlineDate = getSLADeadlineDate();
  const isOverdue = slaDeadlineDate && slaDeadlineDate < new Date();
  const timeRemaining = slaDeadlineDate 
    ? Math.max(0, Math.floor((slaDeadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)))
    : null;

  const getStatusIcon = () => {
    switch (grievance.status) {
      case 'resolved':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'in_review':
      case 'action_taken':
        return <Clock className="w-6 h-6 text-blue-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    }
  };

  // Keep messages in chronological order as they were inserted
  const getDisplayMessages = () => {
    if (!grievance.messages || grievance.messages.length === 0) return [];
    
    // Sort all messages chronologically by timestamp (as inserted)
    const sortedMessages = [...grievance.messages].sort((a, b) => {
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 
                   a.timestamp instanceof Date ? a.timestamp.getTime() : 
                   typeof a.timestamp === 'number' ? a.timestamp : 0;
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 
                   b.timestamp instanceof Date ? b.timestamp.getTime() : 
                   typeof b.timestamp === 'number' ? b.timestamp : 0;
      return aTime - bTime; // Ascending order (oldest first)
    });
    
    return sortedMessages;
  };

  const displayMessages = getDisplayMessages();
  const firstUserMessage = displayMessages.find(m => 
    m.sender === 'student' || m.sender === 'user' || m.sender === user?.uid
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {grievance.title || `${grievance.category} Grievance`}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ID: {grievance.id.substring(0, 8)} • Created: {format(getCreatedAtDate(), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {getStatusIcon()}
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {grievance.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">{grievance.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">{grievance.priority}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">SLA Status</p>
              {timeRemaining !== null ? (
                <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                  {isOverdue ? 'Overdue' : `${timeRemaining}h remaining`}
                </p>
              ) : (
                <p className="font-semibold text-gray-600">No SLA set</p>
              )}
            </div>
          </div>

          {/* User Details Section - Show only if not anonymous */}
          {!grievance.anonymous && (grievance.studentName || grievance.studentEmail) && (
            <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Submitted By
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grievance.studentName && (
                  <div className="flex items-start space-x-2">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{grievance.studentName}</p>
                    </div>
                  </div>
                )}
                {grievance.studentEmail && (
                  <div className="flex items-start space-x-2">
                    <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{grievance.studentEmail}</p>
                    </div>
                  </div>
                )}
                {grievance.studentPhone && (
                  <div className="flex items-start space-x-2">
                    <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Mobile Number</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{grievance.studentPhone}</p>
                    </div>
                  </div>
                )}
                {grievance.studentYear && (
                  <div className="flex items-start space-x-2">
                    <GraduationCap className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Student Year</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{grievance.studentYear}</p>
                    </div>
                  </div>
                )}
                {grievance.studentClass && (
                  <div className="flex items-start space-x-2">
                    <Users className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Class/Section</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{grievance.studentClass}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Anonymous Notice */}
          {grievance.anonymous && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                This grievance was submitted anonymously. User details are not available.
              </p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Summary</h2>
            {firstUserMessage ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Initial Message:</p>
                <p className="text-gray-800 dark:text-gray-200">{firstUserMessage.text}</p>
              </div>
            ) : null}
            <p className="text-gray-700 dark:text-gray-300">{grievance.summary || grievance.description}</p>
          </div>

          {grievance.attachments && grievance.attachments.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Paperclip className="w-5 h-5 mr-2" />
                Attachments ({grievance.attachments.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grievance.attachments.map((url, index) => {
                  const fileName = url.split('/').pop() || `Attachment ${index + 1}`;
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                  const isPdf = /\.pdf$/i.test(fileName);
                  
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {isImage ? (
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                                <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            ) : isPdf ? (
                              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                                <File className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                                <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {fileName.length > 30 ? `${fileName.substring(0, 30)}...` : fileName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Attachment {index + 1}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="View"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <a
                            href={url}
                            download
                            className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      {isImage && (
                        <div className="mt-3 rounded overflow-hidden">
                          <img
                            src={url}
                            alt={fileName}
                            className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(url, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Conversation History
          </h2>
          
          <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-2">
            {displayMessages && displayMessages.length > 0 ? (
              displayMessages.map((message, index) => {
                // Determine message sender type - handle various formats from chat and manual messages
                const senderStr = String(message.sender || '').toLowerCase();
                const isUser = senderStr === 'student' || 
                              senderStr === 'user' || 
                              (message.sender === user?.uid && userRole?.role === 'student');
                const isSystem = senderStr === 'system';
                const isAuthority = senderStr === 'authority' || 
                                   senderStr === 'admin' ||
                                   (message.sender === user?.uid && (userRole?.role === 'authority' || userRole?.role === 'admin'));
                
                return (
                  <div
                    key={index}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-lg ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : isAuthority
                          ? 'bg-green-100 dark:bg-green-900/30 text-gray-900 dark:text-gray-100 rounded-bl-none border border-green-300 dark:border-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                      }`}
                    >
                      {!isUser && (
                        <p className="text-xs font-semibold mb-1 opacity-80">
                          {isAuthority ? 'Authority' : 'System'}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'opacity-70'}`}>
                        {message.timestamp?.toDate 
                          ? format(message.timestamp.toDate(), 'MMM dd, HH:mm')
                          : message.timestamp instanceof Date
                          ? format(message.timestamp, 'MMM dd, HH:mm')
                          : 'Just now'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation below.</p>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

