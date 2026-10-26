import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';

import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StudentDashboard } from './pages/StudentDashboard';
import { CampusCareList } from './pages/CampusCare/CampusCareList';
import { ReportIssue } from './pages/CampusCare/ReportIssue';
import { IssueDetails } from './pages/CampusCare/IssueDetails';
import { CampusCareAnalytics } from './pages/CampusCare/CampusCareAnalytics';
import { UniPulseList } from './pages/UniPulse/UniPulseList';
import { OpportunityList } from './pages/OpportunityHub/OpportunityList';
import { ResourceList } from './pages/ResourceShare/ResourceList';
import { CampusArenaList } from './pages/CampusArena/CampusArenaList';
import { StudentVoiceList } from './pages/StudentVoice/StudentVoiceList';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { Profile } from './pages/Profile/Profile';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* App routes wrapped in responsive MainLayout */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Landing />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />

                {/* Authenticated Student Dashboard */}
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* CampusCare */}
                <Route path="campuscare" element={<CampusCareList />} />
                <Route
                  path="campuscare/report"
                  element={
                    <ProtectedRoute>
                      <ReportIssue />
                    </ProtectedRoute>
                  }
                />
                <Route path="campuscare/:id" element={<IssueDetails />} />
                <Route path="campuscare/analytics" element={<CampusCareAnalytics />} />

                {/* UniPulse */}
                <Route path="unipulse" element={<UniPulseList />} />

                {/* OpportunityHub */}
                <Route path="opportunityhub" element={<OpportunityList />} />

                {/* ResourceShare */}
                <Route path="resourceshare" element={<ResourceList />} />

                {/* CampusArena */}
                <Route path="campusarena" element={<CampusArenaList />} />

                {/* StudentVoice */}
                <Route path="studentvoice" element={<StudentVoiceList />} />

                {/* User Profile */}
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Administration Portal */}
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute roles={['staff', 'admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Catch-All */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
