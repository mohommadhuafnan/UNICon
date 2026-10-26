import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import {
  MessageSquareQuote,
  Search,
  Filter,
  PlusCircle,
  ThumbsUp,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Send,
  EyeOff,
  X,
} from 'lucide-react';

export const StudentVoiceList = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('most_supported');

  // New Suggestion Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    title: '',
    description: '',
    category: 'Library Services',
    campusLocation: 'Main Campus',
    isAnonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Staff Status Response Modifier Modal
  const [activeFeedbackForResponse, setActiveFeedbackForResponse] = useState(null);
  const [responseStatus, setResponseStatus] = useState('Accepted');
  const [responseText, setResponseText] = useState('');
  const [responseSubmitting, setResponseSubmitting] = useState(false);

  const categories = [
    'All',
    'Academic Facilities',
    'Library Services',
    'Hostel Facilities',
    'Transportation',
    'Internet Connectivity',
    'Student Welfare',
    'Campus Accessibility',
    'General Improvements',
  ];

  const statuses = ['All', 'Submitted', 'Under Review', 'Accepted', 'Implemented', 'Declined'];

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const params = { sort };
      if (category !== 'All') params.category = category;
      if (status !== 'All') params.status = status;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/feedback', { params });
      if (res.data.success) {
        setFeedbacks(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      showToast('Error loading student suggestions', 'error');
    } finally {
      setLoading(false);
    }
  }, [category, status, search, sort, showToast]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleToggleSupport = async (id) => {
    if (!isAuthenticated) {
      showToast('Please sign in to upvote suggestions', 'warning');
      return;
    }

    try {
      const res = await api.post(`/feedback/${id}/support`);
      if (res.data.success) {
        setFeedbacks((prev) =>
          prev.map((item) =>
            item._id === id
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
      showToast('Error voting for suggestion', 'error');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createData.title.trim() || !createData.description.trim()) {
      showToast('Please fill in both title and detailed explanation', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/feedback', createData);
      if (res.data.success) {
        showToast('Your suggestion has been submitted to StudentVoice!', 'success');
        setShowCreateModal(false);
        setCreateData({
          title: '',
          description: '',
          category: 'Library Services',
          campusLocation: 'Main Campus',
          isAnonymous: false,
        });
        fetchFeedbacks();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting suggestion', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!activeFeedbackForResponse) return;

    try {
      setResponseSubmitting(true);
      const res = await api.patch(`/feedback/${activeFeedbackForResponse._id}/status`, {
        status: responseStatus,
        responseText,
      });

      if (res.data.success) {
        showToast('Administrative status & response published', 'success');
        setActiveFeedbackForResponse(null);
        setResponseText('');
        fetchFeedbacks();
      }
    } catch (err) {
      showToast('Error updating suggestion status', 'error');
    } finally {
      setResponseSubmitting(false);
    }
  };

  const isStaffOrAdmin = user && (user.role === 'staff' || user.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              StudentVoice
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Campus Democracy
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Structured student suggestions for university facilities, shuttle transport, and academic welfare improvements.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Propose Suggestion</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student suggestions..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Suggestion Categories' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : st}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              <option value="most_supported">Most Upvoted</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggestion Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <MessageSquareQuote className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No student suggestions found</h3>
          <p className="text-xs text-gray-500">Have an idea for campus improvement? Submit the first proposal!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb) => (
            <div
              key={fb._id}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:border-amber-300 transition-all text-left space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    {fb.category}
                  </span>
                  <StatusBadge status={fb.status} />
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Upvote button */}
                  <button
                    onClick={() => handleToggleSupport(fb._id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      fb.hasSupported
                        ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                        : 'bg-orange-50 text-brand-700 hover:bg-orange-100 border border-brand-200'
                    }`}
                    title="Upvote this constructive student suggestion"
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${fb.hasSupported ? 'fill-white' : ''}`} />
                    <span>Upvote</span>
                    <span className="ml-1 px-1.5 py-0.2 bg-black/10 rounded-full text-[10px]">
                      {fb.supportCount || 0}
                    </span>
                  </button>

                  {/* Staff Response action */}
                  {isStaffOrAdmin && (
                    <button
                      onClick={() => {
                        setActiveFeedbackForResponse(fb);
                        setResponseStatus(fb.status);
                        setResponseText(fb.administrativeResponse?.responseText || '');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold"
                    >
                      Staff Action
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {fb.title}
                </h3>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed whitespace-pre-line">
                  {fb.description}
                </p>
              </div>

              {/* Official Staff Response Callout */}
              {fb.administrativeResponse?.responseText && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-left space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{fb.administrativeResponse.responderName || 'University Administration'}</span>
                    </span>
                    <span className="text-[10px] text-emerald-600">
                      {new Date(fb.administrativeResponse.respondedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed pl-5">
                    "{fb.administrativeResponse.responseText}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {fb.campusLocation || 'Main Campus'}
                </span>
                <span>
                  Suggested by:{' '}
                  <strong className="text-gray-700">
                    {fb.author?.name || 'Anonymous Student'}
                  </strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Propose Suggestion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Propose Campus Improvement Suggestion
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
                  Suggestion Title *
                </label>
                <input
                  type="text"
                  required
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  placeholder="e.g. Extend Library Air-Conditioned Hours during Exam Weeks"
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
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Relevant Campus Spot
                  </label>
                  <input
                    type="text"
                    value={createData.campusLocation}
                    onChange={(e) => setCreateData({ ...createData, campusLocation: e.target.value })}
                    placeholder="e.g. Science Library or Shuttle Route"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Detailed Explanation & Justification *
                </label>
                <textarea
                  required
                  rows={4}
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="Explain why this change is necessary, how many students benefit, and practical suggestions for implementation..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              {/* Anonymous checkbox */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <input
                  type="checkbox"
                  id="anonVoice"
                  checked={createData.isAnonymous}
                  onChange={(e) => setCreateData({ ...createData, isAnonymous: e.target.checked })}
                  className="w-4 h-4 text-brand-500 rounded border-gray-300"
                />
                <label htmlFor="anonVoice" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Submit anonymously (hide your name from public view)
                </label>
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
                  {submitting ? 'Submitting...' : 'Post to StudentVoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Status & Response Modal */}
      {activeFeedbackForResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Staff Review: {activeFeedbackForResponse.title}
              </h3>
              <button
                onClick={() => setActiveFeedbackForResponse(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResponseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Change Review Status
                </label>
                <select
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Accepted">Accepted (Approved for implementation)</option>
                  <option value="Implemented">Implemented (Completed)</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Official Administrative Remarks
                </label>
                <textarea
                  rows={3}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="e.g. The Library Committee reviewed this recommendation and approved extended hours..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFeedbackForResponse(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={responseSubmitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-70"
                >
                  {responseSubmitting ? 'Saving...' : 'Update & Publish Remark'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
