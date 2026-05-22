import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Stethoscope, HeartPulse, Brain, Baby, 
  Activity, Bone, ArrowRight, ChevronRight, Star, ShieldCheck,
  User, Building2, Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { SPECIALIZATION_GROUPS } from '../data/specializations';
import Navbar from '../components/layout/Navbar';

// Mapping specializations to icons for the grid
const specIconMap = {
  'Cardiology': HeartPulse,
  'Neurology': Brain,
  'Pediatrics': Baby,
  'Dermatology': Activity,
  'Orthopedics': Bone,
  'General Medicine': Stethoscope,
  'Surgery': Activity,
  'Psychiatry': Brain,
  'Dentistry': Stethoscope,
};

const FindDoctors = () => {
  const { isAuthenticated, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doctorsRes, clinicsRes] = await Promise.all([
          api.get('users/doctors/'),
          api.get('users/clinics/'),
        ]);
        setDoctors(doctorsRes.data);
        setClinics(clinicsRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!searchTerm && !location) return [];
    return doctors.filter(doc => {
      const nameMatch = !searchTerm || 
                       (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (doc.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());
      const locationMatch = !location || 
                           (doc.clinic?.address || '').toLowerCase().includes(location.toLowerCase()) ||
                           (doc.clinic?.name || '').toLowerCase().includes(location.toLowerCase());
      return nameMatch && locationMatch;
    });
  }, [searchTerm, location, doctors]);

  const displayedSpecializations = useMemo(() => {
    const specs = SPECIALIZATION_GROUPS.map(group => ({
      name: group.group,
      icon: specIconMap[group.group.split(' ')[0]] || Stethoscope,
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
      desc: `Specialists in ${group.options.slice(0, 3).join(', ')}...`
    }));
    
    const colorMap = {
      'Cardiology & Vascular': '#FF4D4D',
      'Neurology & Brain': '#9B51E0',
      'Pediatrics': '#27AE60',
      'Eyes, ENT & Skin': '#F2C94C',
      'Orthopedics & Bones': '#2F80ED',
      'Internal Medicine': '#00C2A8'
    };
    
    return specs.map(s => ({
      ...s,
      color: colorMap[s.name] || '#3D7A68'
    })).slice(0, showAllSpecs ? undefined : 6);
  }, [showAllSpecs]);

  return (
    <div className="min-h-screen bg-[#F5F2ED] font-sans overflow-x-hidden">
      {/* ── Navigation ── */}
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#00C2A8]/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#1A3C34]/20 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#00C2A8]/10 text-[#00C2A8] text-[10px] font-bold uppercase tracking-widest mb-6">Find Your Specialist</span>
            <h1 className="text-4xl md:text-6xl font-black text-[#1A3C34] mb-6 leading-tight">
              Search for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3C34] to-[#00C2A8]">Top-Rated Doctors</span> Near You
            </h1>
            <p className="text-[#5A7A70] text-lg max-w-2xl mx-auto mb-12">
              Connect with board-certified specialists across 40+ medical fields. Book your appointment in seconds.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:flex-row items-center gap-2 p-2 bg-white rounded-2xl md:rounded-full shadow-2xl border border-[#1A3C34]/5 max-w-3xl mx-auto"
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(26, 60, 52, 0.5)" }}
          >
            <div className="flex items-center flex-1 w-full px-4 border-b md:border-b-0 md:border-r border-[#1A3C34]/10">
              <Search className="text-[#3D7A68] mr-3" size={20} />
              <input
                type="text"
                placeholder="Doctor name, specialty..."
                className="w-full py-4 bg-transparent outline-none text-[#1A3C34] placeholder-[#7A9E94]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center flex-1 w-full px-4">
              <MapPin className="text-[#3D7A68] mr-3" size={20} />
              <input
                type="text"
                placeholder="City or location"
                className="w-full py-4 bg-transparent outline-none text-[#1A3C34] placeholder-[#7A9E94]"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button className="w-full md:w-auto px-10 py-4 bg-[#1A3C34] text-white rounded-xl md:rounded-full font-bold hover:bg-[#122822] transition-all active:scale-95 flex items-center justify-center gap-2">
              Search <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Search Results ── */}
      <AnimatePresence>
        {(searchTerm || location) && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="py-12 px-6 bg-white border-b border-[#1A3C34]/5"
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-[#1A3C34]">
                  Search Results <span className="text-[#00C2A8] ml-2">({filteredDoctors.length})</span>
                </h2>
                {filteredDoctors.length > 0 && (
                  <p className="text-sm text-[#5A7A70] font-bold">Showing doctors matching your criteria</p>
                )}
              </div>

              {filteredDoctors.length === 0 ? (
                <div className="text-center py-12 bg-[#F5F2ED] rounded-3xl border-2 border-dashed border-[#1A3C34]/10">
                  <User className="mx-auto text-[#7A9E94] mb-4" size={48} />
                  <h3 className="text-xl font-bold text-[#1A3C34]">No doctors found</h3>
                  <p className="text-[#5A7A70]">Try adjusting your search terms or location.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map((doc, idx) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-[#F5F2ED] p-6 rounded-3xl border border-[#1A3C34]/5 hover:border-[#00C2A8]/30 transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <img 
                            src={doc.user_details?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                            className="w-16 h-16 rounded-2xl border-2 border-white shadow-md object-cover" 
                            alt={doc.name} 
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00C2A8] rounded-full border-2 border-white flex items-center justify-center">
                            <ShieldCheck size={12} color="white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-black text-[#1A3C34] group-hover:text-[#00C2A8] transition-colors">{doc.name}</h4>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#00C2A8]">{doc.specialty}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-xs text-[#5A7A70]">
                          <Building2 size={14} className="text-[#1A3C34]" />
                          <span className="font-bold">{doc.clinic?.name || 'Private Clinic'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#5A7A70]">
                          <MapPin size={14} className="text-[#1A3C34]" />
                          <span className="truncate">{doc.clinic?.address || 'Location Verified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#5A7A70]">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          <span className="font-bold">4.9</span>
                          <span className="opacity-50">(120+ reviews)</span>
                        </div>
                        {doc.user_details?.phone_number && (
                          <div className="flex items-center gap-2 text-xs text-[#5A7A70]">
                            <Phone size={14} className="text-[#1A3C34]" />
                            <span className="font-bold tabular-nums">{doc.user_details.phone_number}</span>
                          </div>
                        )}
                      </div>

                      <Link 
                        to={!isAuthenticated ? "/login" : userRole === 'USER' ? "/patient/book" : "/unauthorized"}
                        state={userRole === 'USER' ? { doctorId: doc.id, entityType: 'DOCTOR', step: 2 } : {}}
                        className="w-full py-3 bg-white text-[#1A3C34] rounded-xl font-bold flex items-center justify-center gap-2 border border-[#1A3C34]/10 hover:bg-[#1A3C34] hover:text-white transition-all no-underline shadow-sm"
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

      {/* ── Specializations ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-[#1A3C34] mb-4">Explore Specializations</h2>
            <div className="w-20 h-1.5 bg-[#00C2A8] mx-auto rounded-full mb-6" />
            <p className="text-[#5A7A70] max-w-xl mx-auto">
              Browse through our most sought-after medical departments to find the care you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedSpecializations.map((spec, index) => (
              <motion.div
                key={spec.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative p-8 bg-[#F5F2ED] rounded-3xl overflow-hidden cursor-pointer"
                onClick={() => {
                   setSearchTerm(spec.name.split(' ')[0]);
                   window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
              >
                {/* Background Pattern Animation */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                  style={{ 
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${spec.color} 1px, transparent 0)`,
                    backgroundSize: '16px 16px'
                  }}
                />

                {/* Background Animation Icon */}
                <div 
                  className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 group-hover:opacity-20 group-hover:scale-150 group-hover:rotate-12 transition-all duration-700 pointer-events-none"
                  style={{ color: spec.color }}
                >
                  <spec.icon size={128} />
                </div>

                <motion.div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:rotate-12 transition-all duration-500"
                  style={{ backgroundColor: spec.color + '20', color: spec.color }}
                  animate={{ 
                    y: [0, -5, 0],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: index * 0.5
                  }}
                >
                  <spec.icon size={32} />
                </motion.div>

                <h3 className="text-xl font-black text-[#1A3C34] mb-3 group-hover:text-[#00C2A8] transition-colors">{spec.name}</h3>
                <p className="text-[#5A7A70] text-sm leading-relaxed mb-6">{spec.desc}</p>
                
                <div className="flex items-center gap-2 text-[#00C2A8] font-bold text-sm">
                  View Doctors <ChevronRight size={16} />
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-16 text-center"
          >
            <button 
              onClick={() => setShowAllSpecs(!showAllSpecs)}
              className="px-8 py-3 rounded-full border-2 border-[#1A3C34]/10 text-[#1A3C34] font-bold hover:bg-[#1A3C34] hover:text-white transition-all shadow-sm active:scale-95"
            >
              {showAllSpecs ? 'Show Less' : 'See All Specialties'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-24 px-6 bg-[#1A3C34] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-black mb-8 leading-tight">
              We make finding doctors <br />
              <span className="text-[#00C2A8]">effortless and secure.</span>
            </h2>
            
            <div className="space-y-8">
              {[
                { title: 'Verified Professionals', desc: 'All doctors are strictly vetted for their certifications and experience.', icon: ShieldCheck },
                { title: 'Real-time Availability', desc: 'See instantly when your favorite doctor is free for a consultation.', icon: Activity },
                { title: 'Patient Reviews', desc: 'Read honest feedback from thousands of patients to make informed choices.', icon: Star },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  className="flex gap-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    <item.icon size={24} className="text-[#00C2A8]" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl relative border-8 border-white/5 group">
              <img 
                src="/medical_specialties_illustration.png" 
                alt="Medical Specialties Illustration" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A3C34] via-transparent to-transparent opacity-60" />
              
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 group-hover:translate-y-[-10px] transition-transform duration-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#00C2A8] flex items-center justify-center shadow-lg">
                    <Stethoscope size={24} color="white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-widest">Specializations</div>
                    <div className="text-2xl font-black">20+</div>
                  </div>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-full bg-[#00C2A8]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 bg-white border-t border-[#1A3C34]/10 text-center">
        <Logo size="md" variant="dark" className="mx-auto mb-8" />
        <p className="text-[#5A7A70] text-sm mb-6">© {new Date().getFullYear()} careNconnect. All rights reserved.</p>
        <div className="flex justify-center gap-8 text-[#5A7A70] text-xs font-bold">
          <a href="#" className="hover:text-[#1A3C34] transition-colors no-underline">Privacy Policy</a>
          <a href="#" className="hover:text-[#1A3C34] transition-colors no-underline">Terms of Service</a>
          <a href="#" className="hover:text-[#1A3C34] transition-colors no-underline">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default FindDoctors;
