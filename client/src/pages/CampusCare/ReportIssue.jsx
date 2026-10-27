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
  MapPin,
  Building,
  User,
  Hash,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const ReportIssue = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Dynamic organizational metadata fetched from backend
  const [metadata, setMetadata] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form state
  const [categoryKey, setCategoryKey] = useState('FACULTY_RELATED');
  const [subcategory, setSubcategory] = useState('CLASSROOM_EQUIPMENT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Dynamic location fields
  const [selectedFaculty, setSelectedFaculty] = useState(user?.faculty || 'Faculty of Technology');
  const [selectedHostel, setSelectedHostel] = useState('Hijra Hostel');
  const [hostelBlock, setHostelBlock] = useState('Block B');
  const [building, setBuilding] = useState('Technology Complex Block A');
  const [specificRoom, setSpecificRoom] = useState('');
  const [canteenLocation, setCanteenLocation] = useState('Main Campus Canteen Complex, Oluvil');

  // Photographic attachments
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Submission & Confirmation state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoadingMeta(true);
        const res = await api.get('/metadata/organization');
        if (res.data.success) {
          setMetadata(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMetadata();
  }, []);

  // Update subcategories when categoryKey changes
  const activeCategory = metadata?.categories?.find((c) => c.key === categoryKey);
  const availableSubcategories = activeCategory?.subcategories || [];

  useEffect(() => {
    if (availableSubcategories.length > 0) {
      setSubcategory(availableSubcategories[0].name);
    }
  }, [categoryKey]);

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

  // Derive consolidated location string and locationDetails
  const constructLocationData = () => {
    let locString = '';
    let details = {
      locationType: activeCategory?.locationType || 'GENERAL',
      facultyName: '',
      hostelName: '',
      building: '',
      roomOrArea: specificRoom.trim(),
    };

    if (categoryKey === 'HOSTEL_ACCOMMODATION') {
      details.hostelName = selectedHostel;
      details.building = hostelBlock;
      locString = `${selectedHostel}, ${hostelBlock}${specificRoom ? ` - Room ${specificRoom}` : ''}`;
    } else if (categoryKey === 'FACULTY_RELATED') {
      details.facultyName = selectedFaculty;
      details.building = building;
      locString = `${selectedFaculty}, ${building}${specificRoom ? ` (${specificRoom})` : ''}`;
    } else if (categoryKey === 'LIBRARY') {
      details.building = 'Central Library Complex, Oluvil';
      locString = `SEUSL Central Library${specificRoom ? ` - ${specificRoom}` : ''}`;
    } else if (categoryKey === 'CANTEEN_FOOD') {
      details.building = canteenLocation;
      locString = `${canteenLocation}${specificRoom ? ` - ${specificRoom}` : ''}`;
    } else {
      locString = `SEUSL Campus Facilities${specificRoom ? ` - ${specificRoom}` : ''}`;
    }

    return { location: locString, locationDetails: details };
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
      const { location, locationDetails } = constructLocationData();

      const submitData = new FormData();
      submitData.append('title', title.trim());
      submitData.append('description', description.trim());
      submitData.append('category', categoryKey);
      submitData.append('subcategory', subcategory);
      submitData.append('location', location);
      submitData.append('specificLocation', specificRoom.trim());
      submitData.append('locationDetails', JSON.stringify(locationDetails));
      submitData.append('priority', priority);
      submitData.append('isAnonymous', isAnonymous);

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const res = await api.post('/issues', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setShowSummaryModal(false);
        setSubmittedTicket(res.data.data);
        showToast(`Complaint submitted successfully! Ticket #${res.data.ticketNumber}`, 'success');
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
              Your grievance has been validated and routed to the verified university service unit.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Complaint Title:</span>
              <span className="font-bold text-gray-900">{submittedTicket.title}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Assigned Service Unit:</span>
              <span className="font-bold text-brand-600">
                {submittedTicket.routingDecision?.assignedUnit || 'Maintenance Division'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Initial Status:</span>
              <span className="font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                {submittedTicket.status}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Routing Policy Applied:</span>
              <span className="font-medium text-gray-700">
                {submittedTicket.routingDecision?.ruleApplied || 'Verified Standard Scope'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-left text-xs text-orange-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-brand-700">
              <Clock className="w-4 h-4" />
              <span>What Happens Next?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-orange-900">
              1. The assigned service division will acknowledge and inspect the reported facility.
              <br />
              2. You will receive in-app status updates as repairs progress.
              <br />
              3. If clarification is needed, authorized staff will post a question directly to your ticket.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={`/campuscare/${submittedTicket._id}`}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>View Ticket & Timeline</span>
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
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              Submit University Complaint
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            UniConnect SmartResolve · South Eastern University of Sri Lanka (SEUSL)
          </p>
        </div>

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
              <span>Verified Student Record (Read-Only)</span>
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

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Service Category *
              </label>
              <select
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900 font-semibold"
              >
                {metadata?.categories?.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.displayName}
                  </option>
                )) || (
                  <>
                    <option value="FACULTY_RELATED">A. Faculty-Related Issues</option>
                    <option value="HOSTEL_ACCOMMODATION">B. Hostel and Accommodation</option>
                    <option value="LIBRARY">C. Library</option>
                    <option value="CANTEEN_FOOD">D. Canteen and Food Facilities</option>
                    <option value="CAMPUS_MAINTENANCE">E. Campus Maintenance</option>
                    <option value="OTHER_SERVICES">F. Other University Services</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Specific Subcategory *
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900 font-semibold"
              >
                {availableSubcategories.map((sub) => (
                  <option key={sub.name} value={sub.name}>
                    {sub.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DYNAMIC LOCATION FIELDS BASED ON CATEGORY */}
          <div className="p-4 rounded-2xl bg-campus-bg/70 border border-gray-200 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-500" />
              <span>Campus Facility & Location Details</span>
            </div>

            {categoryKey === 'HOSTEL_ACCOMMODATION' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Select Hostel *
                  </label>
                  <select
                    value={selectedHostel}
                    onChange={(e) => setSelectedHostel(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                  >
                    {metadata?.hostels?.map((h) => (
                      <option key={h._id} value={h.name}>
                        {h.name} ({h.gender})
                      </option>
                    )) || (
                      <>
                        <option value="Hijra Hostel">Hijra Hostel (Male)</option>
                        <option value="Al-Aqsa Hostel">Al-Aqsa Hostel (Male)</option>
                        <option value="Bilal Hostel">Bilal Hostel (Male)</option>
                        <option value="Zahira Hostel">Zahira Hostel (Female)</option>
                        <option value="Fathima Hostel">Fathima Hostel (Female)</option>
                        <option value="Zainab Hostel">Zainab Hostel (Female)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Hostel Block / Wing
                  </label>
                  <input
                    type="text"
                    value={hostelBlock}
                    onChange={(e) => setHostelBlock(e.target.value)}
                    placeholder="e.g. Block B or 2nd Floor"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Room / Washroom Area
                  </label>
                  <input
                    type="text"
                    value={specificRoom}
                    onChange={(e) => setSpecificRoom(e.target.value)}
                    placeholder="e.g. Room 204 or Washroom #2"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                  />
                </div>
              </div>
            )}

            {categoryKey === 'FACULTY_RELATED' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Faculty *
                  </label>
                  <select
                    value={selectedFaculty}
                    onChange={(e) => setSelectedFaculty(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                  >
                    {metadata?.faculties?.map((f) => (
                      <option key={f._id} value={f.name}>
                        {f.name} ({f.code})
                      </option>
                    )) || (
                      <>
                        <option value="Faculty of Technology">Faculty of Technology</option>
                        <option value="Faculty of Engineering">Faculty of Engineering</option>
                        <option value="Faculty of Applied Sciences">Faculty of Applied Sciences</option>
                        <option value="Faculty of Management and Commerce">Faculty of Management & Commerce</option>
                        <option value="Faculty of Arts and Culture">Faculty of Arts & Culture</option>
                        <option value="Faculty of Islamic Studies and Arabic Language">Faculty of Islamic Studies</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Building / Complex
                  </label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="e.g. Technology Complex Block A"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Hall / Room / Lab
                  </label>
                  <input
                    type="text"
                    value={specificRoom}
                    onChange={(e) => setSpecificRoom(e.target.value)}
                    placeholder="e.g. Hall W201 or Embedded Lab"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                  />
                </div>
              </div>
            )}

            {categoryKey === 'LIBRARY' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Library Facility
                  </label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900">
                    <option value="Main Library Oluvil">SEUSL Main Library, Oluvil</option>
                    <option value="Sammanthurai Science Library">Sammanthurai Campus Science Library</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Section / Reading Hall
                  </label>
                  <input
                    type="text"
                    value={specificRoom}
                    onChange={(e) => setSpecificRoom(e.target.value)}
                    placeholder="e.g. 1st Floor Periodicals Hall or Digital Lab"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                  />
                </div>
              </div>
            )}

            {categoryKey === 'CANTEEN_FOOD' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Cafeteria Facility *
                  </label>
                  <select
                    value={canteenLocation}
                    onChange={(e) => setCanteenLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                  >
                    <option value="Main Campus Student Canteen, Oluvil">
                      Main Campus Student Canteen, Oluvil
                    </option>
                    <option value="Faculty of Technology Canteen">Faculty of Technology Canteen</option>
                    <option value="Faculty of Applied Sciences Canteen, Sammanthurai">
                      Faculty of Applied Sciences Canteen, Sammanthurai
                    </option>
                    <option value="Staff Cafeteria, Oluvil">Staff Cafeteria, Oluvil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Specific Dining Spot / Station
                  </label>
                  <input
                    type="text"
                    value={specificRoom}
                    onChange={(e) => setSpecificRoom(e.target.value)}
                    placeholder="e.g. South Water Cooler or Counter #2"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                  />
                </div>
              </div>
            )}

            {(categoryKey === 'CAMPUS_MAINTENANCE' || categoryKey === 'OTHER_SERVICES') && (
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Campus Facility / Location Spot *
                </label>
                <input
                  type="text"
                  value={specificRoom}
                  onChange={(e) => setSpecificRoom(e.target.value)}
                  placeholder="e.g. Main Access Road Gate #1, Drainage near Sports Ground, Health Centre Clinic"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                />
              </div>
            )}
          </div>

          {/* Title & Priority */}
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
                placeholder="e.g. Water Supply Pressure Failure in 2nd Floor Washrooms"
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
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900"
              >
                <option value="Low">Low (Routine)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="High">High (Disruptive)</option>
                <option value="Critical">Critical (Safety Hazard)</option>
              </select>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Detailed Complaint Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete details: describe exactly what is malfunctioning, how many students are affected, when the issue began, and any safety hazards..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-brand-500 text-gray-900 leading-relaxed"
            />
          </div>

          {/* Image Upload */}
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
          <div className="p-4 rounded-2xl bg-campus-bg border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EyeOff className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-xs font-bold text-gray-900">Report Anonymously</div>
                <div className="text-[11px] text-gray-500">
                  Hide your name from public view. Internal records remain securely auditable by administrators.
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
            <ShieldAlert className="w-4 h-4" />
            <span>Review Complaint Summary & Submit</span>
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
              Please review your details before submitting to the SEUSL SmartResolve routing system.
            </p>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-400">Reporter:</span>
                <span className="font-semibold text-gray-900">
                  {isAnonymous ? 'Anonymous Student' : user?.name} ({user?.registrationNumber || 'Student'})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-400">Category:</span>
                <span className="font-semibold text-gray-900">{categoryKey}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-400">Location:</span>
                <span className="font-semibold text-gray-900">{constructLocationData().location}</span>
              </div>
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
