import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-campus-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-gray-900">
              Uni<span className="text-brand-500">Connect</span>
            </span>
            <span className="text-xs text-gray-400">
              — The University Community & Campus Intelligence Platform
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
            <Link to="/campuscare" className="hover:text-brand-600 transition-colors">CampusCare</Link>
            <Link to="/unipulse" className="hover:text-brand-600 transition-colors">UniPulse</Link>
            <Link to="/opportunityhub" className="hover:text-brand-600 transition-colors">OpportunityHub</Link>
            <Link to="/resourceshare" className="hover:text-brand-600 transition-colors">ResourceShare</Link>
            <Link to="/campusarena" className="hover:text-brand-600 transition-colors">CampusArena</Link>
            <Link to="/studentvoice" className="hover:text-brand-600 transition-colors">StudentVoice</Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
          <div>
            &copy; {new Date().getFullYear()} UniConnect Platform. Empowering Sri Lankan & global higher education communities.
          </div>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>for university students & staff</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
