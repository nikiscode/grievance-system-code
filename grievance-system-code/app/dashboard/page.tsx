'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import GrievanceCard from '@/components/GrievanceCard';
import { Plus, FileText, Search, SortAsc, SortDesc } from 'lucide-react';
import Link from 'next/link';

interface Grievance {
  id: string;
  category: string;
  priority: string;
  status: string;
  summary: string;
  createdAt: any;
  slaDeadline?: any;
  title?: string;
  messages?: Array<{ text: string; sender: string; timestamp: any }>;
}

export default function DashboardPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [filteredGrievances, setFilteredGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'priority'>('newest');

  useEffect(() => {
    if (!authLoading && (!user || !userRole)) {
      router.push('/login');
      return;
    }

    // Allow admins and authorities to view dashboard, but show appropriate message
    // Only load student grievances if user is a student
    if (userRole?.role === 'student') {
      loadGrievances();
    } else {
      // If not a student, stop loading immediately
      setLoading(false);
    }
  }, [user, userRole, authLoading, router]);

  const loadGrievances = async () => {
    if (!user) return;

    try {
      // Query for grievances where studentId matches user.uid
      // Note: Anonymous grievances have studentId as null, so they won't show here
      const q = query(
        collection(db, 'grievances'),
        where('studentId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        
        // Extract first user message from messages array for chat-created grievances
        let firstUserMessage: string | undefined;
        if (docData.messages && Array.isArray(docData.messages)) {
          // Find first message from user/student (skip system messages)
          const userMessage = docData.messages.find((msg: any) => 
            msg.sender === 'user' || 
            msg.sender === 'student' || 
            (msg.sender && typeof msg.sender === 'string' && !['system', 'authority', 'admin'].includes(msg.sender))
          );
          if (userMessage && userMessage.text) {
            firstUserMessage = userMessage.text;
          }
        }
        
        return {
          id: doc.id,
          category: docData.category || 'administration',
          priority: docData.priority || 'medium',
          status: docData.status || 'submitted',
          summary: docData.summary || docData.description || 'No summary',
          createdAt: docData.createdAt,
          slaDeadline: docData.slaDeadline,
          messages: docData.messages,
          // Use first user message as title if available, otherwise use summary
          title: firstUserMessage || docData.title || docData.summary?.substring(0, 50) || `${docData.category || 'administration'} Grievance`,
        };
      }) as Grievance[];
      
      // Sort by createdAt descending (client-side if orderBy fails)
      data.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                     a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                     b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
      
      setGrievances(data);
      setFilteredGrievances(data);
      console.log('Loaded grievances:', data.length);
    } catch (error: any) {
      console.error('Error loading grievances:', error);
      // Set empty arrays on error so page still renders
      setGrievances([]);
      setFilteredGrievances([]);
      
      // If orderBy fails, try without it (though we're not using orderBy in the query)
      if (error.code === 'failed-precondition') {
        console.log('Index missing, but query should work without orderBy');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort grievances
  useEffect(() => {
    let filtered = [...grievances];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.summary.toLowerCase().includes(query) ||
        g.category.toLowerCase().includes(query) ||
        g.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(g => g.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortOrder === 'priority') {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        return bPriority - aPriority;
      }
      
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                   a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                   b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      
      return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });

    setFilteredGrievances(filtered);
  }, [grievances, searchQuery, statusFilter, categoryFilter, sortOrder]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = {
    total: grievances.length,
    pending: grievances.filter((g) => g.status === 'submitted' || g.status === 'in_review').length,
    resolved: grievances.filter((g) => g.status === 'resolved').length,
  };

  // Show different content for non-students
  if (userRole?.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {userRole?.role === 'admin' 
                ? 'This is the student dashboard. Use Admin Panel for admin features.'
                : 'This is the student dashboard. Use Authority Dashboard for authority features.'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {userRole?.role === 'admin' ? 'Admin Access' : 'Authority Access'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {userRole?.role === 'admin'
                ? 'As an admin, please use the Admin Panel to view system analytics and manage grievances.'
                : 'As an authority, please use the Authority Dashboard to view and manage assigned grievances.'}
            </p>
            <Link
              href={userRole?.role === 'admin' ? '/admin' : '/authority'}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to {userRole?.role === 'admin' ? 'Admin Panel' : 'Authority Dashboard'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Student Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your grievances and track their status
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Grievances</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">My Grievances</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredGrievances.length} of {grievances.length} grievances
            </p>
          </div>
          <Link
            href="/grievance/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Grievance
          </Link>
        </div>

        {/* Filters and Search */}
        {grievances.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search grievances..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_review">In Review</option>
                  <option value="action_taken">Action Taken</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="academic">Academic</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="safety">Safety</option>
                  <option value="administration">Administration</option>
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="mt-4 flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSortOrder('newest')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    sortOrder === 'newest'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <SortDesc className="w-4 h-4 inline mr-1" />
                  Newest
                </button>
                <button
                  onClick={() => setSortOrder('oldest')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    sortOrder === 'oldest'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <SortAsc className="w-4 h-4 inline mr-1" />
                  Oldest
                </button>
                <button
                  onClick={() => setSortOrder('priority')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    sortOrder === 'priority'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Priority
                </button>
              </div>
            </div>
          </div>
        )}

        {grievances.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No grievances yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start by creating your first grievance
            </p>
            <Link
              href="/grievance/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Grievance
            </Link>
          </div>
        ) : filteredGrievances.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No grievances found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGrievances.map((grievance) => (
              <GrievanceCard
                key={grievance.id}
                {...grievance}
                title={grievance.title || grievance.summary?.substring(0, 50) || `${grievance.category} Grievance`}
                onClick={() => router.push(`/grievance/track?id=${grievance.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

