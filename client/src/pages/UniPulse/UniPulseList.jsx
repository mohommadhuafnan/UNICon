import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  Radio,
  Search,
  Filter,
  CheckCircle2,
  Bookmark,
  Calendar,
  Building,
  PlusCircle,
  ExternalLink,
  Sparkles,
  X,
} from 'lucide-react';

export const UniPulseList = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Create Announcement Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    title: '',
    description: '',
    category: 'Academic',
    priority: 'Normal',
    sourceDepartment: user?.department || 'Faculty Administration',
    targetAudience: 'All Students & Staff',
    sourceUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'All',
    'Academic',
    'Examinations',
    'Departmental',
    'Administrative',
    'Workshop & Events',
    'Student Society',
    'General Notices',
  ];

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (category !== 'All') params.category = category;
      if (search.trim()) params.search = search.trim();
      if (verifiedOnly) params.verifiedOnly = 'true';

      const res = await api.get('/announcements', { params });
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      showToast('Error loading announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [category, search, verifiedOnly, showToast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleToggleSave = async (id) => {
    if (!isAuthenticated) {
      showToast('Please sign in to bookmark notices', 'warning');
      return;
    }

    try {
      const res = await api.post(`/announcements/${id}/save`);
      if (res.data.success) {
        setAnnouncements((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, isSaved: res.data.isSaved } : item
          )
        );
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      showToast('Error updating bookmark', 'error');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createData.title.trim() || !createData.description.trim()) {
      showToast('Please provide both title and description', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/announcements', createData);
      if (res.data.success) {
        showToast('Announcement published successfully', 'success');
        setShowCreateModal(false);
        setCreateData({
          title: '',
          description: '',
          category: 'Academic',
          priority: 'Normal',
          sourceDepartment: user?.department || 'Faculty Administration',
          targetAudience: 'All Students & Staff',
          sourceUrl: '',
        });
        fetchAnnouncements();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error publishing notice', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canPublish = user && (user.role === 'staff' || user.role === 'admin' || user.role === 'organizer');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              UniPulse
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-brand-800">
              Verified Feed
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Centralized official university notices, examination schedules, and departmental announcements.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish Announcement</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements by title or content..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Announcement Categories' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
              />
              <span>Verified Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Announcements Stream */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <Radio className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No announcements found</h3>
          <p className="text-xs text-gray-500">Try adjusting your category filter or search keywords.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann._id}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:border-brand-200 transition-all text-left space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                    {ann.category}
                  </span>
                  <PriorityBadge priority={ann.priority} />
                  {ann.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Official
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(ann.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleSave(ann._id)}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto ${
                    ann.isSaved
                      ? 'bg-brand-50 border-brand-300 text-brand-600'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                  title={ann.isSaved ? 'Remove bookmark' : 'Bookmark notice'}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${ann.isSaved ? 'fill-brand-500 text-brand-500' : ''}`} />
                  <span className="hidden sm:inline">{ann.isSaved ? 'Bookmarked' : 'Bookmark'}</span>
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {ann.title}
                </h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                  {ann.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-semibold text-gray-700">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    {ann.sourceDepartment || ann.publisherName}
                  </span>
                  <span>·</span>
                  <span>Audience: <strong>{ann.targetAudience || 'All Students'}</strong></span>
                </div>

                {ann.sourceUrl && (
                  <a
                    href={ann.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-brand-600 hover:text-brand-700"
                  >
                    <span>View Official Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Publish Official Announcement
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  placeholder="e.g. Semester II Examination Timetable Released"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={createData.category}
                    onChange={(e) => setCreateData({ ...createData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  >
                    {categories.slice(1).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Urgency Priority
                  </label>
                  <select
                    value={createData.priority}
                    onChange={(e) => setCreateData({ ...createData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Source Department
                </label>
                <input
                  type="text"
                  value={createData.sourceDepartment}
                  onChange={(e) => setCreateData({ ...createData, sourceDepartment: e.target.value })}
                  placeholder="e.g. Dean's Office / Examination Branch"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Detailed Announcement Text *
                </label>
                <textarea
                  required
                  rows={4}
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="Enter notice body, regulations, venue allocations..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  External URL / Intranet Link
                </label>
                <input
                  type="url"
                  value={createData.sourceUrl}
                  onChange={(e) => setCreateData({ ...createData, sourceUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs disabled:opacity-70"
                >
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
