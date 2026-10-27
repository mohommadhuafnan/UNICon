import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  ShieldAlert,
  Radio,
  Compass,
  BookOpen,
  Trophy,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  MapPin,
  Bot,
  Send,
  HelpCircle,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'my_complaints' | 'ai_assistant'
  const [loading, setLoading] = useState(true);

  // My complaints
  const [myComplaints, setMyComplaints] = useState([]);
  const [complaintStats, setComplaintStats] = useState({
    total: 0,
    submitted: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
  });

  // AI Policy Assistant state
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.name || 'Student'}! I am the SEUSL SmartResolve Policy & Knowledge Assistant. You can ask me questions about the University Student Handbook, hostel quiet hours, cafeteria food safety rules, or check the status of your complaint ticket.`,
      sources: [],
    },
  ]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues', { params: { myOnly: 'true', limit: 30 } });
      if (res.data.success) {
        const issues = res.data.data || [];
        setMyComplaints(issues);

        setComplaintStats({
          total: issues.length,
          submitted: issues.filter((i) => ['SUBMITTED', 'Reported'].includes(i.status)).length,
          assigned: issues.filter((i) => ['ASSIGNED', 'ACKNOWLEDGED'].includes(i.status)).length,
          inProgress: issues.filter((i) => ['IN_PROGRESS', 'In Progress'].includes(i.status)).length,
          resolved: issues.filter((i) => ['RESOLVED', 'Resolved', 'CLOSED', 'Closed'].includes(i.status)).length,
        });
      }
    } catch (err) {
      console.error('Error fetching student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim() || aiLoading) return;

    const userMessage = aiQuery.trim();
    setAiQuery('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    try {
      const res = await api.post('/agent/chat', {
        message: userMessage,
        history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
      });

      if (res.data.success) {
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.reply,
            sources: res.data.sources || [],
          },
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered an error retrieving policy documents. Please ensure your query is specific or check with your Faculty Office.',
          sources: [],
        },
      ]);
    } finally {
      setAiLoading(false);
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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-brand-500 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SmartResolve · South Eastern University of Sri Lanka</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
            {user?.faculty || 'Faculty of Technology'} · Registration: <span className="font-mono font-bold">{user?.registrationNumber || user?.studentId || 'TG/2022/1042'}</span>
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-gray-200 shadow-sm text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('my_complaints')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'my_complaints'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>My Complaints</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current font-bold">
              {complaintStats.total}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ai_assistant')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'ai_assistant'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Knowledge Assistant</span>
          </button>
        </div>

        <Link
          to="/campuscare/report"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Campus Issue</span>
        </Link>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards (From real database records) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Total Filed
              </div>
              <div className="text-2xl font-black text-gray-900 mt-1">{complaintStats.total}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Campus complaints logged</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-xs text-purple-700 font-semibold uppercase tracking-wider">
                Assigned
              </div>
              <div className="text-2xl font-black text-purple-700 mt-1">{complaintStats.assigned}</div>
              <div className="text-[11px] text-purple-600 mt-0.5">Routed to service unit</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-xs text-amber-700 font-semibold uppercase tracking-wider">
                In Progress
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1">{complaintStats.inProgress}</div>
              <div className="text-[11px] text-amber-600 mt-0.5">Repairs underway</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-xs text-status-success font-semibold uppercase tracking-wider">
                Resolved
              </div>
              <div className="text-2xl font-black text-status-success mt-1">{complaintStats.resolved}</div>
              <div className="text-[11px] text-green-600 mt-0.5">Completed by staff</div>
            </div>
          </div>

          {/* Recent My Complaints list */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-brand-500" />
                <span>My Active Complaints & Work Orders</span>
              </h3>
              <button
                onClick={() => setActiveTab('my_complaints')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                View All ({complaintStats.total})
              </button>
            </div>

            {myComplaints.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-xs text-gray-400">You have not submitted any complaints yet.</p>
                <Link
                  to="/campuscare/report"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  <span>Submit your first complaint</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myComplaints.slice(0, 5).map((comp) => (
                  <Link
                    key={comp._id}
                    to={`/campuscare/${comp._id}`}
                    className="block p-4 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-orange-50/40 hover:border-brand-200 transition-all text-left"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-brand-700">
                          #{comp.ticketNumber}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase">
                          {comp.category}
                        </span>
                      </div>
                      <StatusBadge status={comp.status} />
                    </div>
                    <div className="text-xs font-bold text-gray-900 line-clamp-1">{comp.title}</div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {comp.location}
                      </span>
                      <span className="text-gray-500">
                        Assigned: <strong className="text-gray-700">{comp.routingDecision?.assignedUnit || 'Maintenance'}</strong>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY COMPLAINTS TAB */}
      {activeTab === 'my_complaints' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">
              All My Submitted Complaints ({myComplaints.length})
            </h3>
            <button
              onClick={fetchDashboardData}
              className="text-xs text-gray-500 hover:text-brand-600 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {myComplaints.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No complaint tickets logged on your account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Ticket ID & Title</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Assigned Unit</th>
                    <th className="pb-3">Urgency</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myComplaints.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 max-w-xs">
                        <div className="font-mono font-bold text-brand-700 text-xs">
                          #{c.ticketNumber}
                        </div>
                        <div className="font-bold text-gray-900 line-clamp-1">{c.title}</div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 text-gray-600">{c.location}</td>
                      <td className="py-3.5 font-medium text-purple-700">
                        {c.routingDecision?.assignedUnit || 'Maintenance Division'}
                      </td>
                      <td className="py-3.5">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to={`/campuscare/${c._id}`}
                          className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-brand-600 font-bold text-xs inline-flex items-center gap-1"
                        >
                          <span>Track</span>
                          <ArrowRight className="w-3 h-3" />
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

      {/* AI ASSISTANT / UNIVERSITY KNOWLEDGE CENTRE TAB */}
      {activeTab === 'ai_assistant' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                SEUSL Campus Knowledge & Policy Assistant
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ask questions about university policies, hostel regulations, cafeteria food safety, and check ticket resolution timelines grounded in official documentation.
            </p>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto space-y-3 p-4 rounded-2xl bg-gray-50/70 border border-gray-200">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Grounded Source Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100 space-y-1">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-brand-500" />
                        <span>Verified Citations:</span>
                      </div>
                      {msg.sources.map((src, sIdx) => (
                        <div key={sIdx} className="text-[11px] text-brand-700 font-medium">
                          • {src.title}{' '}
                          {src.url && (
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] underline text-blue-600 ml-1"
                            >
                              (view source)
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {aiLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 p-2">
                <div className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span>Searching verified SEUSL knowledge chunks...</span>
              </div>
            )}
          </div>

          {/* Suggested Quick Queries */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-[11px] text-gray-400 font-semibold self-center">Try asking:</span>
            <button
              type="button"
              onClick={() => setAiQuery('What are the official quiet hours for student hostels?')}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px]"
            >
              Hostel quiet hours?
            </button>
            <button
              type="button"
              onClick={() => setAiQuery('What is the service resolution SLA for hostel water supply disruptions?')}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px]"
            >
              Water outage repair SLA?
            </button>
            <button
              type="button"
              onClick={() => setAiQuery('How are canteen food hygiene complaints escalated?')}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px]"
            >
              Canteen food hygiene protocols?
            </button>
          </div>

          {/* Question Input Form */}
          <form onSubmit={handleAskAI} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask a question about university procedures or enter a ticket ID (e.g. SEUSL-2026-00101)..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuery.trim()}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
