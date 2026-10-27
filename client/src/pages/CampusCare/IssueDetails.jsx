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
  Lock,
  Bot,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const IssueDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isStaff, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Staff workflow management state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Staff official response state
  const [responseMsg, setResponseMsg] = useState('');
  const [responseSubmitting, setResponseSubmitting] = useState(false);

  // Staff internal note state
  const [internalNoteMsg, setInternalNoteMsg] = useState('');
  const [internalNoteSubmitting, setInternalNoteSubmitting] = useState(false);

  // Student clarification answer state
  const [clarificationAnswer, setClarificationAnswer] = useState('');
  const [clarificationSubmitting, setClarificationSubmitting] = useState(false);

  // Staff request clarification modal/state
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [askingClarification, setAskingClarification] = useState(false);

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

  const copyTicketNumber = () => {
    if (!issue?.ticketNumber) return;
    navigator.clipboard.writeText(issue.ticketNumber);
    setCopiedTicket(true);
    showToast('Ticket number copied to clipboard', 'success');
    setTimeout(() => setCopiedTicket(false), 2000);
  };

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
        showToast(`Complaint status changed to ${newStatus}`, 'success');
        setStatusNote('');
        fetchIssue();
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
        showToast('Official university response published', 'success');
        setResponseMsg('');
        fetchIssue();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error posting response', 'error');
    } finally {
      setResponseSubmitting(false);
    }
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNoteMsg.trim()) return;

    try {
      setInternalNoteSubmitting(true);
      const res = await api.post(`/issues/${id}/internal-note`, {
        note: internalNoteMsg.trim(),
      });

      if (res.data.success) {
        showToast('Confidential internal note saved', 'success');
        setInternalNoteMsg('');
        fetchIssue();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving internal note', 'error');
    } finally {
      setInternalNoteSubmitting(false);
    }
  };

  const handleAnswerClarification = async (e, reqId) => {
    e.preventDefault();
    if (!clarificationAnswer.trim()) return;

    try {
      setClarificationSubmitting(true);
      const res = await api.post(`/issues/${id}/clarification/answer`, {
        requestId: reqId,
        answer: clarificationAnswer.trim(),
      });

      if (res.data.success) {
        showToast('Clarification submitted successfully! Ticket resumed.', 'success');
        setClarificationAnswer('');
        fetchIssue();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting clarification', 'error');
    } finally {
      setClarificationSubmitting(false);
    }
  };

  const handleStaffRequestClarification = async (e) => {
    e.preventDefault();
    if (!clarificationQuestion.trim()) return;

    try {
      setAskingClarification(true);
      const res = await api.post(`/staff/complaints/${issue._id}/clarification`, {
        question: clarificationQuestion.trim(),
      });

      if (res.data.success) {
        showToast('Clarification request sent to student', 'success');
        setClarificationQuestion('');
        setShowClarificationModal(false);
        fetchIssue();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request clarification', 'error');
    } finally {
      setAskingClarification(false);
    }
  };

  const isStaffOrAdmin = isStaff || isAdmin;
  const isReporter = user && issue && (
    (typeof issue.reporter === 'object' && issue.reporter?._id === user._id) ||
    issue.reporter === user._id
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-8">
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
        <h2 className="text-lg font-bold text-gray-900">Complaint Not Found</h2>
        <p className="text-xs text-gray-500">
          The requested university complaint record may have been moved, resolved, or does not exist.
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

  const latestClarification = issue.clarificationRequests?.[issue.clarificationRequests.length - 1];
  const pendingClarification = latestClarification && !latestClarification.studentAnswer;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Ticket Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          to="/campuscare"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CampusCare Hub</span>
        </Link>

        {issue.ticketNumber && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">Official Ticket:</span>
            <button
              onClick={copyTicketNumber}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 hover:bg-black text-amber-400 rounded-xl text-xs font-mono font-bold transition shadow-sm"
              title="Click to copy ticket number"
            >
              <span>{issue.ticketNumber}</span>
              {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Action Required: Student Clarification Needed Banner */}
      {issue.status === 'AWAITING_CLARIFICATION' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-200 rounded-xl text-amber-800 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-amber-950">
                Action Required: Additional Information Requested
              </h3>
              <p className="text-xs text-amber-800 mt-1">
                University officials are handling this complaint but require further clarification from the reporter before proceeding.
              </p>
              {latestClarification && (
                <div className="mt-3 p-3.5 bg-white/90 rounded-2xl border border-amber-200 space-y-1">
                  <div className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
                    <span>Officer Question ({latestClarification.askedByName || 'Assigned Officer'}):</span>
                    <span className="text-[10px] text-gray-400">{new Date(latestClarification.askedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-800 font-medium whitespace-pre-wrap">
                    "{latestClarification.question}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Student response form */}
          {isReporter && pendingClarification && (
            <form onSubmit={(e) => handleAnswerClarification(e, latestClarification._id)} className="pt-2 border-t border-amber-200 space-y-2">
              <label className="block text-xs font-bold text-amber-950">
                Your Response as Complaint Reporter:
              </label>
              <textarea
                required
                rows={3}
                value={clarificationAnswer}
                onChange={(e) => setClarificationAnswer(e.target.value)}
                placeholder="Provide the requested details (e.g., exact room number, time of incident, equipment tag)..."
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-2xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={clarificationSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{clarificationSubmitting ? 'Submitting...' : 'Submit Clarification & Resume Ticket'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Main Issue Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              {issue.category}
            </span>
            {issue.subcategory && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {issue.subcategory}
              </span>
            )}
            <PriorityBadge priority={issue.priority} />
            <StatusBadge status={issue.status} />
            <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
            {issue.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-2 border-b border-gray-100 pb-4">
            <span className="flex items-center gap-1.5 font-semibold text-gray-800">
              <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
              {issue.location} {issue.specificLocation ? `(${issue.specificLocation})` : ''}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 font-medium text-gray-600">
              <Building className="w-3.5 h-3.5 text-gray-400" />
              {issue.faculty || 'Campus General'}
            </span>
            <span>·</span>
            <span>
              Reported by:{' '}
              <strong className="text-gray-900">
                {typeof issue.reporter === 'object' ? issue.reporter.name : 'University Member'}
              </strong>
              {issue.reporter?.registrationNumber && (
                <span className="ml-1 text-[11px] font-mono text-gray-500">
                  ({issue.reporter.registrationNumber})
                </span>
              )}
            </span>
            {issue.isAnonymous && (
              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold">
                Anonymous Report
              </span>
            )}
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Issue Description
          </h3>
          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50/70 p-5 rounded-2xl border border-gray-100 font-normal">
            {issue.description}
          </p>
        </div>

        {/* Photographic Evidence */}
        {issue.imageUrl && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Photographic Evidence
            </h3>
            <div className="max-w-lg rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
              <img
                src={issue.imageUrl}
                alt={issue.title}
                className="w-full h-auto object-cover max-h-96"
              />
            </div>
          </div>
        )}

        {/* Community "Affected Too" Section */}
        <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-gray-900">
              Are you also affected by this campus issue?
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              Support this report to signal high student impact and accelerate resolution priority.
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
            <span>{issue.hasSupported ? 'Supported by You' : "I'm Affected Too"}</span>
            <span className="px-2 py-0.5 bg-black/10 rounded-full text-xs font-black">
              {issue.supportCount || 0}
            </span>
          </button>
        </div>
      </div>

      {/* AI Analysis & Verified Routing Intelligence Card */}
      {issue.aiClassification && (
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 rounded-3xl p-6 border border-indigo-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                <Bot className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                <span>AI Classification & SmartResolve Routing</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              </h3>
            </div>
            {issue.aiClassification.confidence && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                {Math.round(issue.aiClassification.confidence * 100)}% Confidence
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Unit</span>
              <span className="font-bold text-gray-900 mt-0.5 block">
                {issue.assignedToUnit || issue.routingDecision?.assignedUnit || 'Administrative Triage'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Urgency Meter</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-gray-900">
                  {issue.aiClassification.urgencyScore || 3} / 5
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      (issue.aiClassification.urgencyScore || 3) >= 4
                        ? 'bg-red-500'
                        : (issue.aiClassification.urgencyScore || 3) === 3
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${((issue.aiClassification.urgencyScore || 3) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Routing Decision</span>
              <span className="font-bold text-indigo-900 mt-0.5 block truncate">
                {issue.routingDecision?.ruleAppliedName || 'Standard SEUSL Scope Engine'}
              </span>
            </div>
          </div>

          {issue.aiClassification.reasoning && (
            <div className="p-3 bg-white/90 rounded-2xl border border-indigo-100 text-xs text-gray-700">
              <span className="font-bold text-indigo-950">AI Reasoning: </span>
              <span className="italic">"{issue.aiClassification.reasoning}"</span>
            </div>
          )}

          {issue.slaEscalationDueAt && (
            <div className="flex items-center gap-2 text-xs text-indigo-900 font-medium pt-1">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>SLA Resolution Target: {new Date(issue.slaEscalationDueAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Authorized Staff / Admin Workflow Control Panel */}
      {isStaffOrAdmin && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-900">
                Staff / Admin Resolution Control Panel
              </h3>
            </div>
            <button
              onClick={() => setShowClarificationModal(true)}
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Request Student Clarification</span>
            </button>
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
                <option value="SUBMITTED">SUBMITTED (Reported)</option>
                <option value="ASSIGNED">ASSIGNED (In Queue)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Investigating / Active)</option>
                <option value="AWAITING_CLARIFICATION">AWAITING_CLARIFICATION</option>
                <option value="RESOLVED">RESOLVED (Action Taken)</option>
                <option value="CLOSED">CLOSED (Completed)</option>
                <option value="REJECTED">REJECTED (Invalid / Out of Scope)</option>
              </select>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Resolution Note / Action Taken
              </label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Dispatched maintenance technician to replace breaker."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-purple-500"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={statusSubmitting}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-70 shadow-sm"
              >
                {statusSubmitting ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confidential Staff Internal Notes (Only Staff / Admin) */}
      {isStaffOrAdmin && (
        <div className="bg-stone-50 rounded-3xl p-6 sm:p-8 border border-stone-300 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
            <Lock className="w-4 h-4 text-stone-600" />
            <h3 className="text-sm font-bold text-stone-900">
              Confidential Internal Staff Notes
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700 uppercase">
              Staff & Admin Only (Hidden from Students)
            </span>
          </div>

          <div className="space-y-3">
            {(!issue.internalNotes || issue.internalNotes.length === 0) ? (
              <div className="py-4 text-center text-xs text-stone-500">
                No internal notes recorded yet.
              </div>
            ) : (
              issue.internalNotes.map((note, idx) => (
                <div key={idx} className="p-3.5 bg-white rounded-2xl border border-stone-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-stone-500 text-[11px]">
                    <span className="font-bold text-stone-800">
                      {note.authorName || 'Staff Member'} ({note.authorRole || 'STAFF'})
                    </span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-stone-800 font-medium whitespace-pre-wrap">{note.note}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddInternalNote} className="pt-2 border-t border-stone-200 flex gap-2">
            <input
              type="text"
              required
              value={internalNoteMsg}
              onChange={(e) => setInternalNoteMsg(e.target.value)}
              placeholder="Add confidential note (e.g. vendor quoted Rs. 14,000 for replacement parts)..."
              className="flex-1 px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-500"
            />
            <button
              type="submit"
              disabled={internalNoteSubmitting}
              className="px-4 py-2 bg-stone-800 hover:bg-black text-white font-bold text-xs rounded-xl disabled:opacity-50 transition"
            >
              {internalNoteSubmitting ? 'Saving...' : 'Add Note'}
            </button>
          </form>
        </div>
      )}

      {/* Official University Remarks Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <MessageSquare className="w-5 h-5 text-brand-500" />
          <h3 className="text-sm font-bold text-gray-900">
            Official University Responses & Remarks ({issue.officialResponses?.length || 0})
          </h3>
        </div>

        <div className="space-y-3">
          {(!issue.officialResponses || issue.officialResponses.length === 0) ? (
            <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl">
              No official responses logged yet. Assigned university officers are reviewing this report.
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

        {/* Add official response form for staff/admin */}
        {isStaffOrAdmin && (
          <form onSubmit={handleAddResponse} className="pt-3 border-t border-gray-100 space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              Add Official Public Staff Remark (Visible to Student)
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
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-70 transition-colors shadow-sm"
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
              <div className="flex-1 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={hist.newStatus} />
                    <span className="font-semibold text-gray-700 text-xs">
                      {hist.changedByName || (typeof hist.changedBy === 'object' ? hist.changedBy.name : 'University Official')}
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

      {/* Staff Request Clarification Modal */}
      {showClarificationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <HelpCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-gray-900">Request Student Clarification</h3>
            </div>
            <p className="text-xs text-gray-600">
              This will update the complaint status to <strong className="text-amber-700">AWAITING_CLARIFICATION</strong> and notify the reporting student to provide more details.
            </p>

            <form onSubmit={handleStaffRequestClarification} className="space-y-4">
              <textarea
                required
                rows={3}
                value={clarificationQuestion}
                onChange={(e) => setClarificationQuestion(e.target.value)}
                placeholder="What specific information do you need from the student? (e.g. Which lab bench is affected? Have you reported this to the hostel subwarden?)"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClarificationModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={askingClarification}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
                >
                  {askingClarification ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
