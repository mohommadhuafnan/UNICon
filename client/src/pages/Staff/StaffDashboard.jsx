import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  ShieldAlert,
  CheckCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Forward,
  CornerDownRight,
  Shield,
  MapPin,
  Lock,
} from 'lucide-react';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    totalQueue: 0,
    assigned: 0,
    acknowledged: 0,
    inProgress: 0,
    resolved: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'status' | 'clarification' | 'reassign' | 'internal_note'
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Form states inside modals
  const [modalStatus, setModalStatus] = useState('IN_PROGRESS');
  const [modalNote, setModalNote] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [reassignUnit, setReassignUnit] = useState('Maintenance Division');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [submittingModal, setSubmittingModal] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/staff/complaints', { params });
      if (res.data.success) {
        setComplaints(res.data.data);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching staff queue:', err);
      showToast('Error loading staff queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, priorityFilter, searchQuery]);

  // Handle 1-click Acknowledge
  const handleAcknowledge = async (complaintId) => {
    try {
      const res = await api.post(`/staff/complaints/${complaintId}/acknowledge`);
      if (res.data.success) {
        showToast('Complaint acknowledged successfully', 'success');
        fetchQueue();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to acknowledge', 'error');
    }
  };

  // Handle Status Change
  const handleSubmitStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setSubmittingModal(true);
      const res = await api.patch(`/issues/${selectedComplaint._id}/status`, {
        status: modalStatus,
        note: modalNote,
        resolutionDetails: modalStatus === 'RESOLVED' ? resolutionDetails : undefined,
      });

      if (res.data.success) {
        showToast(`Status updated to ${modalStatus}`, 'success');
        setActiveModal(null);
        fetchQueue();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating status', 'error');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Handle Request Clarification
  const handleSubmitClarification = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !clarificationQuestion.trim()) return;

    try {
      setSubmittingModal(true);
      const res = await api.post(`/staff/complaints/${selectedComplaint._id}/clarification`, {
        question: clarificationQuestion.trim(),
      });

      if (res.data.success) {
        showToast('Clarification request sent to student', 'success');
        setActiveModal(null);
        setClarificationQuestion('');
        fetchQueue();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Handle Reassignment
  const handleSubmitReassign = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !reassignUnit) return;

    try {
      setSubmittingModal(true);
      const res = await api.post(`/staff/complaints/${selectedComplaint._id}/reassign`, {
        newUnit: reassignUnit,
        reason: modalNote || 'Reassigned to specialist unit',
      });

      if (res.data.success) {
        showToast(`Ticket reassigned to ${reassignUnit}`, 'success');
        setActiveModal(null);
        fetchQueue();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Reassignment failed', 'error');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Handle Internal Note
  const handleSubmitInternalNote = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !internalNoteText.trim()) return;

    try {
      setSubmittingModal(true);
      const res = await api.post(`/issues/${selectedComplaint._id}/internal-note`, {
        note: internalNoteText.trim(),
      });

      if (res.data.success) {
        showToast('Internal confidential note saved', 'success');
        setActiveModal(null);
        setInternalNoteText('');
        fetchQueue();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save note', 'error');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Handle Escalate
  const handleEscalate = async (complaintId) => {
    if (!window.confirm('Are you sure you want to escalate this overdue complaint to Central Administrator Review?')) {
      return;
    }

    try {
      const res = await api.post(`/staff/complaints/${complaintId}/escalate`, {
        reason: 'Staff initiated escalation due to SLA threshold',
      });
      if (res.data.success) {
        showToast('Complaint escalated to Administrator Review queue', 'success');
        fetchQueue();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Escalation failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Role Title customization */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {user?.role === 'LIBRARY_OFFICER'
                ? 'Library Complaints & Service Portal'
                : user?.role === 'CANTEEN_MANAGER'
                ? 'Cafeteria & Dining Complaints Portal'
                : user?.role === 'HOSTEL_WARDEN'
                ? 'Hostel Accommodation Grievance Hub'
                : user?.role === 'FACULTY_OFFICER'
                ? 'Faculty Complaints & Academic Grievance Hub'
                : 'Staff Complaints Resolution Portal'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              {user?.department || 'SEUSL Service Unit'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Scoped complaint queue for {user?.name} · {user?.university || 'SEUSL'}
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Scoped Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase">Total in Queue</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{stats.totalQueue}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-purple-700 uppercase">Assigned</div>
          <div className="text-2xl font-black text-purple-700 mt-1">{stats.assigned}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-blue-700 uppercase">Acknowledged</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{stats.acknowledged}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-amber-700 uppercase">In Progress</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.inProgress}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-status-success uppercase">Resolved</div>
          <div className="text-2xl font-black text-status-success mt-1">{stats.resolved}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-red-700 uppercase">Overdue (&gt;48h)</div>
          <div className="text-2xl font-black text-red-700 mt-1">{stats.overdue}</div>
        </div>
      </div>

      {/* Main Queue Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket number, student reg #, or location..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
            >
              <option value="All">All Statuses</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="AWAITING_CLARIFICATION">AWAITING_CLARIFICATION</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="ON_HOLD">ON_HOLD</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No active complaints found matching current filters in your assigned scope.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Ticket ID & Title</th>
                  <th className="pb-3">Student & Reg No</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Location Spot</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Current Status</th>
                  <th className="pb-3 text-right">Officer Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 max-w-xs">
                      <div className="font-mono font-bold text-brand-700 text-xs">
                        #{c.ticketNumber}
                      </div>
                      <div className="font-bold text-gray-900 line-clamp-1">{c.title}</div>
                      <div className="text-[10px] text-gray-400">
                        {c.category}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-semibold text-gray-800">
                        {c.isAnonymous ? 'Anonymous Student' : c.reporter?.name || 'Student'}
                      </div>
                      <div className="font-mono text-[10px] text-gray-400">
                        {c.studentRegistrationNumber || c.reporter?.studentId || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-gray-700 text-xs">
                        {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 text-gray-600 max-w-[180px] truncate">
                      {c.location}
                    </td>
                    <td className="py-3.5">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 text-right space-x-1 whitespace-nowrap">
                      {c.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleAcknowledge(c._id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200"
                        >
                          Acknowledge
                        </button>
                      )}

                      {c.status !== 'RESOLVED' && c.status !== 'Resolved' && (
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setModalStatus('RESOLVED');
                            setModalNote('Issue inspected, approved, and marked as resolved.');
                            setResolutionDetails('Grievance resolved and verified on site.');
                            setActiveModal('status');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all"
                          title="Approve and mark resolved"
                        >
                          ✓ Approve & Resolve
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setModalStatus(c.status);
                          setModalNote('');
                          setResolutionDetails('');
                          setActiveModal('status');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200"
                      >
                        Update Status
                      </button>

                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setClarificationQuestion('');
                          setActiveModal('clarification');
                        }}
                        className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold border border-amber-200"
                        title="Request Clarification from Student"
                      >
                        Ask Student
                      </button>

                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setInternalNoteText('');
                          setActiveModal('internal_note');
                        }}
                        className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                        title="Add Confidential Internal Note"
                      >
                        Note
                      </button>

                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setReassignUnit('Maintenance Division');
                          setActiveModal('reassign');
                        }}
                        className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
                        title="Reassign to another unit"
                      >
                        <Forward className="w-3.5 h-3.5 inline" />
                      </button>

                      <Link
                        to={`/campuscare/${c._id}`}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {activeModal === 'status' && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Update Status: #{selectedComplaint.ticketNumber}
            </h3>

            <form onSubmit={handleSubmitStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Workflow Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                >
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="RESOLVED">RESOLVED (Complete)</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Status Transition Explanation / Note *
                </label>
                <textarea
                  required
                  rows={3}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="e.g. Electrician arrived on site, replaced faulty MCCB breaker."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              {modalStatus === 'RESOLVED' && (
                <div>
                  <label className="block text-xs font-bold text-status-success mb-1">
                    Completion & Resolution Details
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionDetails}
                    onChange={(e) => setResolutionDetails(e.target.value)}
                    placeholder="Describe specific repair works performed and tested..."
                    className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-950 font-medium"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-70"
                >
                  {submittingModal ? 'Saving...' : 'Save & Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST CLARIFICATION MODAL */}
      {activeModal === 'clarification' && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Request Student Clarification: #{selectedComplaint.ticketNumber}
            </h3>

            <p className="text-xs text-gray-500">
              Ask the student for any missing details required by the repair technicians.
            </p>

            <form onSubmit={handleSubmitClarification} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Clarification Question *</label>
                <textarea
                  required
                  rows={3}
                  value={clarificationQuestion}
                  onChange={(e) => setClarificationQuestion(e.target.value)}
                  placeholder="e.g. Which specific tap or shower in the 2nd floor bathroom is leaking?"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-70"
                >
                  {submittingModal ? 'Sending...' : 'Send Request to Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERNAL CONFIDENTIAL NOTE MODAL */}
      {activeModal === 'internal_note' && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-1.5 text-gray-700">
              <Lock className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-bold text-gray-900">
                Confidential Staff Internal Note
              </h3>
            </div>

            <p className="text-xs text-gray-500">
              Internal notes are only visible to authorized staff and administrators. They are hidden from student view.
            </p>

            <form onSubmit={handleSubmitInternalNote} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Internal Work Order Note *</label>
                <textarea
                  required
                  rows={3}
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                  placeholder="e.g. Spare motor requisition submitted to Procurement Division. Estimated delivery 2 days."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-70"
                >
                  {submittingModal ? 'Saving...' : 'Save Internal Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN UNIT MODAL */}
      {activeModal === 'reassign' && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Forward / Reassign Ticket: #{selectedComplaint.ticketNumber}
            </h3>

            <form onSubmit={handleSubmitReassign} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Service Unit *</label>
                <select
                  value={reassignUnit}
                  onChange={(e) => setReassignUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                >
                  <option value="Maintenance Division">Maintenance Division</option>
                  <option value="ICT Centre">ICT Centre</option>
                  <option value="Library Services">Library Services</option>
                  <option value="Cafeteria Services">Cafeteria Services</option>
                  <option value="Student Support Services and Welfare">Student Support Services and Welfare</option>
                  <option value="Health Centre">Health Centre</option>
                  <option value="Security Division">Security Division</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Reassignment *</label>
                <textarea
                  required
                  rows={2}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="e.g. Issue involves electrical wiring beyond hostel scope, forwarded to Works Engineer."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-70"
                >
                  {submittingModal ? 'Reassigning...' : 'Reassign Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
