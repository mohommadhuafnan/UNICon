import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  ShieldAlert,
  ArrowLeft,
  ThumbsUp,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Send,
  Building,
} from 'lucide-react';

export const IssueDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(false);

  // Staff workflow management state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Staff official response state
  const [responseMsg, setResponseMsg] = useState('');
  const [responseSubmitting, setResponseSubmitting] = useState(false);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/issues/${id}`);
      if (res.data.success) {
        setIssue(res.data.data);
        setNewStatus(res.data.data.status);
      }
    } catch (err) {
      console.error('Error fetching issue:', err);
      showToast('Could not load issue details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const handleSupportToggle = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to support this report', 'warning');
      return;
    }

    try {
      setSupportLoading(true);
      const res = await api.post(`/issues/${id}/support`);
      if (res.data.success) {
        setIssue((prev) => ({
          ...prev,
          hasSupported: res.data.hasSupported,
          supportCount: res.data.supportCount,
        }));
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      showToast('Error toggling support', 'error');
    } finally {
      setSupportLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    try {
      setStatusSubmitting(true);
      const res = await api.patch(`/issues/${id}/status`, {
        status: newStatus,
        note: statusNote,
      });

      if (res.data.success) {
        showToast(`Issue status changed to ${newStatus}`, 'success');
        setStatusNote('');
        fetchIssue(); // Refresh status history
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating status', 'error');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleAddResponse = async (e) => {
    e.preventDefault();
    if (!responseMsg.trim()) return;

    try {
      setResponseSubmitting(true);
      const res = await api.post(`/issues/${id}/respond`, {
        message: responseMsg.trim(),
      });

      if (res.data.success) {
        showToast('Official response published', 'success');
        setResponseMsg('');
        fetchIssue();
      }
    } catch (err) {
      showToast('Error posting response', 'error');
    } finally {
      setResponseSubmitting(false);
    }
  };

  const isStaffOrAdmin = user && (user.role === 'staff' || user.role === 'admin');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-3xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl text-center border border-gray-200 shadow-sm space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Issue Not Found</h2>
        <p className="text-xs text-gray-500">
          The requested campus report may have been archived or removed.
        </p>
        <Link
          to="/campuscare"
          className="inline-block px-4 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs"
        >
          Back to CampusCare
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/campuscare"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CampusCare Hub</span>
        </Link>
      </div>

      {/* Main Issue Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
              {issue.category}
            </span>
            <PriorityBadge priority={issue.priority} />
            <StatusBadge status={issue.status} />
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Reported on {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
            {issue.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1 border-b border-gray-100 pb-4">
            <span className="flex items-center gap-1 font-medium text-gray-700">
              <MapPin className="w-4 h-4 text-brand-500" />
              {issue.location} {issue.specificLocation ? `(${issue.specificLocation})` : ''}
            </span>
            <span>·</span>
            <span>{issue.faculty || 'Campus General'}</span>
            <span>·</span>
            <span>
              Submitted by: <strong className="text-gray-800">{issue.reporter?.name || 'Anonymous Student'}</strong>
            </span>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Issue Description
          </h3>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-campus-bg/70 p-4 rounded-2xl border border-gray-100">
            {issue.description}
          </p>
        </div>

        {/* Attached Photo if available */}
        {issue.imageUrl && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Photographic Evidence
            </h3>
            <div className="max-w-md rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <img
                src={issue.imageUrl}
                alt={issue.title}
                className="w-full h-auto object-cover max-h-80"
              />
            </div>
          </div>
        )}

        {/* Community "Affected Too" Section */}
        <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-gray-900">
              Are you also experiencing this problem?
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              Click "I'm Affected Too" to help university maintenance prioritize this report based on community impact.
            </div>
          </div>

          <button
            onClick={handleSupportToggle}
            disabled={supportLoading}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all flex-shrink-0 ${
              issue.hasSupported
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white text-brand-700 hover:bg-orange-100 border border-brand-300'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${issue.hasSupported ? 'fill-white' : ''}`} />
            <span>{issue.hasSupported ? 'Affected Too' : "I'm Affected Too"}</span>
            <span className="px-2 py-0.5 bg-black/10 rounded-full text-xs font-black">
              {issue.supportCount || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Authorized Staff Status Workflow Control Panel */}
      {isStaffOrAdmin && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-gray-900">
              Staff / Admin Workflow Control Panel
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">
              Authorized Action
            </span>
          </div>

          <form onSubmit={handleStatusUpdate} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Update Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:border-purple-500"
              >
                <option value="Reported">Reported</option>
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Official Resolution Note
              </label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Dispatched technician to repair switch Rack 2B."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-purple-500"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={statusSubmitting}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-70"
              >
                {statusSubmitting ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Official Staff Remarks Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <MessageSquare className="w-5 h-5 text-brand-500" />
          <h3 className="text-sm font-bold text-gray-900">
            Official University Responses & Remarks ({issue.officialResponses?.length || 0})
          </h3>
        </div>

        <div className="space-y-3">
          {(!issue.officialResponses || issue.officialResponses.length === 0) ? (
            <div className="py-6 text-center text-xs text-gray-400 bg-campus-bg rounded-2xl">
              No official responses logged yet. Authorized staff are currently reviewing this report.
            </div>
          ) : (
            issue.officialResponses.map((resp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 text-left space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <ShieldCheck className="w-4 h-4 text-brand-500" />
                    <span>{resp.responderName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-brand-100 text-brand-700 rounded font-semibold">
                      {resp.responderRole}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(resp.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed pl-5">
                  {resp.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add official response form for staff */}
        {isStaffOrAdmin && (
          <form onSubmit={handleAddResponse} className="pt-3 border-t border-gray-100 space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              Add Official Staff Remark
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={responseMsg}
                onChange={(e) => setResponseMsg(e.target.value)}
                placeholder="Type official update or instructions for the student..."
                className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 text-gray-900"
              />
              <button
                type="submit"
                disabled={responseSubmitting}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-70 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Status History Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Clock className="w-5 h-5 text-brand-500" />
          <h3 className="text-sm font-bold text-gray-900">
            Status Audit History & Timeline
          </h3>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {issue.statusHistory?.map((hist, idx) => (
            <div key={idx} className="relative flex items-start gap-3">
              <div className="absolute -left-6 mt-1 w-3.5 h-3.5 rounded-full bg-brand-500 ring-4 ring-orange-50" />
              <div className="flex-1 bg-campus-bg p-3.5 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={hist.newStatus} />
                    <span className="font-semibold text-gray-700 text-xs">
                      {hist.changedByName || 'Campus Official'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(hist.timestamp).toLocaleString()}
                  </span>
                </div>
                {hist.note && (
                  <p className="text-xs text-gray-600 mt-1 leading-snug">
                    {hist.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
