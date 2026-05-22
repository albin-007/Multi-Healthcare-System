import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Stethoscope, Building2, FlaskConical, ActivitySquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../ui/Logo';

export default function Navbar({ activeSection = 0, onSectionClick = null }) {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isHome = location.pathname === '/';

  const getDashboardPath = () => {
    switch (userRole) {
      case 'ADMIN': return '/admin';
      case 'CLINIC': return '/clinic';
      case 'DOCTOR': return '/doctor';
      case 'LAB': return '/lab';
      default: return '/patient';
    }
  };

  const sections = ['home', 'services', 'features', 'programs', 'about', 'testimonials', 'contact'];

  const searchTabs = [
    { label: 'Doctors', path: '/find-doctors', icon: Stethoscope },
    { label: 'Clinics', path: '/find-clinics', icon: Building2 },
    { label: 'Tests', path: '/find-tests', icon: ActivitySquare },
  ];

  const handleSectionClick = (index) => {
    setIsOpen(false);
    if (onSectionClick) {
      onSectionClick(index);
    } else {
      navigate('/' + (index > 0 ? `#${sections[index]}` : ''));
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 lg:px-12 py-4 transition-all duration-350 bg-[#F5F2ED]/95 backdrop-blur-xl border-b border-[#1A3C34]/5 shadow-sm`}>
        <Link to="/" className="no-underline">
          <Logo size="md" variant="dark" />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden xl:flex gap-6 items-center">
          {isHome && onSectionClick ? (
            <div className="flex gap-6">
              {sections.slice(0, 6).map((s, i) => (
                <button
                  key={s}
                  onClick={() => handleSectionClick(i)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, letterSpacing: '.01em',
                    color: activeSection === i ? '#1A3C34' : 'rgba(26,60,52,0.55)',
                    textTransform: 'capitalize',
                    borderBottom: activeSection === i ? '2px solid #1A3C34' : '2px solid transparent',
                    paddingBottom: 2, transition: 'all .2s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <Link 
              to="/" 
              className="text-[#1A3C34]/60 hover:text-[#1A3C34] font-bold text-sm no-underline transition-colors"
            >
              Home
            </Link>
          )}

          {/* Search Shortcuts on desktop */}
          <div className="h-4 w-px bg-[#1A3C34]/10 mx-2" />
          <div className="flex gap-5">
            {searchTabs.map((tab) => {
              const active = location.pathname === tab.path;
              return (
                <Link
                  key={tab.label}
                  to={tab.path}
                  className={`text-sm font-bold no-underline flex items-center gap-1.5 transition-all ${
                    active 
                      ? 'text-[#00C2A8] border-b-2 border-[#00C2A8] pb-0.5' 
                      : 'text-[#1A3C34]/60 hover:text-[#1A3C34]'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link 
                to="/login" 
                className="px-6 py-2.5 rounded-full border-2 border-[#1A3C34]/15 font-bold text-[#1A3C34] hover:bg-[#1A3C34]/5 text-xs uppercase tracking-wider no-underline transition-all"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-2.5 rounded-full bg-[#1A3C34] text-[#F5F2ED] hover:bg-[#2D5748] font-bold text-xs uppercase tracking-wider no-underline transition-all shadow-lg shadow-[#1A3C34]/10 flex items-center gap-1.5"
              >
                Get Started <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <Link 
              to={getDashboardPath()} 
              className="px-6 py-2.5 rounded-full bg-[#1A3C34] text-[#F5F2ED] hover:bg-[#2D5748] font-bold text-xs uppercase tracking-wider no-underline transition-all shadow-lg shadow-[#1A3C34]/10 flex items-center gap-1.5"
            >
              Dashboard <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Mobile Hamburger menu */}
        <div className="xl:hidden flex items-center gap-3">
          {!isAuthenticated ? (
            <Link 
              to="/register" 
              className="px-4 py-2 rounded-full bg-[#1A3C34] text-[#F5F2ED] font-bold text-[10px] uppercase tracking-wider no-underline transition-all"
            >
              Join
            </Link>
          ) : (
            <Link 
              to={getDashboardPath()} 
              className="px-4 py-2 rounded-full bg-[#1A3C34] text-[#F5F2ED] font-bold text-[10px] uppercase tracking-wider no-underline transition-all"
            >
              Dash
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-[#1A3C34]/5 text-[#1A3C34] hover:bg-[#1A3C34]/10 transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#1A3C34]/40 z-[98] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-full bg-[#F5F2ED] z-[99] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-8">
                {/* Header inside drawer */}
                <div className="flex items-center justify-between border-b border-[#1A3C34]/10 pb-4">
                  <Logo size="md" variant="dark" />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl bg-[#1A3C34]/5 text-[#1A3C34] hover:bg-[#1A3C34]/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Search Navigation inside drawer */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Find Services</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {searchTabs.map((tab) => {
                      const active = location.pathname === tab.path;
                      return (
                        <Link
                          key={tab.label}
                          to={tab.path}
                          onClick={() => setIsOpen(false)}
                          className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1 text-center no-underline transition-all ${
                            active 
                              ? 'bg-[#1A3C34] text-white border-[#1A3C34]' 
                              : 'bg-white text-[#1A3C34] border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <tab.icon size={18} />
                          <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Homepage Section Links inside drawer */}
                {isHome && onSectionClick && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Navigation</h3>
                    <div className="flex flex-col gap-2">
                      {sections.slice(0, 6).map((s, i) => (
                        <button
                          key={s}
                          onClick={() => handleSectionClick(i)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-bold text-sm text-left transition-all ${
                            activeSection === i
                              ? 'bg-[#1A3C34]/5 text-[#1A3C34] border border-[#1A3C34]/10'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <span className="capitalize">{s}</span>
                          <span className="text-xs opacity-50">0{i+1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer CTA */}
              <div className="space-y-3 border-t border-[#1A3C34]/10 pt-6 mt-8">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="w-full h-12 rounded-2xl border-2 border-[#1A3C34]/10 font-bold text-[#1A3C34] flex items-center justify-center text-xs uppercase tracking-wider no-underline transition-all"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="w-full h-12 rounded-2xl bg-[#1A3C34] text-[#F5F2ED] font-bold flex items-center justify-center text-xs uppercase tracking-wider no-underline transition-all shadow-lg"
                    >
                      Create Free Account
                    </Link>
                  </>
                ) : (
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setIsOpen(false)}
                    className="w-full h-12 rounded-2xl bg-[#1A3C34] text-[#F5F2ED] font-bold flex items-center justify-center text-xs uppercase tracking-wider no-underline transition-all shadow-lg"
                  >
                    Go To Dashboard
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
