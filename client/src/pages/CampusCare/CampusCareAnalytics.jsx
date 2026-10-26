import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  BarChart2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const CampusCareAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/issues/analytics');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const COLORS = ['#F56527', '#2563EB', '#15803D', '#D97706', '#8B5CF6', '#EC4899', '#06B6D4'];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-36 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/campuscare"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CampusCare Hub</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center font-bold">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              CampusCare Analytics & Intelligence
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Aggregated real-time metrics showing recurring campus issue patterns, resolution rates, and infrastructure bottlenecks.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Reported Issues
            </div>
            <div className="text-3xl font-black text-gray-900 mt-1">
              {data?.totalIssues || 0}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Campus tickets logged</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-brand-600 flex items-center justify-center border border-brand-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Successfully Resolved
            </div>
            <div className="text-3xl font-black text-status-success mt-1">
              {data?.resolvedIssues || 0}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Closed by maintenance</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-status-success flex items-center justify-center border border-green-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Resolution Efficiency
            </div>
            <div className="text-3xl font-black text-blue-600 mt-1">
              {data?.resolutionRate || 0}%
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Overall clearance rate</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Campus Issues by Category
            </h3>
            <span className="text-xs text-gray-400">Total breakdown</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.byCategory || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
              >
                <XAxis
                  dataKey="name"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#F56527" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issues by Status Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Current Issue Workflow Statuses
            </h3>
            <span className="text-xs text-gray-400">Live operational state</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.byStatus || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {(data?.byStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recurring Hotspot Locations */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-500" />
          <h3 className="text-sm font-bold text-gray-900">
            Top Recurring Campus Issue Locations
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {data?.locationTrends?.map((loc, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-campus-bg border border-gray-200 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-gray-900 truncate max-w-[180px]">
                  {loc.location}
                </div>
                <div className="text-[11px] text-gray-500">Campus Facility</div>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-orange-100 text-brand-700 font-bold text-xs">
                {loc.count} tickets
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
