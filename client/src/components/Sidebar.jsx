import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShieldAlert,
  Radio,
  Compass,
  BookOpen,
  Trophy,
  MessageSquareQuote,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Sliders,
  UserCheck,
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) => {
  const { user, isStaff, isAdmin, isStudent } = useAuth();

  // Navigation items dynamically scoped by account type for clean role segregation
  const navItems = isStudent
    ? [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          name: 'CampusCare',
          path: '/campuscare',
          icon: ShieldAlert,
          badge: 'Core',
        },
        {
          name: 'UniPulse',
          path: '/unipulse',
          icon: Radio,
          badge: null,
        },
        {
          name: 'OpportunityHub',
          path: '/opportunityhub',
          icon: Compass,
          badge: null,
        },
        {
          name: 'ResourceShare',
          path: '/resourceshare',
          icon: BookOpen,
          badge: null,
        },
        {
          name: 'CampusArena',
          path: '/campusarena',
          icon: Trophy,
          badge: null,
        },
        {
          name: 'StudentVoice',
          path: '/studentvoice',
          icon: MessageSquareQuote,
          badge: null,
        },
      ]
    : [
        {
          name:
            user?.role === 'HOSTEL_WARDEN'
              ? 'Hostel Grievances'
              : user?.role === 'LIBRARY_OFFICER'
              ? 'Library Complaints'
              : user?.role === 'CANTEEN_MANAGER'
              ? 'Cafeteria Complaints'
              : user?.role === 'FACULTY_OFFICER'
              ? 'Faculty Complaints'
              : 'Grievance Queue',
          path: '/staff',
          icon: ShieldCheck,
          badge: 'Official',
        },
        {
          name: 'CampusCare Feed',
          path: '/campuscare',
          icon: ShieldAlert,
          badge: null,
        },
        {
          name: 'Campus Notices',
          path: '/unipulse',
          icon: Radio,
          badge: null,
        },
      ];

  const isAdminOrStaff = user && (user.role === 'staff' || user.role === 'admin');

  const renderNavLink = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onCloseMobile}
        className={({ isActive }) =>
          `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm lg:text-[15px] font-semibold transition-all relative ${
            isActive
              ? 'bg-brand-50 text-brand-600 font-bold shadow-xs'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/70'
          } ${isCollapsed ? 'justify-center px-2 py-3' : ''}`
        }
        title={isCollapsed ? item.name : undefined}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-brand-500 rounded-r-full" />
            )}
            <Icon
              className={`w-5 h-5 flex-shrink-0 transition-colors ${
                isActive ? 'text-brand-500' : 'text-gray-500 group-hover:text-gray-800'
              }`}
            />
            {!isCollapsed && <span className="flex-1 truncate tracking-tight">{item.name}</span>}
            {!isCollapsed && item.badge && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-brand-100 text-brand-700">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  const content = (
    <aside className="flex flex-col justify-between h-full bg-white border-r border-campus-border select-none">
      {/* Top Part: Header + Navigation List */}
      <div>
        {/* Tagline / Category indicator */}
        <div className={`p-4 border-b border-gray-100 flex items-center justify-between ${isCollapsed ? 'px-2' : ''}`}>
          {!isCollapsed && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Campus Intelligence
              </span>
              <div className="text-sm font-bold text-gray-900 truncate">
                {user?.university || 'University Community'}
              </div>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-auto"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Static Navigation List (fits comfortably, zero internal scrolling) */}
        <nav className="p-3 space-y-1">
          {navItems.map(renderNavLink)}

          {/* Executive Admin Center Link */}
          {isAdmin && (
            <div className="pt-2 mt-2 border-t border-gray-100">
              <NavLink
                to="/admin"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm lg:text-[15px] font-semibold transition-all relative ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 font-bold'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/70'
                  } ${isCollapsed ? 'justify-center px-2 py-3' : ''}`
                }
                title={isCollapsed ? 'Admin Center' : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-brand-500 rounded-r-full" />
                    )}
                    <Sliders
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? 'text-brand-500' : 'text-gray-500'
                      }`}
                    />
                    {!isCollapsed && <span className="flex-1 truncate tracking-tight">Admin Center</span>}
                    {!isCollapsed && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-brand-100 text-brand-700">
                        Admin
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom info card */}
      {!isCollapsed && (
        <div className="p-3 border-t border-gray-100 mt-auto">
          <div className="bg-campus-bg rounded-xl p-3 border border-gray-200">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
              <LifeBuoy className="w-4 h-4 text-brand-500" />
              <span>Campus Hotline</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
              24/7 Security Desk: <span className="font-semibold text-gray-700">011-258-1234</span>
            </p>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar: Sticky & completely static on the left */}
      <div
        className={`hidden lg:block h-[calc(100vh-4rem)] sticky top-16 transition-all duration-200 flex-shrink-0 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {content}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

