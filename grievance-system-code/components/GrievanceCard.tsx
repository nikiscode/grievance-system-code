'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { MessageSquare, Clock, AlertCircle, CheckCircle, XCircle, Calendar, AlertTriangle, Building2, GraduationCap, Shield, FileText } from 'lucide-react';

interface GrievanceCardProps {
  id: string;
  category: string;
  priority: string;
  status: string;
  summary: string;
  createdAt: any;
  slaDeadline?: any;
  title?: string;
  onClick?: () => void;
}

const statusColors = {
  submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300',
  in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300',
  action_taken: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const categoryIcons = {
  academic: GraduationCap,
  infrastructure: Building2,
  safety: Shield,
  administration: FileText,
};

const categoryColors = {
  academic: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  infrastructure: 'border-green-500 bg-green-50 dark:bg-green-900/20',
  safety: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  administration: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
};

export default function GrievanceCard({
  id,
  category,
  priority,
  status,
  summary,
  createdAt,
  slaDeadline,
  title,
  onClick,
}: GrievanceCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_review':
      case 'action_taken':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getSlaDate = () => {
    if (!slaDeadline) return null;
    if (slaDeadline?.toDate) return slaDeadline.toDate();
    if (slaDeadline instanceof Date) return slaDeadline;
    return null;
  };
  
  const isOverdue = slaDeadline && getSlaDate() && getSlaDate()! < new Date();
  const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || FileText;
  const categoryColor = categoryColors[category as keyof typeof categoryColors] || categoryColors.administration;

  const getCreatedDate = () => {
    if (!createdAt) return new Date();
    if (createdAt?.toDate) return createdAt.toDate();
    if (createdAt instanceof Date) return createdAt;
    return new Date();
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 border-l-4 ${categoryColor} p-6 group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg ${categoryColor.replace('border-', 'bg-').replace('-500', '-100')} dark:bg-gray-700`}>
            <CategoryIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {title || `${category} Grievance`}
            </h3>
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {format(getCreatedDate(), 'MMM dd, yyyy')}
              </span>
              <span>•</span>
              <span>ID: {id.substring(0, 8)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                statusColors[status as keyof typeof statusColors] || statusColors.submitted
              }`}
            >
              {status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2 text-sm leading-relaxed">
        {summary || 'No summary available'}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-md text-xs font-semibold ${
              priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium
            }`}
          >
            {priority.toUpperCase()} PRIORITY
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {category}
          </span>
        </div>
        {slaDeadline && (
          <div className={`flex items-center space-x-1 text-xs font-medium ${
            isOverdue 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {isOverdue && <AlertTriangle className="w-4 h-4" />}
            <span>
              {isOverdue 
                ? 'OVERDUE' 
                : `Due ${format(getSlaDate()!, 'MMM dd')}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

