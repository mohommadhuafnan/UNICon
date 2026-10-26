import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import {
  BookOpen,
  Search,
  Filter,
  Bookmark,
  ExternalLink,
  PlusCircle,
  Flag,
  FileText,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react';

export const ResourceList = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState('All');
  const [semester, setSemester] = useState('All');
  const [resourceType, setResourceType] = useState('All');
  const [search, setSearch] = useState('');

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    subject: '',
    faculty: user?.faculty || 'Faculty of Computing',
    department: user?.department || 'Computer Science',
    semester: 'Year 1 Sem 1',
    resourceType: 'Lecture Notes',
    sourceUrl: '',
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Flag resource modal
  const [flagModalId, setFlagModalId] = useState(null);

  const resourceTypes = [
    'All',
    'Lecture Notes',
    'Revision Guide',
    'Tutorial',
    'Practice Questions / Past Papers',
    'Code & Documentation',
    'Video Lecture',
    'Reference Book',
  ];

  const semesters = [
    'All',
    'Year 1 Sem 1',
    'Year 1 Sem 2',
    'Year 2 Sem 1',
    'Year 2 Sem 2',
    'Year 3 Sem 1',
    'Year 3 Sem 2',
    'Year 4 Sem 1',
    'Year 4 Sem 2',
    'Postgraduate / General',
  ];

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (faculty !== 'All') params.faculty = faculty;
      if (semester !== 'All') params.semester = semester;
      if (resourceType !== 'All') params.resourceType = resourceType;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/resources', { params });
      if (res.data.success) {
        setResources(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
      showToast('Error loading study resources', 'error');
    } finally {
      setLoading(false);
    }
  }, [faculty, semester, resourceType, search, showToast]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleToggleSave = async (id) => {
    if (!isAuthenticated) {
      showToast('Please sign in to bookmark study materials', 'warning');
      return;
    }

    try {
      const res = await api.post(`/resources/${id}/save`);
      if (res.data.success) {
        setResources((prev) =>
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

  const handleFlagResource = async () => {
    if (!flagModalId) return;
    try {
      const res = await api.post(`/resources/${flagModalId}/flag`);
      if (res.data.success) {
        showToast('Resource link flagged for review. Thank you!', 'info');
        setFlagModalId(null);
      }
    } catch (err) {
      showToast('Error flagging resource', 'error');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.title.trim() || !uploadData.subject.trim() || !uploadData.sourceUrl.trim()) {
      showToast('Please fill in required fields', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/resources', uploadData);
      if (res.data.success) {
        showToast('Learning material shared successfully!', 'success');
        setShowUploadModal(false);
        setUploadData({
          title: '',
          description: '',
          subject: '',
          faculty: user?.faculty || 'Faculty of Computing',
          department: user?.department || 'Computer Science',
          semester: 'Year 1 Sem 1',
          resourceType: 'Lecture Notes',
          sourceUrl: '',
          tags: '',
        });
        fetchResources();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error uploading resource', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              ResourceShare
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Peer Learning
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Discover and share past-paper solutions, comprehensive revision summaries, lecture slides, and tutorials.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload Study Material</span>
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
              placeholder="Search course code, subject, topic..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Semesters / Years' : s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
            >
              {resourceTypes.map((rt) => (
                <option key={rt} value={rt}>
                  {rt === 'All' ? 'All Material Types' : rt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <BookOpen className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No resources found</h3>
          <p className="text-xs text-gray-500">Be the first to share notes or revision guides for this module!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resItem) => (
            <div
              key={resItem._id}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between text-left space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {resItem.resourceType}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFlagModalId(resItem._id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Report broken link"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleSave(resItem._id)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                        resItem.isSaved
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                      title="Bookmark material"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${resItem.isSaved ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-bold text-brand-600">
                  {resItem.subject}
                </div>
                <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mt-0.5">
                  {resItem.title}
                </h3>

                <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                  {resItem.description}
                </p>

                {resItem.tags && resItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {resItem.tags.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-400">
                  {resItem.semester} · by {resItem.contributorName}
                </span>

                <a
                  href={resItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Share Learning Resource
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  placeholder="e.g. Data Structures & Algorithms Revision Cheatsheet"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Subject / Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadData.subject}
                    onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })}
                    placeholder="e.g. SCS 2201"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Academic Semester *
                  </label>
                  <select
                    value={uploadData.semester}
                    onChange={(e) => setUploadData({ ...uploadData, semester: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  >
                    {semesters.slice(1).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Resource Type *
                  </label>
                  <select
                    value={uploadData.resourceType}
                    onChange={(e) => setUploadData({ ...uploadData, resourceType: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  >
                    {resourceTypes.slice(1).map((rt) => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Faculty
                  </label>
                  <input
                    type="text"
                    value={uploadData.faculty}
                    onChange={(e) => setUploadData({ ...uploadData, faculty: e.target.value })}
                    placeholder="Faculty of Computing"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Access Link / Drive / GitHub URL *
                </label>
                <input
                  type="url"
                  required
                  value={uploadData.sourceUrl}
                  onChange={(e) => setUploadData({ ...uploadData, sourceUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Brief Description & Topics Covered
                </label>
                <textarea
                  rows={2}
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Annotated summary of modules 1 through 4 with practice problems..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                  placeholder="Algorithms, Graphs, ExamPrep"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-70"
                >
                  {submitting ? 'Uploading...' : 'Publish Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flag Confirmation Dialog */}
      {flagModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Flag className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Report Inappropriate or Broken Link</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to flag this study resource link for administrative verification?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setFlagModalId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagResource}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
