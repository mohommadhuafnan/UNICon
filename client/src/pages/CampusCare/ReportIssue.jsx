import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import {
  ShieldAlert,
  Upload,
  ArrowLeft,
  CheckCircle,
  EyeOff,
  User,
  Sparkles,
  Bot,
  Send,
  Building,
  BookOpen,
  Home,
  Coffee,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const ReportIssue = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Mode: 'agent' (AI Autonomous Decision Routing) vs 'manual' (Direct targeted officer selection)
  const [submissionMode, setSubmissionMode] = useState('agent');

  // Manual mode state
  const [targetOfficerRole, setTargetOfficerRole] = useState('FACULTY_OFFICER');

  // Common form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [specificRoom, setSpecificRoom] = useState('');

  // Photographic attachments
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Agent interactive simulation / preview state
  const [agentAnalyzing, setAgentAnalyzing] = useState(false);
  const [agentDecision, setAgentDecision] = useState(null);

  // Submission state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const officerOptions = [
    {
      role: 'FACULTY_OFFICER',
      label: 'Faculty Officer',
      icon: Building,
      desc: 'Lecture halls, multimedia projectors, lab computers, departmental matters',
      color: 'border-blue-200 bg-blue-50/40 text-blue-800',
      activeColor: 'ring-2 ring-blue-600 bg-blue-50 border-blue-500',
    },
    {
      role: 'LIBRARY_OFFICER',
      label: 'Library Officer',
      icon: BookOpen,
      desc: 'Books, periodicals, silent study rooms, air conditioning, digital lending',
      color: 'border-indigo-200 bg-indigo-50/40 text-indigo-800',
      activeColor: 'ring-2 ring-indigo-600 bg-indigo-50 border-indigo-500',
    },
    {
      role: 'HOSTEL_WARDEN',
      label: 'Hostel Warden',
      icon: Home,
      desc: 'Residential halls (Hijra, Zahira, etc.), dorm rooms, water tanks, electricity',
      color: 'border-amber-200 bg-amber-50/40 text-amber-800',
      activeColor: 'ring-2 ring-amber-600 bg-amber-50 border-amber-500',
    },
    {
      role: 'CANTEEN_MANAGER',
      label: 'Canteen Manager',
      icon: Coffee,
      desc: 'Student cafeteria, dining hygiene, food freshness, meal pricing, water cooler',
      color: 'border-purple-200 bg-purple-50/40 text-purple-800',
      activeColor: 'ring-2 ring-purple-600 bg-purple-50 border-purple-500',
    },
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must be less than 5MB', 'error');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenReview = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim() || !description.trim()) {
      setErrorMessage('Please provide a complaint title and detailed description.');
      return;
    }

    setShowSummaryModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      const submitData = new FormData();
      submitData.append('title', title.trim());
      submitData.append('description', description.trim());
      submitData.append('submissionMode', submissionMode);
      submitData.append('targetOfficerRole', targetOfficerRole);
      submitData.append('priority', priority);
      submitData.append('isAnonymous', isAnonymous);
      submitData.append('specificLocation', specificRoom.trim());

      const derivedLoc = specificRoom.trim()
        ? `SEUSL Campus - ${specificRoom.trim()}`
        : `${user?.faculty || 'SEUSL Campus'}`;
      submitData.append('location', derivedLoc);

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const res = await api.post('/issues', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setShowSummaryModal(false);
        setSubmittedTicket(res.data.data);
        showToast(
          `Complaint submitted successfully! Ticket #${res.data.ticketNumber}`,
          'success'
        );
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit complaint. Please check required fields.'
      );
      setShowSummaryModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (submittedTicket) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-white rounded-3xl p-8 border border-green-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-green-50 border border-green-200 text-status-success flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 uppercase tracking-wider">
              Official Complaint Ticket Registered
            </span>
            <h1 className="text-3xl font-black text-gray-900 mt-2 font-mono">
              #{submittedTicket.ticketNumber}
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Your grievance has been successfully routed and notification sent to the responsible university official.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Complaint Title:</span>
              <span className="font-bold text-gray-900">{submittedTicket.title}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Routing Decision:</span>
              <span className="font-bold text-brand-600">
                {submittedTicket.routingDecision?.assignedUnit || 'Assigned Officer'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Assigned Official:</span>
              <span className="font-bold text-purple-700">
                {submittedTicket.routingDecision?.assignedStaffName || 'Officer Queue'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Routing Method:</span>
              <span className="font-semibold text-gray-700">
                {submittedTicket.routingDecision?.ruleApplied || 'Targeted Routing'}
              </span>
            </div>
            {submittedTicket.routingDecision?.reason && (
              <div className="py-1">
                <span className="text-gray-500 block mb-0.5">Agent Reasoning:</span>
                <span className="text-gray-700 italic bg-white p-2 rounded-lg border border-gray-200 block">
                  "{submittedTicket.routingDecision.reason}"
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={`/campuscare/${submittedTicket._id}`}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>View Ticket Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50"
            >
              Return to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-brand-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                Submit University Complaint
              </h1>
              <p className="text-xs text-gray-500">
                UniConnect SmartResolve · South Eastern University of Sri Lanka (SEUSL)
              </p>
            </div>
          </div>
        </div>

        {/* 2 COMPLAINT SUBMISSION MODES (AI AGENT vs MANUAL TARGETED) */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setSubmissionMode('agent')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              submissionMode === 'agent'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>AI Agent Decision Routing</span>
          </button>

          <button
            type="button"
            onClick={() => setSubmissionMode('manual')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              submissionMode === 'manual'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4 text-purple-600" />
            <span>Manual Targeted Routing</span>
          </button>
        </div>

        {/* MODE BANNER */}
        {submissionMode === 'agent' ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 flex items-start gap-3">
            <Bot className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-gray-900">
                Google Gemini AI Intelligent Decision-Maker Active
              </div>
              <div className="text-gray-600 mt-0.5 leading-relaxed">
                Type your complaint naturally. Our Gemini AI agent will read, understand the context (e.g. library books, hostel water leak, canteen food, lecture projector), make the routing decision, and dispatch it to the exact responsible officer automatically.
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-start gap-3">
            <Building className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-gray-900">Manual Direct Officer Selection</div>
              <div className="text-gray-600 mt-0.5 leading-relaxed">
                Select specifically which university official should receive and resolve this complaint.
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleOpenReview} className="space-y-5">
          {/* Read-Only Verified Student Credentials */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-500" />
              <span>Verified Student Record</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">Student Full Name</span>
                <span className="font-bold text-gray-800">{user?.name || 'Kasun Perera'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Registration Number</span>
                <span className="font-mono font-bold text-brand-700">
                  {user?.registrationNumber || user?.studentId || 'TG/2022/1042'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Faculty</span>
                <span className="font-semibold text-gray-800">
                  {user?.faculty || 'Faculty of Technology'}
                </span>
              </div>
            </div>
          </div>

          {/* MANUAL MODE: SELECT THE TARGET ROLE */}
          {submissionMode === 'manual' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                Select Destination University Official *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {officerOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = targetOfficerRole === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setTargetOfficerRole(opt.role)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? `${opt.activeColor} shadow-xs`
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-white shadow-xs' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Icon className="w-5 h-5 text-gray-800" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gray-900">{opt.label}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Title & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Complaint Title *
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  submissionMode === 'agent'
                    ? 'e.g. Missing reference books on 2nd floor or Water leak in Hijra hostel'
                    : 'e.g. Projector power failure in lecture room'
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Initial Urgency
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900 font-semibold"
              >
                <option value="Low">Low (Routine)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="High">High (Urgent)</option>
                <option value="Critical">Critical (Immediate Hazard)</option>
              </select>
            </div>
          </div>

          {/* Location Spot */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Specific Room / Location (Optional)
            </label>
            <input
              type="text"
              value={specificRoom}
              onChange={(e) => setSpecificRoom(e.target.value)}
              placeholder="e.g. Hall W201, Hijra Block B Room 304, Central Library 2nd Floor, or Student Canteen Counter 1"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
            />
          </div>

          {/* Detailed Complaint Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Detailed Complaint Description *</span>
              {submissionMode === 'agent' && (
                <span className="text-[11px] font-semibold text-brand-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Gemini AI understands natural language
                </span>
              )}
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe exactly what happened or what is malfunctioning. Example: 'The books in the 3rd floor computer science section have torn and missing pages', or 'The dining hall food was stale and overpriced'..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900 leading-relaxed"
            />
          </div>

          {/* Photographic Evidence */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Photographic Evidence (Optional, max 5MB)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer px-4 py-2.5 border border-dashed border-gray-300 hover:border-brand-500 rounded-xl bg-gray-50 hover:bg-orange-50/30 text-xs font-bold text-gray-700 flex items-center gap-2 transition-colors">
                <Upload className="w-4 h-4 text-brand-500" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <span className="text-xs text-gray-500 truncate max-w-xs">{imageFile.name}</span>
              )}
            </div>
            {imagePreview && (
              <div className="mt-3 relative w-36 h-28 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-[10px]"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Anonymous Option */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EyeOff className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-xs font-bold text-gray-900">Report Anonymously</div>
                <div className="text-[11px] text-gray-500">
                  Hide your name from public display. Internal records remain securely recorded.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
          >
            {submissionMode === 'agent' ? (
              <>
                <Zap className="w-4 h-4" />
                <span>Submit with AI Agent Decision Routing</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Submit Targeted Complaint</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* SUMMARY CONFIRMATION MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-brand-600">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">Confirm Complaint Submission</h3>
            </div>

            <p className="text-xs text-gray-500">
              Review your complaint details before sending to the SEUSL SmartResolve system.
            </p>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-400">Reporter:</span>
                <span className="font-semibold text-gray-900">
                  {isAnonymous ? 'Anonymous Student' : user?.name}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-400">Mode:</span>
                <span className="font-bold text-brand-600 uppercase">
                  {submissionMode === 'agent' ? 'AI Agent Decision' : 'Manual Targeted'}
                </span>
              </div>
              {submissionMode === 'manual' && (
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-400">Destination Official:</span>
                  <span className="font-bold text-purple-700">{targetOfficerRole}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-400">Title:</span>
                <span className="font-bold text-gray-900">{title}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Urgency:</span>
                <span className="font-bold uppercase text-brand-700">{priority}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs disabled:opacity-70 flex items-center gap-1.5"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Generate Ticket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
