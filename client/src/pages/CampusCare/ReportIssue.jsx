import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import {
  ShieldAlert,
  Upload,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  EyeOff,
  MapPin,
  Building,
} from 'lucide-react';

export const ReportIssue = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Internet and Wi-Fi',
    university: user?.university || 'University of Colombo',
    faculty: user?.faculty || 'Faculty of Computing',
    location: '',
    specificLocation: '',
    priority: 'Medium',
    isAnonymous: false,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    'Hostel and Accommodation',
    'Water Supply',
    'Electricity',
    'Internet and Wi-Fi',
    'Classroom Facilities',
    'Library',
    'Sanitation and Cleanliness',
    'Campus Infrastructure',
    'Safety and Accessibility',
    'Other',
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      setErrorMessage('Please fill in title, detailed description, and general location.');
      return;
    }

    try {
      setSubmitting(true);
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const res = await api.post('/issues', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast('Campus issue report submitted successfully!', 'success');
        navigate(`/campuscare/${res.data.data._id}`);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit report. Please check required fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              Report a Campus Issue
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Provide clear details so campus maintenance and student welfare representatives can take immediate action.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Issue Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Issue Title *
            </label>
            <input
              type="text"
              name="title"
              required
              maxLength={150}
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Wi-Fi Connectivity Dropout in Level 2 Study Hall"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Initial Severity / Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              >
                {priorities.map((pri) => (
                  <option key={pri} value={pri}>
                    {pri} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Specifics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                General Campus Location *
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. New Faculty Complex or Male Hostel B"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Specific Spot / Room / Hall
              </label>
              <input
                type="text"
                name="specificLocation"
                value={formData.specificLocation}
                onChange={handleChange}
                placeholder="e.g. Level 2 Hall W202 or 3rd Floor Washroom"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              />
            </div>
          </div>

          {/* Faculty / University */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Faculty / Department
              </label>
              <input
                type="text"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                placeholder="e.g. Faculty of Computing"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                University
              </label>
              <input
                type="text"
                name="university"
                value={formData.university}
                onChange={handleChange}
                placeholder="University of Colombo"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              />
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail: what is broken, how many students are affected, and any safety hazards..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900 leading-relaxed"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Upload Photographic Proof (Optional, max 5MB)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer px-4 py-2.5 border border-dashed border-gray-300 hover:border-brand-500 rounded-xl bg-gray-50 hover:bg-orange-50/30 text-xs font-bold text-gray-700 flex items-center gap-2 transition-colors">
                <Upload className="w-4 h-4 text-brand-500" />
                <span>Choose Image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <span className="text-xs text-gray-500 truncate max-w-xs">
                  {imageFile.name}
                </span>
              )}
            </div>
            {imagePreview && (
              <div className="mt-3 relative w-36 h-28 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
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

          {/* Anonymous Toggle */}
          <div className="p-4 rounded-2xl bg-campus-bg border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EyeOff className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-xs font-bold text-gray-900">
                  Report Anonymously
                </div>
                <div className="text-[11px] text-gray-500">
                  Hide your real name from public view. Only administrators can inspect origin if needed.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Submit Campus Report</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
