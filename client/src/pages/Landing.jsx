import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Radio,
  Compass,
  BookOpen,
  Trophy,
  MessageSquareQuote,
  ArrowRight,
  CheckCircle2,
  Users,
  Building2,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Layers,
} from 'lucide-react';

export const Landing = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      name: 'CampusCare',
      tagline: 'Every issue heard, tracked, and resolved.',
      desc: 'Report broken classroom facilities, hostel water/power issues, or Wi-Fi dropouts. Rally student support with "Affected Too", and watch live verified status updates.',
      icon: ShieldAlert,
      color: 'bg-red-50 text-red-600 border-red-200',
      link: '/campuscare',
      badge: 'Core Engine',
    },
    {
      name: 'UniPulse',
      tagline: 'Verified official campus announcements.',
      desc: 'Never miss an exam timetable, faculty notice, or scholarship release scattered in unverified WhatsApp groups. Direct from authenticated departmental deans and faculty boards.',
      icon: Radio,
      color: 'bg-orange-50 text-brand-600 border-orange-200',
      link: '/unipulse',
      badge: 'Real-Time',
    },
    {
      name: 'OpportunityHub',
      tagline: 'Competitions, internships, and research grants.',
      desc: 'Discover nationwide hackathons, data science challenges, paid tech internships, and undergraduate grants tailored to your skills and academic year.',
      icon: Compass,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      link: '/opportunityhub',
      badge: 'Career Growth',
    },
    {
      name: 'ResourceShare',
      tagline: 'Curated peer-to-peer revision notes.',
      desc: 'Access verified past-paper solutions, lecture notes, lab guides, and programming tutorials organized neatly by faculty, department, and semester.',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      link: '/resourceshare',
      badge: 'Academics',
    },
    {
      name: 'CampusArena',
      tagline: 'Events, sports championships, and workshops.',
      desc: 'From annual inter-faculty cricket finals and robotics exhibitions to career fairs, explore schedules, locations, and register in a single click.',
      icon: Trophy,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      link: '/campusarena',
      badge: 'Community',
    },
    {
      name: 'StudentVoice',
      tagline: 'Constructive student suggestions for campus reform.',
      desc: 'Propose new shuttle routes, extended library study hours, or cafeteria improvements. Receive official written remarks from university leadership.',
      icon: MessageSquareQuote,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      link: '/studentvoice',
      badge: 'Democracy',
    },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section - Edge to Edge Full Display Width */}
      <section className="w-full bg-gradient-to-b from-orange-50/60 via-white to-white pt-14 pb-20 sm:pt-20 sm:pb-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.12]">
              Your University. <br />
              <span className="text-brand-500">One Connected Community.</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Report campus issues, discover opportunities, stay informed, and connect with your university community — all in one centralized, verified web application.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to={isAuthenticated ? '/dashboard' : '/campuscare'}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <span>Explore UniConnect</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm border border-gray-300 shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>{isAuthenticated ? 'Open Dashboard' : 'Get Started'}</span>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 text-left">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-black text-brand-600">6 Modules</div>
                <div className="text-xs text-gray-500 font-medium">One Connected Suite</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-black text-gray-900">100%</div>
                <div className="text-xs text-gray-500 font-medium">Verified Official Notices</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-black text-status-success">Live Tracked</div>
                <div className="text-xs text-gray-500 font-medium">CampusCare Workflow</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-black text-blue-600">Zero Clutter</div>
                <div className="text-xs text-gray-500 font-medium">No Lost WhatsApp Chats</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Six Core Modules Showcase - Edge to Edge */}
      <section className="w-full py-20 bg-gray-50/70 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Six Intelligent Modules. One Integrated Hub.
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Engineered specifically to solve the information fragmentation in Sri Lankan and global universities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.name}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${feat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                      {feat.name}
                    </h3>
                    <div className="text-xs font-semibold text-brand-600 mb-2">
                      {feat.tagline}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-5 mt-5 border-t border-gray-100">
                    <Link
                      to={feat.link}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700"
                    >
                      <span>Open {feat.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works - Edge to Edge */}
      <section className="w-full py-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Workflow</span>
            <h2 className="text-3xl font-extrabold text-gray-900">How UniConnect Works</h2>
            <p className="text-sm text-gray-600">
              A seamless bridge between university students, student societies, and university administration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-campus-bg p-6 rounded-2xl border border-gray-200 text-left relative">
              <div className="w-9 h-9 rounded-full bg-brand-500 text-white font-black text-sm flex items-center justify-center mb-3.5 shadow-sm shadow-brand-500/20">
                1
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Join the Community</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Authenticate with your student or staff email to unlock faculty-specific feeds and verified channels.
              </p>
            </div>

            <div className="bg-campus-bg p-6 rounded-2xl border border-gray-200 text-left relative">
              <div className="w-9 h-9 rounded-full bg-brand-500 text-white font-black text-sm flex items-center justify-center mb-3.5 shadow-sm shadow-brand-500/20">
                2
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Discover Campus Info</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Explore verified announcements, upcoming career fairs, competitions, and downloadable study guides.
              </p>
            </div>

            <div className="bg-campus-bg p-6 rounded-2xl border border-gray-200 text-left relative">
              <div className="w-9 h-9 rounded-full bg-brand-500 text-white font-black text-sm flex items-center justify-center mb-3.5 shadow-sm shadow-brand-500/20">
                3
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Report or Participate</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Report campus infrastructure issues, click "Affected Too" on existing tickets, and propose student suggestions.
              </p>
            </div>

            <div className="bg-campus-bg p-6 rounded-2xl border border-gray-200 text-left relative">
              <div className="w-9 h-9 rounded-full bg-brand-500 text-white font-black text-sm flex items-center justify-center mb-3.5 shadow-sm shadow-brand-500/20">
                4
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Track Progress in Real Time</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Receive notifications when university maintenance teams inspect, repair, and close campus issues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency - Edge to Edge */}
      <section className="w-full py-20 bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4 text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold border border-brand-500/30">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Trust & Accountability First</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Constructive, Transparent University Collaboration
              </h2>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
                  <span>Official announcements identify verified publishers and faculty departments.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
                  <span>CampusCare logs immutable status histories and staff response notes.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
                  <span>Strict role-based authorization prevents unauthorized status tampering.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-xl">
              <div className="text-xs text-gray-300 font-medium">Ready to experience UniConnect?</div>
              <Link
                to="/campuscare"
                className="block w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all text-center"
              >
                Explore CampusCare
              </Link>
              <div className="text-[11px] text-gray-400">
                Demo accounts available for Student, Staff, and Admin roles.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
