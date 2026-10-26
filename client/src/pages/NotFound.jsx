import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-orange-100 text-brand-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">
        404 - Page Not Found
      </h1>
      <p className="text-sm text-gray-500 max-w-sm">
        The campus page or resource you requested could not be found. It may have moved or been retired.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
      >
        <Home className="w-4 h-4" />
        <span>Return to UniConnect</span>
      </Link>
    </div>
  );
};
