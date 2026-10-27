import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layers, Lock, Mail, ArrowRight, ArrowLeft, Shield, Sparkles } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, demoLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await login(email, password);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'admin'].includes(res.user.role)) {
        navigate('/admin', { replace: true });
      } else if (res.user.role !== 'STUDENT' && res.user.role !== 'student') {
        navigate('/staff', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (role) => {
    try {
      setSubmitting(true);
      setErrorMessage('');
      const res = await demoLogin(role);
      showToast(`Logged in as ${res.user.name} (${res.user.role})`, 'success');
      if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'admin'].includes(res.user.role)) {
        navigate('/admin', { replace: true });
      } else if (res.user.role !== 'STUDENT' && res.user.role !== 'student') {
        navigate('/staff', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMessage('Failed to log in with demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-10 px-4">
      <div className="max-w-xl w-full mb-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to UniConnect</span>
        </Link>
      </div>

      <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Sign In to UniConnect SmartResolve
          </h1>
          <p className="text-xs text-gray-500">
            South Eastern University of Sri Lanka (SEUSL) · Campus Intelligence Platform
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              University Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@seu.ac.lk"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click SEUSL Role Switchers */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              1-Click Verified Role Demonstration:
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <button
              type="button"
              onClick={() => handleQuickDemo('STUDENT')}
              className="p-2 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-orange-50/50 transition-all"
            >
              <div className="text-[11px] font-bold text-gray-900">Student</div>
              <div className="text-[10px] text-gray-400 truncate">Kasun Perera (FOT)</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('SUPER_ADMIN')}
              className="p-2 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50/50 transition-all"
            >
              <div className="text-[11px] font-bold text-red-700">Super Admin</div>
              <div className="text-[10px] text-gray-400 truncate">SEUSL Administrator</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('FACULTY_OFFICER')}
              className="p-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              <div className="text-[11px] font-bold text-blue-700">Faculty Officer</div>
              <div className="text-[10px] text-gray-400 truncate">Dr. M. A. Fathima</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('HOSTEL_WARDEN')}
              className="p-2 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all"
            >
              <div className="text-[11px] font-bold text-amber-700">Hostel Warden</div>
              <div className="text-[10px] text-gray-400 truncate">Hijra Hostel Warden</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('MAINTENANCE_OFFICER')}
              className="p-2 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
            >
              <div className="text-[11px] font-bold text-emerald-700">Maintenance</div>
              <div className="text-[10px] text-gray-400 truncate">Works Engineer</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('CANTEEN_MANAGER')}
              className="p-2 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all"
            >
              <div className="text-[11px] font-bold text-purple-700">Canteen Manager</div>
              <div className="text-[10px] text-gray-400 truncate">Cafeteria Supervisor</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('LIBRARY_OFFICER')}
              className="p-2 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
            >
              <div className="text-[11px] font-bold text-indigo-700">Library Officer</div>
              <div className="text-[10px] text-gray-400 truncate">Senior Librarian</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('STUDENT_WELFARE_OFFICER')}
              className="p-2 rounded-xl border border-gray-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all"
            >
              <div className="text-[11px] font-bold text-rose-700">Welfare Officer</div>
              <div className="text-[10px] text-gray-400 truncate">Senior Counselor</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          New Student?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
