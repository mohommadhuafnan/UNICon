import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import {
  User,
  Mail,
  GraduationCap,
  Building,
  Shield,
  Edit2,
  CheckCircle,
  Save,
  Sparkles,
} from 'lucide-react';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    faculty: user?.faculty || '',
    department: user?.department || '',
    interests: user?.interests ? user?.interests.join(', ') : '',
  });

  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const interestsArray = formData.interests
        ? formData.interests.split(',').map((i) => i.trim())
        : [];

      const res = await api.put('/auth/profile', {
        name: formData.name,
        bio: formData.bio,
        faculty: formData.faculty,
        department: formData.department,
        interests: interestsArray,
      });

      if (res.data.success) {
        updateUser(res.data.user);
        showToast('Profile updated successfully!', 'success');
        setEditing(false);
      }
    } catch (err) {
      showToast('Error updating profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 font-extrabold text-2xl flex items-center justify-center border border-brand-200 shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                  {user?.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-brand-700">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {user?.email} · {user?.studentId || 'ID: Active'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{editing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Faculty
                </label>
                <input
                  type="text"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Bio / Status Note
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Academic & Extracurricular Interests (comma-separated)
              </label>
              <input
                type="text"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                placeholder="e.g. Hackathons, Cloud Computing, Sports, Student Welfare"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-70 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{submitting ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-campus-bg border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  University
                </span>
                <div className="font-bold text-gray-900 text-sm mt-0.5">
                  {user?.university || 'University of Colombo'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-campus-bg border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Faculty & Department
                </span>
                <div className="font-bold text-gray-900 text-sm mt-0.5">
                  {user?.faculty || 'Faculty of Computing'}
                </div>
                <div className="text-gray-500 text-[11px]">
                  {user?.department || 'Computer Science'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-campus-bg border border-gray-100 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                About / Bio
              </span>
              <p className="text-gray-700 leading-relaxed">
                {user?.bio || 'No bio provided yet.'}
              </p>
            </div>

            {user?.interests && user?.interests.length > 0 && (
              <div className="p-4 rounded-2xl bg-campus-bg border border-gray-100 space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Interests & Focus Areas
                </span>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-orange-100 text-brand-800 text-[11px] font-semibold"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
