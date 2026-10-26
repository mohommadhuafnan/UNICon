import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  ShieldAlert,
  Search,
  Filter,
  PlusCircle,
  ThumbsUp,
  MapPin,
  Calendar,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const CampusCareList = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({
    totalIssues: 0,
    reported: 0,
    underReview: 0,
    inProgress: 0,
    resolved: 0,
  });

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters from URL or state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'All');
  const [sort, setSort] = useState('newest');

  const categories = [
    'All',
    'Hostel and Accommodation',
    'Water Supply',
    'Electricity',
    'Internet and Wi-Fi',
    'Classroom Facilities',
    'Library',
    'Sanitation and Cleanliness',
    'Campus Infrastructure',
    'Safety and Accessibility',
    'Other',
  ];

  const statuses = ['All', 'Reported', 'Under Review', 'In Progress', 'Resolved', 'Closed'];
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 8,
        sort,
      };

      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (status !== 'All') params.status = status;
      if (priority !== 'All') params.priority = priority;

      const res = await api.get('/issues', { params });
      if (res.data.success) {
        setIssues(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching campus issues:', err);
      showToast('Failed to load campus issues', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, category, status, priority, showToast]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleSupportToggle = async (e, issueId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please sign in to support this report', 'warning');
      return;
    }

    try {
      const res = await api.post(`/issues/${issueId}/support`);
      if (res.data.success) {
        setIssues((prev) =>
          prev.map((item) =>
            item._id === issueId
              ? {
                  ...item,
                  hasSupported: res.data.hasSupported,
                  supportCount: res.data.supportCount,
                }
              : item
          )
        );
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      showToast('Error updating support', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setStatus('All');
    setPriority('All');
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              CampusCare
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Core Module
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Report campus issues, mobilize student support, and track real-time resolution from university authorities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/campuscare/analytics"
            className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <BarChart2 className="w-4 h-4 text-brand-500" />
            <span>Campus Intelligence</span>
          </Link>

          <Link
            to="/campuscare/report"
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report an Issue</span>
          </Link>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Total Reports
          </div>
          <div className="text-2xl font-black text-gray-900 mt-1">
            {stats.totalIssues}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Recorded on campus</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            Under Review
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1">
            {stats.underReview}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">Assigned to technicians</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            In Progress
          </div>
          <div className="text-2xl font-black text-blue-800 mt-1">
            {stats.inProgress}
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5">Active repairs underway</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[11px] font-bold text-status-success uppercase tracking-wider">
            Resolved
          </div>
          <div className="text-2xl font-black text-status-success mt-1">
            {stats.resolved}
          </div>
          <div className="text-[10px] text-green-600 mt-0.5">Inspected & closed</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, location, or problem description..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              <option value="All">All Categories</option>
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : st}
                </option>
              ))}
            </select>
          </div>

          {/* Priority / Sort */}
          <div className="md:col-span-2">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              <option value="newest">Newest First</option>
              <option value="most_supported">Most Supported</option>
              <option value="priority">Priority Order</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <span className="font-semibold">Priority Filter:</span>
            {priorities.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPriority(p);
                  setPage(1);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  priority === p
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {(search || category !== 'All' || status !== 'All' || priority !== 'All' || sort !== 'newest') && (
            <button
              onClick={handleResetFilters}
              className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Issue Cards Listing */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-brand-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No campus reports found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No issues match your current filters. Try selecting another category, clearing your search query, or submit a new report.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <Link
              key={issue._id}
              to={`/campuscare/${issue._id}`}
              className="block bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-card-hover hover:border-brand-300 transition-all text-left group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                      {issue.category}
                    </span>
                    <PriorityBadge priority={issue.priority} />
                    <StatusBadge status={issue.status} />
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                    {issue.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {issue.location} {issue.specificLocation ? `· ${issue.specificLocation}` : ''}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span>
                      Reported by:{' '}
                      <span className="font-semibold text-gray-700">
                        {issue.reporter?.name || 'Anonymous Student'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Right side: Community Support ("Affected Too") button */}
                <div className="flex sm:flex-col items-center justify-between sm:items-end gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <button
                    type="button"
                    onClick={(e) => handleSupportToggle(e, issue._id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      issue.hasSupported
                        ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                        : 'bg-orange-50 text-brand-700 hover:bg-orange-100 border border-brand-200'
                    }`}
                    title="Indicate that you are also affected by this campus issue"
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${issue.hasSupported ? 'fill-white' : ''}`} />
                    <span>{issue.hasSupported ? 'Affected Too' : "I'm Affected Too"}</span>
                    <span className="ml-1 px-1.5 py-0.2 bg-black/10 rounded-full text-[10px]">
                      {issue.supportCount || 0}
                    </span>
                  </button>

                  <span className="text-[11px] font-semibold text-brand-600 group-hover:underline">
                    View Details & Timeline &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-gray-600 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
