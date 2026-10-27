import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Layers,
  Lock,
  Mail,
  User,
  GraduationCap,
  Building,
  Hash,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    registrationNumber: '',
    faculty: 'Faculty of Technology',
    department: 'Information & Communication Technology',
    degreeProgramme: 'Bachelor of Information and Communication Technology (Honours)',
    academicYear: '2022/2023',
    contactNumber: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const faculties = [
    {
      name: 'Faculty of Technology',
      code: 'FOT',
      defaultDept: 'Information & Communication Technology',
      defaultDegree: 'Bachelor of Information and Communication Technology (Honours)',
      prefix: 'TG',
    },
    {
      name: 'Faculty of Engineering',
      code: 'FOE',
      defaultDept: 'Civil Engineering',
      defaultDegree: 'Bachelor of Science in Engineering (Honours)',
      prefix: 'EG',
    },
    {
      name: 'Faculty of Applied Sciences',
      code: 'FAS',
      defaultDept: 'Physical Sciences',
      defaultDegree: 'Bachelor of Science in Applied Sciences',
      prefix: 'AS',
    },
    {
      name: 'Faculty of Management and Commerce',
      code: 'FMC',
      defaultDept: 'Management',
      defaultDegree: 'Bachelor of Business Administration (BBA)',
      prefix: 'MC',
    },
    {
      name: 'Faculty of Arts and Culture',
      code: 'FAC',
      defaultDept: 'Social Sciences',
      defaultDegree: 'Bachelor of Arts (Honours)',
      prefix: 'AC',
    },
    {
      name: 'Faculty of Islamic Studies and Arabic Language',
      code: 'FIA',
      defaultDept: 'Islamic Studies',
      defaultDegree: 'Bachelor of Arts in Islamic Studies',
      prefix: 'IA',
    },
  ];

  const handleFacultyChange = (e) => {
    const selectedFac = faculties.find((f) => f.name === e.target.value);
    setFormData((prev) => ({
      ...prev,
      faculty: e.target.value,
      department: selectedFac ? selectedFac.defaultDept : prev.department,
      degreeProgramme: selectedFac ? selectedFac.defaultDegree : prev.degreeProgramme,
    }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage('Please fill in your full name, university email, and password.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!formData.registrationNumber.trim()) {
      setErrorMessage('Please provide your university registration number (e.g. TG/2022/1042).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        registrationNumber: formData.registrationNumber.toUpperCase(),
        faculty: formData.faculty,
        department: formData.department,
        degreeProgramme: formData.degreeProgramme,
        academicYear: formData.academicYear,
        contactNumber: formData.contactNumber,
      });

      showToast(res?.message || 'Registration successful! Welcome to UniConnect SEUSL.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Registration failed. Please check inputs.');
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
            Student Registration Portal
          </h1>
          <p className="text-xs text-gray-500">
            South Eastern University of Sri Lanka (SEUSL) · SmartResolve Platform
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Kasun Mihiranga Perera"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              />
            </div>
          </div>

          {/* Email & Registration Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                University Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@seu.ac.lk"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Registration Number *
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="registrationNumber"
                  required
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="e.g. TG/2022/1042"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900 uppercase font-mono"
                />
              </div>
            </div>
          </div>

          {/* Faculty & Academic Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Faculty *
              </label>
              <select
                name="faculty"
                value={formData.faculty}
                onChange={handleFacultyChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              >
                {faculties.map((f) => (
                  <option key={f.code} value={f.name}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Academic Batch / Year *
              </label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              >
                <option value="2023/2024">2023/2024 (1st Year)</option>
                <option value="2022/2023">2022/2023 (2nd Year)</option>
                <option value="2021/2022">2021/2022 (3rd Year)</option>
                <option value="2020/2021">2020/2021 (4th Year / Final)</option>
              </select>
            </div>
          </div>

          {/* Degree Programme & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Degree Programme
              </label>
              <input
                type="text"
                name="degreeProgramme"
                value={formData.degreeProgramme}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="+94 77 123 4567"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Password (min. 6 chars) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-[11px] text-orange-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
            <span>
              Your registration number and faculty will be validated against the university student record system and locked to your official complaint tickets.
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Student Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
