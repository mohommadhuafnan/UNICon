import React from 'react';
import { CheckCircle2, Clock, PlayCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'Reported':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          Reported
        </span>
      );
    case 'Under Review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          Under Review
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
          In Progress
        </span>
      );
    case 'Resolved':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          Resolved
        </span>
      );
    case 'Closed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          Closed
        </span>
      );
    case 'Rejected':
    case 'Declined':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          {status}
        </span>
      );
    case 'Accepted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Accepted
        </span>
      );
    case 'Implemented':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          Implemented
        </span>
      );
    case 'Active':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    case 'Expired':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
          Expired
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          {status || 'Unknown'}
        </span>
      );
  }
};
