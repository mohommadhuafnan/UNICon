import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  ShieldAlert,
  Radio,
  Compass,
  BookOpen,
  Trophy,
  MessageSquareQuote,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  Bookmark,
  Calendar,
  Sparkles,
  ExternalLink,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/student-summary');
        if (res.data.success) {
          setSummaryData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = summaryData?.stats || {
    myReportedIssues: 0,
    myResolvedIssues: 0,
    savedOpportunities: 0,
    savedEvents: 0,
  };

  const quickActions = [
    {
      title: 'Report a Campus Issue',
      desc: 'Submit classroom, water, electricity, or Wi-Fi problem',
      icon: ShieldAlert,
      link: '/campuscare/report',
      color: 'bg-red-50 text-red-600 border-red-200',
    },
    {
      title: 'Browse Announcements',
      desc: 'View verified faculty schedules & notices',
      icon: Radio,
      link: '/unipulse',
      color: 'bg-orange-50 text-brand-600 border-orange-200',
    },
    {
      title: 'Explore Opportunities',
      desc: 'Find hackathons, internships & research grants',
      icon: Compass,
      link: '/opportunityhub',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Study Resources',
      desc: 'Download past papers, lecture notes & tutorials',
      icon: BookOpen,
      link: '/resourceshare',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      title: 'Campus Events',
      desc: 'View sports championships & society workshops',
      icon: Trophy,
      link: '/campusarena',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      title: 'Submit Suggestion',
      desc: 'Voice your ideas for campus improvements',
      icon: MessageSquareQuote,
      link: '/studentvoice',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-gray-200 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-brand-500 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
            {user?.faculty || 'Faculty of Computing'} · {user?.university || 'University of Colombo'}
          </p>
        </div>
        {/* Subtle geometric circle decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              My Issues Reported
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {stats.myReportedIssues}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Active campus reports</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-brand-200 text-brand-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Issues Resolved
            </div>
            <div className="text-2xl font-black text-status-success mt-1">
              {stats.myResolvedIssues}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Completed by staff</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-200 text-status-success flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Saved Opportunities
            </div>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {stats.savedOpportunities}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Hackathons & jobs</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Saved Events
            </div>
            <div className="text-2xl font-black text-purple-600 mt-1">
              {stats.savedEvents}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Sports & workshops</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <span>Quick Campus Actions</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.link}
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-card-hover hover:border-brand-300 transition-all text-left flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-3 ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                    {action.title}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-snug">
                    {action.desc}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-brand-600">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Recent CampusCare Issues & Latest UniPulse Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent CampusCare Issues */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-500" />
              <h3 className="text-sm font-bold text-gray-900">Recent CampusCare Issues</h3>
            </div>
            <Link
              to="/campuscare"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {summaryData?.recentIssues?.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No active campus reports right now.
              </div>
            ) : (
              summaryData?.recentIssues?.map((issue) => (
                <Link
                  key={issue._id}
                  to={`/campuscare/${issue._id}`}
                  className="block p-3.5 rounded-xl border border-gray-100 bg-campus-bg/60 hover:bg-orange-50/40 hover:border-brand-200 transition-all text-left"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      {issue.category}
                    </span>
                    <StatusBadge status={issue.status} />
                  </div>
                  <div className="text-xs font-bold text-gray-900 line-clamp-1">
                    {issue.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {issue.location}
                    </span>
                    <span className="font-semibold text-brand-600">
                      {issue.supportCount || 0} Affected
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-brand-500" />
              <h3 className="text-sm font-bold text-gray-900">Official Notices (UniPulse)</h3>
            </div>
            <Link
              to="/unipulse"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {summaryData?.latestAnnouncements?.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No recent announcements.
              </div>
            ) : (
              summaryData?.latestAnnouncements?.map((ann) => (
                <div
                  key={ann._id}
                  className="p-3.5 rounded-xl border border-gray-100 bg-campus-bg/60 hover:bg-orange-50/40 hover:border-brand-200 transition-all text-left"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {ann.category}
                      </span>
                      {ann.isVerified && (
                        <span className="text-[10px] font-bold text-status-success flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(ann.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-900 line-clamp-1">
                    {ann.title}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {ann.description}
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">
                    Source: <span className="font-semibold text-gray-600">{ann.sourceDepartment || ann.publisherName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recommended Opportunities & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Opportunities */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">Opportunities for You</h3>
            </div>
            <Link
              to="/opportunityhub"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {summaryData?.recommendedOpportunities?.map((opp) => (
              <div
                key={opp._id}
                className="p-3.5 rounded-xl border border-gray-100 bg-campus-bg/60 hover:bg-blue-50/30 hover:border-blue-200 transition-all text-left flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {opp.category}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Deadline: {new Date(opp.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-900 line-clamp-1">
                    {opp.title}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                    Organizer: {opp.organizer}
                  </div>
                </div>
                <a
                  href={opp.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center gap-1 flex-shrink-0"
                >
                  <span>Apply</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-900">Upcoming Campus Events</h3>
            </div>
            <Link
              to="/campusarena"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {summaryData?.upcomingEvents?.map((ev) => (
              <div
                key={ev._id}
                className="p-3.5 rounded-xl border border-gray-100 bg-campus-bg/60 hover:bg-purple-50/30 hover:border-purple-200 transition-all text-left flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {ev.category}
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold">
                      {new Date(ev.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-900 line-clamp-1">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                    Venue: {ev.venue}
                  </div>
                </div>
                <Link
                  to="/campusarena"
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs flex items-center gap-1 flex-shrink-0"
                >
                  <span>RSVP</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
