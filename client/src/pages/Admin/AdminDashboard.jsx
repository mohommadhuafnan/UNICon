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
  Radio,
  Compass,
  BookOpen,
  Trophy,
  MessageSquareQuote,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart2,
  Search,
  Filter,
  Edit,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Users tab state
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');

  // Issues tab state
  const [adminIssues, setAdminIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // Selected issue for status modal
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      showToast('Error loading administration statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = {};
      if (userRoleFilter !== 'All') params.role = userRoleFilter;
      if (userSearch.trim()) params.search = userSearch.trim();

      const res = await api.get('/admin/users', { params });
      if (res.data.success) {
        setUsersList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAdminIssues = async () => {
    try {
      setIssuesLoading(true);
      const res = await api.get('/issues', { params: { limit: 20 } });
      if (res.data.success) {
        setAdminIssues(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
    } finally {
      setIssuesLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'admin') {
      fetchUsers();
    } else if (activeTab === 'issues') {
      fetchAdminIssues();
    }
  }, [activeTab, userRoleFilter, userSearch]);

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await api.patch(`/admin/users/${targetUserId}/role`, { role: newRole });
      if (res.data.success) {
        showToast(`User role updated to ${newRole.toUpperCase()}`, 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast('Error updating user role', 'error');
    }
  };

  const handleUpdateIssueStatus = async (e) => {
    e.preventDefault();
    if (!selectedIssue || !newStatus) return;

    try {
      setSubmittingStatus(true);
      const res = await api.patch(`/issues/${selectedIssue._id}/status`, {
        status: newStatus,
        note: statusNote,
      });

      if (res.data.success) {
        showToast(`Issue status changed to ${newStatus}`, 'success');
        setSelectedIssue(null);
        setStatusNote('');
        fetchAdminIssues();
        fetchStats();
      }
    } catch (err) {
      showToast('Error updating issue status', 'error');
    } finally {
      setSubmittingStatus(false);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Administrative Control Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
              {user?.role?.toUpperCase()} Privileges
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Review campus reports, assign work orders, moderate student suggestions, and oversee university operations.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-gray-200 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'issues' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            CampusCare Tickets
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'users' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              User Management
            </button>
          )}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[11px] font-bold text-gray-500 uppercase">
                Registered Community
              </div>
              <div className="text-2xl font-black text-gray-900 mt-1">
                {stats?.totalUsers || 0}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {stats?.studentsCount || 0} Students · {stats?.staffCount || 0} Staff
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[11px] font-bold text-amber-700 uppercase">
                Open Reports
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {stats?.openIssues || 0}
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">Awaiting resolution</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[11px] font-bold text-status-success uppercase">
                Resolved Issues
              </div>
              <div className="text-2xl font-black text-status-success mt-1">
                {stats?.resolvedIssues || 0}
              </div>
              <div className="text-[10px] text-green-600 mt-0.5">
                {stats?.resolutionRate || 0}% Clearance rate
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-[11px] font-bold text-purple-700 uppercase">
                Student Suggestions
              </div>
              <div className="text-2xl font-black text-purple-700 mt-1">
                {stats?.totalFeedback || 0}
              </div>
              <div className="text-[10px] text-purple-600 mt-0.5">
                {stats?.pendingFeedback || 0} Awaiting review
              </div>
            </div>
          </div>

          {/* Module Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
              <Radio className="w-6 h-6 text-brand-500" />
              <div>
                <div className="text-lg font-bold text-gray-900">{stats?.totalAnnouncements || 0}</div>
                <div className="text-xs text-gray-400 font-medium">Published Notices</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
              <Compass className="w-6 h-6 text-blue-500" />
              <div>
                <div className="text-lg font-bold text-gray-900">{stats?.activeOpportunities || 0}</div>
                <div className="text-xs text-gray-400 font-medium">Active Opportunities</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-emerald-500" />
              <div>
                <div className="text-lg font-bold text-gray-900">{stats?.totalResources || 0}</div>
                <div className="text-xs text-gray-400 font-medium">Shared Resources</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-purple-500" />
              <div>
                <div className="text-lg font-bold text-gray-900">{stats?.upcomingEvents || 0}</div>
                <div className="text-xs text-gray-400 font-medium">Upcoming Events</div>
              </div>
            </div>
          </div>

          {/* Category distribution */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              CampusCare Issue Categories Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats?.issuesByCategory?.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-campus-bg border border-gray-200 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-gray-800">{cat.category}</span>
                  <span className="font-bold text-brand-600 bg-orange-100 px-2 py-0.5 rounded-full">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ISSUES MANAGEMENT TAB */}
      {activeTab === 'issues' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">
              Manage CampusCare Tickets & Workflow Status
            </h3>
            <span className="text-xs text-gray-400">
              Showing {adminIssues.length} active tickets
            </span>
          </div>

          {issuesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Title & Category</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3">Current Status</th>
                    <th className="pb-3">Affected Students</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adminIssues.map((issue) => (
                    <tr key={issue._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 max-w-xs">
                        <div className="font-bold text-gray-900 line-clamp-1">
                          {issue.title}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {issue.category} · {new Date(issue.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">
                        {issue.location}
                      </td>
                      <td className="py-3">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="py-3">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="py-3 font-semibold text-brand-600">
                        {issue.supportCount || 0} Affected
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedIssue(issue);
                            setNewStatus(issue.status);
                            setStatusNote('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200"
                        >
                          Change Status
                        </button>
                        <Link
                          to={`/campuscare/${issue._id}`}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
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
      )}

      {/* USER MANAGEMENT TAB (Admin only) */}
      {activeTab === 'users' && user?.role === 'admin' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">
              User Directory & Role Permissions
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name or email..."
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
              >
                <option value="All">All Roles</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Faculty / Department</th>
                    <th className="pb-3">Student / Staff ID</th>
                    <th className="pb-3">Active Role</th>
                    <th className="pb-3 text-right">Modify Permission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 font-bold text-gray-900">
                        {u.name}
                      </td>
                      <td className="py-3 text-gray-500 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3 text-gray-600">
                        {u.faculty || 'Campus General'}
                      </td>
                      <td className="py-3 text-gray-500 font-mono">
                        {u.studentId || '-'}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : u.role === 'staff'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'organizer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white text-gray-800 font-semibold focus:border-brand-500"
                        >
                          <option value="student">Student</option>
                          <option value="staff">Staff</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Change Status Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Update Status: {selectedIssue.title}
            </h3>

            <form onSubmit={handleUpdateIssueStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                >
                  <option value="Reported">Reported</option>
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Audit Explanation / Work Order Note
                </label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched ICTC technician to repair fiber switch."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-70"
                >
                  {submittingStatus ? 'Updating...' : 'Save & Notify Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
