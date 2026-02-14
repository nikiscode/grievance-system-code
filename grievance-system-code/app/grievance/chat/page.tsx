'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import ChatInterface from '@/components/ChatInterface';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { analyzeGrievanceFromChat, GrievanceAnalysis } from '@/lib/gemini';
import { predictUrgencyScore } from '@/lib/vertex';

export default function ChatPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || userRole?.role !== 'student') {
    router.push('/login');
    return null;
  }

  const calculateSLADeadline = (category: string, priority: string): Date => {
    const now = new Date();
    let hours = 72;

    if (priority === 'critical') hours = 24;
    else if (priority === 'high') hours = 48;
    else if (priority === 'medium') hours = 72;
    else hours = 120;

    if (category === 'safety') hours = Math.min(hours, 24);
    
    now.setHours(now.getHours() + hours);
    return now;
  };

  const handleChatConvert = async (conversation: string, analysis: GrievanceAnalysis) => {
    setError('');
    setLoading(true);

    try {
      const urgencyScore = await predictUrgencyScore(conversation);
      const priority = urgencyScore >= 80 ? 'critical' : 
                      urgencyScore >= 60 ? 'high' : 
                      urgencyScore >= 40 ? 'medium' : 'low';

      const grievanceData = {
        studentId: anonymous ? null : user.uid,
        anonymous,
        category: analysis.category,
        priority,
        sentimentScore: analysis.sentimentScore,
        urgencyScore,
        status: 'submitted',
        title: `Grievance - ${analysis.category}`,
        description: conversation,
        summary: analysis.summary,
        messages: conversation.split('\n').filter(line => line.trim()).map((line, idx) => ({
          text: line.replace(/^(Student|System):\s*/, ''),
          sender: line.startsWith('Student:') ? 'student' : 'system',
          timestamp: new Date(),
        })),
        attachments: [],
        createdAt: serverTimestamp(),
        slaDeadline: calculateSLADeadline(analysis.category, priority),
      };

      const docRef = await addDoc(collection(db, 'grievances'), grievanceData);
      router.push(`/grievance/track?id=${docRef.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create grievance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Chat Interface
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Describe your grievance and our AI will help you create a formal request
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-[600px]">
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Submit anonymously
              </span>
            </label>
          </div>
          <ChatInterface 
            onConvertToGrievance={handleChatConvert}
            autoCreate={true}
            onGrievanceCreated={(grievanceId) => {
              // Grievance is already created in handleChatConvert, this is just for confirmation
              console.log('Grievance created:', grievanceId);
            }}
          />
        </div>
      </div>
    </div>
  );
}

