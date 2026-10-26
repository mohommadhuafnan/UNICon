import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layers, Lock, Mail, ArrowRight, ArrowLeft, UserCheck, Shield, Sparkles } from 'lucide-react';

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
      navigate(from, { replace: true });
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
      showToast(`Logged in as ${res.user.name} (${role.toUpperCase()})`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage('Failed to log in with demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-10 px-4">
      <div className="max-w-md w-full mb-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to UniConnect</span>
        </Link>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Sign in to UniConnect
          </h1>
          <p className="text-xs text-gray-500">
            Enter your university credentials to access the intelligence platform
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
              University Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@uniconnect.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-gray-900 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-gray-900 transition-colors"
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

        {/* Quick Demo Logins for Instant Testing */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-500" />
              Instant 1-Click Demo Login:
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left">
            <button
              type="button"
              onClick={() => handleQuickDemo('student')}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-orange-50/50 transition-all"
            >
              <div className="text-xs font-bold text-gray-900">Student</div>
              <div className="text-[10px] text-gray-500 truncate">Kasun Perera</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('staff')}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-orange-50/50 transition-all"
            >
              <div className="text-xs font-bold text-gray-900">Staff</div>
              <div className="text-[10px] text-gray-500 truncate">Dr. Jayawardena</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('organizer')}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-orange-50/50 transition-all"
            >
              <div className="text-xs font-bold text-gray-900">Organizer</div>
              <div className="text-[10px] text-gray-500 truncate">Malith (IEEE)</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-orange-50/50 transition-all"
            >
              <div className="text-xs font-bold text-gray-900">Administrator</div>
              <div className="text-[10px] text-gray-500 truncate">UniConnect Admin</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
