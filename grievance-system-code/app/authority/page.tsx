'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import GrievanceCard from '@/components/GrievanceCard';
import { CheckCircle, Clock, AlertCircle, Search } from 'lucide-react';

interface Grievance {
  id: string;
  category: string;
  priority: string;
  status: string;
  summary: string;
  createdAt: any;
  slaDeadline?: any;
  assignedTo?: string;
}

export default function AuthorityPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [filteredGrievances, setFilteredGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'pending'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || userRole?.role !== 'authority')) {
      router.push('/login');
      return;
    }

    loadGrievances();
  }, [user, userRole, authLoading, router, filter]);

  // Filter grievances by search query and status (client-side filtering)
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

    // Status filter - apply regardless of Firestore filter
    // This allows further refinement of the results
    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    setFilteredGrievances(filtered);
  }, [grievances, searchQuery, statusFilter]);

  const loadGrievances = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let q;
      if (filter === 'assigned') {
        // Query for assigned grievances
        q = query(
          collection(db, 'grievances'),
          where('assignedTo', '==', user.uid)
        );
      } else if (filter === 'pending') {
        // Query for pending grievances
        q = query(
          collection(db, 'grievances'),
          where('status', 'in', ['submitted', 'in_review'])
        );
      } else {
        // Query all grievances
        q = query(collection(db, 'grievances'));
      }

      // Try to add orderBy if possible
      let snapshot;
      try {
        const orderedQuery = query(q, orderBy('createdAt', 'desc'));
        snapshot = await getDocs(orderedQuery);
      } catch (orderByError: any) {
        // If orderBy fails (missing index), use query without orderBy
        if (orderByError.code === 'failed-precondition') {
          console.log('OrderBy index missing, loading without orderBy');
          snapshot = await getDocs(q);
        } else {
          throw orderByError;
        }
      }

      let data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          category: docData.category || 'administration',
          priority: docData.priority || 'medium',
          status: docData.status || 'submitted',
          summary: docData.summary || docData.description || 'No summary',
          createdAt: docData.createdAt,
          slaDeadline: docData.slaDeadline,
          assignedTo: docData.assignedTo,
          title: docData.title,
        };
      }) as Grievance[];

      // Sort client-side if orderBy wasn't used
      data.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                     a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                     b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });

      setGrievances(data);
      // The useEffect will handle filtering based on searchQuery and statusFilter
    } catch (error: any) {
      console.error('Error loading grievances:', error);
      // Set empty arrays on error so page still renders
      setGrievances([]);
      setFilteredGrievances([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (grievanceId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'grievances', grievanceId), {
        status: newStatus,
        assignedTo: user?.uid,
      });
      loadGrievances();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = {
    total: grievances.length,
    assigned: grievances.filter((g) => g.assignedTo === user?.uid).length,
    pending: grievances.filter((g) => g.status === 'submitted' || g.status === 'in_review').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Authority Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and respond to assigned grievances
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assigned to Me</p>
                <p className="text-2xl font-bold text-orange-600">{stats.assigned}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
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
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              Showing {filteredGrievances.length} of {grievances.length} grievances
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All Grievances
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'assigned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Assigned to Me ({stats.assigned})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Pending ({stats.pending})
            </button>
          </div>
        </div>

        {grievances.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No grievances found
            </h3>
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
                setFilter('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGrievances.map((grievance) => (
              <div key={grievance.id} className="relative group">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden">
                  <div onClick={() => router.push(`/grievance/track?id=${grievance.id}`)} className="cursor-pointer">
                    <GrievanceCard
                      {...grievance}
                      title={grievance.summary?.substring(0, 50) || `${grievance.category} Grievance`}
                      onClick={() => {}}
                    />
                  </div>
                  {(grievance.status === 'submitted' || grievance.status === 'in_review') && (
                    <div className="px-6 pb-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2 bg-gray-50 dark:bg-gray-900/50">
                      {grievance.status === 'submitted' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(grievance.id, 'in_review');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-md transition-colors"
                        >
                          Accept
                        </button>
                      )}
                      {grievance.status === 'in_review' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(grievance.id, 'action_taken');
                            }}
                            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 shadow-md transition-colors"
                          >
                            Action Taken
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(grievance.id, 'resolved');
                            }}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 shadow-md transition-colors"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

