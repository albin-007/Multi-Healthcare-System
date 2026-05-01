import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../context/DashboardContext';
import {
  LogOut, Stethoscope, ActivitySquare, Clock, User, FileText,
  FlaskConical, History, Plus, Send, CheckCircle2, AlertCircle,
  X, Eye, ChevronRight, LayoutDashboard, Calendar, Users,
  ClipboardList, Menu, Ban, ShieldCheck, Bell, ArrowUpRight, Search
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { logout, userName } = useAuth();
  // Strip any leading "Dr." / "Dr " prefix so we don't show "Dr. Dr Anna Paul"
  const cleanName = (userName || '').replace(/^Dr\.?\s*/i, '').trim() || null;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { 
    setSubTabs, 
    activeSubTab, 
    setActiveSubTab, 
    notifications, 
    unreadCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useDashboard();
  const activeTab = activeSubTab || 'Appointments';
  const setActiveTab = setActiveSubTab;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Good Afternoon 🌤️';
    if (hour < 21) return 'Good Evening 🌙';
    return 'Good Night ✨';
  };

  const [appointments, setAppointments] = useState([]);
  const [labs, setLabs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showLabRequestModal, setShowLabRequestModal] = useState(false);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [patientHistory, setPatientHistory] = useState({ prescriptions: [], tests: [] });
  const [allLabTests, setAllLabTests] = useState([]);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [testRequests, setTestRequests] = useState([]);

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000);
  };

  const [availabilities, setAvailabilities] = useState([]);
  const [newAvail, setNewAvail] = useState({ day_of_week: 0, start_time: '09:00', end_time: '17:00', slot_duration: 30 });
  const [selectedDateFilter, setSelectedDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [daySlots, setDaySlots] = useState([]);
  const [loadingDaySlots, setLoadingDaySlots] = useState(false);

  const fetchData = async () => {
    try {
      const [aptRes, labRes, preRes, availRes, testsRes, testReqRes] = await Promise.all([
        api.get('appointments/'),
        api.get('users/labs/'),
        api.get('records/prescriptions/'),
        api.get('appointments/availability/'),
        api.get('users/lab-tests/'),
        api.get('users/test-requests/'),
      ]);
      setAppointments(aptRes.data || []);
      setLabs(labRes.data || []);
      setPrescriptions(preRes.data || []);
      setAvailabilities(availRes.data || []);
      setAllLabTests(testsRes.data || []);
      setTestRequests(testReqRes.data || []);
    } catch (err) {
      console.error('Failed to fetch doctor dashboard data:', err);
      // Optional: Set defaults on error to prevent undefined maps
      setAppointments([]);
      setLabs([]);
      setPrescriptions([]);
      setAvailabilities([]);
      showToast('Connection error. Please refresh the page.', 'error');
    }
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    try {
      // Get the doctor profile ID
      const doctorRes = await api.get('users/doctors/me/');
      const doctorId = doctorRes.data.id;
      
      await api.post('appointments/availability/', {
        ...newAvail,
        doctor: doctorId
      });
      fetchData();
      showToast('Availability added correctly.');
    } catch (err) {
      let errorMessage = 'Failed to add availability.';
      if (err.response?.status === 404) {
        errorMessage = 'Your Doctor profile is incomplete. Contact your clinic admin.';
      } else if (err.response?.data) {
        if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (typeof err.response.data === 'object') {
          const firstKey = Object.keys(err.response.data)[0];
          if (Array.isArray(err.response.data[firstKey])) {
            errorMessage = `${firstKey}: ${err.response.data[firstKey][0]}`;
          }
        }
      }
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteAvailability = async (id) => {
    try {
      await api.delete(`appointments/availability/${id}/`);
      fetchData();
      showToast('Availability removed.');
    } catch (err) {
      showToast('Failed to remove availability.', 'error');
    }
  };

  const fetchDaySlots = async (date) => {
    try {
      setLoadingDaySlots(true);
      const doctorRes = await api.get('users/doctors/me/');
      const doctorId = doctorRes.data.id;
      const res = await api.get(`appointments/slots/all_slots/?doctor_id=${doctorId}&date=${date}`);
      setDaySlots(res.data);
    } catch (err) {
      console.error('Failed to fetch day slots:', err);
    } finally {
      setLoadingDaySlots(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  // ─── Derived data ────────────────────────────────────────────────────────
  const pendingApts   = appointments.filter(a => a.status === 'PENDING');
  const confirmedApts = appointments.filter(a => a.status === 'CONFIRMED');
  const completedApts = appointments.filter(a => a.status === 'COMPLETED');

  // unique patients
  const uniquePatients = [...new Map(
    appointments.filter(a => a.user).map(a => [a.user.id, a.user])
  ).values()];

  const navItems = [
    { id: 'Appointments', icon: Calendar,     label: 'Appointments',  badge: pendingApts.length },
    { id: 'Patients',     icon: Users,        label: 'Patients' },
    { id: 'Availability', icon: Clock,        label: 'My Schedule' },
    { id: 'Prescriptions',icon: ClipboardList, label: 'Prescriptions' },
    { id: 'Lab Requests', icon: FlaskConical,  label: 'Lab Requests' },
    { id: 'Notifications',icon: Bell,          label: 'Notifications', badge: unreadCount },
  ];

  useEffect(() => {
    setSubTabs(navItems);
    if (!activeSubTab) setActiveSubTab('Appointments');
  }, [pendingApts.length]);

  useEffect(() => {
    if (activeTab === 'Availability' && selectedDateFilter) {
      fetchDaySlots(selectedDateFilter);
    }
  }, [selectedDateFilter, activeTab]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`appointments/${id}/`, { status });
      fetchData();
      showToast(`Appointment ${status === 'CONFIRMED' ? 'accepted' : status.toLowerCase() + 'ed'} successfully.`);
    } catch (err) {
      showToast('Status update failed.', 'error');
    }
  };

  const handleWritePrescription = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      await api.post('records/prescriptions/', {
        appointment_id: selectedAppointment.id,
        patient_id: selectedAppointment.user.id,
        notes: prescriptionNotes,
      });
      setShowPrescriptionModal(false);
      setPrescriptionNotes('');
      fetchData();
      showToast('Prescription written successfully.');
    } catch (err) {
      console.error('Prescription error:', err.response?.data || err);
      const errorMsg = err.response?.data?.appointment?.[0] || 
                      err.response?.data?.non_field_errors?.[0] || 
                      'Failed to write prescription. Ensure this appointment doesn\'t already have one.';
      showToast(errorMsg, 'error');
    }
  };

  const handleRequestLabTest = async (e) => {
    e.preventDefault();
    if (selectedTests.length === 0) {
      showToast('Please select at least one test.', 'error');
      return;
    }

    try {
      await api.post('users/test-requests/', {
        patient: selectedAppointment.user.id,
        tests: selectedTests,
      });
      setShowLabRequestModal(false);
      setSelectedTests([]);
      showToast('Test request sent to patient successfully.');
      fetchData();
    } catch (err) {
      showToast('Failed to send test request.', 'error');
    }
  };

  const fetchPatientHistory = async (patientId) => {
    try {
      const [preRes, testRes] = await Promise.all([
        api.get(`records/prescriptions/?patient_id=${patientId}`),
        api.get(`records/test-results/?patient_id=${patientId}`),
      ]);
      setPatientHistory({
        prescriptions: preRes.data,
        tests: testRes.data
      });
    } catch (err) {
      console.error('Failed to fetch patient history:', err);
    }
  };

  // Local notification functions removed - now using DashboardContext

  const getStatusBadge = (status) => {
    const map = {
      PENDING:   'bg-amber-100 text-amber-700 border-amber-200',
      CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      COMPLETED: 'bg-sky-100 text-sky-700 border-sky-200',
      CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
    };
    const label = { CONFIRMED: 'ACCEPTED' };
    return (
      <Badge className={`uppercase text-[10px] tracking-wider font-black ${map[status] || 'bg-slate-100 text-slate-500 dark:text-slate-400'}`}>
        {label[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">

          {/* ═══ APPOINTMENTS TAB ══════════════════════════════════════ */}
          {activeTab === 'Appointments' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">

              {/* Hero banner */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-brand-600 via-brand-500 to-brand-teal p-10 md:p-14 text-white shadow-2xl shadow-brand-600/20"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.15),transparent_50%)]" />
                <Stethoscope className="absolute -bottom-10 -right-10 w-72 h-72 text-white/5 rotate-12" />
                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className="bg-white/20 text-white border-white/10 mb-6 backdrop-blur-md px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
                      Doctor Workspace • Verified Session
                    </Badge>
                    <p className="text-brand-50 font-black uppercase tracking-[0.4em] text-[10px] mb-4 opacity-80">{getGreeting()}</p>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight italic">Welcome, <br />Dr. {cleanName || 'Doctor'}!</h1>
                    <p className="text-brand-50 mt-6 font-medium opacity-90 max-w-xl text-lg">
                      Manage your appointments, write prescriptions, and order lab tests all from your customized dashboard.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-10">
                      <Button
                        onClick={() => setActiveTab('Availability')}
                        className="bg-white text-brand-600 hover:bg-brand-50 font-black rounded-2xl px-8 py-4 shadow-xl gap-3 text-base group"
                      >
                        My Schedule
                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                      <Button
                        onClick={() => setActiveTab('Patients')}
                        className="bg-brand-teal/20 text-white border border-white/20 hover:bg-white/10 font-black rounded-2xl px-8 py-4 backdrop-blur-sm transition-all"
                      >
                        View Patients
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Today's Appointments", value: appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length, icon: Calendar,      bg: 'bg-brand-50 dark:bg-slate-950',   text: 'text-brand-600' },
                  { label: 'Total Patients',        value: uniquePatients.length,  icon: Users,          bg: 'bg-emerald-50', text: 'text-emerald-600' },
                  { label: 'Prescriptions Written', value: prescriptions.length,   icon: ClipboardList,  bg: 'bg-violet-50',  text: 'text-violet-600' },
                  { label: 'Lab Requests',          value: appointments.filter(a => a.entity_type === 'LAB').length, icon: FlaskConical, bg: 'bg-amber-50', text: 'text-amber-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[1.75rem] border border-brand-50 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center transition-transform group-hover:rotate-6`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Two-col layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Appointment list */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Clock className="w-5 h-5 text-brand-500" /> Today's Appointments
                    </h3>
                    <Badge className="bg-slate-100 text-slate-600 border-0 font-bold px-3 py-1.5">
                      {appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length} Total
                    </Badge>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length === 0 ? (
                      <div className="py-16 text-center">
                        <ActivitySquare className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No appointments scheduled for today.</p>
                      </div>
                    ) : (
                      appointments
                        .filter(a => new Date(a.date).toDateString() === new Date().toDateString())
                        .slice(0, 5)
                        .map(apt => {
                          const name = `${apt.user?.first_name || ''} ${apt.user?.last_name || ''}`.trim() || apt.user?.username || 'Patient';
                          return (
                            <div key={apt.id} className="px-8 py-5 flex items-center justify-between hover:bg-brand-50 dark:bg-slate-950/70 transition-colors group">
                              <div className="flex items-center gap-4">
                                <img 
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                                  className="h-12 w-12 rounded-2xl bg-brand-50 dark:bg-slate-950 border border-brand-50 dark:border-slate-800 shadow-inner group-hover:scale-110 transition-transform"
                                  alt={name}
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-black text-slate-900 dark:text-white text-sm">{name}</p>
                                    {getStatusBadge(apt.status)}
                                    {prescriptions.some(p => p.appointment?.id === apt.id) && (
                                      <Badge className="bg-violet-100 text-violet-700 border-0 text-[9px] font-black uppercase tracking-tighter">PRESCRIBED</Badge>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                                    <Clock className="inline w-3 h-3 mr-1" />
                                    {new Date(apt.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {apt.status === 'PENDING' && (
                                  <Button onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')} className="h-9 px-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl text-xs">
                                    Accept
                                  </Button>
                                )}
                                {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                                  <Button variant="outline" onClick={() => { setSelectedAppointment(apt); if (apt.user?.id) fetchPatientHistory(apt.user.id); }} className="h-9 px-3 border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-100 transition-colors">
                                    <Eye className="w-3.5 h-3.5" /> {prescriptions.some(p => p.appointment?.id === apt.id) ? 'Review' : 'Examine'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                  {appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length > 5 && (
                    <div className="px-8 py-4 border-t border-slate-50 text-center">
                      <button onClick={() => setActiveTab('Appointments')} className="text-[11px] font-black uppercase text-brand-600 hover:text-brand-700 tracking-widest flex items-center gap-1 mx-auto">
                        View All <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Quick Actions</h3>
                  {[
                    { label: 'View All Appointments', desc: 'Manage your schedule',        icon: Calendar,      bg: 'bg-brand-50 dark:bg-slate-950',   text: 'text-brand-600',   tab: 'Appointments' },
                    { label: 'Write Prescription',    desc: 'Create prescriptions',        icon: ClipboardList, bg: 'bg-violet-50',  text: 'text-violet-600',  tab: 'Prescriptions' },
                    { label: 'Request Lab Test',      desc: 'Send to laboratory',          icon: FlaskConical,  bg: 'bg-amber-50',   text: 'text-amber-500',   tab: 'Lab Requests' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab(action.tab)}
                      className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex items-center gap-4 group"
                    >
                      <div className={`p-3 rounded-xl ${action.bg} ${action.text} group-hover:scale-110 transition-transform shrink-0`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{action.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{action.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ AVAILABILITY TAB ════════════════════════════════════════ */}
          {activeTab === 'Availability' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Weekly Schedule</h3>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Define your working hours and appointment slot duration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form to add availability */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-brand-600" /> Add Working Hours
                  </h4>
                  <form onSubmit={handleAddAvailability} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Day of the Week</label>
                      <select 
                        className="w-full h-12 bg-brand-50 dark:bg-slate-950 border border-brand-50 dark:border-slate-800 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                        value={newAvail.day_of_week}
                        onChange={e => setNewAvail({...newAvail, day_of_week: parseInt(e.target.value)})}
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                          <option key={i} value={i}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Start Time</label>
                        <input 
                          type="time" 
                          className="w-full h-12 bg-brand-50 dark:bg-slate-950 border border-brand-50 dark:border-slate-800 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                          value={newAvail.start_time}
                          onChange={e => setNewAvail({...newAvail, start_time: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">End Time</label>
                        <input 
                          type="time" 
                          className="w-full h-12 bg-brand-50 dark:bg-slate-950 border border-brand-50 dark:border-slate-800 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                          value={newAvail.end_time}
                          onChange={e => setNewAvail({...newAvail, end_time: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Slot Duration (Min)</label>
                      <input 
                        type="number" 
                        className="w-full h-12 bg-brand-50 dark:bg-slate-950 border border-brand-50 dark:border-slate-800 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                        value={newAvail.slot_duration}
                        onChange={e => setNewAvail({...newAvail, slot_duration: parseInt(e.target.value)})}
                        min="15"
                        max="120"
                        step="15"
                      />
                    </div>
                    <Button type="submit" className="w-full h-14 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl shadow-lg shadow-brand-500/20 mt-4 transition-transform hover:scale-105 active:scale-95">
                      Register Hours
                    </Button>
                  </form>
                </div>

                {/* List of current availabilities */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 px-2">Current Schedule</h4>
                  {availabilities.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-16 rounded-[2rem] border-2 border-dashed border-brand-50 dark:border-slate-800 text-center">
                       <Clock className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                       <p className="text-slate-400 dark:text-slate-500 font-bold">No working hours defined yet.</p>
                       <p className="text-xs text-slate-300 mt-1">Start by adding your schedule in the form.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {availabilities.map(avail => (
                        <div key={avail.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all hover:translate-x-1">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-slate-950 text-brand-600 flex items-center justify-center font-black">
                              {avail.day_display?.substring(0, 3)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white tracking-tight">{avail.day_display}</p>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                {avail.start_time.substring(0,5)} - {avail.end_time.substring(0,5)} • {avail.slot_duration} Min Slots
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteAvailability(avail.id)}
                            className="p-2 h-10 w-10 flex items-center justify-center rounded-xl bg-brand-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Schedule Preview - Added to help doctors see generated slots */}
              <div className="pt-8 border-t border-brand-50 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Daily Schedule Preview</h4>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Review the generated slots for patients on a specific date</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm">
                    <Calendar className="w-5 h-5 text-brand-600 ml-2" />
                    <input 
                      type="date"
                      className="bg-transparent border-0 font-black text-sm focus:ring-0 outline-none pr-4"
                      value={selectedDateFilter}
                      onChange={e => setSelectedDateFilter(e.target.value)}
                    />
                  </div>
                </div>

                {loadingDaySlots ? (
                  <div className="flex justify-center p-20">
                    <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
                  </div>
                ) : daySlots.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] border-2 border-dashed border-brand-50 dark:border-slate-800 text-center">
                    <div className="w-20 h-20 bg-brand-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Ban className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-lg">No slots available for this date.</p>
                    <p className="text-sm text-slate-300 mt-2">Ensure you have working hours defined for this day of the week.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {daySlots.map(slot => (
                      <div 
                        key={slot.id} 
                        className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 group relative overflow-hidden ${
                          slot.is_booked 
                            ? 'bg-rose-50 border-rose-100 text-rose-600' 
                            : 'bg-white dark:bg-slate-900 border-brand-50 dark:border-slate-800 hover:border-brand-50 dark:border-slate-800 hover:shadow-xl hover:shadow-brand-500/10'
                        }`}
                      >
                        <Clock className={`w-5 h-5 ${slot.is_booked ? 'text-rose-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-brand-500'}`} />
                        <span className="font-black text-sm">
                          {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                        <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                          slot.is_booked ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400 dark:text-slate-500'
                        }`}>
                          {slot.is_booked ? 'Booked' : 'Available'}
                        </div>
                        {slot.is_booked && (
                           <div className="absolute top-0 right-0 p-1">
                             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ═══ PRESCRIPTIONS TAB ═════════════════════════════════════ */}
          {activeTab === 'Prescriptions' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Prescriptions</h3>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">All prescriptions you have written</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-slate-100 text-slate-600 border-0 font-bold px-4 py-2">
                    {prescriptions.length} Total
                  </Badge>
                  <Button
                    onClick={() => {
                      if (appointments.length > 0) {
                        setSelectedAppointment(appointments[0]);
                        setShowPrescriptionModal(true);
                      } else {
                        showToast('No appointments available to prescribe for.', 'error');
                      }
                    }}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl h-10 px-6 gap-2 shadow-lg shadow-brand-500/20"
                  >
                    <Plus className="w-4 h-4" /> New Prescription
                  </Button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-50 dark:bg-slate-950 border-b border-brand-50 dark:border-slate-800">
                        {['Patient', 'Notes / Medication', 'Date Written', 'Status'].map((h, i) => (
                          <th key={i} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {prescriptions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-16 text-center">
                            <ClipboardList className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No prescriptions written yet.</p>
                          </td>
                        </tr>
                      ) : (
                        prescriptions.map(p => {
                          const name = `${p.patient?.first_name || ''} ${p.patient?.last_name || ''}`.trim() || p.patient?.username || '—';
                          return (
                            <tr key={p.id} className="hover:bg-brand-50 dark:bg-slate-950/50 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                                    className="w-9 h-9 rounded-xl border border-brand-50 dark:border-slate-800 shadow-sm"
                                    alt={name}
                                  />
                                  <p className="font-black text-slate-900 dark:text-white text-sm">{name}</p>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <p className="font-bold text-slate-600 text-sm italic truncate max-w-[300px]">"{p.notes}"</p>
                              </td>
                              <td className="px-8 py-5">
                                <p className="font-bold text-slate-500 dark:text-slate-400 text-sm">{new Date(p.created_at).toLocaleDateString()}</p>
                              </td>
                              <td className="px-8 py-5">
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] tracking-wider font-black">
                                  Authorized
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ LAB REQUESTS TAB ══════════════════════════════════════ */}
          {activeTab === 'Lab Requests' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Diagnostic Test Requests</h3>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Prescribe lab tests and track their status</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="bg-brand-50 text-brand-700 border-0 font-bold px-4 py-2">
                    {testRequests.length} Requests Issued
                  </Badge>
                  <Button
                    onClick={() => {
                      setSelectedAppointment(null);
                      setShowLabRequestModal(true);
                    }}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl h-12 px-6 gap-2 shadow-lg shadow-brand-500/20"
                  >
                    <Plus className="w-5 h-5" /> Prescribe New Test
                  </Button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pending Fulfillment</p>
                    <p className="text-3xl font-black text-amber-500">{testRequests.filter(r => r.status === 'PENDING').length}</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Patient Booked</p>
                    <p className="text-3xl font-black text-brand-500">{testRequests.filter(r => r.status === 'BOOKED').length}</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Reports Completed</p>
                    <p className="text-3xl font-black text-emerald-500">{testRequests.filter(r => r.status === 'COMPLETED').length}</p>
                 </div>
              </div>

              {/* Request Log */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="px-8 py-6 border-b border-brand-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                   <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                     <History className="w-5 h-5 text-brand-600" /> Prescribed Tests Log
                   </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-brand-50 dark:border-slate-800">
                        {['Patient', 'Tests Requested', 'Request Date', 'Status'].map((h, i) => (
                          <th key={i} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {testRequests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <FlaskConical className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-bold">No test requests issued yet.</p>
                            <p className="text-xs text-slate-300 mt-1 italic">Click 'Prescribe New Test' to start.</p>
                          </td>
                        </tr>
                      ) : (
                        testRequests.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(req => {
                          const name = `${req.patient_details?.first_name || ''} ${req.patient_details?.last_name || ''}`.trim() || req.patient_details?.username || '—';
                          return (
                            <tr key={req.id} className="hover:bg-brand-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-slate-950 text-brand-600 flex items-center justify-center font-black">
                                    {name[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-900 dark:text-white text-sm">{name}</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">ID: {req.patient_details?.id?.toString().substring(0,6)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex flex-wrap gap-1.5">
                                   {(Array.isArray(req.tests) ? req.tests : (typeof req.tests === 'string' ? req.tests.split(',') : [])).map((t, idx) => (
                                     <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                                       {typeof t === 'string' ? t.trim() : (t.name || 'Test')}
                                     </span>
                                   ))}
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              </td>
                              <td className="px-8 py-5">
                                <Badge className={`uppercase text-[10px] font-black tracking-widest ${
                                  req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                  req.status === 'BOOKED' ? 'bg-brand-100 text-brand-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {req.status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 flex gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                   <Bell className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                   <p className="text-sm font-black text-indigo-900 dark:text-indigo-400 italic">How it works:</p>
                   <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed opacity-80">
                     When you prescribe a test, the patient receives a notification on their dashboard. They can then choose any accredited laboratory in our network to fulfill the request. You will be notified automatically once the patient books their appointment and when results are uploaded.
                   </p>
                 </div>
              </div>
            </div>
          )}

          {/* ═══ PATIENTS TAB ══════════════════════════════════════════ */}
          {activeTab === 'Patients' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Patient Directory</h3>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Unified view of all unique patients in your care</p>
                </div>
                <Badge className="bg-brand-50 text-brand-700 border-0 font-bold px-4 py-2">
                  {uniquePatients.length} Total Patients
                </Badge>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-50 dark:bg-slate-950 border-b border-brand-50 dark:border-slate-800">
                        {['Patient', 'Health ID', 'Demographics', 'Actions'].map((h, i) => (
                          <th key={i} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {uniquePatients.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-bold">No patients registered yet.</p>
                          </td>
                        </tr>
                      ) : (
                        uniquePatients.map(p => {
                          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username || '—';
                          return (
                            <tr key={p.id} className="hover:bg-brand-50 dark:bg-slate-950/50 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                                    className="w-10 h-10 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm"
                                    alt={name}
                                  />
                                  <p className="font-black text-slate-900 dark:text-white text-sm">{name}</p>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">PID-{String(p.id).substring(0,8)}</p>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex gap-2">
                                  <Badge className="bg-slate-50 text-slate-500 border-0 font-bold text-[9px]">{p.gender || 'N/A'}</Badge>
                                  <Badge className="bg-slate-50 text-slate-500 border-0 font-bold text-[9px]">{p.age || '—'} Yrs</Badge>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <Button 
                                  variant="outline" 
                                  onClick={() => { setSelectedAppointment({ user: p }); fetchPatientHistory(p.id); }}
                                  className="h-9 px-4 border-slate-200 rounded-xl text-xs font-bold hover:bg-brand-50 hover:text-brand-600 transition-colors"
                                >
                                  View History
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ NOTIFICATIONS TAB ═════════════════════════════════════ */}
          {activeTab === 'Notifications' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Health Alerts & Notifications</h3>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Stay updated with patient reports and system alerts</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                  <Button 
                    onClick={markAllNotificationsAsRead}
                    variant="outline" 
                    className="border-brand-200 text-brand-600 font-black rounded-xl h-10 px-4 gap-2 hover:bg-brand-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark All Read
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] border-2 border-dashed border-brand-50 dark:border-slate-800 text-center">
                    <Bell className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 font-bold">No notifications to show.</p>
                  </div>
                ) : (
                  notifications.map(noti => (
                    <div 
                      key={noti.id} 
                      className={`p-6 rounded-[2rem] border transition-all flex items-start justify-between gap-6 group ${
                        noti.is_read 
                          ? 'bg-white dark:bg-slate-900 border-brand-50 dark:border-slate-800' 
                          : 'bg-brand-50/50 dark:bg-brand-500/5 border-brand-200 dark:border-brand-500/20 shadow-lg shadow-brand-500/5'
                      }`}
                    >
                      <div className="flex gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          noti.is_read ? 'bg-slate-100 text-slate-400' : 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                        }`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className={`font-black tracking-tight ${noti.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{noti.title}</h4>
                            {!noti.is_read && <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />}
                          </div>
                          <p className={`text-sm mt-1 font-medium leading-relaxed ${noti.is_read ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{noti.message}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-3">{new Date(noti.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      {!noti.is_read && (
                        <button 
                          onClick={() => markNotificationAsRead(noti.id)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-brand-100 text-brand-600 hover:bg-brand-600 hover:text-white transition-all shadow-sm"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

      {/* ── Patient Details & History Modal ────────────────────────────── */}
      {selectedAppointment && !showPrescriptionModal && !showLabRequestModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-brand-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-xl font-black">
                  {selectedAppointment.user?.first_name?.[0] || selectedAppointment.user?.username?.[0] || 'P'}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {`${selectedAppointment.user?.first_name || ''} ${selectedAppointment.user?.last_name || ''}`.trim() || selectedAppointment.user?.username}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Health Record ID: {selectedAppointment.user?.id?.toString().substring(0, 8) || 'N/A'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-white dark:bg-slate-900 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left col - bio + actions */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-brand-50 dark:bg-slate-950 p-6 rounded-[2rem] space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600">Patient Bio</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">Gender</span>
                      <span className="text-slate-900 dark:text-white text-xs font-black uppercase">{selectedAppointment.user?.gender || 'Not Set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">Age</span>
                      <span className="text-slate-900 dark:text-white text-xs font-black">{selectedAppointment.user?.age || 'N/A'} Yrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">Status</span>
                      {getStatusBadge(selectedAppointment.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {prescriptions.some(p => p.appointment?.id === selectedAppointment.id) ? (
                    <div className="p-5 rounded-2xl bg-violet-50 border border-violet-100 space-y-3">
                      <div className="flex items-center gap-2 text-violet-700">
                        <ClipboardList className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Prescription Issued</span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 italic leading-relaxed">
                        "{prescriptions.find(p => p.appointment?.id === selectedAppointment.id)?.notes}"
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPrescriptionModal(true)}
                        className="w-full text-[10px] font-black uppercase text-violet-600 hover:bg-violet-100"
                      >
                        Modify Instructions
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowPrescriptionModal(true)}
                      className="w-full py-6 rounded-2xl bg-brand-600 hover:bg-brand-700 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                    >
                      <Plus className="w-5 h-5" /> Write Prescription
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowLabRequestModal(true)}
                    variant="outline"
                    className="w-full py-6 rounded-2xl border-slate-200 font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <FlaskConical className="w-5 h-5" /> Request Lab Test
                  </Button>
                </div>
              </div>

              {/* Right col - history */}
              <div className="md:col-span-2 space-y-8">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-brand-500" />
                  <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Patient History</h4>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Prescriptions</h5>
                  {patientHistory.prescriptions.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium bg-brand-50 dark:bg-slate-950 p-4 rounded-xl italic text-center">No prescriptions found.</p>
                  ) : (
                    patientHistory.prescriptions.map(p => (
                      <div key={p.id} className="p-4 border border-brand-50 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex justify-between mb-2">
                          <span className="text-[10px] font-black uppercase text-brand-600 tracking-widest">Authorized</span>
                          <time className="text-[10px] font-black text-slate-400 dark:text-slate-500">{new Date(p.created_at).toLocaleDateString()}</time>
                        </div>
                        <p className="text-xs font-bold text-slate-700 italic">"{p.notes}"</p>
                      </div>
                    ))
                  )}

                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 pt-4">Lab Results</h5>
                  {patientHistory.tests.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium bg-brand-50 dark:bg-slate-950 p-4 rounded-xl italic text-center">No lab results yet.</p>
                  ) : (
                    patientHistory.tests.map(t => (
                      <div key={t.id} className="p-4 border border-brand-50 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex justify-between mb-2">
                          <Badge className={t.is_normal ? 'bg-emerald-500 text-white border-0' : 'bg-rose-500 text-white border-0'}>
                            {t.is_normal ? 'NORMAL' : 'ABNORMAL'}
                          </Badge>
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                        <pre className="text-[10px] bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono overflow-x-auto">{t.result_data}</pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <footer className="p-8 border-t border-slate-50 flex justify-between items-center bg-brand-50 dark:bg-slate-950/50">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                End-to-End Encrypted Consultation
              </p>
              <div className="flex gap-3">
                {selectedAppointment.status === 'CONFIRMED' && (
                  <Button onClick={() => { handleUpdateStatus(selectedAppointment.id, 'COMPLETED'); setSelectedAppointment(null); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl">
                    Complete Case
                  </Button>
                )}
                {selectedAppointment.status === 'PENDING' && (
                  <Button onClick={() => { handleUpdateStatus(selectedAppointment.id, 'CONFIRMED'); }} className="bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl">
                    Accept Session
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedAppointment(null)} className="rounded-xl font-bold">
                  Close
                </Button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ── Write Prescription Modal ────────────────────────────────────── */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-brand-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Write Prescription</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mt-0.5">
                    Patient: {`${selectedAppointment?.user?.first_name || ''} ${selectedAppointment?.user?.last_name || ''}`.trim() || selectedAppointment?.user?.username}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPrescriptionModal(false)} className="p-2 hover:bg-white dark:bg-slate-900 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleWritePrescription} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Clinical Instructions & Medication
                </label>
                <textarea
                  value={prescriptionNotes}
                  onChange={e => setPrescriptionNotes(e.target.value)}
                  required
                  className="w-full h-40 p-6 rounded-3xl bg-brand-50 dark:bg-slate-950 border-0 focus:ring-2 focus:ring-brand-500/20 font-bold text-sm tracking-tight outline-none resize-none"
                  placeholder="Specify dosage, duration, and clinical notes..."
                />
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-lg gap-2">
                Submit Prescription <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ── Request Lab Test Modal ──────────────────────────────────────── */}
      {showLabRequestModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-brand-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center">
                  <FlaskConical className="w-6 h-6" />
                </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Prescribe Lab Tests</h3>
                    {selectedAppointment?.user ? (
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mt-0.5">
                        Patient: {`${selectedAppointment?.user?.first_name || ''} ${selectedAppointment?.user?.last_name || ''}`.trim() || selectedAppointment?.user?.username}
                      </p>
                    ) : (
                      <select 
                        className="mt-1 text-[10px] font-black uppercase bg-transparent border-0 text-brand-600 focus:ring-0 cursor-pointer p-0 h-auto font-bold"
                        value={selectedAppointment?.user?.id || ''}
                        onChange={(e) => {
                          const p = uniquePatients.find(up => String(up.id) === e.target.value);
                          if (p) setSelectedAppointment({ user: p, id: null });
                        }}
                      >
                        <option value="">Select Patient...</option>
                        {uniquePatients.map(p => (
                          <option key={p.id} value={p.id}>{`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username}</option>
                        ))}
                      </select>
                    )}
                  </div>
              </div>
              <button onClick={() => { setShowLabRequestModal(false); setSelectedTests([]); }} className="p-2 hover:bg-white dark:bg-slate-900 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleRequestLabTest} className="p-8 space-y-6">
              {!selectedAppointment?.user && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 animate-pulse">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs font-bold text-amber-700">Please select a patient above to proceed.</p>
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Search & Select Tests
                  </label>
                  {selectedTests.length > 0 && (
                    <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                      {selectedTests.length} SELECTED
                    </span>
                  )}
                </div>
                
                <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="text"
                     placeholder="Search diagnostics (e.g. CBC, MRI, Blood...)"
                     value={testSearchQuery}
                     onChange={(e) => setTestSearchQuery(e.target.value)}
                     className="w-full h-14 pl-12 pr-4 bg-brand-50 dark:bg-slate-950/50 border-brand-50 rounded-2xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                   />
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Show Selected Tests First if not searching */}
                  {!testSearchQuery && selectedTests.map(test => (
                    <label key={`selected-${test}`} className="flex items-center gap-3 p-4 rounded-2xl border-2 border-brand-500 bg-brand-50/50 text-brand-700 cursor-pointer animate-in fade-in duration-300">
                      <input 
                        type="checkbox"
                        className="w-5 h-5 rounded-lg border-2 border-brand-500 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        checked={true}
                        onChange={() => setSelectedTests(selectedTests.filter(t => t !== test))}
                      />
                      <span className="font-bold text-sm">{test}</span>
                      <CheckCircle2 className="w-4 h-4 ml-auto text-brand-500" />
                    </label>
                  ))}

                  {/* Filtered List */}
                  {(testSearchQuery 
                    ? [...new Set(allLabTests.map(t => t.name))]
                        .filter(name => name.toLowerCase().includes(testSearchQuery.toLowerCase()))
                        .filter(name => !selectedTests.includes(name))
                    : []
                  ).map(test => (
                    <label key={test} className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 hover:border-brand-200 transition-all cursor-pointer group">
                      <input 
                        type="checkbox"
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 text-brand-600 focus:ring-brand-500 transition-all cursor-pointer"
                        checked={selectedTests.includes(test)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTests([...selectedTests, test]);
                          else setSelectedTests(selectedTests.filter(t => t !== test));
                        }}
                      />
                      <span className="font-bold text-sm text-slate-600 group-hover:text-slate-900">{test}</span>
                    </label>
                  ))}
                  
                  {testSearchQuery && allLabTests.filter(t => t.name.toLowerCase().includes(testSearchQuery.toLowerCase())).length === 0 && (
                    <div className="py-10 text-center text-slate-400 font-bold">
                      No matching tests found.
                    </div>
                  )}

                  {!testSearchQuery && selectedTests.length === 0 && (
                    <div className="py-8 text-center text-slate-400 font-bold border border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                      <Search className="w-6 h-6 mx-auto mb-3 opacity-10" />
                      <p className="text-[10px] uppercase tracking-widest">Start typing to search and add tests...</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-brand-50 dark:bg-slate-950 p-4 rounded-2xl border border-brand-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-brand-700 leading-relaxed uppercase">
                  This request will be sent directly to the patient's dashboard for them to book a lab.
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={!selectedAppointment?.user}
                className={`w-full h-16 rounded-2xl font-black text-lg gap-2 shadow-lg transition-all ${
                  !selectedAppointment?.user 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                }`}
              >
                Send Request to Patient <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom border ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10'
            : 'bg-red-50 text-red-600 border-red-100 shadow-red-500/10'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
