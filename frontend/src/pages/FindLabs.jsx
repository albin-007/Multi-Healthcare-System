import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, FlaskConical, ShieldCheck, ArrowRight, 
  ChevronRight, Star, Building2, Zap, Activity, HeartPulse, 
  Droplets, Thermometer, Brain, Microscope, ClipboardCheck, Info,
  Users, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const HEALTH_CONCERNS = [
  { name: 'Diabetes', icon: Activity, color: '#FF6B6B', tests: 'HbA1c, Fasting Blood Sugar' },
  { name: 'Heart', icon: HeartPulse, color: '#FF4D4D', tests: 'Lipid Profile, Troponin I' },
  { name: 'Liver', icon: Droplets, color: '#FF9F43', tests: 'LFT, Bilirubin, SGOT/SGPT' },
  { name: 'Thyroid', icon: Thermometer, color: '#4834D4', tests: 'T3, T4, TSH' },
  { name: 'Kidney', icon: Microscope, color: '#2ECC71', tests: 'KFT, Creatinine, Urea' },
  { name: 'Brain', icon: Brain, color: '#9B51E0', tests: 'Vitamin B12, EEG' },
];

const VITAL_CHECKUPS = [
  { 
    title: 'Full Body Advanced', 
    tests: '85+ Parameters', 
    price: '₹2,499', 
    oldPrice: '₹4,999', 
    tag: 'MOST POPULAR',
    features: ['CBC', 'Lipid Profile', 'KFT', 'LFT', 'Vitamin D', 'HbA1c']
  },
  { 
    title: 'Vitamin Profile', 
    tests: 'B12 & D3', 
    price: '999', 
    oldPrice: '1,999', 
    tag: 'ESSENTIAL',
    features: ['Vitamin B12', 'Vitamin D Total', 'Calcium']
  },
  { 
    title: 'Cardiac Risk Basic', 
    tests: '12 Parameters', 
    price: '1,299', 
    oldPrice: '2,500', 
    tag: 'HEART HEALTH',
    features: ['Lipid Profile', 'HS-CRP', 'Homocysteine']
  },
];

const FindLabs = () => {
  const { isAuthenticated, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const response = await api.get('users/labs/');
        setLabs(response.data);
      } catch (err) {
        console.error("Failed to fetch labs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, []);

  const filteredLabs = useMemo(() => {
    if (!searchTerm && !location) return [];
    return labs.filter(lab => {
      const nameMatch = lab.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const locationMatch = !location || (lab.address || '').toLowerCase().includes(location.toLowerCase());
      return nameMatch && locationMatch;
    });
  }, [searchTerm, location, labs]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00C2A8]/20 overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-[#1A3C34]/5 shadow-sm">
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
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[100px]" 
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 text-[#3B82F6] mb-8 border border-blue-100">
              <Zap size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Certified Diagnostic Network</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-[#1A3C34] mb-8 tracking-tight">
              Book Certified <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#00C2A8]">Diagnostic Labs</span>
            </h1>
            
            <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto mb-14 font-medium leading-relaxed">
              Find and book tests at accredited laboratories near you. Get accurate reports delivered directly to your secure health vault.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="flex flex-col md:flex-row items-center gap-3 p-3 bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(26,60,52,0.1)] border border-slate-100">
              <div className="flex items-center flex-1 w-full px-6 border-b md:border-b-0 md:border-r border-slate-100">
                <Search className="text-slate-400 shrink-0" size={20} />
                <input
                  type="text"
                  placeholder="Find labs or specific tests..."
                  className="w-full py-5 bg-transparent outline-none text-[#1A3C34] font-bold text-sm px-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center flex-1 w-full px-6">
                <MapPin className="text-slate-400 shrink-0" size={20} />
                <input
                  type="text"
                  placeholder="City or locality"
                  className="w-full py-5 bg-transparent outline-none text-[#1A3C34] font-bold text-sm px-4"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <button className="w-full md:w-auto px-12 py-5 bg-[#3B82F6] text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                Find Labs <ArrowRight size={18} />
              </button>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Link 
                to="/find-tests"
                className="inline-flex items-center gap-3 px-8 py-3 bg-brand-50 text-brand-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-100 transition-all border border-brand-100 no-underline"
              >
                <TrendingDown size={16} /> Compare Test Prices Across Labs
              </Link>
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
                <h2 className="text-3xl font-black text-[#1A3C34] flex items-center gap-3 justify-center md:justify-start">
                  <Microscope className="text-[#3B82F6]" size={32} />
                  Labs Found <span className="text-[#3B82F6] bg-blue-100 px-4 py-1 rounded-full text-xl">{filteredLabs.length}</span>
                </h2>
              </div>

              {filteredLabs.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <ClipboardCheck className="mx-auto text-slate-300 mb-6" size={64} />
                  <h3 className="text-2xl font-black text-slate-400">No matching labs found</h3>
                  <p className="text-slate-400 font-medium">Try a different name or location.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredLabs.map((lab, idx) => (
                    <motion.div
                      key={lab.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -10 }}
                      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
                    >
                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-[1.8rem] flex items-center justify-center shrink-0 border-4 border-white shadow-lg">
                           <Building2 className="text-[#3B82F6]" size={32} />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-[#1A3C34] group-hover:text-[#3B82F6] transition-colors">{lab.name}</h4>
                          <div className="flex items-center gap-1.5 mt-2">
                             <div className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                               <ShieldCheck size={10} /> Certified
                             </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                          <MapPin size={16} className="text-slate-300" />
                          <span className="truncate">{lab.address || 'Address Verified'}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-2">
                             <Star size={16} className="fill-yellow-400 text-yellow-400" />
                             <span className="font-black text-[#1A3C34]">4.8</span>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">(95+ REVIEWS)</span>
                          </div>
                        </div>
                      </div>

                      <Link 
                        to={!isAuthenticated ? "/login" : userRole === 'USER' ? "/patient" : "/unauthorized"}
                        className="w-full py-4 bg-[#1A3C34] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all no-underline"
                      >
                        Book Test Now <ArrowRight size={16} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      {/* ── Lab System Overview ── */}
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
                 <div className="relative aspect-[4/5] max-w-[450px] mx-auto rounded-[4rem] overflow-hidden border-8 border-blue-50 shadow-2xl">
                    <img 
                      src="/friendly_nurse_mascot.png" 
                      alt="Diagnostic Staff Mascot" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                 </div>

                 {/* Animated Speech Bubble */}
                 <motion.div
                   initial={{ opacity: 0, scale: 0.5, y: 20 }}
                   whileInView={{ opacity: 1, scale: 1, y: 0 }}
                   transition={{ delay: 0.8, type: "spring" }}
                   className="absolute -top-10 -right-10 md:-right-20 max-w-[280px] p-8 bg-white rounded-[2.5rem] shadow-2xl border border-blue-100 z-20"
                 >
                    <div className="absolute -bottom-4 left-10 w-8 h-8 bg-white rotate-45 border-r border-b border-blue-100" />
                    <p className="text-[#1A3C34] font-black italic text-lg leading-tight mb-2">"Accurate testing, right at home."</p>
                    <p className="text-slate-500 text-xs font-bold leading-relaxed">I'll help you understand how our seamless home-collection and diagnostic process works.</p>
                 </motion.div>
               </motion.div>

               {/* Background Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50 rounded-full blur-[100px] -z-0 opacity-40" />
            </div>

            {/* System Details */}
            <div className="lg:w-1/2">
               <motion.div
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
               >
                  <span className="text-[#3B82F6] font-black text-[10px] uppercase tracking-[0.2em] mb-4 block">Process Guide</span>
                  <h2 className="text-4xl md:text-5xl font-black text-[#1A3C34] mb-8 italic leading-tight">
                    Smart Diagnostics <br />
                    <span className="text-[#3B82F6]">How it Works.</span>
                  </h2>

                  <div className="space-y-8">
                     {[
                       { title: "Browse & Compare", icon: Search, detail: "Search for specific diagnostic tests and compare pricing across multiple NABL certified laboratories." },
                       { title: "Home Collection", icon: MapPin, detail: "Schedule a certified phlebotomist to collect your samples from the comfort of your home." },
                       { title: "Lab Processing", icon: Microscope, detail: "Samples are processed in NABL accredited labs using state-of-the-art diagnostic technology." },
                       { title: "Smart Reports", icon: Activity, detail: "Get notified as soon as your reports are ready. Access them anytime in your secure digital vault." }
                     ].map((step, i) => (
                       <motion.div 
                         key={i}
                         initial={{ opacity: 0, x: 30 }}
                         whileInView={{ opacity: 1, x: 0 }}
                         transition={{ delay: i * 0.1 }}
                         className="flex gap-6 p-6 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-xl transition-all group"
                       >
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-[#3B82F6] group-hover:scale-110 transition-transform">
                             <step.icon size={24} />
                          </div>
                          <div>
                             <h4 className="font-black text-xl text-[#1A3C34] mb-1 italic">{step.title}</h4>
                             <p className="text-slate-500 text-sm font-medium leading-relaxed opacity-70">{step.detail}</p>
                          </div>
                       </motion.div>
                     ))}
                  </div>
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Health Concerns ── */}
      <section className="py-32 px-6 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <span className="text-[#3B82F6] font-black text-[10px] uppercase tracking-[0.2em] mb-4 block">Personalized Diagnosis</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#1A3C34] mb-4 italic">Find Tests by Health Concern</h2>
            <div className="w-24 h-2 bg-gradient-to-r from-blue-500 to-teal-400 mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {HEALTH_CONCERNS.map((concern, idx) => (
              <motion.div
                key={concern.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="group p-8 bg-slate-50 rounded-[2.5rem] text-center cursor-pointer border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-xl transition-all"
                onClick={() => setSearchTerm(concern.name)}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:rotate-12 transition-transform duration-500"
                  style={{ backgroundColor: concern.color + '15', color: concern.color }}
                >
                  <concern.icon size={32} />
                </div>
                <h4 className="font-black text-[#1A3C34] mb-2">{concern.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                  {concern.tests}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vital Checkups ── */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <span className="text-teal-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4 block">Recommended for You</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#1A3C34] mb-4 italic">Vital Health Checkups</h2>
            <div className="w-24 h-2 bg-teal-500 mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VITAL_CHECKUPS.map((packageItem, idx) => (
              <motion.div
                key={packageItem.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 relative group"
              >
                <div className="absolute top-8 right-8 px-4 py-1.5 bg-teal-50 text-teal-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-teal-100">
                  {packageItem.tag}
                </div>
                
                <div className="mb-10">
                  <h3 className="text-2xl font-black text-[#1A3C34] mb-2">{packageItem.title}</h3>
                  <p className="text-teal-500 font-bold text-sm mb-4 italic">{packageItem.tests} included</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-[#1A3C34]">{packageItem.price}</span>
                    <span className="text-slate-300 line-through text-sm font-bold">{packageItem.oldPrice}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                   {packageItem.features.map((f, i) => (
                     <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                           <ClipboardCheck size={12} className="text-teal-600" />
                        </div>
                        {f}
                     </div>
                   ))}
                </div>

                <Link 
                  to={!isAuthenticated ? "/login" : userRole === 'USER' ? "/patient" : "/unauthorized"}
                  className="block w-full py-5 bg-teal-500 text-white rounded-[1.8rem] text-center font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 hover:shadow-xl transition-all no-underline"
                >
                  Book Package
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Footer ── */}
      <footer className="py-20 px-6 bg-[#F8FAFC] border-t border-slate-100 text-center">
        <Logo size="md" variant="dark" className="mx-auto mb-10" />
        <div className="flex justify-center gap-12 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-10">
          <a href="#" className="hover:text-blue-500 transition-colors no-underline">Privacy</a>
          <a href="#" className="hover:text-blue-500 transition-colors no-underline">Terms</a>
          <a href="#" className="hover:text-blue-500 transition-colors no-underline">Contact</a>
        </div>
        <p className="text-slate-400 text-[10px] font-bold opacity-60">© {new Date().getFullYear()} careNconnect Diagnostics. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default FindLabs;
