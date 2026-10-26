import React from 'react';
import { AlertTriangle, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  switch (priority) {
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          <AlertCircle className="w-3 h-3 text-red-600" />
          Critical
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
          <ArrowUp className="w-3 h-3 text-orange-600" />
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Medium
        </span>
      );
    case 'Low':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          <ArrowDown className="w-3 h-3 text-gray-500" />
          Low
        </span>
      );
  }
};
