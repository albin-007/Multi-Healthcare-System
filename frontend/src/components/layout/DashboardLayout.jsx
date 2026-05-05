import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, Home, User, Stethoscope, FlaskConical, Building2, 
  Calendar, ChevronRight, Menu, Bell, Search, Sun, Moon, 
  PanelLeftClose, PanelLeftOpen, Settings, LayoutDashboard, ShieldCheck
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../ui/Logo';
import ProfileEditModal from '../modals/ProfileEditModal';

export default function DashboardLayout() {
  const { userRole, userName, user, fetchUserProfile, logout } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { 
    subTabs, setSubTabs, activeSubTab, setActiveSubTab, globalSearch, setGlobalSearch,
    notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead
  } = useDashboard();

  const getNavItems = () => {
    switch(userRole) {
      case 'ADMIN': return [{ name: 'System Oversight', icon: ShieldCheck, path: '/admin' }];
      case 'USER': return [
        { name: 'Patient Hub', icon: Home, path: '/patient' },
      ];
      case 'CLINIC': return [{ name: 'Clinic Management', icon: Building2, path: '/clinic' }];
      case 'DOCTOR': return [{ name: 'Clinical Rounds', icon: Stethoscope, path: '/doctor' }];
      case 'LAB': return [{ name: 'Diagnostic Pipeline', icon: FlaskConical, path: '/lab' }];
      default: return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
  };

  // ── Animation Variants ─────────────────────────────────────────────────────
  const sidebarVariants = {
    expanded: { width: 280, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    collapsed: { width: 100, transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  const menuItemVariants = {
    expanded: { opacity: 1, x: 0, display: 'flex' },
    collapsed: { opacity: 0, x: -10, transitionEnd: { display: 'none' } }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''} bg-brand-50 dark:bg-slate-950 transition-colors duration-500`}>
      
      {/* Sidebar - Desktop (Fixed) */}
      <motion.aside 
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        className="hidden md:flex flex-col bg-brand-600 dark:bg-slate-950 border-r border-white/5 z-50 overflow-hidden text-white"
      >
        <div className="h-24 flex items-center px-8 overflow-hidden shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <Logo size="lg" variant="light" textVariants={menuItemVariants} />
          </Link>
        </div>
        

        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto no-scrollbar">
          {subTabs.length > 0 ? (
            /* Flattened Navigation for Patients */
            subTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all relative ${
                   activeSubTab === tab.id
                  ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5 shrink-0" />
                <motion.span variants={menuItemVariants} className="flex-1 text-left">{tab.label}</motion.span>
                {tab.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeSubTab === tab.id ? 'bg-white/20' : 'bg-brand-teal/20 text-brand-teal'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))
          ) : (
            /* Original Nested Navigation for Admin/Other roles */
            navItems.map((item) => (
              <div key={item.name} className="space-y-1">
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all relative ${
                    location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                    ? 'bg-white/10 text-white border border-white/10 shadow-sm' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <motion.span variants={menuItemVariants}>{item.name}</motion.span>
                </Link>

                {/* Dynamic Sub-Tabs if active */}
                {!isCollapsed && (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))) && subTabs.length > 0 && (
                  <div className="pl-4 py-2 space-y-1">
                    {subTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                          activeSubTab === tab.id
                          ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <tab.icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </div>
                        {tab.badge > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${activeSubTab === tab.id ? 'bg-white/20' : 'bg-brand-teal/20 text-brand-teal'}`}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0 space-y-1">

          
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs text-red-100 hover:bg-red-500/20 transition-all font-black uppercase tracking-widest"
          >
            <LogOut size={18} />
            <motion.span variants={menuItemVariants}>Sign Out</motion.span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-brand-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-brand-50 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 transition-colors duration-500 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="p-2.5 rounded-xl bg-brand-50 dark:bg-slate-950 text-brand-600 dark:text-teal-400 hover:bg-brand-100 transition-all border border-brand-100 dark:border-slate-800"
            >
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search resources, doctors, labs..." 
                value={globalSearch || ''}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-brand-50/50 dark:bg-slate-950 border border-transparent focus:border-brand-100 dark:focus:border-slate-800 outline-none font-bold text-xs w-72 focus:ring-4 focus:ring-brand-500/5 transition-all text-slate-600 dark:text-slate-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2.5 rounded-xl bg-brand-50 dark:bg-slate-950 text-brand-600 dark:text-teal-400 hover:bg-brand-100 transition-all border border-brand-100 dark:border-slate-800"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-brand-100 dark:border-slate-800 z-50 overflow-hidden"
                    >
                      <div className="p-5 border-b border-brand-50 dark:border-slate-800 flex items-center justify-between bg-brand-50/30 dark:bg-slate-950/30">
                        <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={() => markAllNotificationsAsRead()}
                            className="text-[10px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center">
                            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3 opacity-50" />
                            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs">No notifications yet.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-brand-50 dark:divide-slate-800">
                            {notifications.map((noti) => (
                              <div 
                                key={noti.id} 
                                onClick={() => markNotificationAsRead(noti.id)}
                                className={`p-4 hover:bg-brand-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${!noti.is_read ? 'bg-brand-50/20 dark:bg-brand-500/5' : ''}`}
                              >
                                <div className="flex gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!noti.is_read ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <Bell size={14} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-black truncate ${!noti.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                      {noti.title}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                      {noti.message}
                                    </p>
                                    <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                                      {new Date(noti.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(noti.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  {!noti.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-1 shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-brand-50/30 dark:bg-slate-950/30 border-t border-brand-50 dark:border-slate-800 text-center">
                         <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest transition-colors">
                           View All Activity
                         </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <div className="relative flex items-center gap-3 pl-4 md:pl-6 border-l border-brand-50 dark:border-slate-800">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none group-hover:text-brand-600 transition-colors">{userName}</p>
                  <p className="text-[10px] font-black uppercase text-brand-teal tracking-widest mt-1.5">{userRole}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black shadow-lg shadow-brand-600/20 border-2 border-white dark:border-slate-800 overflow-hidden group-hover:scale-105 transition-transform">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    userName?.charAt(0).toUpperCase()
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-brand-100 dark:border-slate-800 z-50 overflow-hidden p-2"
                    >
                      <button
                        onClick={() => {
                          setIsProfileModalOpen(true);
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <User size={18} className="text-brand-600" />
                        Edit Profile
                      </button>
                      <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-800 transition-all"
                      >
                        {theme === 'light' ? <Moon size={18} className="text-indigo-500" /> : <Sun size={18} className="text-amber-500" />}
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                      >
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <ProfileEditModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={user} 
        onUpdate={() => fetchUserProfile()} 
      />
    </div>
  );
}




