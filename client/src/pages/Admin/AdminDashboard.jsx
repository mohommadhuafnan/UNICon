import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  Edit,
  Sparkles,
  GitBranch,
  FileText,
  Settings,
  History,
  PlusCircle,
  Clock,
  MapPin,
  Bot,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab 2: Users
  const [usersList, setUsersList] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userVerFilter, setUserVerFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Provision Staff Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'FACULTY_OFFICER',
    department: 'Faculty Administration',
    assignedScope: 'Faculty of Technology',
  });

  // Tab 3: Complaints
  const [adminComplaints, setAdminComplaints] = useState([]);
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [triageStatus, setTriageStatus] = useState('');
  const [triageNote, setTriageNote] = useState('');

  // Tab 4: Routing Rules
  const [routingRules, setRoutingRules] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    category: 'FACULTY_RELATED',
    subcategory: 'ALL',
    responsibleUnit: 'Maintenance Division',
    priorityRule: 'DEFAULT',
    escalationHours: 48,
  });

  // Tab 5: Categories
  const [categories, setCategories] = useState([]);

  // Tab 6: Knowledge Documents (RAG)
  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestForm, setIngestForm] = useState({
    title: '',
    sourceUrl: '',
    sourceReference: '',
    documentType: 'COMPLAINT_PROCEDURE',
    departmentScope: 'UNIVERSITY_WIDE',
    rawText: '',
  });

  // Tab 7: AI Settings
  const [systemSettings, setSystemSettings] = useState([]);

  // Tab 8: Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = {};
      if (userRoleFilter !== 'All') params.role = userRoleFilter;
      if (userVerFilter !== 'All') params.verificationStatus = userVerFilter;
      if (userSearch.trim()) params.search = userSearch.trim();

      const res = await api.get('/admin/users', { params });
      if (res.data.success) setUsersList(res.data.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setComplaintsLoading(true);
      const params = { limit: 30 };
      if (complaintSearch.trim()) params.search = complaintSearch.trim();
      const res = await api.get('/issues', { params });
      if (res.data.success) setAdminComplaints(res.data.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const fetchRoutingRules = async () => {
    try {
      const res = await api.get('/admin/routing-rules');
      if (res.data.success) setRoutingRules(res.data.data);
    } catch (err) {
      console.error('Error fetching routing rules:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchKnowledgeDocs = async () => {
    try {
      const res = await api.get('/admin/knowledge-docs');
      if (res.data.success) setKnowledgeDocs(res.data.data);
    } catch (err) {
      console.error('Error fetching knowledge docs:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success) setSystemSettings(res.data.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      if (res.data.success) setAuditLogs(res.data.data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'complaints') fetchComplaints();
    else if (activeTab === 'routing') fetchRoutingRules();
    else if (activeTab === 'categories') fetchCategories();
    else if (activeTab === 'knowledge') fetchKnowledgeDocs();
    else if (activeTab === 'ai_config') fetchSettings();
    else if (activeTab === 'audit_logs') fetchAuditLogs();
  }, [activeTab, userRoleFilter, userVerFilter, userSearch]);

  // Handle Verify Student
  const handleVerifyStudent = async (userId, newStatus) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/verification`, { status: newStatus });
      if (res.data.success) {
        showToast(`Student account marked as ${newStatus}`, 'success');
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      showToast('Error updating student verification', 'error');
    }
  };

  // Handle Provision Staff Account
  const handleProvisionStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/users/provision-staff', {
        name: staffForm.name,
        email: staffForm.email,
        password: staffForm.password,
        role: staffForm.role,
        department: staffForm.department,
        assignedFaculties: [staffForm.assignedScope],
        assignedHostels: [staffForm.assignedScope],
        assignedServiceUnits: [staffForm.assignedScope],
      });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setShowStaffModal(false);
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to provision staff', 'error');
    }
  };

  // Handle Ingest RAG Knowledge Document
  const handleIngestDoc = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/knowledge-docs/ingest', ingestForm);
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setShowIngestModal(false);
        setIngestForm({
          title: '',
          sourceUrl: '',
          sourceReference: '',
          documentType: 'COMPLAINT_PROCEDURE',
          departmentScope: 'UNIVERSITY_WIDE',
          rawText: '',
        });
        fetchKnowledgeDocs();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Ingestion failed', 'error');
    }
  };

  // Handle Create Routing Rule
  const handleCreateRoutingRule = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/routing-rules', ruleForm);
      if (res.data.success) {
        showToast('Verified routing rule saved successfully', 'success');
        if (res.data.conflictWarning) {
          showToast(res.data.conflictWarning, 'info');
        }
        setShowRuleModal(false);
        fetchRoutingRules();
      }
    } catch (err) {
      showToast('Failed to create routing rule', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-gray-200 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Central University Administration
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              {user?.role?.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            South Eastern University of Sri Lanka (SEUSL) · SmartResolve Executive Command Center
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-2xl border border-gray-200 shadow-sm text-xs font-bold">
        {[
          { id: 'overview', label: 'Executive Overview' },
          { id: 'users', label: 'User Directory & Verification' },
          { id: 'complaints', label: 'Complaints Triage' },
          { id: 'routing', label: 'Verified Routing Rules' },
          { id: 'categories', label: 'Category Architecture' },
          { id: 'knowledge', label: 'RAG Knowledge Center' },
          { id: 'ai_config', label: 'AI Configuration' },
          { id: 'audit_logs', label: 'Audit Trail' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Key Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Registered Students</div>
              <div className="text-2xl font-black text-gray-900 mt-1">{stats.studentsCount}</div>
              <div className="text-[10px] text-amber-600 font-bold mt-0.5">
                {stats.pendingStudentVerifications} Pending Verification
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Total Filed</div>
              <div className="text-2xl font-black text-gray-900 mt-1">{stats.totalComplaints}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{stats.newlySubmitted} New</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[10px] font-bold text-purple-700 uppercase">Awaiting Review</div>
              <div className="text-2xl font-black text-purple-700 mt-1">{stats.awaitingAdminReview}</div>
              <div className="text-[10px] text-purple-600 mt-0.5">Requires intervention</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[10px] font-bold text-amber-700 uppercase">In Progress</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{stats.inProgressComplaints}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">{stats.assignedComplaints} Assigned</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[10px] font-bold text-status-success uppercase">Resolved</div>
              <div className="text-2xl font-black text-status-success mt-1">{stats.resolvedIssues}</div>
              <div className="text-[10px] text-green-600 mt-0.5">{stats.resolutionRate}% Clearance</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[10px] font-bold text-red-700 uppercase">Overdue Escalations</div>
              <div className="text-2xl font-black text-red-700 mt-1">{stats.overdueComplaints}</div>
              <div className="text-[10px] text-red-600 mt-0.5">&gt; 48 hours unresolved</div>
            </div>
          </div>

          {/* Breakdown Grids: Categories & Faculties */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Complaints by University Service Category
              </h3>
              <div className="space-y-2">
                {stats.complaintsByCategory?.map((cat, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-gray-800">{cat.category}</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-orange-100 text-brand-700">
                      {cat.count} tickets
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Complaints by Faculty Scope
              </h3>
              <div className="space-y-2">
                {stats.complaintsByFaculty?.map((fac, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-gray-800">{fac.faculty}</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                      {fac.count} tickets
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">
              User Directory, Student Verifications & Staff Provisioning
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name, email, reg no..."
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
              />

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
              >
                <option value="All">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="FACULTY_OFFICER">Faculty Officer</option>
                <option value="HOSTEL_WARDEN">Hostel Warden</option>
                <option value="MAINTENANCE_OFFICER">Maintenance Officer</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>

              <select
                value={userVerFilter}
                onChange={(e) => setUserVerFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
              >
                <option value="All">All Verification</option>
                <option value="pending">Pending Verification</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                onClick={() => setShowStaffModal(true)}
                className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Provision Staff</span>
              </button>
            </div>
          </div>

          {usersLoading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Registration # / Scope</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Verification</th>
                    <th className="pb-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 font-bold text-gray-900">{u.name}</td>
                      <td className="py-3 font-mono text-[11px] text-gray-500">{u.email}</td>
                      <td className="py-3 font-mono text-gray-600">
                        {u.registrationNumber || u.studentId || u.assignedFaculties?.[0] || '-'}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.verificationStatus === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : u.verificationStatus === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.verificationStatus || 'verified'}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1">
                        {u.verificationStatus === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleVerifyStudent(u._id, 'verified')}
                              className="px-2.5 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-bold border border-green-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyStudent(u._id, 'rejected')}
                              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-400">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. COMPLAINTS TRIAGE TAB */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">
              Campus Complaints Triage & AI Classification Audit
            </h3>
            <span className="text-xs text-gray-400">Showing {adminComplaints.length} tickets</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Ticket ID & Title</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">AI Classification</th>
                  <th className="pb-3">Assigned Unit</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adminComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 max-w-xs">
                      <div className="font-mono font-bold text-brand-700 text-xs">
                        #{c.ticketNumber}
                      </div>
                      <div className="font-bold text-gray-900 line-clamp-1">{c.title}</div>
                      <div className="text-[10px] text-gray-400">{c.location}</div>
                    </td>
                    <td className="py-3.5">{c.category}</td>
                    <td className="py-3.5">
                      {c.aiAnalysis?.confidence ? (
                        <div>
                          <span className="font-bold text-purple-700">
                            {Math.round(c.aiAnalysis.confidence * 100)}% Conf
                          </span>
                          <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                            {c.aiAnalysis.reason}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Rule-based</span>
                      )}
                    </td>
                    <td className="py-3.5 font-medium text-purple-700">
                      {c.routingDecision?.assignedUnit || 'Awaiting Review'}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        to={`/campuscare/${c._id}`}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ROUTING RULES TAB */}
      {activeTab === 'routing' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Verified Complaint Routing Rules Engine
              </h3>
              <p className="text-xs text-gray-500">
                Admin-configured rules mapped to university departments and SLA escalation policies
              </p>
            </div>
            <button
              onClick={() => setShowRuleModal(true)}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Routing Rule</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Rule Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Subcategory</th>
                  <th className="pb-3">Responsible Unit</th>
                  <th className="pb-3">SLA Escalation</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {routingRules.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 font-bold text-gray-900">{r.name}</td>
                    <td className="py-3">{r.category}</td>
                    <td className="py-3 font-mono text-[11px] text-gray-600">{r.subcategory}</td>
                    <td className="py-3 font-semibold text-purple-700">{r.responsibleUnit}</td>
                    <td className="py-3 font-bold text-amber-700">{r.escalationHours}h SLA</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">
              SEUSL Complaint Categories & Subcategory Tree
            </h3>
            <span className="text-xs text-gray-400">{categories.length} Categories Configured</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat._id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-xs">{cat.displayName}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                    {cat.locationType}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">{cat.description}</p>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Subcategories:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories?.map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-[10px] text-gray-700 font-medium"
                      >
                        {sub.displayName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. RAG KNOWLEDGE BASE TAB */}
      {activeTab === 'knowledge' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Retrieval-Augmented Generation (RAG) Document Center
              </h3>
              <p className="text-xs text-gray-500">
                Official SEUSL Student Handbook, hostel guidelines, and cafeteria hygiene charters
              </p>
            </div>
            <button
              onClick={() => setShowIngestModal(true)}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ingest Policy Document</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Document Title</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Scope</th>
                  <th className="pb-3">Vector Chunks</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Source Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {knowledgeDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 font-bold text-gray-900 max-w-xs">{doc.title}</td>
                    <td className="py-3 font-mono text-[10px] text-gray-600">{doc.documentType}</td>
                    <td className="py-3">{doc.departmentScope}</td>
                    <td className="py-3 font-bold text-purple-700">{doc.chunkCount || 4} Chunks</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                        APPROVED
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {doc.sourceUrl ? (
                        <a
                          href={doc.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline font-semibold"
                        >
                          View Official Link
                        </a>
                      ) : (
                        <span className="text-gray-400">Internal Document</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. AI CONFIGURATION TAB */}
      {activeTab === 'ai_config' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900">
            OpenRouter & Nemotron AI Engine Configuration
          </h3>
          <div className="space-y-3 max-w-xl text-xs">
            {systemSettings.map((setting) => (
              <div
                key={setting._id}
                className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-gray-900 font-mono">{setting.key}</div>
                  <div className="text-[11px] text-gray-500">{setting.description}</div>
                </div>
                <span className="font-mono font-bold text-brand-700 bg-orange-100 px-2 py-1 rounded-lg">
                  {String(setting.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. AUDIT LOGS TAB */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Administrative & Security Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Target</th>
                  <th className="pb-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2.5 font-bold text-purple-700">{log.action}</td>
                    <td className="py-2.5 text-gray-800">
                      {log.userName} ({log.userRole})
                    </td>
                    <td className="py-2.5 text-gray-600">{log.targetEntity}</td>
                    <td className="py-2.5 text-gray-500 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROVISION STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Provision Authorized Staff Account</h3>

            <form onSubmit={handleProvisionStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Dr. M. A. Fathima"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">University Staff Email *</label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="officer@seu.ac.lk"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Staff Role *</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                  >
                    <option value="FACULTY_OFFICER">Faculty Officer</option>
                    <option value="HOSTEL_WARDEN">Hostel Warden</option>
                    <option value="MAINTENANCE_OFFICER">Maintenance Officer</option>
                    <option value="LIBRARY_OFFICER">Library Officer</option>
                    <option value="CANTEEN_MANAGER">Canteen Manager</option>
                    <option value="HEALTH_CENTRE_OFFICER">Health Centre Officer</option>
                    <option value="SECURITY_OFFICER">Security Officer</option>
                    <option value="STUDENT_WELFARE_OFFICER">Welfare Officer</option>
                    <option value="UNIVERSITY_ADMIN">University Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Scope</label>
                  <input
                    type="text"
                    value={staffForm.assignedScope}
                    onChange={(e) => setStaffForm({ ...staffForm, assignedScope: e.target.value })}
                    placeholder="e.g. Faculty of Technology or Hijra Hostel"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INGEST DOCUMENT MODAL */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Ingest Document into RAG Knowledge Base</h3>

            <form onSubmit={handleIngestDoc} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={ingestForm.title}
                  onChange={(e) => setIngestForm({ ...ingestForm, title: e.target.value })}
                  placeholder="e.g. SEUSL Student Welfare Charter 2026"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Document Type</label>
                  <select
                    value={ingestForm.documentType}
                    onChange={(e) => setIngestForm({ ...ingestForm, documentType: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold"
                  >
                    <option value="HANDBOOK">Handbook</option>
                    <option value="WELFARE_POLICY">Welfare Policy</option>
                    <option value="HOSTEL_RULES">Hostel Rules</option>
                    <option value="LIBRARY_RULES">Library Rules</option>
                    <option value="CANTEEN_POLICY">Canteen Policy</option>
                    <option value="MAINTENANCE_PROCEDURE">Maintenance Procedure</option>
                    <option value="COMPLAINT_PROCEDURE">Complaint Procedure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department Scope</label>
                  <input
                    type="text"
                    value={ingestForm.departmentScope}
                    onChange={(e) => setIngestForm({ ...ingestForm, departmentScope: e.target.value })}
                    placeholder="UNIVERSITY_WIDE"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Official Source URL</label>
                <input
                  type="url"
                  value={ingestForm.sourceUrl}
                  onChange={(e) => setIngestForm({ ...ingestForm, sourceUrl: e.target.value })}
                  placeholder="https://www.seu.ac.lk/publications/..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Document Text Content (Will be chunked & embedded) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={ingestForm.rawText}
                  onChange={(e) => setIngestForm({ ...ingestForm, rawText: e.target.value })}
                  placeholder="Paste official regulation text, policies, and guidelines here..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm"
                >
                  Chunk & Index Vector Chunks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROUTING RULE MODAL */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Create Verified Routing Rule</h3>

            <form onSubmit={handleCreateRoutingRule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="e.g. Science Lab Chemical Safety Routing"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={ruleForm.category}
                    onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                  >
                    <option value="FACULTY_RELATED">FACULTY_RELATED</option>
                    <option value="HOSTEL_ACCOMMODATION">HOSTEL_ACCOMMODATION</option>
                    <option value="LIBRARY">LIBRARY</option>
                    <option value="CANTEEN_FOOD">CANTEEN_FOOD</option>
                    <option value="CAMPUS_MAINTENANCE">CAMPUS_MAINTENANCE</option>
                    <option value="OTHER_SERVICES">OTHER_SERVICES</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Responsible Unit *</label>
                  <select
                    value={ruleForm.responsibleUnit}
                    onChange={(e) => setRuleForm({ ...ruleForm, responsibleUnit: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                  >
                    <option value="Maintenance Division">Maintenance Division</option>
                    <option value="ICT Centre">ICT Centre</option>
                    <option value="Library Services">Library Services</option>
                    <option value="Cafeteria Services">Cafeteria Services</option>
                    <option value="Student Support Services and Welfare">Student Welfare (SSSW)</option>
                    <option value="Health Centre">Health Centre</option>
                    <option value="Security Division">Security Division</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">SLA Escalation Hours</label>
                <input
                  type="number"
                  value={ruleForm.escalationHours}
                  onChange={(e) => setRuleForm({ ...ruleForm, escalationHours: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm"
                >
                  Save Routing Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
