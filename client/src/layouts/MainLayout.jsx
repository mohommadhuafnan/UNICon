import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';

export const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const hideSidebar = isLandingPage || isAuthPage;

  // On auth pages (login and register), no navbar and no footer
  if (isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-campus-bg">
        <main className="flex-1 flex flex-col justify-center">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isLandingPage ? 'bg-white' : 'bg-campus-bg'}`}>
      <Navbar
        onToggleMobileSidebar={() => setIsMobileOpen((prev) => !prev)}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isCollapsed={isCollapsed}
        hideSidebar={hideSidebar}
      />

      <div className="flex-1 flex">
        {!hideSidebar && (
          <Sidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
            isMobileOpen={isMobileOpen}
            onCloseMobile={() => setIsMobileOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0 flex flex-col">
          {isLandingPage ? (
            <div className="flex-1 w-full">
              <Outlet />
            </div>
          ) : (
            <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
              <Outlet />
            </div>
          )}
          <Footer />
        </main>
      </div>
    </div>
  );
};



