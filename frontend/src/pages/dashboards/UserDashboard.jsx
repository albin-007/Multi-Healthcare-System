import { useState, useEffect } from 'react';
import {
  Calendar, FileText, Activity, Clock, ChevronRight, ActivitySquare,
  Pill, User, Heart, ArrowUpRight, ShieldCheck, LogOut, MessageSquare,
  AlertCircle, X, Star, Send, Stethoscope, CheckCircle2, Search,
  MapPin, Building2, LayoutDashboard, FlaskConical, CreditCard, RotateCcw,
  ThumbsUp, Flag, Menu, Bell, ChevronDown, Users, Smartphone, TrendingUp, Phone, Microscope, Eye, Download, ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../context/DashboardContext';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { logout, userName } = useAuth();

  const [appointments, setAppointments]   = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [testResults, setTestResults]     = useState([]);
  const [clinics, setClinics]             = useState([]);
  const [doctors, setDoctors]             = useState([]);
  const [labs, setLabs]                   = useState([]);
  const [allAvailableTests, setAllAvailableTests] = useState([]);
  const [userInfo, setUserInfo]           = useState(null);
  const [feedbacks, setFeedbacks]         = useState([]);
  const [testRequests, setTestRequests]   = useState([]);

  const [diagnosticsSearch, setDiagnosticsSearch] = useState('');
  const [selectedDiagnosticTest, setSelectedDiagnosticTest] = useState(null);
  const [loading, setLoading]                     = useState(true);

  const [locationSearch, setLocationSearch]       = useState('');
  const [selectedClinicInfo, setSelectedClinicInfo] = useState(null);
  const [selectedDoctorInfo, setSelectedDoctorInfo] = useState(null);
  const { setSubTabs, activeSubTab, setActiveSubTab, globalSearch } = useDashboard();
  const activeTab = activeSubTab || 'Dashboard';
  const setActiveTab = setActiveSubTab;

  const [showFeedbackModal, setShowFeedbackModal]   = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [feedbackData, setFeedbackData]   = useState({ rating: 5, comment: '', target_doctor: '', target_lab: '' });
  const [complaintData, setComplaintData] = useState({ target_user: '', subject: '', description: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [payingAppointmentId, setPayingAppointmentId] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Profile management state
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ new_password: '', confirm_password: '' });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000);
  };

  const fetchData = async () => {
    try {
      const [aptRes, preRes, testRes, clinicRes, docRes, userRes, labRes, feedbackRes, allTestsRes, testReqRes] = await Promise.all([
        api.get('appointments/'),
        api.get('records/prescriptions/'),
        api.get('records/test-results/'),
        api.get('users/clinics/'),
        api.get('users/doctors/'),
        api.get('users/profiles/me/'),
        api.get('users/labs/'),
        api.get('users/feedback/'),
        api.get('users/lab-tests/'),
        api.get('users/test-requests/'),
      ]);
      setAppointments(aptRes.data);
      setPrescriptions(preRes.data);
      setTestResults(testRes.data);
      setClinics(clinicRes.data);
      setDoctors(docRes.data);
      setLabs(labRes.data);
      setUserInfo(userRes.data);
      setFeedbacks(feedbackRes.data);
      setAllAvailableTests(allTestsRes.data);
      setTestRequests(testReqRes.data);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const upcomingApts  = (appointments || [])
    .filter(a => (a.status === 'PENDING' || a.status === 'CONFIRMED') && new Date(a.date) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const approvedClinicsList = (clinics || []).filter(c => c.admin_user?.status === 'APPROVED');
  const approvedLabsList = (labs || []).filter(l => l.admin_user?.status === 'APPROVED');

  const filteredAppointments = appointments.filter(a => {
    if (!globalSearch) return true;
    const s = globalSearch.toLowerCase();
    const doc = doctors.find(d => String(d.id) === String(a.entity_id));
    const lab = labs.find(l => String(l.id) === String(a.entity_id));
    let name = a.entity_name || '';
    if (!name || name === 'Unknown' || name.includes('Unknown')) {
      name = a.entity_type === 'DOCTOR' ? (doc?.name || '') : (lab?.name || '');
    }
    return name.toLowerCase().includes(s) || a.entity_type.toLowerCase().includes(s) || a.status.toLowerCase().includes(s);
  });

  const filteredDoctors = doctors.filter(d => {
    if (!globalSearch) return true;
    const s = globalSearch.toLowerCase();
    return d.name?.toLowerCase().includes(s) || d.specialty?.toLowerCase().includes(s);
  });

  const filteredClinics = approvedClinicsList.filter(c => {
    const s = globalSearch ? globalSearch.toLowerCase() : '';
    const ls = locationSearch ? locationSearch.toLowerCase() : '';
    const matchGlobal = !s || c.name?.toLowerCase().includes(s) || c.address?.toLowerCase().includes(s);
    const matchLoc = !ls || c.address?.toLowerCase().includes(ls);
    return matchGlobal && matchLoc;
  });

  const navItems = [
    { id: 'Dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Appointments', icon: Calendar,        label: 'Appointments', badge: upcomingApts.length },
    { id: 'Doctors',      icon: Stethoscope,     label: 'Doctors' },
    { id: 'Clinics',      icon: Building2,       label: 'Clinics' },
    { id: 'Diagnostics',  icon: Microscope,      label: 'Diagnostics' },
    { id: 'Lab Results',  icon: FlaskConical,    label: 'Lab Results' },
    { id: 'Prescriptions',icon: Pill,            label: 'Prescriptions' },
    { id: 'Payment',      icon: Smartphone,      label: 'Payments' },
    { id: 'Feedback',     icon: ThumbsUp,        label: 'Feedback' },
    { id: 'Complaints',   icon: Flag,            label: 'Complaints' },
    { id: 'Profile',      icon: User,            label: 'Security Settings' },
  ];

  useEffect(() => {
    setSubTabs(navItems);
    if (!activeSubTab) setActiveSubTab('Dashboard');
  }, [upcomingApts.length]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.post('users/feedback/', feedbackData);
      setShowFeedbackModal(false);
      setFeedbackData({ rating: 5, comment: '', target_doctor: '', target_lab: '' });
      showToast('Feedback submitted successfully.');
      fetchData(); // Refresh feedback list
    } catch (err) {
      showToast('Failed to submit feedback.', 'error');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.new_password) {
      showToast("Please enter a new password.", "error");
      return;
    }
    if (profileForm.new_password !== profileForm.confirm_password) {
      showToast("Passwords do not match.", "error");
      return;
    }
    
    setIsUpdatingProfile(true);
    try {
      const formData = new FormData();
      if (profileForm.new_password) {
        formData.append('new_password', profileForm.new_password);
        formData.append('confirm_password', profileForm.confirm_password);
      }
      if (selectedAvatar) {
        formData.append('avatar', selectedAvatar);
      }

      await api.patch('users/profiles/update_me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProfileForm({ new_password: '', confirm_password: '' });
      setSelectedAvatar(null);
      setAvatarPreview(null);
      showToast("Clinical profile updated successfully.");
      fetchData(); // Refresh user info to show new avatar
    } catch (err) {
      console.error("Profile Update Error:", err);
      showToast(err.response?.data?.detail || "Failed to update profile.", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      await api.post('users/complaints/', complaintData);
      setShowComplaintModal(false);
      setComplaintData({ target_user: '', subject: '', description: '' });
      showToast('Complaint filed successfully.');
    } catch (err) {
      showToast('Failed to submit complaint.', 'error');
    }
  };

  const handlePayment = async (appointmentId) => {
    if (payingAppointmentId) return;
    setPayingAppointmentId(appointmentId);
    try {
      const appt = appointments.find(a => a.id === appointmentId);
      if (!appt) return;
      const { data: order } = await api.post('payments/create-upi-order/', { appointment_id: appointmentId });
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "careNconnect",
        order_id: order.order_id,
        handler: async function (response) {
          try {
            showToast('Verifying Payment...');
            await api.post('payments/verify-upi-payment/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointment_id: appointmentId
            });
            showToast('Payment Successful!');
            fetchData();
          } catch (err) {
            showToast('Verification failed.', 'error');
          } finally {
            setPayingAppointmentId(null);
          }
        },
        modal: {
          ondismiss: function() {
            setPayingAppointmentId(null);
          }
        },
        prefill: { name: userInfo?.username || "Patient" },
        theme: { color: "#00C9B1" }
      };
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast('Failed to load Razorpay payment gateway.', 'error');
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      showToast(`Payment failed: ${err.response?.data?.error || err.message || 'Unknown error'}`, 'error');
    }
  };

  const handleDownloadPDF = (appointment) => {
    if (!appointment) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const providerDoc = doctors.find(d => String(d.id) === String(appointment.entity_id));
    const providerLab = labs.find(l => String(l.id) === String(appointment.entity_id));
    
    let providerName = appointment.entity_name;
    if (!providerName || providerName === 'Unknown' || providerName.includes('Unknown')) {
      providerName = appointment.entity_type === 'DOCTOR'
        ? `Dr. ${(providerDoc?.name || 'Unknown').replace(/^Dr\.?\s*/i, '').trim()}`
        : providerLab?.name || 'Unknown Lab';
    } else {
      providerName = appointment.entity_type === 'DOCTOR' 
        ? `Dr. ${providerName.replace(/^Dr\.?\s*/i, '').trim()}`
        : providerName;
    }

    // Header
    doc.setFillColor(0, 201, 177); // brand-500
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("careNconnect", 20, 25);
    
    doc.setFontSize(10);
    doc.text("Official Appointment Receipt", 20, 32);
    
    // Receipt Details
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    let y = 60;
    
    const addField = (label, value) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 70, y);
      y += 10;
    };

    addField("Appointment ID", `#${appointment.id}`);
    addField("Patient Name", userName);
    addField("Patient ID", `PID-${userInfo?.id || 'N/A'}`);
    addField("Token Number", appointment.token || "Awaiting");
    
    const statusText = appointment.status;
    addField("Status", statusText);
    
    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y - 5, pageWidth - 20, y - 5);
    
    addField("Service Type", appointment.entity_type === 'DOCTOR' ? 'Consultation' : 'Diagnostic Lab');
    addField(appointment.entity_type === 'DOCTOR' ? 'Doctor Name' : 'Laboratory', providerName);
    
    const aptDate = new Date(appointment.date);
    addField("Date", aptDate.toLocaleDateString([], { dateStyle: 'long' }));
    addField("Time / Slot", aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    if (appointment.entity_type === 'DOCTOR' && providerDoc?.clinic) {
      addField("Clinic", providerDoc.clinic.name);
      addField("Address", providerDoc.clinic.address || "N/A");
    } else if (appointment.entity_type === 'LAB' && providerLab) {
      addField("Address", providerLab.address || "N/A");
    }

    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y - 5, pageWidth - 20, y - 5);
    
    addField("Amount", `INR ${appointment.amount}`);
    addField("Payment Status", appointment.is_paid ? "PAID" : "PENDING");
    
    const paymentModeLabel = appointment.payment_mode === 'PAY_AT_CLINIC' 
      ? (appointment.entity_type === 'DOCTOR' ? 'Pay at Clinic' : 'Pay at Lab')
      : 'Online Payment';
    addField("Payment Mode", paymentModeLabel);

    if (appointment.test_details && appointment.test_details.length > 0) {
      const testNames = appointment.test_details.map(t => t.name).join(", ");
      const wrappedTestNames = doc.splitTextToSize(testNames, 120);
      doc.setFont("helvetica", "bold");
      doc.text("Prescribed Tests:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(wrappedTestNames, 70, y);
      y += (wrappedTestNames.length * 7);
    }

    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("This is an electronically generated receipt and does not require a physical signature.", pageWidth / 2, 280, { align: "center" });
    doc.text("Generated on: " + new Date().toLocaleString(), pageWidth / 2, 285, { align: "center" });
    
    doc.save(`Appointment-${appointment.id}.pdf`);
  };

  // ── UNIQUE FEATURES LOGIC ──────────────────────────────────────────────────
  const getSmartSuggestedSlot = () => {
    if (!doctors || doctors.length === 0) return null;
    const physician = doctors.find(d => d.specialty?.toLowerCase().includes('physician')) || doctors[0];
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    tom.setHours(10, 0, 0, 0); 
    return { doctor: physician, time: tom };
  };

  const suggestedSlot = getSmartSuggestedSlot();

  const getStatusBadge = (status) => {
    const map = {
      COMPLETED: 'bg-sky-100 text-sky-700 border-sky-200',
      CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
      CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      PENDING:   'bg-amber-100 text-amber-700 border-amber-200',
    };
    const label = {
      CONFIRMED: 'Accepted',
      PENDING:   'Pending',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    return (
      <Badge className={`uppercase text-[10px] tracking-wider font-black ${map[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
        {label[status] || status}
      </Badge>
    );
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-brand-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        <ActivitySquare className="h-16 w-16 text-brand-500 animate-pulse" />
        <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
          Loading Your Health Portal
        </p>
      </div>
    </div>
  );


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Good Afternoon 🌤️';
    if (hour < 21) return 'Good Evening 🌙';
    return 'Good Night ✨';
  };

  return (
    <div className="space-y-8 no-scrollbar">

          {/* ═══ DASHBOARD ════════════════════════════════════════════════ */}
          {activeTab === 'Dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >

              {/* Hero */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-brand-600 via-brand-500 to-brand-teal p-10 md:p-14 text-white shadow-2xl shadow-brand-600/20"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.15),transparent_50%)]" />
                <Heart className="absolute -bottom-10 -right-10 w-72 h-72 text-white/5 rotate-12" />
                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className="bg-white/20 text-white border-white/10 mb-6 backdrop-blur-md px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
                      Patient Portal • Verified Session
                    </Badge>
                    <p className="text-brand-50 font-black uppercase tracking-[0.4em] text-[10px] mb-4 opacity-80">{getGreeting()}</p>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight italic">Welcome, <br />{userName}!</h1>
                    <p className="text-brand-50 mt-6 font-medium opacity-90 max-w-xl text-lg">
                      Your complete health management system. Book sessions, track prescriptions, and monitor your vitals in real-time.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-10">
                      <Button
                        onClick={() => navigate('/patient/book')}
                        className="bg-white text-brand-600 hover:bg-brand-50 font-black rounded-2xl px-8 py-4 shadow-xl gap-3 text-base group"
                      >
                        Book Appointment 
                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                      <Button
                        onClick={() => setActiveTab('Lab Results')}
                        className="bg-brand-teal/20 text-white border border-white/20 hover:bg-white/10 font-black rounded-2xl px-8 py-4 backdrop-blur-sm transition-all"
                      >
                        View Reports
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              <div className="grid lg:grid-cols-4 gap-8">
                {/* Stats */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Upcoming Visits',   value: upcomingApts.length,   icon: Calendar,    bg: 'bg-brand-50 dark:bg-brand-500/10',   text: 'text-brand-600 dark:text-brand-400',   tab: 'Appointments' },
                    { label: 'Active Meds',      value: prescriptions.length,  icon: Pill,        bg: 'bg-violet-50 dark:bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400',  tab: 'Prescriptions' },
                    { label: 'Lab Reports',        value: testResults.length,    icon: FlaskConical,bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', tab: 'Lab Results' },
                    { label: 'Total Visits', value: appointments.length,   icon: Activity,    bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-500 dark:text-amber-400',   tab: 'Appointments' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => setActiveTab(stat.tab)}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center group-hover:rotate-12 transition-transform`}>
                          <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="p-2 rounded-full group-hover:bg-brand-50 dark:group-hover:bg-slate-800 transition-colors">
                          <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-brand-400" />
                        </div>
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* UNIQUE FEATURE: Smart Slot Suggestion */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-slate-900 to-brand-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/10 blur-3xl rounded-full" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-brand-teal/20 flex items-center justify-center border border-white/10">
                        <ActivitySquare className="w-5 h-5 text-brand-teal" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal">Smart Suggestion</p>
                    </div>
                    
                    {suggestedSlot ? (
                      <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-300">Optimal time found for your routine checkup:</p>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                          <p className="font-black text-brand-teal mb-1">Dr. {suggestedSlot.doctor?.name}</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <Clock className="w-3 h-3 text-brand-teal" /> {suggestedSlot.time.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <Button 
                          onClick={() => navigate('/patient/book', { 
                            state: { 
                              doctorId: suggestedSlot.doctor?.id,
                              date: suggestedSlot.time.toISOString().split('T')[0],
                              step: 3,
                              entityType: 'DOCTOR'
                            } 
                          })}
                          className="w-full bg-brand-teal hover:bg-brand-400 text-slate-950 font-black rounded-xl h-12 shadow-lg shadow-brand-400/20 group"
                        >
                          Suggest Booking 
                          <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Stay tuned! We'll suggest slots based on your history.</p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Two-col */}
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Upcoming appointments */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-2 space-y-8"
                >
                  {/* New Test Requests Section */}
                  {testRequests.filter(r => r.status === 'PENDING').length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-500/5 rounded-[2.5rem] border border-amber-100 dark:border-amber-500/20 p-8 shadow-xl shadow-amber-500/5 overflow-hidden relative group">
                      <FlaskConical className="absolute -top-10 -right-10 w-48 h-48 text-amber-500/10 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                               <Bell className="w-5 h-5 animate-bounce" />
                             </div>
                             <h3 className="text-xl font-black text-amber-900 dark:text-amber-400 italic">New Test Request</h3>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 border-0 font-black">{testRequests.filter(r => r.status === 'PENDING').length}</Badge>
                        </div>

                        <div className="space-y-6">
                          {testRequests.filter(r => r.status === 'PENDING').map(req => (
                            <div key={req.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all">
                               <div className="flex items-center gap-5">
                                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-slate-950 flex items-center justify-center font-black text-brand-600 border border-brand-100">
                                    {req.doctor_details?.name?.[0] || 'D'}
                                  </div>
                                  <div>
                                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Doctor</p>
                                     <p className="font-black text-slate-900 dark:text-white italic">Dr. {req.doctor_details?.name}</p>
                                  </div>
                               </div>
                               
                               <div className="flex-1">
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Prescribed Tests</p>
                                  <div className="flex flex-wrap gap-2">
                                     {req.tests.map((test, i) => (
                                       <span key={i} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-[10px] font-black border border-brand-100">
                                         {test}
                                       </span>
                                     ))}
                                  </div>
                               </div>

                               <Button 
                                 onClick={() => navigate('/find-tests', { 
                                   state: { 
                                     searchTerm: req.tests[0],
                                     testRequestId: req.id,
                                     prescribedTests: req.tests
                                   } 
                                 })}
                                 className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl px-8 h-12 shadow-lg shadow-amber-500/20 group/btn"
                               >
                                 Book Test <ArrowUpRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                               </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-8 py-7 border-b border-brand-50 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                          <Clock className="w-5 h-5 text-brand-500" /> Upcoming Schedule
                        </h3>
                      </div>
                      <button onClick={() => setActiveTab('Appointments')} className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-2 hover:bg-brand-50 px-4 py-2 rounded-xl transition-all">
                        Full Schedule <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  {upcomingApts.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="w-20 h-20 bg-brand-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-slate-200" />
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 font-bold text-base">You have no upcoming visits.</p>
                      <Button onClick={() => navigate('/patient/book')} className="mt-6 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl px-8 py-3 shadow-lg">
                        Schedule First Visit
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-brand-50 dark:divide-slate-800">
                      {upcomingApts.slice(0, 4).map((a, idx) => {
                        const doc = doctors.find(d => String(d.id) === String(a.entity_id));
                        const lab = labs.find(l => String(l.id) === String(a.entity_id));
                        
                        let title = a.entity_name;
                        if (!title || title === 'Unknown' || title.includes('Unknown')) {
                          title = a.entity_type === 'DOCTOR'
                            ? `Dr. ${(doc?.name || 'Unknown').replace(/^Dr\.?\s*/i, '').trim()}`
                            : `Lab: ${lab?.name || 'Unknown'}`;
                        } else {
                          title = a.entity_type === 'DOCTOR' 
                            ? `Dr. ${title.replace(/^Dr\.?\s*/i, '').trim()}`
                            : `Lab: ${title}`;
                        }
                        return (
                          <motion.div 
                            key={a.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="px-8 py-6 flex items-center justify-between hover:bg-brand-50/50 dark:hover:bg-slate-800/50 group transition-colors"
                          >
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-slate-950 text-brand-600 flex flex-col items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">
                                  {new Date(a.date).toLocaleString([], { month: 'short' })}
                                </span>
                                <span className="text-xl font-black leading-none mt-0.5">
                                  {new Date(a.date).getDate()}
                                </span>
                              </div>
                              <div>
                                <p className="font-black text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors text-lg italic">{title}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
                                    <Clock className="w-3 h-3" /> {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{a.entity_type}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {getStatusBadge(a.status)}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>

                {/* Removed Doctor Performance Ranking */}
              </div>
            </motion.div>
          )}


          {/* ═══ APPOINTMENTS ═════════════════════════════════════════════ */}
          {activeTab === 'Appointments' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Appointments</h2>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">All your scheduled and past appointments</p>
                </div>
                <Button onClick={() => navigate('/patient/book')} className="bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl h-10 px-5 gap-2 shadow-lg shadow-brand-500/20">
                  <Calendar className="w-4 h-4" /> Book New
                </Button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="table-container no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-50 dark:bg-slate-950 border-b border-brand-50 dark:border-slate-800">
                        {['Provider', 'Type', 'Date & Time', 'Status', 'Token', 'Payment', 'Action'].map((h, i) => (
                          <th key={i} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-50 dark:divide-slate-800">
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center">
                            <Calendar className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No appointments found.</p>
                            <Button onClick={() => navigate('/patient/book')} className="mt-4 bg-brand-600 text-white font-black rounded-xl px-5 py-2 text-sm">
                              Book Now
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map(a => {
                          const doc = doctors.find(d => String(d.id) === String(a.entity_id));
                          const lab = labs.find(l => String(l.id) === String(a.entity_id));
                          
                          let providerName = a.entity_name;
                          if (!providerName || providerName === 'Unknown' || providerName.includes('Unknown')) {
                            providerName = a.entity_type === 'DOCTOR'
                              ? `Dr. ${(doc?.name || 'Unknown').replace(/^Dr\.?\s*/i, '').trim()}`
                              : lab?.name || 'Unknown Lab';
                          } else {
                            providerName = a.entity_type === 'DOCTOR' 
                              ? `Dr. ${providerName.replace(/^Dr\.?\s*/i, '').trim()}`
                              : providerName;
                          }
                          return (
                            <tr key={a.id} className="hover:bg-brand-50 dark:bg-slate-950/60 transition-colors group">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-slate-950 text-brand-600 flex items-center justify-center font-black group-hover:bg-brand-600 group-hover:text-white transition-all">
                                    {providerName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-900 dark:text-white text-sm">{providerName}</p>
                                    {doc?.specialty && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{doc.specialty}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <Badge className={`text-[10px] font-black uppercase tracking-wider border-0 ${a.entity_type === 'DOCTOR' ? 'bg-brand-50 dark:bg-slate-950 text-brand-700' : 'bg-violet-50 text-violet-700'}`}>
                                  {a.entity_type === 'DOCTOR' ? 'Consultation' : 'Lab Test'}
                                </Badge>
                              </td>
                              <td className="px-6 py-5">
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{new Date(a.date).toLocaleDateString([], { dateStyle: 'medium' })}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{new Date(a.date).toLocaleTimeString([], { timeStyle: 'short' })}</p>
                                </div>
                              </td>
                              <td className="px-6 py-5">{getStatusBadge(a.status)}</td>
                              <td className="px-6 py-5">
                                {a.token ? (
                                  <span className="px-3 py-1 rounded-xl bg-brand-50 dark:bg-slate-950 text-brand-700 text-[11px] font-black border border-brand-100">
                                    #{a.token}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-sm font-bold">—</span>
                                )}
                              </td>
                              <td className="px-6 py-5">
                                {a.is_paid && a.status === 'CANCELLED' ? (
                                  <div className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-wider">
                                    <AlertCircle className="w-3.5 h-3.5" /> Refund Initiated
                                  </div>
                                ) : a.is_paid ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                                  </div>
                                ) : a.payment_mode === 'PAY_AT_CLINIC' ? (
                                  <div className="flex items-center gap-1.5 text-amber-600 font-black text-[10px] uppercase tracking-wider">
                                    <Clock className="w-3.5 h-3.5" /> Pay at {a.entity_type === 'DOCTOR' ? 'Clinic' : 'Lab'}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-sm font-bold">—</span>
                                )}
                              </td>
                              <td className="px-6 py-5 flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedAppointment(a)}
                                  className="text-brand-600 hover:bg-brand-50 rounded-xl h-9 w-9 p-0"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
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

          {/* ═══ DOCTORS ══════════════════════════════════════════════════ */}
          {activeTab === 'Doctors' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Available Doctors</h2>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Browse verified specialists</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDoctors.length === 0 ? (
                  <div className="col-span-full p-16 text-center border-2 border-dashed border-brand-50 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                    <Stethoscope className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No doctors found.</p>
                  </div>
                ) : (
                  filteredDoctors.map(doc => (
                    <div key={doc.id} className="p-6 bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                      {/* Decorative Background Element */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50/50 dark:bg-brand-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                      
                      <div className="flex items-start gap-5 mb-6 relative z-10">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                          className="w-16 h-16 rounded-[1.25rem] border-2 border-white dark:border-slate-800 shadow-xl shadow-brand-500/10 transition-transform group-hover:scale-110 duration-500" 
                          alt={doc.name} 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight truncate">Dr. {doc.name.replace(/^Dr\.?\s*/i, '').trim()}</p>
                          <p className="text-[10px] font-black uppercase text-brand-600 tracking-[0.15em] mt-0.5">{doc.specialty}</p>
                          {doc.clinic && (
                            <div className="flex items-center gap-1.5 mt-2 text-slate-400 dark:text-slate-500 transition-colors group-hover:text-brand-500">
                              <Building2 className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold truncate">{doc.clinic.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                        <div className="bg-brand-50/50 dark:bg-slate-950 p-3 rounded-2xl border border-brand-50 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Rating</span>
                          </div>
                          <p className="font-black text-slate-900 dark:text-white">{doc.average_rating || '0.0'}<span className="text-[10px] text-slate-400 ml-1">({doc.rating_count || 0}+)</span></p>
                        </div>
                        <div className="bg-brand-50/50 dark:bg-slate-950 p-3 rounded-2xl border border-brand-50 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 text-brand-500 mb-1">
                            <CreditCard className="w-3 h-3" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Consult</span>
                          </div>
                          <p className="font-black text-slate-900 dark:text-white">₹150</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {doc.qualification && (
                          <Badge className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 uppercase text-[9px] font-black px-2 py-1 tracking-widest">
                            {doc.qualification}
                          </Badge>
                        )}
                        <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-0 uppercase text-[9px] font-black px-2 py-1 tracking-widest">
                          Verified Specialist
                        </Badge>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          onClick={() => setSelectedDoctorInfo(doc)} 
                          variant="outline"
                          className="flex-1 h-12 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all gap-2 text-sm"
                        >
                          View Details
                        </Button>
                        <Button 
                          onClick={() => navigate('/patient/book', { state: { doctorId: doc.id, step: 2, entityType: 'DOCTOR' } })} 
                          className="flex-[1.5] h-12 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl transition-all duration-300 shadow-xl shadow-brand-500/20 gap-2 text-sm group/btn"
                        >
                          <Calendar className="w-4 h-4 transition-transform group-hover/btn:scale-110" /> 
                          Book Now
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ═══ CLINICS ══════════════════════════════════════════════════ */}
          {activeTab === 'Clinics' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Clinic Network</h2>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Find approved healthcare facilities near you</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    placeholder="Search by location..."
                    value={locationSearch}
                    onChange={e => setLocationSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 rounded-xl border border-brand-50 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-sm outline-none focus:border-brand-50 dark:focus:border-brand-400 w-60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClinics.length === 0 ? (
                  <div className="col-span-full p-16 text-center border-2 border-dashed border-brand-50 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                    <Building2 className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No clinics found.</p>
                  </div>
                ) : (
                  filteredClinics
                    .map(clinic => (
                      <div
                        key={clinic.id}
                        onClick={() => setSelectedClinicInfo(clinic)}
                        className="p-6 bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:border-brand-200 hover:-translate-y-1 transition-all group cursor-pointer"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <img 
                            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${clinic.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                            className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-110"
                            alt={clinic.name}
                          />
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{clinic.name}</h4>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[9px] tracking-wider font-black mt-1">
                              Verified
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-brand-50 dark:bg-slate-950 p-3 rounded-xl">
                          <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                          <span className="text-xs font-bold truncate">{clinic.address}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* ═══ DIAGNOSTICS ══════════════════════════════════════════════ */}
          {activeTab === 'Diagnostics' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500 pb-12">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-sm">
                  <div className="flex-1">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic">Find Diagnostic Tests</h2>
                    <p className="text-slate-400 dark:text-slate-500 font-bold mt-2">Search for tests first, then compare laboratories by pricing.</p>
                    
                    <div className="relative mt-8 group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                      <input 
                        type="text"
                        placeholder="Search for CBC, MRI, Thyroid, Glucose..."
                        className="w-full pl-16 pr-6 py-5 bg-brand-50/50 dark:bg-slate-950/50 rounded-2xl border-2 border-transparent focus:border-brand-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                        value={diagnosticsSearch}
                        onChange={(e) => setDiagnosticsSearch(e.target.value)}
                      />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Test Selection List */}
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Available Tests</h3>
                    <div className="max-h-[600px] overflow-y-auto no-scrollbar pr-2 space-y-3">
                      {Array.from(new Set(allAvailableTests.filter(t => approvedLabsList.some(l => String(l.id) === String(t.lab))).map(t => t.name))).filter(name => name.toLowerCase().includes(diagnosticsSearch.toLowerCase())).map(testName => {
                        const filteredTests = allAvailableTests.filter(t => t.name === testName && approvedLabsList.some(l => String(l.id) === String(t.lab)));
                        const testData = filteredTests[0];
                        const labsCount = filteredTests.length;
                        const minPrice = Math.min(...filteredTests.map(t => t.price));
                        
                        return (
                          <div 
                            key={testName}
                            onClick={() => setSelectedDiagnosticTest(testName)}
                            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${selectedDiagnosticTest === testName ? 'bg-brand-600 border-brand-600 shadow-xl shadow-brand-500/20' : 'bg-white dark:bg-slate-900 border-brand-50 dark:border-slate-800 hover:border-brand-200'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Badge className={`${selectedDiagnosticTest === testName ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600'} border-0 text-[8px] font-black uppercase tracking-widest`}>
                                {testData.category || 'General'}
                              </Badge>
                              <span className={`text-[10px] font-black ${selectedDiagnosticTest === testName ? 'text-white/60' : 'text-slate-400'}`}>{labsCount} Labs</span>
                            </div>
                            <h4 className={`font-black italic text-lg ${selectedDiagnosticTest === testName ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{testName}</h4>
                            <p className={`text-[10px] font-bold mt-1 ${selectedDiagnosticTest === testName ? 'text-white/70' : 'text-slate-400'}`}>Starting from <span className="text-sm font-black ml-1">₹{minPrice}</span></p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Laboratory Comparison */}
                  <div className="lg:col-span-2">
                    {!selectedDiagnosticTest ? (
                      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-brand-50 dark:border-slate-800 p-12 text-center">
                        <div className="w-20 h-20 bg-brand-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-6 text-brand-600">
                          <TrendingUp size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 italic">Select a Test to Compare</h3>
                        <p className="text-slate-400 dark:text-slate-500 font-bold max-w-sm">Pick a diagnostic test from the left to view all laboratories and compare their official pricing.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden"
                        >
                          <div className="relative z-10">
                            <h3 className="text-2xl font-black italic">{selectedDiagnosticTest}</h3>
                            <p className="text-slate-400 font-bold text-sm mt-1">Comparing prices across {allAvailableTests.filter(t => t.name === selectedDiagnosticTest && approvedLabsList.some(l => String(l.id) === String(t.lab))).length} verified laboratories</p>
                          </div>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full" />
                        </motion.div>

                        <div className="grid gap-4">
                          {allAvailableTests
                            .filter(t => t.name === selectedDiagnosticTest && approvedLabsList.some(l => String(l.id) === String(t.lab)))
                            .sort((a,b) => a.price - b.price)
                            .map((offer, idx) => {
                             const lab = approvedLabsList.find(l => String(l.id) === String(offer.lab));
                             return (
                               <motion.div 
                                 key={offer.id}
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: idx * 0.05 }}
                                 className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-6"
                               >
                                 <div className="w-16 h-16 bg-brand-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center shrink-0">
                                   <Building2 className="text-brand-600" size={24} />
                                 </div>
                                 <div className="flex-1 text-center md:text-left">
                                   <h4 className="font-black text-slate-900 dark:text-white italic text-lg">{lab?.name}</h4>
                                   <div className="flex items-center justify-center md:justify-start gap-3 mt-1 text-[10px] font-bold text-slate-400">
                                      {lab?.address && <span className="flex items-center gap-1"><MapPin size={12} className="text-brand-500" /> {lab.address}</span>}
                                   </div>
                                 </div>
                                 <div className="flex flex-col items-center md:items-end gap-3 min-w-[140px]">
                                   <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">₹{offer.price}</p>
                                   <Button 
                                     onClick={() => navigate('/patient/book', { state: { entityId: offer.lab, entityType: 'LAB', step: 3, selectedTests: [offer.id] } })}
                                     className="bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl h-10 px-6 text-xs shadow-lg shadow-brand-500/20"
                                   >
                                     Book Now
                                   </Button>
                                 </div>
                               </motion.div>
                             );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {/* ═══ LAB RESULTS ══════════════════════════════════════════════ */}
          {activeTab === 'Lab Results' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Lab Results</h2>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Your diagnostic test results</p>
              </div>
              {testResults.length === 0 ? (
                <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-brand-50 dark:border-slate-800">
                  <FlaskConical className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No lab results yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {testResults.map(t => {
                    const labInfo = labs.find(l => String(l.admin_user?.id) === String(t.lab?.id)) || t.lab;
                    return (
                      <div key={t.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-500/5 rounded-bl-full -mr-16 -mt-16 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/10 transition-colors" />
                        
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                          <div className="flex items-start gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                              <FlaskConical className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{labInfo?.name || labInfo?.username || 'Verified Laboratory'}</h4>
                              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> 
                                {new Date(t.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                              </p>
                              {t.appointment?.test_details && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {t.appointment.test_details.map((test, i) => (
                                    <Badge key={i} className="bg-brand-50 dark:bg-brand-500/10 text-brand-600 border-0 text-[9px] font-black uppercase tracking-wider px-2 py-1">
                                      {test.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-3">
                            <Badge className={`border-0 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-sm ${t.is_normal ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                              {t.is_normal ? 'Normal Range' : 'Requires Attention'}
                            </Badge>
                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-1">Ref ID: #LB-{t.id}</p>
                          </div>
                        </div>

                        <div className="mt-8 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                          <div className="pl-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5" /> Diagnostic Summary
                            </p>
                            <pre className="text-xs bg-slate-900 text-emerald-400 p-6 rounded-2xl font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                              {t.result_data}
                            </pre>
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 italic text-[10px] font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Digitally signed and encrypted by authority
                          </div>
                          <div className="flex items-center gap-3">
                            {t.file_url && (
                              <Button 
                                onClick={() => window.open(t.file_url, '_blank')}
                                variant="outline"
                                className="h-10 px-5 rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-black text-[10px] uppercase gap-2"
                              >
                                <Download className="w-4 h-4" /> Original Report
                              </Button>
                            )}
                            <Button 
                              onClick={() => navigate(`/report/lab-test/${t.id}`)}
                              className="h-10 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-[10px] transition-all gap-2 uppercase tracking-wider shadow-lg shadow-brand-500/20"
                            >
                              <ExternalLink className="w-4 h-4" /> Verified Digital Copy
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ PRESCRIPTIONS ════════════════════════════════════════════ */}
          {activeTab === 'Prescriptions' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Prescriptions</h2>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Medications and clinical instructions from your doctors</p>
              </div>
              {prescriptions.length === 0 ? (
                <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-brand-50 dark:border-slate-800">
                  <Pill className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No prescriptions yet.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="table-container no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-50 dark:bg-slate-950 border-b border-brand-50 dark:border-slate-800">
                          {['Doctor', 'Medication / Notes', 'Date', 'Status'].map((h, i) => (
                            <th key={i} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-50 dark:divide-slate-800">
                        {prescriptions.map(p => (
                          <tr key={p.id} className="hover:bg-brand-50 dark:bg-slate-950/60 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.doctor?.name || 'Doctor'}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                                  className="w-9 h-9 rounded-xl border border-brand-50 dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform"
                                  alt={p.doctor?.name}
                                />
                                <div>
                                  <p className="font-black text-slate-900 dark:text-white text-sm">Dr. {(p.doctor?.name || 'Unknown').replace(/^Dr\.?\s*/i, '').trim()}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{p.doctor?.specialty || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-bold text-slate-700 text-sm italic max-w-xs truncate">"{p.notes}"</p>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-bold text-slate-500 dark:text-slate-400 text-sm">{new Date(p.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] tracking-wider font-black">
                                  Active
                                </Badge>
                                <Button 
                                  onClick={() => navigate(`/report/prescription/${p.id}`)}
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg bg-slate-100 text-slate-500 dark:text-slate-400 hover:bg-brand-600 hover:text-white transition-all shadow-none"
                                  title="View Digital Report"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ PAYMENT ══════════════════════════════════════════════════ */}
          {activeTab === 'Payment' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Payment</h2>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Your billing and payment history</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { label: 'Total Visits & Tests', value: appointments.length, icon: Calendar, bg: 'bg-brand-50 dark:bg-slate-950', text: 'text-brand-600' },
                  { label: 'Completed & Billed',   value: appointments.filter(a => a.status === 'COMPLETED').length, icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                  { label: 'Pending Payments',     value: `₹${appointments.filter(a => !a.is_paid && a.status !== 'CANCELLED').reduce((acc, a) => acc + parseFloat(a.amount || 0), 0)}`, icon: CreditCard, bg: 'bg-amber-50', text: 'text-amber-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm">
                    <div className={`w-11 h-11 rounded-xl ${s.bg} ${s.text} flex items-center justify-center mb-4`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{s.value}</h3>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50">
                  <h3 className="font-black text-slate-900 dark:text-white">Payment History</h3>
                </div>
                <div className="p-6">
                  {appointments.filter(a => a.is_paid || a.payment_status === 'REFUNDED').length === 0 ? (
                    <div className="py-10 text-center">
                      <CreditCard className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No payment history found.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {appointments.filter(a => a.is_paid || a.payment_status === 'REFUNDED').map(a => {
                        const doc = doctors.find(d => String(d.id) === String(a.entity_id));
                        const lab = labs.find(l => String(l.id) === String(a.entity_id));
                        const isRefunded = a.payment_status === 'REFUNDED';
                        
                        let entityDisplay = a.entity_name || 'Unknown Facility';
                        if (a.entity_type === 'DOCTOR' && doc) {
                          entityDisplay = `Dr. ${doc.name.replace(/^Dr\.?\s*/i, '').trim()}`;
                        } else if (a.entity_type === 'LAB' && lab) {
                          entityDisplay = lab.name;
                        }
                        
                        return (
                          <div key={a.id} className="py-4 flex items-center justify-between animate-in fade-in duration-500">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isRefunded ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {isRefunded ? <RotateCcw className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 dark:text-white text-sm">
                                  {entityDisplay}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                                  ID: PAY-{a.id} • {new Date(a.date).toLocaleDateString()}
                                </p>
                                {isRefunded && a.refund_details && (
                                  <p className="text-[9px] font-black text-orange-500 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {a.refund_details.status} • {a.refund_details.timeline}
                                  </p>
                                )}
                                {a.status === 'CANCELLED' && a.cancellation_reason && (
                                  <p className="text-[9px] font-bold text-rose-500 mt-1 italic">
                                    Reason: {a.cancellation_reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-black text-sm ${isRefunded ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>₹{a.amount}</p>
                              <Badge className={`uppercase text-[9px] tracking-wider font-black mt-1 ${isRefunded ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                {isRefunded ? 'Refunded' : 'Success'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ FEEDBACK ═════════════════════════════════════════════════ */}
          {activeTab === 'Feedback' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Ratings & Reviews</h2>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Share your experience and browse your past feedback</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm">
                  <div className="px-4 py-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl">
                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Your Avg Rating</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        {feedbacks.length > 0 
                          ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) 
                          : '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-5 gap-10">
                {/* Submit Feedback Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-brand-500/5 sticky top-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-xl">New Review</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">How was your visit?</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmitFeedback} className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-3">Select Provider</label>
                        <select
                          value={feedbackData.target_doctor ? `doctor:${feedbackData.target_doctor}` : (feedbackData.target_lab ? `lab:${feedbackData.target_lab}` : '')}
                          onChange={e => {
                            const [type, id] = e.target.value.split(':');
                            if (type === 'doctor') setFeedbackData({ ...feedbackData, target_doctor: id, target_lab: '' });
                            else if (type === 'lab') setFeedbackData({ ...feedbackData, target_lab: id, target_doctor: '' });
                            else setFeedbackData({ ...feedbackData, target_doctor: '', target_lab: '' });
                          }}
                          className="w-full p-4 rounded-2xl bg-brand-50 dark:bg-slate-950 border border-transparent focus:border-brand-200 dark:focus:border-brand-900 outline-none font-bold text-sm transition-all"
                        >
                          <option value="">General Platform Feedback</option>
                          <optgroup label="Doctors You've Visited">
                            {Array.from(new Set(appointments.filter(a => a.entity_type === 'DOCTOR' && a.status === 'COMPLETED').map(a => a.entity_id)))
                              .map(id => {
                                const doc = doctors.find(d => String(d.id) === String(id));
                                return doc ? <option key={`doc-${id}`} value={`doctor:${id}`}>Dr. {doc.name}</option> : null;
                              })}
                          </optgroup>
                          <optgroup label="Labs You've Visited">
                            {Array.from(new Set(appointments.filter(a => a.entity_type === 'LAB' && a.status === 'COMPLETED').map(a => a.entity_id)))
                              .map(id => {
                                const lab = labs.find(l => String(l.id) === String(id));
                                return lab ? <option key={`lab-${id}`} value={`lab:${id}`}>{lab.name}</option> : null;
                              })}
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-3">Your Rating</label>
                        <div className="flex gap-3">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star} type="button"
                              onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${feedbackData.rating >= star ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 hover:bg-slate-200'}`}
                            >
                              <Star className={`w-6 h-6 ${feedbackData.rating >= star ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-3">Your Experience</label>
                        <textarea
                          value={feedbackData.comment}
                          onChange={e => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                          className="w-full h-40 p-5 rounded-2xl bg-brand-50 dark:bg-slate-950 border border-transparent focus:border-brand-200 dark:focus:border-brand-900 outline-none font-bold text-sm resize-none transition-all placeholder:text-slate-400"
                          placeholder="Tell us what you liked or what could be better..."
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full h-14 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black gap-3 shadow-xl shadow-brand-500/20 text-base group">
                        Post Review 
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Feedback List */}
                <div className="lg:col-span-3 space-y-6">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 px-2">
                    <Star className="w-5 h-5 text-amber-500 fill-current" /> Recent Reviews
                  </h3>
                  
                  {feedbacks.length === 0 ? (
                    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-brand-100 dark:border-slate-800">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-slate-200" />
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 font-bold">You haven't posted any reviews yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {feedbacks.map((f, idx) => (
                        <motion.div
                          key={f.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
                        >
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-slate-950 text-brand-600 flex items-center justify-center font-black text-lg">
                                {(f.doctor_name || f.lab_name || 'G')[0]}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 dark:text-white">
                                  {f.doctor_name ? `Dr. ${f.doctor_name}` : (f.lab_name || 'General Feedback')}
                                </p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                  {new Date(f.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= f.rating ? 'text-amber-500 fill-current' : 'text-slate-100 dark:text-slate-800'}`} />
                              ))}
                            </div>
                          </div>
                          <div className="relative">
                            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-brand-100 dark:bg-brand-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-slate-600 dark:text-slate-400 font-medium italic leading-relaxed pl-4">
                              "{f.comment}"
                            </p>
                          </div>
                          {(f.target_doctor || f.target_lab) && (
                            <div className="mt-6 pt-5 border-t border-brand-50 dark:border-slate-800 flex items-center justify-between">
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-0 text-[9px] font-black uppercase tracking-widest px-3">
                                Verified Patient Review
                              </Badge>
                              <button className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline">
                                Report Issue
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ COMPLAINTS ═══════════════════════════════════════════════ */}
          {activeTab === 'Complaints' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Complaints</h2>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Report issues with healthcare providers</p>
              </div>
              <div className="max-w-xl bg-white dark:bg-slate-900 p-8 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Flag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-lg">Raise a Complaint</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">We take all reports seriously and investigate thoroughly.</p>
                  </div>
                </div>
                <form onSubmit={handleSubmitComplaint} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2">Target Provider</label>
                    <select
                      value={complaintData.target_user}
                      onChange={e => setComplaintData({ ...complaintData, target_user: e.target.value })}
                      required
                      className="w-full p-4 rounded-xl bg-brand-50 dark:bg-slate-950 border border-slate-200 focus:border-brand-50 dark:border-slate-800 outline-none font-bold text-sm"
                    >
                      <option value="">Select Clinic or Provider</option>
                      <optgroup label="Clinics">
                        {clinics.map(c => (
                          <option key={`c-${c.id}`} value={c.admin_user?.id}>{c.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Diagnostic Labs">
                        {labs.map(l => (
                          <option key={`l-${l.id}`} value={l.admin_user?.id}>{l.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Individual Doctors">
                        {doctors.map(d => (
                          <option key={`d-${d.id}`} value={d.user_details?.id}>{d.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2">Subject</label>
                    <input
                      type="text"
                      value={complaintData.subject}
                      onChange={e => setComplaintData({ ...complaintData, subject: e.target.value })}
                      className="w-full p-4 rounded-xl bg-brand-50 dark:bg-slate-950 border border-slate-200 focus:border-brand-50 dark:border-slate-800 outline-none font-bold text-sm"
                      placeholder="Brief summary of the issue..."
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2">Description</label>
                    <textarea
                      value={complaintData.description}
                      onChange={e => setComplaintData({ ...complaintData, description: e.target.value })}
                      className="w-full h-36 p-4 rounded-xl bg-brand-50 dark:bg-slate-950 border border-slate-200 focus:border-brand-50 dark:border-slate-800 outline-none font-bold text-sm resize-none"
                      placeholder="Detailed account of the incident..."
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black gap-2">
                    Submit Complaint <ShieldCheck className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* ═══ PROFILE/SECURITY ═══════════════════════════════════════════ */}
          {activeTab === 'Profile' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic">Security & Profile</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">Manage your clinical access credentials</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand-500 to-indigo-600 opacity-10 group-hover:opacity-20 transition-opacity" />
                    
                    <div className="relative mt-4 mb-6 mx-auto w-32 h-32">
                       <div className="w-full h-full rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-inner">
                          {avatarPreview || userInfo?.avatar_url ? (
                            <img src={avatarPreview || userInfo?.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                          ) : (
                            <User className="w-12 h-12 text-slate-300" />
                          )}
                       </div>
                       <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-600 text-white rounded-2xl flex items-center justify-center cursor-pointer hover:bg-brand-700 hover:scale-110 active:scale-95 transition-all shadow-lg border-4 border-white dark:border-slate-900">
                          <Download className="w-5 h-5 rotate-180" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                       </label>
                    </div>

                    <h4 className="text-xl font-black text-slate-900 dark:text-white">{userInfo?.display_name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{userInfo?.role}</p>

                    <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-4">
                       <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Visits</p>
                          <p className="text-lg font-black text-brand-600">{appointments.length}</p>
                       </div>
                       <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Status</p>
                          <p className="text-sm font-black text-emerald-600 uppercase">Active</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-500/20">
                     <ShieldCheck className="w-10 h-10 mb-4 opacity-50" />
                     <h4 className="text-lg font-black mb-2">Secure Node</h4>
                     <p className="text-xs font-bold text-indigo-100 leading-relaxed">Your profile and clinical history are encrypted and stored in a private healthcare cloud.</p>
                  </div>
                </div>

                {/* Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-brand-50 dark:border-slate-800 shadow-sm">
                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                      <div className="flex items-center gap-4 p-6 bg-brand-50 dark:bg-slate-950 rounded-[2rem]">
                        <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white">Security & Identity</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Synchronize credentials and bio-data</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:border-slate-500 ml-1">New Password</label>
                            <input 
                              type="password"
                              value={profileForm.new_password}
                              onChange={(e) => setProfileForm({...profileForm, new_password: e.target.value})}
                              placeholder="Leave blank to keep current"
                              className="w-full h-16 px-6 bg-brand-50 dark:bg-slate-950/50 border-brand-50 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm outline-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:border-slate-500 ml-1">Confirm New Password</label>
                            <input 
                              type="password"
                              value={profileForm.confirm_password}
                              onChange={(e) => setProfileForm({...profileForm, confirm_password: e.target.value})}
                              placeholder="Repeat your password"
                              className="w-full h-16 px-6 bg-brand-50 dark:bg-slate-950/50 border-brand-50 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isUpdatingProfile}
                        className="w-full h-16 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black shadow-xl shadow-brand-500/20 group"
                      >
                        {isUpdatingProfile ? 'Syncing Node...' : 'Synchronize Profile Changes'}
                        {!isUpdatingProfile && <RotateCcw className="ml-2 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* ── Doctor Details Modal ────────────────────────────────────────── */}
      {selectedDoctorInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <img 
                  src={selectedDoctorInfo.user_details?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDoctorInfo.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                  className="w-20 h-20 rounded-3xl border-4 border-white dark:border-slate-800 shadow-2xl shadow-brand-500/10 object-cover" 
                  alt={selectedDoctorInfo.name} 
                />
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic">
                    Dr. {selectedDoctorInfo.name.replace(/^Dr\.?\s*/i, '').trim()}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-xs font-black uppercase text-brand-600 tracking-[0.2em]">{selectedDoctorInfo.specialty}</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-sm font-black">{selectedDoctorInfo.average_rating || '0.0'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedDoctorInfo(null)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* About & Qualification */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Professional Background</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Qualifications</p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-relaxed">{selectedDoctorInfo.qualification || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">License Number</p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-relaxed">{selectedDoctorInfo.license_no || 'Pending Verification'}</p>
                      </div>
                    </div>
                    {selectedDoctorInfo.user_details?.phone_number && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Direct Contact</p>
                          <p className="font-bold text-slate-900 dark:text-white text-sm leading-relaxed tabular-nums">{selectedDoctorInfo.user_details.phone_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Primary Clinic</h4>
                  {selectedDoctorInfo.clinic ? (
                    <div className="p-5 bg-brand-50/30 dark:bg-slate-950 border border-brand-50 dark:border-slate-800 rounded-3xl">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-brand-500" />
                        </div>
                        <p className="font-black text-slate-900 dark:text-white text-sm">{selectedDoctorInfo.clinic.name}</p>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                        <span>{selectedDoctorInfo.clinic.address}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 text-center">
                      <p className="text-xs text-slate-400 font-bold italic">No clinic affiliated yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Reviews Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Patient Reviews ({selectedDoctorInfo.reviews?.length || 0})</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Sort by:</span>
                    <span className="text-[10px] font-black uppercase text-brand-600">Newest First</span>
                  </div>
                </div>

                {!selectedDoctorInfo.reviews || selectedDoctorInfo.reviews.length === 0 ? (
                  <div className="p-10 bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No reviews from patients yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {selectedDoctorInfo.reviews.map((rev, i) => (
                      <div key={i} className="p-6 bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-3xl hover:border-brand-200 transition-all shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-slate-950 text-brand-600 flex items-center justify-center font-black text-xs border border-brand-100">
                              {rev.user_details?.display_name?.[0] || 'P'}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white text-xs">{rev.user_details?.display_name || 'Verified Patient'}</p>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                {new Date(rev.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, idx) => (
                              <Star key={idx} className={`w-3 h-3 ${idx < rev.rating ? 'text-amber-500 fill-current' : 'text-slate-100 dark:text-slate-800'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium italic leading-relaxed">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950 flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedDoctorInfo(null)} 
                className="rounded-2xl font-black border-slate-200 px-8"
              >
                Close
              </Button>
              <Button 
                onClick={() => { navigate('/patient/book', { state: { doctorId: selectedDoctorInfo.id, step: 2, entityType: 'DOCTOR' } }); setSelectedDoctorInfo(null); }} 
                className="bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl px-10 gap-3 shadow-xl shadow-brand-500/20 group"
              >
                Book Consultation
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clinic Details Modal ────────────────────────────────────────── */}
      {selectedClinicInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={`https://api.dicebear.com/7.x/shapes/svg?seed=${selectedClinicInfo.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                  className="w-14 h-14 rounded-2xl border-2 border-brand-100 shadow-lg shadow-brand-500/10 bg-white dark:bg-slate-900"
                  alt={selectedClinicInfo.name}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[9px] tracking-wider font-black">
                      Verified
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedClinicInfo.name}</h3>
                  <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 mt-2">
                    <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-bold leading-relaxed">{selectedClinicInfo.address}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedClinicInfo(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Clinic Insights Section */}
              <div className="space-y-4">
                 <div className="p-6 border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-[2rem] group hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl transition-all duration-500 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center text-brand-500 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                       <Clock className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Opening Hours</p>
                       <p className="font-bold text-slate-900 dark:text-white text-base">Open 24/7 • Emergency Ready</p>
                    </div>
                 </div>
                 <div className="p-6 border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-[2rem] group hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl transition-all duration-500 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center text-brand-500 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                       <Phone className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Contact Desk</p>
                       <p className="font-bold text-slate-900 dark:text-white text-base tabular-nums">+91 82813 46911</p>
                    </div>
                 </div>
              </div>

              {/* Amenities Section */}
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Key Amenities</h4>
                 <div className="flex flex-wrap gap-2">
                    {[
                       { label: 'In-house Pharmacy', icon: Pill },
                       { label: 'Emergency Care', icon: Activity },
                       { label: 'Ample Parking', icon: Building2 },
                       { label: 'Laboratory Services', icon: FlaskConical }
                    ].map((a, i) => (
                       <Badge key={i} variant="outline" className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 py-1.5 px-3 rounded-xl gap-2 hover:bg-brand-50 hover:text-brand-600 transition-all cursor-default">
                          <a.icon className="w-3 h-3" />
                          <span className="text-[10px] uppercase font-black tracking-wider">{a.label}</span>
                       </Badge>
                    ))}
                 </div>
              </div>

              {/* Doctors Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Professional Staff</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {doctors.filter(d => d.clinic_id === selectedClinicInfo.id || d.clinic?.id === selectedClinicInfo.id).length === 0 ? (
                    <div className="col-span-full p-12 bg-slate-50 dark:bg-slate-950 rounded-3xl text-center border-2 border-dashed border-slate-100">
                      <Stethoscope className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 dark:text-slate-500 font-bold text-sm italic">No specialists currently listed for this facility.</p>
                    </div>
                  ) : (
                    doctors.filter(d => d.clinic_id === selectedClinicInfo.id || d.clinic?.id === selectedClinicInfo.id).map(doc => (
                      <div key={doc.id} className="p-4 border border-slate-50 dark:border-slate-800 rounded-3xl flex items-center gap-4 hover:border-brand-200 hover:shadow-lg transition-all group">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                          className="w-12 h-12 rounded-2xl border-2 border-white dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform"
                          alt={doc.name}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 dark:text-white text-sm">Dr. {doc.name.replace(/^Dr\.?\s*/i, '').trim()}</p>
                          <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-0.5">{doc.specialty}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedClinicInfo(null)} className="rounded-xl font-bold border-slate-200">
                Close
              </Button>
              <Button onClick={() => { navigate('/patient/book'); setSelectedClinicInfo(null); }} className="bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl gap-2">
                Book Appointment <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Appointment Details Modal ────────────────────────────────────── */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-brand-600 relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
               <div className="relative z-10">
                 <h3 className="text-2xl font-black text-white tracking-tight italic">Appointment Overview</h3>
                 <p className="text-brand-100 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Ref: #APT-{selectedAppointment.id}</p>
               </div>
               <button onClick={() => setSelectedAppointment(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all relative z-10">
                 <X size={20} />
               </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
               {/* Provider Info */}
               <div className="flex items-center gap-5 p-6 bg-brand-50/50 dark:bg-slate-950/50 rounded-3xl border border-brand-50 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-brand-600">
                     {selectedAppointment.entity_type === 'DOCTOR' ? <Stethoscope size={32} /> : <Microscope size={32} />}
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-brand-600 tracking-widest mb-1">{selectedAppointment.entity_type}</p>
                     <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                        {(() => {
                           const doc = doctors.find(d => String(d.id) === String(selectedAppointment.entity_id));
                           const lab = labs.find(l => String(l.id) === String(selectedAppointment.entity_id));
                           let name = selectedAppointment.entity_name;
                           if (!name || name === 'Unknown' || name.includes('Unknown')) {
                             name = selectedAppointment.entity_type === 'DOCTOR' ? (doc?.name || '') : (lab?.name || '');
                           }
                           return selectedAppointment.entity_type === 'DOCTOR' ? `Dr. ${name.replace(/^Dr\.?\s*/i, '').trim()}` : name;
                        })()}
                     </h4>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-3xl">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Schedule</p>
                     <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-brand-500" />
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">{new Date(selectedAppointment.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                     </div>
                     <div className="flex items-center gap-3 mt-2">
                        <Clock className="w-4 h-4 text-brand-500" />
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                          {selectedAppointment.time_slot || (selectedAppointment.date ? new Date(selectedAppointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending Time')}
                        </span>
                     </div>
                  </div>

                  <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-3xl">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Status & Payment</p>
                     <div className="mb-2">{getStatusBadge(selectedAppointment.status)}</div>
                     <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                        Mode: <span className="text-brand-600">{selectedAppointment.payment_mode?.replace(/_/g, ' ') || 'N/A'}</span>
                     </p>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
               <Button 
                 variant="outline" 
                 onClick={() => setSelectedAppointment(null)} 
                 className="flex-1 rounded-2xl h-14 font-black border-slate-200"
               >
                 Close
               </Button>
               <Button 
                 onClick={() => { handleDownloadPDF(selectedAppointment); }}
                 className="flex-1 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl h-14 font-black shadow-xl shadow-brand-500/20 gap-3"
               >
                 <Download size={20} />
                 Download Receipt
               </Button>
            </div>
          </motion.div>
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
