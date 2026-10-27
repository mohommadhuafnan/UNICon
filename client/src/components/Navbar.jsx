import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import {
  Bell,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  Layers,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

export const Navbar = ({ onToggleMobileSidebar, onToggleCollapse, isCollapsed, hideSidebar }) => {
  const { user, logout, demoLogin, isAuthenticated, isStaff, isAdmin, isStudent } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const roleRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setShowRoleSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/campuscare?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleRoleSwitch = async (role) => {
    try {
      await demoLogin(role);
      setShowRoleSwitcher(false);
      showToast(`Switched active profile to ${role.toUpperCase()}`, 'success');
    } catch (err) {
      showToast('Error switching demo account', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-campus-border h-16 px-4 sm:px-6 flex items-center justify-between shadow-sm">
      {/* Left: Mobile hamburger (if sidebar present) & Logo */}
      <div className="flex items-center gap-3">
        {!hideSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/30 group-hover:bg-brand-600 transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-gray-900">
                Uni<span className="text-brand-500">Connect</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-brand-100 text-brand-700 rounded">
                Campus
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-gray-400 font-medium -mt-0.5 leading-none">
              Intelligence Platform
            </p>
          </div>
        </Link>
      </div>

      {/* Middle: On landing page, show public module links; on internal pages, show search bar */}
      {hideSidebar ? (
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-gray-600">
          <Link to="/campuscare" className="hover:text-brand-600 transition-colors">
            CampusCare
          </Link>
          <Link to="/unipulse" className="hover:text-brand-600 transition-colors">
            UniPulse
          </Link>
          <Link to="/opportunityhub" className="hover:text-brand-600 transition-colors">
            OpportunityHub
          </Link>
          <Link to="/resourceshare" className="hover:text-brand-600 transition-colors">
            ResourceShare
          </Link>
          <Link to="/campusarena" className="hover:text-brand-600 transition-colors">
            CampusArena
          </Link>
          <Link to="/studentvoice" className="hover:text-brand-600 transition-colors">
            StudentVoice
          </Link>
        </nav>
      ) : (
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center relative max-w-md w-full mx-6"
        >
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campus issues, notices, opportunities..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-gray-800 placeholder-gray-400"
          />
        </form>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Role Switcher Button */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 text-brand-700 hover:bg-orange-100 border border-brand-200 transition-colors"
            title="Switch demo account to test different roles"
          >
            <Shield className="w-3.5 h-3.5 text-brand-500" />
            <span className="capitalize">{user ? user.role : 'Demo Switch'}</span>
            <ChevronDown className="w-3 h-3 text-brand-500" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-dropdown py-2 z-50 max-h-96 overflow-y-auto">
              <div className="px-3.5 py-1.5 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Switch SEUSL Test Role
              </div>
              <button
                onClick={() => handleRoleSwitch('student')}
                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${user?.role === 'STUDENT' || user?.role === 'student' ? 'text-brand-600 font-bold bg-orange-50/50' : 'text-gray-700'}`}
              >
                <div>
                  <div className="font-semibold">Student (TG/2022/1042)</div>
                  <div className="text-[11px] text-gray-400">Reports complaints, AI query</div>
                </div>
                {(user?.role === 'STUDENT' || user?.role === 'student') && <CheckCircle className="w-4 h-4 text-brand-500" />}
              </button>
              <button
                onClick={() => handleRoleSwitch('technology_officer')}
                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${user?.role === 'FACULTY_OFFICER' ? 'text-purple-600 font-bold bg-purple-50/50' : 'text-gray-700'}`}
              >
                <div>
                  <div className="font-semibold">Faculty Officer (Technology)</div>
                  <div className="text-[11px] text-gray-400">Scoped to Faculty of Technology</div>
                </div>
                {user?.role === 'FACULTY_OFFICER' && <CheckCircle className="w-4 h-4 text-purple-600" />}
              </button>
              <button
                onClick={() => handleRoleSwitch('hostel_warden')}
                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${user?.role === 'HOSTEL_WARDEN' ? 'text-purple-600 font-bold bg-purple-50/50' : 'text-gray-700'}`}
              >
                <div>
                  <div className="font-semibold">Hostel Warden (Zahira Hall)</div>
                  <div className="text-[11px] text-gray-400">Resolves hostel accommodation & facilities</div>
                </div>
                {user?.role === 'HOSTEL_WARDEN' && <CheckCircle className="w-4 h-4 text-purple-600" />}
              </button>
              <button
                onClick={() => handleRoleSwitch('maintenance')}
                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${user?.role === 'MAINTENANCE_OFFICER' ? 'text-purple-600 font-bold bg-purple-50/50' : 'text-gray-700'}`}
              >
                <div>
                  <div className="font-semibold">Maintenance Officer</div>
                  <div className="text-[11px] text-gray-400">Civil & Electrical repairs</div>
                </div>
                {user?.role === 'MAINTENANCE_OFFICER' && <CheckCircle className="w-4 h-4 text-purple-600" />}
              </button>
              <button
                onClick={() => handleRoleSwitch('super_admin')}
                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${user?.role === 'SUPER_ADMIN' ? 'text-red-600 font-bold bg-red-50/50' : 'text-gray-700'}`}
              >
                <div>
                  <div className="font-semibold">Super Admin (Vice Chancellor)</div>
                  <div className="text-[11px] text-gray-400">Total university governance & overrides</div>
                </div>
                {user?.role === 'SUPER_ADMIN' && <CheckCircle className="w-4 h-4 text-red-600" />}
              </button>
              <button
                onClick={() => handleRoleSwitch('admin')}
                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${user?.role === 'UNIVERSITY_ADMIN' ? 'text-brand-600 font-bold bg-orange-50/50' : 'text-gray-700'}`}
              >
                <div>
                  <div className="font-semibold">University Administrator</div>
                  <div className="text-[11px] text-gray-400">Rules, categories, users, RAG AI</div>
                </div>
                {user?.role === 'UNIVERSITY_ADMIN' && <CheckCircle className="w-4 h-4 text-brand-500" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        {isAuthenticated && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-dropdown py-2 z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => {
                          markAsRead(notif._id);
                          if (notif.link) {
                            navigate(notif.link);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3.5 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-orange-50/40' : ''}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.isRead ? 'bg-brand-500' : 'bg-transparent'}`} />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-gray-900 leading-tight">
                              {notif.title}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5 leading-snug">
                              {notif.message}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Dropdown or Auth Links */}
        {isAuthenticated ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-200">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[110px]">
                  {user.name}
                </div>
                <div className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">
                  {user.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-dropdown py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-gray-100">
                  <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                  <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                  <div className="text-[10px] font-semibold text-brand-600 mt-0.5 capitalize">
                    {user.role} · {user.faculty || 'Campus Member'}
                  </div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  My Account Profile
                </Link>

                {isStudent && (
                  <Link
                    to="/dashboard"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Layers className="w-4 h-4 text-brand-500" />
                    Student Dashboard & AI
                  </Link>
                )}

                {(isStaff || isAdmin) && (
                  <Link
                    to="/staff"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Staff Resolution Hub
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-brand-600 hover:bg-orange-50"
                  >
                    <Shield className="w-4 h-4 text-brand-500" />
                    Admin Control Center
                  </Link>
                )}

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
