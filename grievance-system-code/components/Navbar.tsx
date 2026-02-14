'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LogOut, Home, MessageSquare, Settings, BarChart3 } from 'lucide-react';

export default function Navbar() {
  const { user, userRole, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user || !userRole) return null;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Grievance System
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {userRole.role === 'admin' ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Admin Panel
                </Link>
              ) : userRole.role === 'authority' ? (
                <Link
                  href="/authority"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Home className="w-4 h-4 mr-1" />
                  Authority Dashboard
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Home className="w-4 h-4 mr-1" />
                  Dashboard
                </Link>
              )}
              {userRole.role === 'student' && (
                <Link
                  href="/grievance/create"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Create Grievance
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {userRole.role === 'student' && (
              <Link
                href="/profile"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 mr-4"
              >
                <Settings className="w-4 h-4 mr-1" />
                Profile
              </Link>
            )}
            <span className="text-sm text-gray-700 dark:text-gray-300 mr-4">
              {userRole.name || user.email} ({userRole.role})
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

