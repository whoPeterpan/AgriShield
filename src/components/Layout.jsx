import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardCheck,
  FileText,
  Home,
  Languages,
  LogOut,
  Menu,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../utils/translations.js';
import PWAInstallButton from './PWAInstallButton.jsx';

export default function Layout({ children }) {
  const {
    user,
    isDemoMode,
    language,
    setLanguage,
    isOnline,
    simulateOffline,
    setSimulateOffline,
    offlineQueue,
    syncOfflineQueue,
    isSupabaseConfigured,
    statusMessage,
    myFarms,
    activeFarm,
    setActiveFarmId,
    enterDemoRole,
    resetDemoData,
    signOut,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleRoleSwitch = (roleOption) => {
    enterDemoRole(roleOption, { fresh: false });
    navigate(
      roleOption === 'veterinarian'
        ? '/vet-support'
        : roleOption === 'authority'
        ? '/authority'
        : '/dashboard'
    );
  };

  const farmerLinks = [
    { to: '/dashboard', label: t(language, 'navDashboard'), icon: Home },
    { to: '/audit', label: t(language, 'navAssessment'), icon: ClipboardCheck },
    { to: '/action-plan', label: t(language, 'navActionPlan'), icon: BookOpen },
    { to: '/readiness', label: t(language, 'navReadiness'), icon: Award },
    { to: '/records', label: t(language, 'navRecords'), icon: FileText },
    { to: '/alerts', label: t(language, 'navAlerts'), icon: Bell },
    { to: '/vet-support', label: t(language, 'navVetCases'), icon: Stethoscope },
    { to: '/farm-profile', label: t(language, 'navRegister'), icon: UserCog },
  ];

  const vetLinks = [
    { to: '/vet-support', label: 'Veterinarian Desk', icon: Stethoscope },
    { to: '/alerts', label: t(language, 'navAlerts'), icon: Bell },
    { to: '/action-plan', label: 'Biosecurity Pathshala', icon: BookOpen },
  ];

  const authorityLinks = [
    { to: '/authority', label: t(language, 'navAuthority'), icon: BarChart3 },
    { to: '/alerts', label: t(language, 'navAlerts'), icon: Bell },
    { to: '/action-plan', label: 'Pathshala Library', icon: BookOpen },
  ];

  const navLinks =
    user?.role === 'veterinarian'
      ? vetLinks
      : user?.role === 'authority'
      ? authorityLinks
      : farmerLinks;

  const mobileTabs = navLinks.slice(0, 4);
  const currentNav = navLinks.find((item) => item.to === location.pathname);

  const handleConfirmReset = () => {
    resetDemoData();
    setConfirmResetOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFBF9] text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar (260px–280px) */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200/90 z-30">
        <div className="px-5 h-16 flex items-center justify-between border-b border-slate-200/80">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            aria-label="Go to home page"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0D3B26] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-base font-bold tracking-tight text-slate-900 truncate">
              {t(language, 'brand')}
            </p>
          </Link>
          <span className="text-[11px] font-medium text-emerald-800 capitalize whitespace-nowrap">
            {user?.role === 'veterinarian' ? 'Vet' : user?.role}
          </span>
        </div>

        {/* Farmer Active Farm Selector */}
        {user?.role === 'farmer' && (
          <div className="px-4 py-3 border-b border-slate-100 bg-[#FAFBF9]">
            <label
              htmlFor="sidebar-farm-select"
              className="block text-[11px] font-medium text-slate-500 mb-1.5"
            >
              Active Farm
            </label>
            {myFarms.length > 0 ? (
              <select
                id="sidebar-farm-select"
                value={activeFarm?.id || ''}
                onChange={(e) => setActiveFarmId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              >
                {myFarms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.farm_name} ({farm.farm_type})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-500">No farm registered yet</p>
            )}
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary Navigation">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#EEF5F0] text-[#0D3B26] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Demo Role Switcher, Reset & Connection Controls */}
        <div className="p-4 border-t border-slate-200/80 space-y-2.5 bg-[#FAFBF9]">
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              {isDemoMode
                ? t(language, 'demoModeTag')
                : isSupabaseConfigured
                ? t(language, 'supabaseLiveTag')
                : t(language, 'demoModeTag')}
            </span>
            <span className="font-semibold text-slate-700 capitalize">
              {user?.role === 'veterinarian' ? 'Vet' : user?.role}
            </span>
          </div>

          {isDemoMode && (
            <>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/60 rounded-lg">
                {['farmer', 'veterinarian', 'authority'].map((roleOption) => (
                  <button
                    key={roleOption}
                    type="button"
                    onClick={() => handleRoleSwitch(roleOption)}
                    className={`px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors capitalize whitespace-nowrap ${
                      user?.role === roleOption
                        ? 'bg-white text-[#0D3B26] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {roleOption === 'veterinarian' ? 'Vet' : roleOption}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50/70 text-xs font-semibold text-rose-800 hover:bg-rose-100/80 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setSimulateOffline((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
            </span>
            <span className="text-slate-400">{simulateOffline ? 'Restore' : 'Test Offline'}</span>
          </button>

          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account / Exit</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area — Full 92-96% Desktop Presence */}
      <div className="flex-1 lg:pl-68 flex flex-col min-w-0">
        {/* Top Workspace Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="lg:hidden flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
              aria-label="Go to home page"
            >
              <div className="w-7 h-7 rounded-lg bg-[#0D3B26] text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline text-sm font-bold text-slate-900">
                {t(language, 'brand')}
              </span>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm lg:text-base font-bold text-slate-900 truncate">
                {currentNav?.label || t(language, 'brand')}
              </h1>
              <p className="hidden sm:block text-xs text-slate-500 truncate">
                {user?.role === 'farmer'
                  ? activeFarm
                    ? `${activeFarm.farm_name} · ${activeFarm.district} · ${activeFarm.farm_type}`
                    : `${user?.full_name || 'Farmer'} · Register a farm to begin`
                  : `${user?.full_name || 'Workspace'} · ${t(language, 'tagline')}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {offlineQueue.length > 0 && (
              <button
                type="button"
                onClick={syncOfflineQueue}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {t(language, 'syncNow')} ({offlineQueue.length})
                </span>
              </button>
            )}

            {isDemoMode && (
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-800 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              aria-label="Toggle English or Hindi language"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            <PWAInstallButton />
          </div>
        </header>

        {/* Offline Banner (only shown when actually offline) */}
        {!isOnline && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 lg:px-10 py-2 flex items-center justify-between gap-3 text-xs text-amber-900">
            <span className="flex items-center gap-2 font-medium">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>{t(language, 'offlineBanner')}</span>
            </span>
            {simulateOffline && (
              <button
                type="button"
                onClick={() => setSimulateOffline(false)}
                className="underline font-semibold whitespace-nowrap shrink-0"
              >
                Reconnect
              </button>
            )}
          </div>
        )}

        {/* Transient Action Feedback Toast */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              key={statusMessage.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-4 sm:px-6 lg:px-10 pt-3 max-w-[1680px] w-full mx-auto"
            >
              <div
                role="status"
                className={`rounded-xl border px-4 py-2.5 text-xs font-medium flex items-center justify-between ${
                  statusMessage.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : statusMessage.type === 'info'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-[#EEF5F0] border-emerald-200 text-[#0D3B26]'
                }`}
              >
                <span>{statusMessage.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wide Viewport Container (~92-96% desktop screen width) */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 pb-24 lg:pb-12 max-w-[1680px] w-full mx-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Confirmation Dialog Modal for Reset Demo Data */}
      <AnimatePresence>
        {confirmResetOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmResetOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="reset-dialog-title" className="text-base font-bold text-slate-900">
                    Reset All Demonstration Data?
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    This clears all demonstration farms, audits, visitor &amp; cleaning logs,
                    evidence files, alerts, and vet cases across Farmer, Veterinarian, and Authority
                    views back to zero. Real Supabase user accounts are never affected.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Yes, Reset Demo Data</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="px-4 h-14 flex items-center justify-between border-b border-slate-200">
              <Link
                to="/"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="font-bold text-slate-900 flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label="Go to home page"
              >
                <ShieldCheck className="w-5 h-5 text-[#0D3B26]" />
                {t(language, 'brand')}
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {user?.role === 'farmer' && myFarms.length > 0 && (
              <div className="p-4 border-b border-slate-100">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Active Farm
                </label>
                <select
                  value={activeFarm?.id || ''}
                  onChange={(e) => setActiveFarmId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                >
                  {myFarms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.farm_name} ({farm.farm_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                        isActive
                          ? 'bg-[#EEF5F0] text-[#0D3B26] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 space-y-3 bg-[#FAFBF9]">
              {isDemoMode && (
                <>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-lg">
                    {['farmer', 'veterinarian', 'authority'].map((roleOption) => (
                      <button
                        key={roleOption}
                        type="button"
                        onClick={() => {
                          handleRoleSwitch(roleOption);
                          setMobileMenuOpen(false);
                        }}
                        className={`px-2 py-2 text-xs font-medium rounded-md capitalize ${
                          user?.role === roleOption
                            ? 'bg-white text-[#0D3B26] shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        {roleOption === 'veterinarian' ? 'Vet' : roleOption}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setConfirmResetOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo Data</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setSimulateOffline((prev) => !prev);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700"
              >
                <span>{isOnline ? 'Online Mode' : 'Offline Mode'}</span>
                <span className="text-emerald-700">
                  {simulateOffline ? 'Go Online' : 'Simulate Offline'}
                </span>
              </button>
              <button
                type="button"
                onClick={signOut}
                className="w-full py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Switch Account / Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 h-16 grid grid-cols-4 items-center"
        aria-label="Mobile Quick Navigation"
      >
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full px-1 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#0D3B26] font-semibold' : 'text-slate-500'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate max-w-full">{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
