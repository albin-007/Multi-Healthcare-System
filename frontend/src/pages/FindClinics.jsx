import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Building2, ShieldCheck, ArrowRight, 
  Star, Phone, Clock, Zap, CheckCircle2, HeartPulse, 
  Users, Calendar, Activity, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const CLINIC_FEATURES = [
  { 
    title: "Instant Registration", 
    desc: "Scan QR code at the clinic or pre-register online to skip the front desk queues.",
    icon: Zap 
  },
  { 
    title: "Live Queue Tracking", 
    desc: "Track your consultation number in real-time from your mobile device.",
    icon: Activity 
  },
  { 
    title: "Verified Specialists", 
    desc: "Every clinic in our network is verified for medical standards and doctor credentials.",
    icon: ShieldCheck 
  }
];

const FindClinics = () => {
  const { isAuthenticated, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await api.get('users/clinics/');
        setClinics(response.data);
      } catch (err) {
        console.error("Failed to fetch clinics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);

  const filteredClinics = useMemo(() => {
    if (!searchTerm && !location) return [];
    return clinics.filter(clinic => {
      const nameMatch = clinic.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const locationMatch = !location || (clinic.address || '').toLowerCase().includes(location.toLowerCase());
      return nameMatch && locationMatch;
    });
  }, [searchTerm, location, clinics]);

  return (
    <div className="min-h-screen bg-[#F5F9F8] font-sans selection:bg-[#3D7A68]/20 overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-[#3D7A68]/10 shadow-sm">
        <Link to="/" className="no-underline">
          <Logo size="md" variant="dark" />
        </Link>
        <div className="flex gap-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="px-6 py-2.5 rounded-2xl border-2 border-[#1A3C34]/10 font-black text-[#1A3C34] hover:bg-[#1A3C34] hover:text-white transition-all no-underline text-[10px] uppercase tracking-widest">Login</Link>
              <Link to="/register" className="px-6 py-2.5 rounded-2xl bg-[#1A3C34] font-black text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all no-underline text-[10px] uppercase tracking-widest">Get Started</Link>
            </>
          ) : (
            <Link to={userRole === 'ADMIN' ? '/admin' : userRole === 'CLINIC' ? '/clinic' : userRole === 'DOCTOR' ? '/doctor' : userRole === 'LAB' ? '/lab' : '/patient'} className="px-6 py-2.5 rounded-2xl bg-[#1A3C34] font-black text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all no-underline text-[10px] uppercase tracking-widest">Dashboard</Link>
          )}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden bg-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E6F4F1] rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#E6F4F1] text-[#3D7A68] mb-8 border border-[#3D7A68]/10">
              <Building2 size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Verified Clinic Network</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-[#1A3C34] mb-8 tracking-tight">
              Book Multi-Specialty <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3D7A68] to-[#00C2A8]">Medical Clinics</span>
            </h1>
            
            <p className="text-[#5A7A70] text-lg md:text-xl max-w-2xl mx-auto mb-14 font-medium leading-relaxed">
              Find verified care centers near you. Manage appointments, track queues, and access medical records in one unified platform.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative max-w-4xl mx-auto group"
          >
            <div className="flex flex-col md:flex-row items-center gap-3 p-3 bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(61,122,104,0.15)] border border-slate-100 group-hover:shadow-[0_48px_80px_-20px_rgba(61,122,104,0.2)] transition-all">
              <div className="flex items-center flex-1 w-full px-6 border-b md:border-b-0 md:border-r border-slate-100">
                <Search className="text-[#7A9E94] shrink-0" size={20} />
                <input
                  type="text"
                  placeholder="Clinic name or specialty..."
                  className="w-full py-5 bg-transparent outline-none text-[#1A3C34] font-bold text-sm px-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center flex-1 w-full px-6">
                <MapPin className="text-[#7A9E94] shrink-0" size={20} />
                <input
                  type="text"
                  placeholder="City or locality"
                  className="w-full py-5 bg-transparent outline-none text-[#1A3C34] font-bold text-sm px-4"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <button className="w-full md:w-auto px-12 py-5 bg-[#1A3C34] text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-[#122822] transition-all active:scale-95 flex items-center justify-center gap-3">
                Search Clinics <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Search Results ── */}
      <AnimatePresence mode="wait">
        {(searchTerm || location) && (
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="py-24 px-6 bg-slate-50 border-y border-slate-100"
          >
            <div className="max-w-7xl mx-auto">
              <div className="mb-12 text-center md:text-left">
                <h2 className="text-3xl font-black text-[#1A3C34] flex items-center gap-3 justify-center md:justify-start italic">
                  <Building2 className="text-[#3D7A68]" size={32} />
                  Clinics Matching Your Search <span className="text-[#3D7A68] bg-[#E6F4F1] px-4 py-1 rounded-full text-xl italic">{filteredClinics.length}</span>
                </h2>
              </div>

              {filteredClinics.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-[#3D7A68]/10">
                  <Activity className="mx-auto text-slate-300 mb-6" size={64} />
                  <h3 className="text-2xl font-black text-[#1A3C34]/40">No clinics found in this area</h3>
                  <p className="text-[#5A7A70] font-medium mt-2">Try searching for a different name or expanding your location.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredClinics.map((clinic, idx) => (
                    <motion.div
                      key={clinic.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -10 }}
                      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-[#3D7A68]/5 hover:shadow-xl transition-all group"
                    >
                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-20 h-20 bg-[#E6F4F1] rounded-[1.8rem] flex items-center justify-center shrink-0 border-4 border-white shadow-lg overflow-hidden">
                           {clinic.admin_user?.avatar_url ? (
                             <img 
                               src={clinic.admin_user.avatar_url} 
                               alt={clinic.name} 
                               className="w-full h-full object-cover"
                             />
                           ) : (
                             <Building2 className="text-[#3D7A68]" size={32} />
                           )}
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-[#1A3C34] group-hover:text-[#3D7A68] transition-colors italic">{clinic.name}</h4>
                          <div className="flex items-center gap-1.5 mt-2">
                             <div className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                               <ShieldCheck size={10} /> Verified Care
                             </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-3 text-xs text-[#5A7A70] font-bold">
                          <MapPin size={16} className="text-[#3D7A68]/30" />
                          <span className="truncate">{clinic.address || 'Address Verified'}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-[#F5F9F8] rounded-2xl">
                          <div className="flex items-center gap-2">
                             <Star size={16} className="fill-yellow-400 text-yellow-400" />
                             <span className="font-black text-[#1A3C34]">4.9</span>
                             <span className="text-[10px] text-[#5A7A70] font-bold uppercase tracking-wider opacity-60">(150+ REVIEWS)</span>
                          </div>
                        </div>
                      </div>

                      <Link 
                        to={!isAuthenticated ? "/login" : userRole === 'USER' ? "/patient" : "/unauthorized"}
                        className="w-full py-4 bg-[#1A3C34] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#122822] transition-all no-underline"
                      >
                        Book Appointment <ArrowRight size={16} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Clinic System Overview ── */}
      <section className="py-32 px-6 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            {/* Staff Mascot Image */}
            <div className="lg:w-1/2 relative">
               <motion.div
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ duration: 1 }}
                 className="relative z-10"
               >
                 <div className="relative aspect-[4/5] max-w-[450px] mx-auto rounded-[4rem] overflow-hidden border-8 border-[#E6F4F1] shadow-2xl">
                    <img 
                      src="/friendly_nurse_mascot.png" 
                      alt="Clinic Staff Mascot" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A3C34]/40 to-transparent" />
                 </div>

                 {/* Animated Speech Bubble */}
                 <motion.div
                   initial={{ opacity: 0, scale: 0.5, y: 20 }}
                   whileInView={{ opacity: 1, scale: 1, y: 0 }}
                   transition={{ delay: 0.8, type: "spring" }}
                   className="absolute -top-10 -right-10 md:-right-20 max-w-[280px] p-8 bg-white rounded-[2.5rem] shadow-2xl border border-[#3D7A68]/10 z-20"
                 >
                    <div className="absolute -bottom-4 left-10 w-8 h-8 bg-white rotate-45 border-r border-b border-[#3D7A68]/10" />
                    <p className="text-[#1A3C34] font-black italic text-lg leading-tight mb-2">"Hi! I'm here to guide you."</p>
                    <p className="text-[#5A7A70] text-xs font-bold leading-relaxed">Let's walk through how our clinic system ensures you get the best care without the wait.</p>
                 </motion.div>
               </motion.div>

               {/* Background Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#E6F4F1] rounded-full blur-[100px] -z-0 opacity-40" />
            </div>

            {/* System Details */}
            <div className="lg:w-1/2">
               <motion.div
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
               >
                  <span className="text-[#3D7A68] font-black text-[10px] uppercase tracking-[0.2em] mb-4 block">System Overview</span>
                  <h2 className="text-4xl md:text-5xl font-black text-[#1A3C34] mb-8 italic leading-tight">
                    Smart Care Ecosystem <br />
                    <span className="text-[#3D7A68]">How it Works.</span>
                  </h2>

                  <div className="space-y-8">
                     {[
                       { title: "Search & Select", icon: Search, detail: "Find specialized clinics by name or location using our intelligent search filters." },
                       { title: "Instant Slot Booking", icon: Calendar, detail: "View real-time availability and book your preferred time slot in just three clicks." },
                       { title: "Digital Check-in", icon: Zap, detail: "On arrival, scan the clinic QR code to instantly check-in and enter the virtual queue." },
                       { title: "Live Queue Monitor", icon: Activity, detail: "Wait comfortably! Track your turn via our live dashboard notification system." }
                     ].map((step, i) => (
                       <motion.div 
                         key={i}
                         initial={{ opacity: 0, x: 30 }}
                         whileInView={{ opacity: 1, x: 0 }}
                         transition={{ delay: i * 0.1 }}
                         className="flex gap-6 p-6 bg-[#F5F9F8] rounded-[2.5rem] border border-transparent hover:border-[#3D7A68]/10 hover:bg-white hover:shadow-xl transition-all group"
                       >
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-[#3D7A68] group-hover:scale-110 transition-transform">
                             <step.icon size={24} />
                          </div>
                          <div>
                             <h4 className="font-black text-xl text-[#1A3C34] mb-1 italic">{step.title}</h4>
                             <p className="text-[#5A7A70] text-sm font-medium leading-relaxed opacity-70">{step.detail}</p>
                          </div>
                       </motion.div>
                     ))}
                  </div>
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-32 px-6 bg-[#1A3C34] text-white overflow-hidden">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
               <h2 className="text-4xl font-black italic tracking-tight">Why Choose Our Clinics?</h2>
               <div className="w-20 h-1.5 bg-[#00C2A8] mx-auto mt-6 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               {CLINIC_FEATURES.map((feat, i) => (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="p-10 bg-white/5 backdrop-blur-md rounded-[3.5rem] border border-white/10 hover:bg-white/10 transition-all text-center group"
                 >
                    <div className="w-20 h-20 bg-[#00C2A8] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl transform group-hover:rotate-12 transition-all">
                       <feat.icon size={32} color="white" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 italic">{feat.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed font-medium">{feat.desc}</p>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* ── Statistics ── */}
      <section className="py-32 px-6 bg-white">
         <div className="max-w-4xl mx-auto text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
               {[
                 { label: 'Clinics', val: '10+' },
                 { label: 'Doctors', val: '25+' },
                 { label: 'Patients', val: '200+' },
                 { label: 'Ratings', val: '5.0/5' }
               ].map((stat, i) => (
                 <div key={i}>
                    <div className="text-4xl font-black text-[#1A3C34] mb-2 italic">{stat.val}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#3D7A68]">{stat.label}</div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-20 px-6 bg-[#F5F9F8] border-t border-[#3D7A68]/10 text-center">
        <Logo size="md" variant="dark" className="mx-auto mb-10" />
        <div className="flex justify-center gap-12 text-[#5A7A70] text-[10px] font-black uppercase tracking-widest mb-10">
          <a href="#" className="hover:text-[#3D7A68] transition-colors no-underline">Privacy</a>
          <a href="#" className="hover:text-[#3D7A68] transition-colors no-underline">Terms</a>
          <a href="#" className="hover:text-[#3D7A68] transition-colors no-underline">Contact</a>
        </div>
        <p className="text-[#5A7A70] text-[10px] font-bold opacity-60">© {new Date().getFullYear()} careNconnect Clinic Network. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default FindClinics;
