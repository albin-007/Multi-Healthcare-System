import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, FlaskConical, ShieldCheck, ArrowRight,
  ChevronRight, Star, Building2, Zap, Activity, HeartPulse,
  Droplets, Thermometer, Brain, Microscope, ClipboardCheck, Info,
  Users, Calendar, TrendingDown, Check, Plus, ShoppingCart
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';

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

const FindTests = () => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const locationState = useLocation().state;
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [testRequestId, setTestRequestId] = useState(null);
  const [prescribedTests, setPrescribedTests] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTests, setSelectedTests] = useState([]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await api.get('users/lab-tests/');
        setLabTests(response.data);
      } catch (err) {
        console.error("Failed to fetch tests", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  useEffect(() => {
    if (locationState?.searchTerm) setSearchTerm(locationState.searchTerm);
    if (locationState?.testRequestId) setTestRequestId(locationState.testRequestId);
    if (locationState?.prescribedTests) setPrescribedTests(locationState.prescribedTests);
  }, [locationState]);

  const filteredTests = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const normalizedLocation = location.toLowerCase().trim();

    return labTests.filter(test => {
      const nameMatch = test.name?.toLowerCase().includes(normalizedSearch);
      const categoryMatch = test.category?.toLowerCase().includes(normalizedSearch);
      const descMatch = test.description?.toLowerCase().includes(normalizedSearch);
      const labMatch = test.lab_details?.name?.toLowerCase().includes(normalizedSearch);

      const searchMatch = !normalizedSearch || nameMatch || categoryMatch || descMatch || labMatch;

      const addrMatch = (test.lab_details?.address || '').toLowerCase().includes(normalizedLocation);
      const cityMatch = (test.lab_details?.city || '').toLowerCase().includes(normalizedLocation);
      const locationMatch = !normalizedLocation || addrMatch || cityMatch;

      return searchMatch && locationMatch;
    });
  }, [searchTerm, location, labTests]);

  const displayedTests = useMemo(() => {
    if (!searchTerm.trim() && !location.trim()) return [];
    return filteredTests;
  }, [filteredTests, searchTerm, location]);

  const toggleTestSelection = (test) => {
    if (selectedTests.length > 0 && selectedTests[0].lab_details?.id !== test.lab_details?.id) {
      if (window.confirm(`You can only book tests from one lab at a time (${selectedTests[0].lab_details?.name}). Clear current selection and select this test from ${test.lab_details?.name}?`)) {
        setSelectedTests([test]);
      }
      return;
    }

    const isSelected = selectedTests.some(t => t.id === test.id);
    if (isSelected) {
      setSelectedTests(prev => prev.filter(t => t.id !== test.id));
    } else {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const handleBookSelected = () => {
    if (selectedTests.length === 0) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userRole !== 'USER') {
      navigate('/unauthorized');
      return;
    }

    const labId = selectedTests[0].lab_details?.id;
    navigate('/patient/book', {
      state: {
        entityId: labId,
        entityType: 'LAB',
        step: 3,
        selectedTests: selectedTests.map(t => t.id),
        testRequestId: testRequestId
      }
    });
  };

  const handleBookTest = (labId, testId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userRole !== 'USER') {
      navigate('/unauthorized');
      return;
    }

    // If it's a doctor's request, book the entire request at this lab
    if (testRequestId) {
      navigate('/patient/book', {
        state: {
          entityId: labId,
          entityType: 'LAB',
          step: 3,
          testRequestId: testRequestId
        }
      });
      return;
    }

    navigate('/patient/book', {
      state: {
        entityId: labId,
        entityType: 'LAB',
        step: 3,
        selectedTests: [testId],
        testRequestId: testRequestId
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00C2A8]/20 overflow-x-hidden">
      {/* ── Navigation ── */}
      <Navbar />

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
              Compare <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#00C2A8]">Diagnostic Tests</span> & Pricing
            </h1>

            <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto mb-14 font-medium leading-relaxed">
              Find and compare test prices across accredited laboratories. Get the best rates and fast reports delivered directly to your vault.
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
                  placeholder="Find tests (e.g. CBC, MRI, Thyroid...)"
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
              <button
                onClick={() => {
                  const element = document.getElementById('results-area');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full md:w-auto px-12 py-5 bg-[#3B82F6] text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Find Tests <ArrowRight size={18} />
              </button>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                to="/find-labs"
                className="inline-flex items-center gap-3 px-8 py-3 bg-blue-50 text-[#3B82F6] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 no-underline"
              >
                <Building2 size={16} /> Browse Laboratories Directly
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Search Results ── */}
      <AnimatePresence mode="wait">
        {(searchTerm.trim() || location.trim()) && (
          <motion.section
            id="results-area"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="py-24 px-6 bg-slate-50 border-y border-slate-100 scroll-mt-24 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto">
              {testRequestId && prescribedTests.length > 0 && (
                <div className="mb-16">
                  <div className="bg-gradient-to-r from-[#1A3C34] to-[#142e28] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C2A8] opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                      <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-md">
                        <ClipboardCheck className="text-[#00C2A8]" size={48} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <span className="text-[#00C2A8] font-black text-[10px] uppercase tracking-[0.3em] mb-4 block">Medical Order Detected</span>
                        <h2 className="text-3xl font-black text-white mb-3">Complete Your Prescribed Checkup</h2>
                        <p className="text-slate-400 font-medium max-w-xl">
                          A doctor has requested the following tests for you: <span className="text-white font-bold">{Array.isArray(prescribedTests) ? prescribedTests.join(', ') : prescribedTests}</span>. 
                          Choose an accredited lab below to book all of them in a single appointment.
                        </p>
                      </div>
                      <div className="shrink-0 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
                         <div className="flex items-center gap-3 text-[#00C2A8] mb-2">
                            <ShieldCheck size={20} />
                            <span className="font-black text-xs uppercase tracking-widest">Locked Order</span>
                         </div>
                         <p className="text-[10px] text-slate-400 font-bold">Only prescribed tests will be processed.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-12 text-center md:text-left">
                <h2 className="text-3xl font-black text-[#1A3C34] flex items-center gap-3 justify-center md:justify-start">
                  <FlaskConical className="text-[#3B82F6]" size={32} />
                  Search Results
                  <span className="text-[#3B82F6] bg-blue-100 px-4 py-1 rounded-full text-xl">{displayedTests.length}</span>
                </h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-[2.5rem] animate-pulse" />)}
                </div>
              ) : displayedTests.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <ClipboardCheck className="mx-auto text-slate-300 mb-6" size={64} />
                  <h3 className="text-2xl font-black text-slate-400">No matching tests found</h3>
                  <p className="text-slate-400 font-medium">Try a different name or location.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayedTests.map((test, idx) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -10 }}
                      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
                    >
                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-[1.8rem] flex items-center justify-center shrink-0 border-4 border-white shadow-lg overflow-hidden">
                           {test.lab_details?.avatar_url ? (
                             <img 
                               src={test.lab_details.avatar_url} 
                               alt={test.lab_details.name} 
                               className="w-full h-full object-cover"
                             />
                           ) : (
                             <Microscope className="text-[#3B82F6]" size={32} />
                           )}
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-[#1A3C34] group-hover:text-[#3B82F6] transition-colors">{test.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black uppercase text-slate-400">{test.category || 'General'}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-black text-[#00C2A8]">₹{test.price}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                          <Building2 size={16} className="text-slate-300" />
                          <span className="truncate">{test.lab_details?.name || 'Accredited Lab'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                          <MapPin size={16} className="text-slate-300" />
                          <span className="truncate">{test.lab_details?.address || 'Address Verified'}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <Star size={16} className="fill-yellow-400 text-yellow-400" />
                            <span className="font-black text-[#1A3C34]">4.9</span>
                          </div>
                          {test.lab_details?.home_collection_available && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full">Home Collection</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => toggleTestSelection(test)}
                          className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                            selectedTests.some(t => t.id === test.id)
                              ? 'bg-[#00C2A8] text-white shadow-lg shadow-[#00C2A8]/20'
                              : 'bg-blue-50 text-[#3B82F6] hover:bg-blue-100'
                          }`}
                        >
                          {selectedTests.some(t => t.id === test.id) ? (
                            <>Selected <Check size={16} /></>
                          ) : (
                            <>Add to List <Plus size={16} /></>
                          )}
                        </button>
                        <button
                          onClick={() => handleBookTest(test.lab_details?.id, test.id)}
                          className="px-6 py-4 bg-[#1A3C34] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-slate-800 transition-all"
                          title="Quick Book"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Selection Floating Bar ── */}
      <AnimatePresence>
        {selectedTests.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-full max-w-2xl px-6"
          >
            <div className="bg-[#1A3C34] text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between border-4 border-white">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="text-[#00C2A8]" size={24} />
                </div>
                <div>
                  <h4 className="font-black text-lg">{selectedTests.length} Tests Selected</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    From {selectedTests[0].lab_details?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Price</p>
                  <p className="text-2xl font-black text-[#00C2A8]">₹{selectedTests.reduce((sum, t) => sum + parseFloat(t.price), 0)}</p>
                </div>
                <button
                  onClick={handleBookSelected}
                  className="px-10 py-5 bg-[#00C2A8] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-[#00D9BD] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-[#00C2A8]/20"
                >
                  Book Now <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
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

                <button
                  onClick={() => {
                    setSearchTerm(packageItem.title);
                    document.getElementById('results-area')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="block w-full py-5 bg-teal-500 text-white rounded-[1.8rem] text-center font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 hover:shadow-xl transition-all no-underline"
                >
                  Book Package
                </button>
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

export default FindTests;
