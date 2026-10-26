import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import {
  Compass,
  Search,
  Filter,
  Bookmark,
  Calendar,
  ExternalLink,
  PlusCircle,
  Briefcase,
  CheckCircle,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';

export const OpportunityList = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('Active');
  const [search, setSearch] = useState('');

  // Create Opportunity Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    title: '',
    description: '',
    category: 'Hackathon',
    organizer: '',
    eligibility: 'All university undergraduates',
    skills: '',
    locationType: 'Remote',
    deadline: '',
    registrationUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'All',
    'Hackathon',
    'Coding Competition',
    'Designathon',
    'Datathon',
    'Internship',
    'Scholarship',
    'Workshop',
    'Research',
    'Certification',
  ];

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      const params = { status };
      if (category !== 'All') params.category = category;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/opportunities', { params });
      if (res.data.success) {
        setOpportunities(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      showToast('Error loading opportunities', 'error');
    } finally {
      setLoading(false);
    }
  }, [category, status, search, showToast]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleToggleSave = async (id) => {
    if (!isAuthenticated) {
      showToast('Please sign in to save opportunities', 'warning');
      return;
    }

    try {
      const res = await api.post(`/opportunities/${id}/save`);
      if (res.data.success) {
        setOpportunities((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, isSaved: res.data.isSaved } : item
          )
        );
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      showToast('Error updating saved list', 'error');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createData.title.trim() || !createData.organizer.trim() || !createData.deadline || !createData.registrationUrl) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/opportunities', createData);
      if (res.data.success) {
        showToast('Opportunity posted successfully!', 'success');
        setShowCreateModal(false);
        setCreateData({
          title: '',
          description: '',
          category: 'Hackathon',
          organizer: '',
          eligibility: 'All university undergraduates',
          skills: '',
          locationType: 'Remote',
          deadline: '',
          registrationUrl: '',
        });
        fetchOpportunities();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating opportunity', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canPost = user && (user.role === 'organizer' || user.role === 'staff' || user.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              OpportunityHub
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              Career & Competitions
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Discover verified hackathons, paid internships, research grants, and student innovation competitions.
          </p>
        </div>

        {canPost && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Opportunity</span>
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
              placeholder="Search hackathons, internships, skills..."
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
                  {c === 'All' ? 'All Opportunity Categories' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              <option value="Active">Active Deadlines</option>
              <option value="All">All (Including Expired)</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <Compass className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No opportunities match criteria</h3>
          <p className="text-xs text-gray-500">Try switching your category or check active vs expired deadlines.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp) => (
            <div
              key={opp._id}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between text-left space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                      {opp.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                      {opp.locationType}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleSave(opp._id)}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                      opp.isSaved
                        ? 'bg-blue-50 border-blue-300 text-blue-600'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                    title={opp.isSaved ? 'Saved in hub' : 'Save opportunity'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${opp.isSaved ? 'fill-blue-500 text-blue-500' : ''}`} />
                  </button>
                </div>

                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {opp.title}
                </h3>
                <div className="text-xs font-semibold text-gray-600 mt-1">
                  Organizer: <span className="text-gray-900 font-bold">{opp.organizer}</span>
                </div>

                <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                  {opp.description}
                </p>

                {/* Skills tags */}
                {opp.skills && opp.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {opp.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded bg-gray-50 text-gray-600 text-[10px] font-medium border border-gray-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom footer: Deadline & Apply link */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Deadline: <strong className={opp.isExpired ? 'text-red-600' : 'text-gray-800'}>
                      {new Date(opp.deadline).toLocaleDateString()}
                    </strong>
                  </span>
                  {opp.isExpired && (
                    <span className="text-[10px] text-red-600 font-bold ml-1">(Expired)</span>
                  )}
                </div>

                <a
                  href={opp.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                >
                  <span>Apply Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Opportunity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Post Opportunity / Competition
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
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  placeholder="e.g. National Datathon 2026"
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
                    Format
                  </label>
                  <select
                    value={createData.locationType}
                    onChange={(e) => setCreateData({ ...createData, locationType: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Physical">Physical</option>
                    <option value="On-Campus">On-Campus</option>
                  </select>
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
                    placeholder="e.g. Data Science Society"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Deadline Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createData.deadline}
                    onChange={(e) => setCreateData({ ...createData, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={createData.skills}
                  onChange={(e) => setCreateData({ ...createData, skills: e.target.value })}
                  placeholder="Python, React, Machine Learning, SQL"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="Eligibility requirements, prize pool, team size..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Application / Registration Link *
                </label>
                <input
                  type="url"
                  required
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-70"
                >
                  {submitting ? 'Posting...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
