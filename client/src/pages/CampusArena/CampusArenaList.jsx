import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import {
  Trophy,
  Search,
  Filter,
  Calendar,
  MapPin,
  Bookmark,
  ExternalLink,
  PlusCircle,
  Users,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';

export const CampusArenaList = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [timeline, setTimeline] = useState('upcoming');
  const [search, setSearch] = useState('');

  // Create Event Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    title: '',
    description: '',
    category: 'Workshop',
    organizer: '',
    venue: '',
    startDate: '',
    registrationUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'All',
    'Sports',
    'Inter-Faculty',
    'Cultural Festival',
    'Society Activity',
    'Technical Exhibition',
    'Workshop',
    'Seminar',
    'Career Fair',
  ];

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = { timeline };
      if (category !== 'All') params.category = category;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/events', { params });
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      showToast('Error loading campus events', 'error');
    } finally {
      setLoading(false);
    }
  }, [category, timeline, search, showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleToggleSave = async (id) => {
    if (!isAuthenticated) {
      showToast('Please sign in to save events', 'warning');
      return;
    }

    try {
      const res = await api.post(`/events/${id}/save`);
      if (res.data.success) {
        setEvents((prev) =>
          prev.map((item) =>
            item._id === id
              ? {
                  ...item,
                  isSaved: res.data.isSaved,
                  attendeeCount: res.data.isSaved
                    ? (item.attendeeCount || 0) + 1
                    : Math.max(0, (item.attendeeCount || 1) - 1),
                }
              : item
          )
        );
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      showToast('Error updating event bookmark', 'error');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createData.title.trim() || !createData.organizer.trim() || !createData.venue.trim() || !createData.startDate) {
      showToast('Please fill in required fields', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/events', createData);
      if (res.data.success) {
        showToast('Campus event published successfully!', 'success');
        setShowCreateModal(false);
        setCreateData({
          title: '',
          description: '',
          category: 'Workshop',
          organizer: '',
          venue: '',
          startDate: '',
          registrationUrl: '',
        });
        fetchEvents();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = user && (user.role === 'organizer' || user.role === 'staff' || user.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              CampusArena
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
              Campus Events & Life
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Centralized schedule of inter-faculty tournaments, career fairs, cultural galas, and tech workshops.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Campus Event</span>
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
              placeholder="Search events, venues, organizers..."
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
                  {c === 'All' ? 'All Event Categories' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              <option value="upcoming">Upcoming Events</option>
              <option value="all">All Dates</option>
              <option value="past">Past Events Archive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <Trophy className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No events found</h3>
          <p className="text-xs text-gray-500">Check upcoming events or switch to past event archives.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <div
              key={ev._id}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between text-left space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                    {ev.category}
                  </span>

                  <button
                    onClick={() => handleToggleSave(ev._id)}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                      ev.isSaved
                        ? 'bg-purple-50 border-purple-300 text-purple-600'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                    title={ev.isSaved ? 'Attending / Saved' : 'RSVP & Save'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${ev.isSaved ? 'fill-purple-500 text-purple-500' : ''}`} />
                    <span className="text-[11px] font-bold">{ev.attendeeCount || 0}</span>
                  </button>
                </div>

                <div className="text-[11px] font-bold text-purple-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(ev.startDate).toLocaleDateString()} · {new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mt-1">
                  {ev.title}
                </h3>

                <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {ev.description}
                </p>

                <div className="space-y-1 mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{ev.venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <span>By:</span>
                    <strong className="text-gray-700">{ev.organizer}</strong>
                  </div>
                </div>
              </div>

              {ev.registrationUrl && (
                <div className="pt-2">
                  <a
                    href={ev.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-purple-200"
                  >
                    <span>Register / Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Publish Campus Event
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
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  placeholder="e.g. Inter-Faculty Cricket Grand Final"
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
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createData.startDate}
                    onChange={(e) => setCreateData({ ...createData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Organizer Entity *
                  </label>
                  <input
                    type="text"
                    required
                    value={createData.organizer}
                    onChange={(e) => setCreateData({ ...createData, organizer: e.target.value })}
                    placeholder="e.g. Sports Council or Rotaract Club"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Campus Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={createData.venue}
                    onChange={(e) => setCreateData({ ...createData, venue: e.target.value })}
                    placeholder="e.g. University Gymnasium Grounds"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Event Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="Details, team participation, schedules, and audience entry guidelines..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Registration Link (Optional)
                </label>
                <input
                  type="url"
                  value={createData.registrationUrl}
                  onChange={(e) => setCreateData({ ...createData, registrationUrl: e.target.value })}
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-70"
                >
                  {submitting ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
