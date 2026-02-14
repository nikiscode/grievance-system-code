'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import ChatInterface from '@/components/ChatInterface';
import { analyzeGrievanceFromChat, GrievanceAnalysis } from '@/lib/gemini';
import { predictUrgencyScore } from '@/lib/vertex';
import { MessageSquare, FileText, Upload } from 'lucide-react';

export default function CreateGrievancePage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'chat' | 'form'>('chat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'academic' | 'infrastructure' | 'safety' | 'administration'>('administration');
  const [anonymous, setAnonymous] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

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

  // Load user profile data
  const loadUserProfile = async (): Promise<{
    name: string;
    email: string;
    phone: string;
    studentYear: string;
    studentClass: string;
  } | null> => {
    if (!user) return null;

    try {
      const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        return {
          name: data.name || user.displayName || userRole?.name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          studentYear: data.studentYear || '',
          studentClass: data.studentClass || '',
        };
      }
      // Fallback to auth data if profile doesn't exist
      return {
        name: user.displayName || userRole?.name || '',
        email: user.email || '',
        phone: '',
        studentYear: '',
        studentClass: '',
      };
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async (grievanceId: string): Promise<string[]> => {
    if (!grievanceId) {
      console.error('Grievance ID is missing');
      return [];
    }

    if (files.length === 0) {
      return [];
    }

    // Check if storage is available
    if (!storage) {
      console.error('Storage is not initialized. Please check Firebase Storage configuration.');
      throw new Error('Storage is not initialized. Please check your Firebase configuration.');
    }

    const urls: string[] = [];
    const uploadPromises = files.map(async (file, index) => {
      try {
        // Validate file size (max 10MB per file)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          console.warn(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Max size is 10MB. Skipping...`);
          return null;
        }

        // Create a unique filename to avoid conflicts
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 9);
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${randomId}_${sanitizedFileName}`;
        const fileRef = ref(storage, `grievances/${grievanceId}/${fileName}`);
        
        console.log(`[${index + 1}/${files.length}] Uploading file:`, fileName, `(${(file.size / 1024).toFixed(2)}KB)`);
        
        // Upload the file
        await uploadBytes(fileRef, file);
        console.log(`[${index + 1}/${files.length}] File bytes uploaded:`, fileName);
        
        // Get download URL
        const url = await getDownloadURL(fileRef);
        console.log(`[${index + 1}/${files.length}] File uploaded successfully:`, fileName);
        
        return { url, fileName: file.name, size: file.size };
      } catch (fileError: any) {
        console.error(`Error uploading file ${file.name}:`, fileError);
        // Log specific error details
        if (fileError.code) {
          console.error(`Error code: ${fileError.code}`);
        }
        if (fileError.message) {
          console.error(`Error message: ${fileError.message}`);
        }
        // Continue with other files even if one fails
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const validResults = results.filter((result): result is { url: string; fileName: string; size: number } => result !== null);
    
    console.log(`Upload complete: ${validResults.length}/${files.length} files uploaded successfully`);
    
    // Return just the URLs for backward compatibility
    return validResults.map(r => r.url);
  };

  const calculateSLADeadline = (category: string, priority: string): Date => {
    const now = new Date();
    let hours = 72; // Default 3 days

    if (priority === 'critical') hours = 24;
    else if (priority === 'high') hours = 48;
    else if (priority === 'medium') hours = 72;
    else hours = 120;

    if (category === 'safety') hours = Math.min(hours, 24);
    
    now.setHours(now.getHours() + hours);
    return now;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!title.trim() || !description.trim()) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Load user profile if not anonymous
      let userProfile = null;
      if (!anonymous) {
        userProfile = await loadUserProfile();
        if (!userProfile) {
          setError('Failed to load your profile. Please update your profile first.');
          setLoading(false);
          return;
        }
        // Validate profile data
        if (!userProfile.name.trim()) {
          setError('Please update your profile with your full name. Go to Profile page to update.');
          setLoading(false);
          return;
        }
        if (!userProfile.email.trim() || !userProfile.email.includes('@')) {
          setError('Please update your profile with a valid email address. Go to Profile page to update.');
          setLoading(false);
          return;
        }
        if (!userProfile.phone.trim()) {
          setError('Please update your profile with your mobile number. Go to Profile page to update.');
          setLoading(false);
          return;
        }
        if (!userProfile.studentYear.trim()) {
          setError('Please update your profile with your student year. Go to Profile page to update.');
          setLoading(false);
          return;
        }
        if (!userProfile.studentClass.trim()) {
          setError('Please update your profile with your class/section. Go to Profile page to update.');
          setLoading(false);
          return;
        }
      }

      // Analyze with Gemini (with fallback)
      let analysis;
      try {
        analysis = await analyzeGrievanceFromChat(description);
        // Validate analysis result
        if (!analysis || !analysis.category) {
          throw new Error('Invalid analysis result');
        }
      } catch (analysisError: any) {
        console.error('Analysis error, using fallback:', analysisError);
        // Use fallback analysis if Gemini fails - this ensures form submission never fails due to AI
        analysis = {
          category: category || 'administration',
          priority: 'medium' as const,
          sentimentScore: 0.5,
          summary: description.substring(0, 200) || 'Grievance submitted',
          urgencyScore: 50,
        };
      }
      
      // Get urgency score from Vertex AI (with fallback)
      let urgencyScore = 50;
      try {
        urgencyScore = await predictUrgencyScore(description);
      } catch (urgencyError: any) {
        console.error('Urgency prediction error, using default:', urgencyError);
        // Use default urgency score if Vertex AI fails
      }

      const priority = urgencyScore >= 80 ? 'critical' : 
                      urgencyScore >= 60 ? 'high' : 
                      urgencyScore >= 40 ? 'medium' : 'low';

      const grievanceData = {
        studentId: anonymous ? null : user.uid,
        anonymous,
        category: analysis.category || category,
        priority,
        sentimentScore: analysis.sentimentScore || 0.5,
        urgencyScore,
        status: 'submitted',
        title: title.trim(),
        description: description.trim(),
        summary: analysis.summary || description.substring(0, 200),
        messages: [{
          text: description.trim(),
          sender: 'student',
          timestamp: new Date(),
        }],
        attachments: [],
        createdAt: serverTimestamp(),
        slaDeadline: calculateSLADeadline(analysis.category || category, priority),
        // User details (from profile if not anonymous)
        studentName: anonymous ? null : (userProfile?.name.trim() || null),
        studentEmail: anonymous ? null : (userProfile?.email.trim() || null),
        studentPhone: anonymous ? null : (userProfile?.phone.trim() || null),
        studentYear: anonymous ? null : (userProfile?.studentYear.trim() || null),
        studentClass: anonymous ? null : (userProfile?.studentClass.trim() || null),
      };

      // Create grievance first (this is the critical part - must succeed)
      const docRef = await addDoc(collection(db, 'grievances'), grievanceData);
      console.log('Grievance created successfully:', docRef.id);
      
      // Upload files if any (non-blocking - don't fail form submission if upload fails)
      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        try {
          console.log(`Starting upload of ${files.length} file(s)...`);
          uploadedUrls = await uploadFiles(docRef.id);
          console.log(`Successfully uploaded ${uploadedUrls.length} out of ${files.length} file(s)`);
          
          if (uploadedUrls.length > 0) {
            // Update the grievance document with attachment URLs
            await updateDoc(doc(db, 'grievances', docRef.id), {
              attachments: uploadedUrls,
            });
            // Also save to attachments subcollection for reference
            try {
              await addDoc(collection(db, 'grievances', docRef.id, 'attachments'), {
                urls: uploadedUrls,
                uploadedAt: serverTimestamp(),
              });
            } catch (subcollectionError) {
              console.warn('Failed to save to attachments subcollection:', subcollectionError);
              // This is not critical, continue anyway
            }
            console.log('Files uploaded and saved to grievance:', uploadedUrls.length);
          }
          
          if (uploadedUrls.length < files.length) {
            // Some files failed to upload - but grievance is already created
            console.warn(`${files.length - uploadedUrls.length} file(s) failed to upload`);
            // Don't show error to user since grievance was created successfully
            // They can add files later if needed
          }
        } catch (uploadError: any) {
          console.error('File upload error:', uploadError);
          // Don't fail the entire grievance creation if file upload fails
          // The grievance is already created, so we can continue
          // User can add files later if needed
        }
      }

      // Clear form state before redirect
      setTitle('');
      setDescription('');
      setFiles([]);
      setError('');
      setAnonymous(false);
      
      // Always redirect to track page, even if file upload had issues
      router.push(`/grievance/track?id=${docRef.id}`);
    } catch (err: any) {
      console.error('Error creating grievance:', err);
      setError(err.message || 'Failed to create grievance. Please try again.');
      setLoading(false);
      // Don't redirect on error - let user see the error and retry
    }
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
            Create Grievance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose your preferred method to submit a grievance
          </p>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              mode === 'chat'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Chat Interface
          </button>
          <button
            onClick={() => setMode('form')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              mode === 'form'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FileText className="w-5 h-5 mr-2" />
            Manual Form
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {mode === 'chat' ? (
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
            />
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="space-y-6">
              {/* Anonymous Checkbox at Top */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Submit anonymously
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {anonymous 
                        ? 'Your personal details will not be saved with this grievance.'
                        : 'Your profile information will be used. Update your profile if needed.'}
                    </p>
                    {!anonymous && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        <a href="/profile" className="underline">Go to Profile</a> to manage your details.
                      </p>
                    )}
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief title of your grievance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="academic">Academic</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="safety">Safety</option>
                  <option value="administration">Administration</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe your grievance in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attachments (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {files.length} file(s) selected:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {files.map((file, index) => (
                        <li key={index}>
                          {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => {
                      setAnonymous(e.target.checked);
                      if (e.target.checked) {
                        // Clear user details when anonymous
                        setUserName('');
                        setUserEmail('');
                        setUserPhone('');
                        setStudentYear('');
                        setStudentClass('');
                      } else {
                        // Restore user details when not anonymous
                        setUserName(user?.displayName || userRole?.name || '');
                        setUserEmail(user?.email || '');
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Submit anonymously (your details will not be saved)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Submitting...' : 'Submit Grievance'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

