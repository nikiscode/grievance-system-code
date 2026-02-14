'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { BarChart3, Users, FileText, AlertTriangle, TrendingUp, Search, Eye } from 'lucide-react';
import GrievanceCard from '@/components/GrievanceCard';

interface Grievance {
  id: string;
  category: string;
  priority: string;
  status: string;
  createdAt: any;
  resolvedAt?: any;
  summary?: string;
  title?: string;
  slaDeadline?: any;
  messages?: Array<{ text: string; sender: string; timestamp: any }>;
}

interface User {
  id: string;
  role: string;
  department?: string;
}

export default function AdminPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [filteredGrievances, setFilteredGrievances] = useState<Grievance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrievancesList, setShowGrievancesList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading) {
      if (!user || userRole?.role !== 'admin') {
        router.push('/login');
        return;
      }
      
      // Only load data if user is admin
      if (user && userRole?.role === 'admin') {
        loadData();
      }
    }
  }, [user, userRole, authLoading, router]);

  // Filter grievances for list view - MUST be before early returns
  useEffect(() => {
    let filtered = [...grievances];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.summary?.toLowerCase().includes(query) ||
        g.category.toLowerCase().includes(query) ||
        g.id.toLowerCase().includes(query) ||
        g.title?.toLowerCase().includes(query)
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

    // Sort by newest first
    filtered.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                   a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                   b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });

    setFilteredGrievances(filtered);
  }, [grievances, searchQuery, statusFilter, categoryFilter]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load grievances - try with orderBy first, fallback without it
      let grievancesData: Grievance[] = [];
      try {
        const grievancesQuery = query(collection(db, 'grievances'), orderBy('createdAt', 'desc'));
        const grievancesSnapshot = await getDocs(grievancesQuery);
        grievancesData = grievancesSnapshot.docs.map((doc) => {
          const data = doc.data();
          // Extract first user message from messages array for chat-created grievances
          let firstUserMessage: string | undefined;
          if (data.messages && Array.isArray(data.messages)) {
            const userMessage = data.messages.find((msg: any) => 
              msg.sender === 'user' || 
              msg.sender === 'student' || 
              (msg.sender && typeof msg.sender === 'string' && !['system', 'authority', 'admin'].includes(msg.sender.toLowerCase()))
            );
            if (userMessage && userMessage.text) {
              firstUserMessage = userMessage.text;
            }
          }
          
          return {
            id: doc.id,
            category: data.category || 'administration',
            priority: data.priority || 'medium',
            status: data.status || 'submitted',
            createdAt: data.createdAt,
            resolvedAt: data.resolvedAt,
            summary: data.summary || data.description || 'No summary',
            title: firstUserMessage || data.title || data.summary?.substring(0, 50) || `${data.category || 'administration'} Grievance`,
            slaDeadline: data.slaDeadline,
            messages: data.messages,
          };
        }) as Grievance[];
      } catch (orderByError: any) {
        // If orderBy fails (missing index), try without it
        if (orderByError.code === 'failed-precondition') {
          console.log('OrderBy index missing, loading without orderBy');
          const grievancesQuery = query(collection(db, 'grievances'));
          const grievancesSnapshot = await getDocs(grievancesQuery);
          grievancesData = grievancesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              category: data.category || 'administration',
              priority: data.priority || 'medium',
              status: data.status || 'submitted',
              createdAt: data.createdAt,
              resolvedAt: data.resolvedAt,
            };
          }) as Grievance[];
          
          // Sort client-side
          grievancesData.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                         a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                         b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
            return bTime - aTime;
          });
        } else {
          throw orderByError;
        }
      }
      setGrievances(grievancesData);
      setFilteredGrievances(grievancesData);

      // Load users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role || 'student',
          department: data.department,
        };
      }) as User[];
      setUsers(usersData);
      
      console.log('Admin data loaded:', { grievances: grievancesData.length, users: usersData.length });
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      // Set empty arrays on error so page still renders
      setGrievances([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error if user is not admin (should have been redirected)
  if (!user || userRole?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate analytics
  const analytics = {
    totalGrievances: grievances.length,
    resolved: grievances.filter((g) => g.status === 'resolved').length,
    pending: grievances.filter((g) => g.status === 'submitted' || g.status === 'in_review').length,
    critical: grievances.filter((g) => g.priority === 'critical').length,
    byCategory: {
      academic: grievances.filter((g) => g.category === 'academic').length,
      infrastructure: grievances.filter((g) => g.category === 'infrastructure').length,
      safety: grievances.filter((g) => g.category === 'safety').length,
      administration: grievances.filter((g) => g.category === 'administration').length,
    },
    byPriority: {
      low: grievances.filter((g) => g.priority === 'low').length,
      medium: grievances.filter((g) => g.priority === 'medium').length,
      high: grievances.filter((g) => g.priority === 'high').length,
      critical: grievances.filter((g) => g.priority === 'critical').length,
    },
    totalUsers: users.length,
    students: users.filter((u) => u.role === 'student').length,
    authorities: users.filter((u) => u.role === 'authority').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  // Calculate resolution rate - resolved grievances / total grievances * 100
  const resolutionRate = analytics.totalGrievances > 0 
    ? (analytics.resolved / analytics.totalGrievances) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            System analytics and management
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Grievances</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalGrievances}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{analytics.resolved}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.pending}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</p>
                <p className="text-2xl font-bold text-purple-600">{resolutionRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Grievances by Category
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Academic</span>
                  <span className="text-sm font-semibold">{analytics.byCategory.academic}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${analytics.totalGrievances > 0 ? (analytics.byCategory.academic / analytics.totalGrievances) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Infrastructure</span>
                  <span className="text-sm font-semibold">{analytics.byCategory.infrastructure}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${analytics.totalGrievances > 0 ? (analytics.byCategory.infrastructure / analytics.totalGrievances) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Safety</span>
                  <span className="text-sm font-semibold">{analytics.byCategory.safety}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${analytics.totalGrievances > 0 ? (analytics.byCategory.safety / analytics.totalGrievances) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Administration</span>
                  <span className="text-sm font-semibold">{analytics.byCategory.administration}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${analytics.totalGrievances > 0 ? (analytics.byCategory.administration / analytics.totalGrievances) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Grievances by Priority
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Critical</span>
                  <span className="text-sm font-semibold text-red-600">{analytics.byPriority.critical}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${analytics.totalGrievances > 0 ? (analytics.byPriority.critical / analytics.totalGrievances) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">High</span>
                  <span className="text-sm font-semibold text-orange-600">{analytics.byPriority.high}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${analytics.totalGrievances > 0 ? (analytics.byPriority.high / analytics.totalGrievances) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Medium</span>
                  <span className="text-sm font-semibold text-blue-600">{analytics.byPriority.medium}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${analytics.totalGrievances > 0 ? (analytics.byPriority.medium / analytics.totalGrievances) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Low</span>
                  <span className="text-sm font-semibold text-gray-600">{analytics.byPriority.low}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-600 h-2 rounded-full"
                    style={{ width: `${analytics.totalGrievances > 0 ? (analytics.byPriority.low / analytics.totalGrievances) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            User Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalUsers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.students}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Authorities</p>
              <p className="text-2xl font-bold text-green-600">{analytics.authorities}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.admins}</p>
            </div>
          </div>
        </div>

        {/* All Grievances View */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              All Grievances ({filteredGrievances.length} of {grievances.length})
            </h2>
            <button
              onClick={() => setShowGrievancesList(!showGrievancesList)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showGrievancesList ? 'Hide' : 'View'} All Grievances
            </button>
          </div>

          {showGrievancesList && (
            <>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>

              {/* Grievances List */}
              {filteredGrievances.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No grievances found</p>
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setCategoryFilter('all');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Clear Filters
                    </button>
                  ) : null}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

