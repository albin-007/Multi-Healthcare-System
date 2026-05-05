import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../context/DashboardContext';
import api from '../../services/api';
import { SPECIALIZATION_GROUPS } from '../../data/specializations';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Badge } from '../../components/ui/Badge';
import { 
  Building2, MapPin, Stethoscope, PlusCircle, Users, AlertCircle,
  Calendar, Activity, LogOut, ShieldCheck, ArrowUpRight, CheckCircle2, X,
  LayoutDashboard, Menu, Search, Clock, Eye, Ban, FileText, User as UserIcon, HeartPulse, Download,
  TrendingUp, DollarSign, Pin, Settings, Save, BarChart as BarIcon, PieChart as PieIcon, UploadCloud, ActivitySquare, ChevronDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const { logout, userName } = useAuth();
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingAppointmentId, setPayingAppointmentId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const cancellationReasons = [
    "Doctor unavailable",
    "Clinic closed unexpectedly",
    "Emergency situation",
    "Equipment maintenance",
    "Staff shortage",
    "Patient request",
    "Other"
  ];
  const [activeAppointment, setActiveAppointment] = useState(null);
  const { setSubTabs, activeSubTab, setActiveSubTab } = useDashboard();
  const activeTab = activeSubTab || 'Dashboard';
  const setActiveTab = setActiveSubTab;
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelAppointment, setCancelAppointment] = useState(null);
  const [selectedPatientFile, setSelectedPatientFile] = useState(null);
  const getLocalYYYYMMDD = (dObj) => {
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const [selectedPreviewDate, setSelectedPreviewDate] = useState(getLocalYYYYMMDD(new Date()));
  const [selectedPreviewDoctor, setSelectedPreviewDoctor] = useState('');
  const [daySlots, setDaySlots] = useState([]);
  const [loadingDaySlots, setLoadingDaySlots] = useState(false);

  const fetchDaySlots = async (date, doctorId) => {
    if (!doctorId) {
      setDaySlots([]);
      return;
    }
    try {
      setLoadingDaySlots(true);
      const res = await api.get(`appointments/slots/all_slots/?doctor_id=${doctorId}&date=${date}`);
      setDaySlots(res.data || []);
    } catch (err) {
      console.error('Failed to fetch day slots:', err);
      setDaySlots([]);
    } finally {
      setLoadingDaySlots(false);
    }
  };

  useEffect(() => {
    if (selectedPreviewDate && selectedPreviewDoctor) {
      fetchDaySlots(selectedPreviewDate, selectedPreviewDoctor);
    }
  }, [selectedPreviewDate, selectedPreviewDoctor]);

  const groupedSlots = useMemo(() => {
    const groups = {
      Morning: [],
      Afternoon: [],
      Evening: []
    };
    
    (daySlots || []).forEach(slot => {
      const hour = new Date(slot.start_time).getHours();
      if (hour < 12) groups.Morning.push(slot);
      else if (hour < 17) groups.Afternoon.push(slot);
      else groups.Evening.push(slot);
    });
    
    return groups;
  }, [daySlots]);
  
  // New Doctor Form
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [docData, setDocData] = useState({ 
    name: '', specialty: '', qualification: '', license_no: '', 
    username: '', password: '', email: '', phone_number: '' 
  });

  const uniquePatients = useMemo(() => {
    return [...new Map(
      (appointments || []).filter(a => a.user).map(a => [a.user.id, a.user])
    ).values()];
  }, [appointments]);
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);
  const [doctorFormError, setDoctorFormError] = useState('');

  // Analytics Derivation
  const analytics = useMemo(() => {
     const appts = appointments || [];
     const total = appts.length;
     
     // 1. Status Distribution
     const statusCounts = appts.reduce((acc, a) => {
       acc[a.status] = (acc[a.status] || 0) + 1;
       return acc;
     }, {});
     
     const statusStats = [
       { label: 'Completed', count: (statusCounts.COMPLETED || 0) + (statusCounts.CONFIRMED || 0), color: 'bg-emerald-500', barColor: '#10b981' },
       { label: 'Pending', count: statusCounts.PENDING || 0, color: 'bg-amber-500', barColor: '#f59e0b' },
       { label: 'Cancelled', count: (statusCounts.CANCELLED || 0) + (statusCounts.REJECTED || 0), color: 'bg-rose-500', barColor: '#f43f5e' }
     ].map(s => ({
       ...s,
       percentage: total > 0 ? Math.round((s.count / total) * 100) : 0
     }));

     // 2. Monthly Velocity (Last 4 Months)
     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
     const months = [];
     for (let i = 3; i >= 0; i--) {
       const d = new Date();
       d.setMonth(d.getMonth() - i);
       months.push({ 
         name: monthNames[d.getMonth()], 
         month: d.getMonth(), 
         year: d.getFullYear(), 
         count: 0 
       });
     }

     appts.forEach(a => {
       if (!a.date) return;
       const d = new Date(a.date);
       const match = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
       if (match) match.count++;
     });

     const maxCount = Math.max(...months.map(m => m.count), 1);
     const monthlyStats = months.map(m => ({
       ...m,
       width: `${Math.max((m.count / maxCount) * 100, 5)}%`
     }));

     // 3. Daily Stats (Last 10 Days) - FOR CHART
     const dailyTrend = [];

     for (let i = 9; i >= 0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const targetDateStr = getLocalYYYYMMDD(d);
       const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
       
       const dayAppts = appts.filter(a => {
         if (!a.date) return false;
         const apptDate = new Date(a.date);
         return getLocalYYYYMMDD(apptDate) === targetDateStr;
       });

       const confirmedAppts = dayAppts.filter(a => ['COMPLETED', 'CONFIRMED'].includes(a.status));
       
       const revenue = confirmedAppts.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
       const visits = dayAppts.length;

       dailyTrend.push({
         date: targetDateStr,
         label,
         revenue,
         visits
       });
     }

     return { statusStats, monthlyStats, dailyTrend };
  }, [appointments]);

  // Profile Management State
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', address: '', payment_type: 'BOTH', consultation_fee: 150, advance_payment: '', new_password: '', confirm_password: '' });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        address: profile.address || '',
        payment_type: profile.payment_type || 'BOTH',
        consultation_fee: profile.consultation_fee || 150,
        advance_payment: profile.advance_payment || ''
      });
    }
  }, [profile]);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchClinicData();
  }, []);

  const navItems = useMemo(() => [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Analytics' },
    { id: 'Appointments', icon: Calendar, label: 'Appointment calendar' },
    { id: 'Patients', icon: Users, label: 'Patients' },
    { id: 'Cancelled', icon: Ban, label: 'Cancelled' },
    { id: 'Doctors', icon: Stethoscope, label: 'Doctors' },
    { id: 'Payments', icon: DollarSign, label: 'Payments' },
    { id: 'Report', icon: FileText, label: 'Analytics Report' },
    { id: 'Profile', icon: Settings, label: 'Facility Settings' }
  ], []);

  useEffect(() => {
    setSubTabs(navItems);
  }, [navItems, setSubTabs]);

  useEffect(() => {
    if (!activeSubTab) setActiveSubTab('Dashboard');
  }, [activeSubTab, setActiveSubTab]);

  const fetchClinicData = async (isManual = false) => {
    try {
      setIsLoading(true);
      const clinicRes = await api.get('users/clinics/');
      
      if (clinicRes.data && clinicRes.data.length > 0) {
        setProfile(clinicRes.data[0]);
        
        const [docRes, apptRes, prescRes] = await Promise.all([
          api.get('users/doctors/'),
          api.get('appointments/'),
          api.get('records/prescriptions/')
        ]);
        
        setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
        setAppointments(Array.isArray(apptRes.data) ? apptRes.data : []);
        setPrescriptions(Array.isArray(prescRes.data) ? prescRes.data : []);
        
        if (isManual) {
          showToast('Medical records synchronized successfully.', 'success');
        }
      } else {
        if (isManual) showToast('Sync complete: No clinical profiles found.', 'warning');
      }
    } catch (err) {
      console.error("Clinic Dashboard Load Error:", err);
      setError("Failed to fetch clinic information.");
      if (isManual) {
        showToast('Synchronization failed. Check your network.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      setIsLoading(true);
      const res = await api.post('users/clinics/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
      showToast("Clinic Profile Initialized Successfully");
    } catch (err) {
      console.error("Initialization Error:", err.response?.data || err);
      showToast("Initialization Failed. Check all required fields.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setDoctorFormError('');
    setIsSubmittingDoctor(true);
    try {
      const data = { ...docData, clinic_id: profile.id };
      await api.post('users/doctors/', data);
      showToast("Specialist Registered Successfully. Access will be active after admin approval.");
      setShowAddDoctorModal(false);
      setDocData({ name: '', specialty: '', username: '', password: '', email: '', qualification: '', license_no: '' });
      fetchClinicData(); // Refresh list
    } catch (err) {
      // Extract a human-readable error message from the API response
      let errorMsg = 'Registration failed. Please check the details and try again.';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (Array.isArray(data)) {
          errorMsg = data.join(' ');
        } else if (typeof data === 'object') {
          // Flatten field errors: { username: ['already exists'], password: ['too short'] }
          const messages = Object.entries(data).map(([field, msgs]) => {
            const label = field.replace(/_/g, ' ');
            return `${label}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
          });
          errorMsg = messages.join(' | ');
        }
      }
      setDoctorFormError(errorMsg);
      showToast("Registration Failed", "error");
    } finally {
      setIsSubmittingDoctor(false);
    }
  };

  const handleUpdateStatus = async (apptId, status, extraData = {}) => {
    try {
      await api.patch(`appointments/${apptId}/`, { status, ...extraData });
      showToast(`Appointment ${status.toLowerCase()} successfully`);
      fetchClinicData();
    } catch (err) {
      showToast("Status Update Failed", "error");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;
    
    setIsUpdatingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('address', profileForm.address);
      formData.append('payment_type', profileForm.payment_type);
      formData.append('consultation_fee', profileForm.consultation_fee);
      
      if (profileForm.advance_payment) {
        formData.append('advance_payment', profileForm.advance_payment);
      }
      
      if (profileForm.new_password) {
        if (profileForm.new_password !== profileForm.confirm_password) {
          showToast("Passwords do not match", "error");
          setIsUpdatingProfile(false);
          return;
        }
        formData.append('new_password', profileForm.new_password);
        formData.append('confirm_password', profileForm.confirm_password);
      }

      if (selectedAvatar) {
        formData.append('avatar', selectedAvatar);
      }

      await api.patch('users/profiles/update_me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast("Facility profile synchronized successfully");
      setProfileForm({ ...profileForm, new_password: '', confirm_password: '' });
      setSelectedAvatar(null);
      setAvatarPreview(null);
      fetchClinicData();
    } catch (err) {
      console.error("Profile Sync Error:", err);
      showToast("Failed to synchronize profile. Check network node.", "error");
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

  const generateReport = () => {
    try {
      showToast("Compiling Facility Report...", "success");
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(0, 45, 51);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Facility Intelligence Report", 15, 25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 25);

      // Facility Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Facility Identity", 15, 55);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${profile?.name || 'N/A'}`, 15, 65);
      doc.text(`Owner: ${profile?.owner_name || 'N/A'}`, 15, 72);
      doc.text(`Address: ${profile?.address || 'N/A'}, ${profile?.city || 'N/A'}`, 15, 79);

      // Analytics Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Key Metrics", 15, 95);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const apptsCount = (appointments || []).length;
      const docsCount = (doctors || []).length;
      const todayCount = (appointments || []).filter(a => {
        if (!a.date) return false;
        const apptDate = new Date(a.date);
        const today = new Date();
        return apptDate.toDateString() === today.toDateString();
      }).length;
      
      doc.text(`Total Doctors: ${docsCount}`, 15, 105);
      doc.text(`Total Appointments: ${apptsCount}`, 15, 112);
      doc.text(`Today's Appointments: ${todayCount}`, 15, 119);
      doc.text(`Estimated Monthly Revenue: INR ${(apptsCount * 450).toLocaleString()}`, 15, 126);

      // Doctors List
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Clinical Team", 15, 145);
      
      let y = 155;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Name", 15, y);
      doc.text("Specialty", 80, y);
      doc.text("License", 140, y);
      
      y += 8;
      doc.setFont("helvetica", "normal");
      (doctors || []).slice(0, 10).forEach(docItem => {
        doc.text(`Dr. ${(docItem.name || '').replace(/^Dr\.?\s*/i, '').trim()}`, 15, y);
        doc.text(docItem.specialty || 'Generalist', 80, y);
        doc.text(docItem.license_no || 'N/A', 140, y);
        y += 8;
      });

      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("This is an automatically generated system report. Access is restricted.", 15, 280);

      doc.save(`Facility_Report_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error(err);
      showToast("Report generation failed.", "error");
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  if (isLoading && !profile) return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900 flex-col gap-6">
      <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
      <p className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs animate-pulse">Syncing Facility Data</p>
    </div>
  );

  if (error && !profile) return (
    <div className="flex h-screen items-center justify-center bg-brand-50 dark:bg-slate-950 p-8">
      <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-brand-50 dark:border-slate-800 shadow-2xl max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Connectivity Interrupted</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">{error}</p>
        <Button onClick={fetchClinicData} className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black text-lg rounded-2xl shadow-xl shadow-slate-900/20">Attempt Reconnection</Button>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 dark:bg-slate-950 p-6">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-2xl max-w-2xl w-full">
        <div className="mx-auto w-16 h-16 bg-brand-50 dark:bg-slate-950 text-brand-600 rounded-2xl flex items-center justify-center mb-6">
          <Building2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Initialize Clinic Hub</h3>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 font-medium text-sm">Deploy your administrative operations profile securely. Some fields are required for verification.</p>
        <form onSubmit={handleCreateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Clinic Name</Label>
              <Input name="name" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="E.g. Sunrise Medical Center" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Owner Name</Label>
              <Input name="owner_name" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="Full legal name" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Address Location</Label>
              <Input name="address" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="123 Health Ave, Suite 100" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">City</Label>
              <Input name="city" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="City name" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Pincode</Label>
              <Input name="pincode" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="6-digit PIN" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Website URL</Label>
              <Input name="website" type="url" className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="https://example.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">License №</Label>
              <Input name="license_no" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="LIC-XXXXXXXX" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Verification Document (PDF)</Label>
              <div className="relative h-24 border-2 border-dashed border-slate-200 rounded-xl bg-brand-50 dark:bg-slate-950 flex flex-col items-center justify-center group hover:bg-white dark:bg-slate-900 hover:border-brand-50 dark:border-slate-800 transition-all">
                <Input name="document" type="file" required className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 group-hover:text-brand-600">
                  <UploadCloud className="w-6 h-6" />
                  <span className="text-sm font-bold">Upload License Copy</span>
                </div>
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full h-14 bg-brand-600 hover:bg-brand-700 text-white font-black text-lg rounded-xl shadow-xl shadow-brand-500/20">Compile Infrastructure</Button>
        </form>
      </div>
    </div>
  );

  const todayAppointments = (appointments || []).filter(a => {
    if (!a.date) return false;
    return new Date(a.date).toDateString() === new Date().toDateString();
  });

  const getStatusBadge = (status) => {
    const map = {
      'CONFIRMED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
      'CANCELLED': 'bg-rose-50 text-rose-600 border-rose-100',
      'COMPLETED': 'bg-slate-100 text-slate-600 border-slate-200'
    };
    return <Badge className={`${map[status] || 'bg-brand-50 dark:bg-slate-950'} border font-black px-2 shadow-sm rounded-lg text-[10px]`}>{status}</Badge>;
  };

  // ── UNIQUE FEATURES LOGIC ──────────────────────────────────────────────────
  const getDoctorRankings = () => {
    if (!doctors || doctors.length === 0) return [];
    return doctors.filter(d => !!d).map(doc => {
      const count = (appointments || []).filter(a => String(a?.entity_id) === String(doc?.id)).length;
      return { ...doc, patientsCount: count };
    }).sort((a, b) => b.patientsCount - a.patientsCount).slice(0, 3);
  };

  const topDoctors = getDoctorRankings();

  const renderAppointmentTable = (apptsList) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-brand-50 dark:bg-slate-950/50 border-b border-brand-50 dark:border-slate-800">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Client Info</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Time Window</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Specialist</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Payment</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {(apptsList || []).length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-20 text-center text-slate-300 font-bold italic tracking-wide">Empty Pipeline</td>
            </tr>
          ) : (
            apptsList.map(appt => {
              const doc = doctors.find(d => d.id === appt.entity_id);
              return (
                <tr key={appt.id} className="hover:bg-brand-50 dark:bg-slate-950/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-slate-950 flex items-center justify-center text-brand-600 font-black shadow-sm group-hover:scale-110 transition-transform overflow-hidden border border-brand-100 dark:border-slate-800">
                        {appt.user?.avatar_url ? (
                          <img src={appt.user.avatar_url} className="w-full h-full object-cover" alt="User" />
                        ) : (
                          appt.user?.first_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight">
                          {(() => {
                            const u = appt.user;
                            return `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || u?.display_name || u?.username || 'Anonymous';
                          })()}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">ID: {String(appt.user?.id || '').substring(0,8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-sm font-black tracking-tight">
                        {appt.time_slot || (appt.date ? new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-slate-700 text-sm">
                    {doc ? `Dr. ${doc.name.replace(/^Dr\.?\s*/i, '').trim()}` : 'Not Assigned'}
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(appt.status)}
                  </td>
                  <td className="px-6 py-5">
                    {appt.is_paid ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </div>
                    ) : appt.payment_mode === 'PAY_AT_CLINIC' ? (
                      <div className="flex items-center gap-1.5 text-amber-600 font-black text-[10px] uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" /> Pay at Clinic
                      </div>
                    ) : (
                      <span className="text-slate-300 text-sm font-bold">—</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      {appt.status === 'PENDING' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                          className="h-8 rounded-xl text-xs font-bold border-brand-100 hover:bg-brand-50 dark:bg-slate-950 text-brand-600 hover:text-brand-700 shadow-none"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirm
                        </Button>
                      )}
                      {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setCancelAppointment(appt)}
                          className="h-8 rounded-xl text-xs font-bold border-rose-100 hover:bg-rose-50 text-rose-500 hover:text-rose-600 shadow-none"
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" /> Cancel
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedAppointment(appt)}
                        className="h-8 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-100 hover:text-brand-600 group/btn shadow-none"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
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
    <div className="space-y-8">
          
          {/* Dashboard Tab */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              
              {/* Hero */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-brand-600 via-brand-500 to-brand-teal p-10 md:p-14 text-white shadow-2xl shadow-brand-600/20 group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.15),transparent_50%)]" />
                <Building2 className="absolute -bottom-10 -right-10 w-72 h-72 text-white/5 rotate-12 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12" />
                <div className="relative z-10 transition-transform duration-500 group-hover:translate-x-2">
                  <Badge className="bg-white/20 text-white border-white/10 mb-6 backdrop-blur-md px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
                    Facility Portal • Verified Session
                  </Badge>
                  <p className="text-brand-50 font-black uppercase tracking-[0.4em] text-[10px] mb-4 opacity-80">{getGreeting()}</p>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight italic">Welcome, <br />{profile?.name || userName || 'Facility Admin'}!</h1>
                  <p className="text-brand-50 mt-6 font-medium opacity-90 max-w-xl text-lg">
                    Manage your facility's daily operations, track financial performance, and oversee medical personnel schedules all in one powerful hub.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-10">
                    <Button
                      onClick={() => setActiveTab('Appointments')}
                      className="bg-white text-brand-600 hover:bg-brand-50 font-black rounded-2xl px-8 py-4 shadow-xl gap-3 text-base group/btn"
                    >
                      View Pipeline
                      <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </Button>
                    <Button
                      onClick={() => setActiveTab('Report')}
                      className="bg-brand-teal/20 text-white border border-white/20 hover:bg-white/10 font-black rounded-2xl px-8 py-4 backdrop-blur-sm transition-all"
                    >
                      Facility Analytics
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Today's Appts", val: (todayAppointments || []).length, icon: Clock, bg: 'bg-brand-50 dark:bg-slate-950', text: 'text-brand-600' },
                  { label: "Total Doctors", val: (doctors || []).length, icon: Stethoscope, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                  { label: "Monthly Revenue", val: `₹${((appointments || []).length * 450).toLocaleString()}`, icon: DollarSign, bg: 'bg-sky-50', text: 'text-sky-600' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20 hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden group">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center shrink-0 shadow-inner`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.label}</p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mt-1">{stat.val}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Visualization Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-brand-500" /> Daily Revenue & Visit Trend
                      </h3>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 mt-1">Growth trajectory over the last 10 days</p>
                    </div>
                  </div>

                  {/* Dynamic Recharts Area Chart */}
                  <div className="h-80 mt-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.dailyTrend}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                        <XAxis 
                          dataKey="label" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-brand-50 dark:border-slate-800">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{payload[0].payload.label}</p>
                                  <div className="space-y-1">
                                    <p className="text-sm font-black text-emerald-600">revenue : {payload[0].value}</p>
                                    <p className="text-sm font-black text-blue-600">visits : {payload[1].value}</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10b981" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                          animationDuration={1500}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="visits" 
                          stroke="#3b82f6" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorVisits)" 
                          animationDuration={2000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Performance Analytics Column */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                   {/* Monthly Appointments Bar Chart */}
                   <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20 p-8 flex-1">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 mb-6">
                        <BarIcon className="w-4 h-4 text-brand-500" /> Monthly Growth
                      </h3>
                      <div className="space-y-5">
                        {analytics.monthlyStats.map((m, i) => (
                          <div key={i} className="group">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">{m.name} {m.year}</span>
                              <span className="text-xs font-black text-slate-900 dark:text-white">{m.count} visits</span>
                            </div>
                            <div className="h-2 w-full bg-brand-50 dark:bg-slate-950 rounded-full overflow-hidden border border-brand-50 dark:border-slate-800/50">
                               <div 
                                 style={{ width: m.width }} 
                                 className="h-full bg-brand-600 rounded-full transition-all duration-1000 group-hover:bg-brand-600"
                               />
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>

                   {/* Appointment Status Pie Chart (SVG implementation) */}
                   <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20 p-8">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 mb-6">
                        <PieIcon className="w-4 h-4 text-brand-500" /> Status Flow
                      </h3>
                      <div className="flex items-center gap-8">
                         <div className="relative w-24 h-24 shrink-0">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                               {analytics.statusStats.reduce((acc, s, i) => {
                                  const offset = acc.currentOffset;
                                  acc.currentOffset += s.percentage;
                                  acc.elements.push(
                                    <circle 
                                      key={i}
                                      cx="18" cy="18" r="15.915"
                                      fill="transparent"
                                      stroke={s.barColor}
                                      strokeWidth="4"
                                      strokeDasharray={`${s.percentage} ${100 - s.percentage}`}
                                      strokeDashoffset={-offset}
                                      className="transition-all duration-1000"
                                    />
                                  );
                                  return acc;
                               }, { elements: [], currentOffset: 0 }).elements}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">SUCCESS</span>
                            </div>
                         </div>
                      </div>
                   </div>
 
                   {/* Clinical Personnel Quick-Link */}
                   <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20 p-8 flex flex-col justify-between group overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 dark:bg-slate-950/50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-brand-100/50 transition-colors" />
                      <div className="relative">
                        <div className="w-12 h-12 bg-brand-50 dark:bg-slate-950 text-brand-600 rounded-2xl flex items-center justify-center mb-6">
                           <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Clinical Team</h3>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed mb-6">Manage your medical staff, specializations, and availability profiles.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('Doctors')}
                        className="w-full h-12 bg-[#002D33] hover:bg-teal-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                      >
                        Manage Personnel <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                   </div>
                </div>
              </div>

              {/* UNIQUE NEW FEATURES ROW */}
              <div className="grid grid-cols-1 gap-8 mt-8">
                {/* UNIQUE FEATURE: Doctor Performance Ranking */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20 p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Doctor Performance Ranking</h3>
                    <TrendingUp className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="flex-1 space-y-4">
                    {topDoctors.map((doc, i) => (
                      <div 
                        key={doc.id}
                        className="bg-brand-50/50 dark:bg-slate-950/50 p-4 rounded-2xl flex items-center gap-4 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-brand-600 text-xl border border-brand-50 dark:border-slate-800 shadow-sm transition-all group-hover:scale-105">
                            {doc?.name?.charAt(0) || 'D'}
                          </div>
                          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-lg bg-brand-teal text-white flex items-center justify-center font-black text-[10px] shadow-sm">
                            #{i + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 dark:text-white truncate tracking-tight">Dr. {(doc?.name || '').replace(/^Dr\.?\s*/i, '').trim()}</p>
                          <p className="text-[10px] font-black uppercase text-brand-600 tracking-widest mt-0.5">{doc.specialty || 'Generalist'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900 dark:text-white text-lg leading-none">{doc.patientsCount ? `${doc.patientsCount}` : '0'}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Patients</p>
                        </div>
                      </div>
                    ))}
                    {topDoctors.length === 0 && (
                      <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Stethoscope className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-bold">No performance data available.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/30 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white dark:bg-slate-900">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-500" /> Today's Schedule
                  </h3>
                  <Button variant="outline" onClick={() => setActiveTab('Appointments')} className="border-slate-200 text-xs font-bold rounded-xl h-9 hover:bg-brand-50 dark:bg-slate-950 shadow-sm">View Pipeline</Button>
                </div>
                {renderAppointmentTable(todayAppointments)}
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'Appointments' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
               {/* ── Daily Schedule Preview Section ── */}
               <div className="bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/40 p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">Daily Schedule Preview</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Review generated slots and patient flow for a specific date.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative">
                        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600" />
                        <select 
                          value={selectedPreviewDoctor}
                          onChange={(e) => setSelectedPreviewDoctor(e.target.value)}
                          className="pl-10 pr-10 h-11 bg-brand-50 border border-brand-100 rounded-xl text-xs font-bold focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                          ))}
                        </select>
                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600" />
                        <input 
                          type="date" 
                          value={selectedPreviewDate}
                          onChange={(e) => setSelectedPreviewDate(e.target.value)}
                          className="pl-10 pr-4 h-11 bg-brand-50 border border-brand-100 rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {!selectedPreviewDoctor ? (
                    <div className="py-20 text-center bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-200">
                       <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                       <h4 className="font-bold text-slate-900 dark:text-white">Choose a doctor to see their schedule</h4>
                    </div>
                  ) : loadingDaySlots ? (
                    <div className="py-20 text-center">
                      <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Schedule...</p>
                    </div>
                  ) : daySlots.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-200">
                      <ActivitySquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h4 className="font-bold text-slate-900 dark:text-white">No slots available for this doctor on this date</h4>
                      <p className="text-xs text-slate-400 mt-1">Ask the doctor to configure their working hours.</p>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Booked</span>
                         </div>
                      </div>

                      {Object.entries(groupedSlots).map(([group, slots]) => slots.length > 0 && (
                        <div key={group} className="space-y-6">
                           <div className="flex items-center gap-4">
                              <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px]">{group} Session</h5>
                              <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent"></div>
                           </div>
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {slots.map(slot => (
                                <div 
                                  key={slot.id}
                                  className={`relative p-5 rounded-3xl border transition-all duration-300 ${slot.is_booked ? 'bg-rose-50/50 border-rose-100 ring-4 ring-rose-500/5' : 'bg-white dark:bg-slate-900 border-slate-100 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5 cursor-default'}`}
                                >
                                  <div className="flex flex-col items-center text-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${slot.is_booked ? 'bg-rose-100 text-rose-600 shadow-inner' : 'bg-slate-50 text-slate-400'}`}>
                                       <Clock size={18} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-slate-900 dark:text-white">
                                        {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                      <Badge className={`mt-2 font-black text-[9px] uppercase tracking-widest border-0 ${slot.is_booked ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {slot.is_booked ? 'Booked' : 'Available'}
                                      </Badge>
                                    </div>
                                    {slot.is_booked && slot.booking_details && (
                                      <p className="text-[10px] font-bold text-rose-700 bg-rose-100/50 px-2 py-1 rounded-lg w-full truncate" title={slot.booking_details.user?.username}>
                                        {slot.booking_details.user?.username || 'Patient'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/30 overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-slate-50 bg-white dark:bg-slate-900">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Booking Pipeline</h3>
                     <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">Manage all clinical appointments</p>
                  </div>
                  {renderAppointmentTable(appointments)}
               </div>
            </div>
          )}

          {/* Doctors Tab */}
          {activeTab === 'Doctors' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Doctors</h3>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">Manage clinical staff members</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="bg-slate-100 text-slate-600 border-0 font-bold px-4 py-2">{doctors.length} Doctors</Badge>
                  <Button onClick={() => setShowAddDoctorModal(true)} className="bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl h-10 px-6 shadow-xl shadow-brand-500/20 gap-2 transition-transform hover:scale-105">
                    <PlusCircle className="w-4 h-4" /> Add Specialist
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(doctors || []).length === 0 ? (
                  <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white dark:bg-slate-900">
                    <Stethoscope className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-sm bg-brand-50 dark:bg-slate-950 inline-block px-6 py-2 rounded-full border border-brand-50 dark:border-slate-800 shadow-sm">No specialists assigned to this facility.</p>
                  </div>
                ) : (
                  doctors.map(doctor => (
                    <div key={doctor.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-lg shadow-slate-200/10 hover:-translate-y-1 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 dark:bg-slate-950/50 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:bg-brand-100/50 transition-colors" />
                      <div className="flex items-start gap-4 relative">
                        <img 
                          src={doctor.user_details?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                          className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 shadow-sm group-hover:scale-110 transition-all object-cover"
                          alt={doctor.name}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate border-b border-slate-50 pb-2 mb-2">Dr. {doctor.name.replace(/^Dr\.?\s*/i, '').trim()}</h4>
                          <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <Badge className="bg-brand-50 dark:bg-slate-950 text-brand-700 border-brand-100/50 font-black rounded-lg text-[9px] px-2">{doctor.specialty || 'Generalist'}</Badge>
                                <Badge className="bg-brand-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-brand-50 dark:border-slate-800 font-bold rounded-lg text-[9px] px-2">{doctor.license_no}</Badge>
                             </div>
                             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{doctor.user_details?.email || doctor.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}


          {/* Payments Tab */}
          {activeTab === 'Payments' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/30 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-700">
               <div className="p-8 border-b border-slate-50 bg-white dark:bg-slate-900 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Financial Ledger</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">Track patient payments and modes of transaction</p>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-50 dark:bg-slate-950/50 border-b border-brand-50 dark:border-slate-800">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Patient</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Method</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {appointments.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-20 text-center">
                            <DollarSign className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-bold italic">No payment records found.</p>
                          </td>
                        </tr>
                      ) : (
                        appointments.map(appt => (
                          <tr key={appt.id} className="hover:bg-brand-50 dark:bg-slate-950/50 transition-colors">
                            <td className="px-6 py-5">
                               <p className="font-black text-slate-900 dark:text-white text-sm">{appt.user?.username || appt.user?.first_name || 'Patient'}</p>
                               <p className="text-[10px] text-slate-400 font-bold">Appt #{appt.id}</p>
                            </td>
                            <td className="px-6 py-5 font-black text-slate-900 dark:text-white">
                               ₹{appt.amount}
                            </td>
                            <td className="px-6 py-5">
                               <Badge className="bg-slate-100 text-slate-600 font-bold px-2 py-1">{appt.payment_mode === 'PAY_AT_CLINIC' ? 'Pay at Clinic' : 'Online'}</Badge>
                            </td>
                            <td className="px-6 py-5">
                               {appt.is_paid ? (
                                 <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black px-2 py-1">Paid</Badge>
                               ) : (
                                 <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-black px-2 py-1">Unpaid</Badge>
                               )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* Report Tab */}
          {activeTab === 'Report' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
               {/* Summary Section */}
               <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-brand-50 dark:border-slate-800 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 dark:bg-slate-950/30 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative flex flex-col md:flex-row items-center gap-10">
                    <div className="w-24 h-24 bg-brand-600 text-white rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl shadow-brand-500/40">
                       <BarIcon className="w-10 h-10" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Facility Intelligence Overview</h3>
                       <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">Download the encrypted PDF digest for the current period or audit individual digital prescriptions below.</p>
                    </div>
                    <Button onClick={generateReport} className="h-16 px-8 bg-slate-900 hover:bg-black text-white font-black text-lg rounded-2xl shadow-xl shadow-slate-900/20 flex items-center gap-3">
                       <Download className="w-6 h-6" /> Export Master PDF
                    </Button>
                  </div>
               </div>

               {/* Digital Prescriptions List */}
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                 <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white">Signed Digital Prescriptions</h4>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">Verified electronic records issued by your staff</p>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-0 font-bold px-4 py-2">{prescriptions.length} Records</Badge>
                 </div>
                 
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-brand-50 dark:bg-slate-950/50 border-b border-brand-50 dark:border-slate-800">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Patient Recipient</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Issuing Physician</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Timestamp</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">View</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {prescriptions.map(p => (
                          <tr key={p.id} className="hover:bg-brand-50 dark:bg-slate-950/80 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <img 
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.patient?.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                                  className="w-10 h-10 rounded-xl bg-indigo-50 border border-brand-50 dark:border-slate-800 shadow-sm"
                                  alt={p.patient?.username}
                                />
                                <div>
                                  <p className="font-black text-slate-900 dark:text-white text-sm">{p.patient?.username}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter">PID-{p.patient?.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                                <Stethoscope className="w-3.5 h-3.5 text-brand-500" />
                                Dr. {(p.doctor?.name || 'Authorized MD').replace(/^Dr\.?\s*/i, '').trim()}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                               {new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-8 py-5 text-right">
                               <Button 
                                 onClick={() => navigate(`/report/prescription/${p.id}`)}
                                 className="h-10 px-5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:border-brand-200 transition-all font-black text-[10px] uppercase gap-2"
                               >
                                 <FileText className="w-4 h-4" /> Open Report
                               </Button>
                            </td>
                          </tr>
                        ))}
                        {prescriptions.length === 0 && (
                          <tr>
                             <td colSpan="4" className="px-8 py-20 text-center">
                               <FileText className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                               <p className="text-slate-400 dark:text-slate-500 font-bold italic">No digital prescriptions have been issued yet.</p>
                             </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                 </div>
               </div>
            </div>
          )}

          {/* ═══ CANCELLED ══════════════════════════════════════════════════ */}
          {activeTab === 'Cancelled' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
               <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cancelled Bookings</h2>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Audit log of aborted appointments and refund history</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Patient</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Refund</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {appointments.filter(a => a.status === 'CANCELLED').length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-16 text-center">
                            <Ban className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold text-sm">No cancelled bookings.</p>
                          </td>
                        </tr>
                      ) : (
                        appointments.filter(a => a.status === 'CANCELLED').map((apt) => (
                          <tr key={apt.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-black text-slate-900 dark:text-white text-sm">{apt.user?.username}</p>
                              <p className="text-[10px] font-bold text-slate-400">ID: {apt.id}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(apt.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-rose-500">{apt.cancellation_reason || 'Not specified'}</p>
                              <p className="text-[10px] font-medium text-slate-400 italic">By {apt.cancelled_by}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Badge className={`uppercase text-[9px] font-black px-2 ${apt.payment_status === 'REFUNDED' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  {apt.payment_status === 'REFUNDED' ? 'Refunded' : 'N/A'}
                                </Badge>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'Profile' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-20">
               <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Facility Identity</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">Manage global clinic credentials and site data</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Sidebar Info */}
                  <div className="md:col-span-1 space-y-6">
                     <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20 text-center">
                         <div className="relative mx-auto mb-4 w-20 h-20">
                            <div className="w-full h-full bg-brand-50 dark:bg-slate-950 text-brand-600 rounded-[2rem] flex items-center justify-center shadow-inner overflow-hidden border-4 border-white dark:border-slate-800">
                               {avatarPreview || profile?.admin_user?.avatar_url ? (
                                 <img src={avatarPreview || profile?.admin_user?.avatar_url} className="w-full h-full object-cover" alt="Clinic Logo" />
                               ) : (
                                 <Building2 className="w-8 h-8 font-black" />
                               )}
                            </div>
                            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-brand-700 transition-all shadow-lg border-2 border-white dark:border-slate-900">
                               <Download className="w-4 h-4 rotate-180" />
                               <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                         </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg">{profile?.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Verified Medical Hub</p>
                        
                        <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                           <div className="flex items-center gap-3 text-left">
                              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-slate-950 flex items-center justify-center border border-brand-50 dark:border-slate-800">
                                 <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Status</p>
                                 <p className="text-[11px] font-black text-emerald-600">Enterprise Secure</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 text-left">
                              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-slate-950 flex items-center justify-center border border-brand-50 dark:border-slate-800">
                                 <Activity className="w-4 h-4 text-indigo-500" />
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Throughput</p>
                                 <p className="text-[11px] font-black text-indigo-600">Optimized Lane</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Form */}
                  <div className="md:col-span-2">
                     <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20">
                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                           <div className="space-y-6">
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Facility Brand Name</Label>
                                 <Input 
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                                    className="h-14 bg-brand-50 dark:bg-slate-950/50 border-brand-50 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:bg-slate-900 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm"
                                    placeholder="Enter clinic name..."
                                    required
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Physical Site Location</Label>
                                 <div className="relative">
                                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                                    <textarea 
                                       value={profileForm.address}
                                       onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                                       className="w-full min-h-[120px] p-4 pl-12 bg-brand-50 dark:bg-slate-950/50 border-brand-50 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:bg-slate-900 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm outline-none resize-none"
                                       placeholder="Provide the physical address for map registration..."
                                       required
                                    />
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 px-1 italic">Note: Changing the address will refresh your clinic's location on the pictorial map.</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Payment Options</Label>
                                     <select
                                        value={profileForm.payment_type}
                                        onChange={(e) => setProfileForm({...profileForm, payment_type: e.target.value})}
                                        className="w-full h-14 px-4 bg-brand-50 dark:bg-slate-950/50 border-brand-50 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:bg-slate-900 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm outline-none"
                                     >
                                        <option value="PAY_AT_CLINIC">Pay at Clinic</option>
                                        <option value="ONLINE">Online Payment</option>
                                        <option value="BOTH">Both</option>
                                     </select>
                                  </div>
                                  <div className="space-y-2">
                                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Consultation Fee (₹)</Label>
                                     <Input 
                                        type="number"
                                        value={profileForm.consultation_fee}
                                        onChange={(e) => setProfileForm({...profileForm, consultation_fee: e.target.value})}
                                        className="h-14 bg-brand-50 dark:bg-slate-950/50 border-brand-50 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:bg-slate-900 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm"
                                     />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Advance Payment Requirement (₹) - Optional</Label>
                                     <Input 
                                        type="number"
                                        value={profileForm.advance_payment}
                                        onChange={(e) => setProfileForm({...profileForm, advance_payment: e.target.value})}
                                        className="h-14 bg-brand-50 dark:bg-slate-950/50 border-brand-50 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:bg-slate-900 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm"
                                        placeholder="Leave empty for no advance payment"
                                     />
                                  </div>

                                  <div className="md:col-span-2 pt-6 border-t border-slate-50 dark:border-slate-800">
                                     <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-brand-600" /> Security Update
                                     </h4>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">New Password</Label>
                                           <Input 
                                              type="password"
                                              value={profileForm.new_password}
                                              onChange={(e) => setProfileForm({...profileForm, new_password: e.target.value})}
                                              className="h-14 bg-brand-50 dark:bg-slate-950/50 border-brand-50 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:bg-slate-900 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm"
                                              placeholder="Leave blank to keep current"
                                           />
                                        </div>
                                        <div className="space-y-2">
                                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Confirm New Password</Label>
                                           <Input 
                                              type="password"
                                              value={profileForm.confirm_password}
                                              onChange={(e) => setProfileForm({...profileForm, confirm_password: e.target.value})}
                                              className="h-14 bg-brand-50 dark:bg-slate-950/50 border-brand-50 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:bg-slate-900 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm"
                                              placeholder="Repeat new password"
                                           />
                                        </div>
                                     </div>
                                  </div>
                               </div>

                              <div className="pt-4">
                                 <Button 
                                    type="submit" 
                                    disabled={isUpdatingProfile}
                                    className="w-full h-14 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-500/20 flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                 >
                                    {isUpdatingProfile ? (
                                       <div className="flex items-center gap-2">
                                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                          Syncing Node...
                                       </div>
                                    ) : (
                                       <><Save className="w-5 h-5" /> Sync Profile Changes</>
                                    )}
                                 </Button>
                              </div>
                           </div>
                        </form>
                     </div>
                  </div>
               </div>
            </div>
          )}

      {/* Specialist Onboarding Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/10 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-brand-600 p-8 text-white relative">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Stethoscope className="w-24 h-24" />
               </div>
               <h3 className="text-2xl font-black tracking-tight mb-2">Register Specialist</h3>
               <p className="text-brand-100/80 font-bold text-xs uppercase tracking-widest">Expansion Protocol</p>
               <button onClick={() => { setShowAddDoctorModal(false); setDoctorFormError(''); }} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                 <X className="w-6 h-6" />
               </button>
            </div>
            <form onSubmit={handleAddDoctor} className="p-8 space-y-4">
              {/* Error Banner */}
              {doctorFormError && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">{doctorFormError}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Full Name</Label>
                  <Input value={docData.name} onChange={e => setDocData({...docData, name: e.target.value})} required className="rounded-xl border-slate-200" placeholder="Dr. John Smith" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Specialty</Label>
                   <select
                     value={docData.specialty}
                     onChange={e => setDocData({...docData, specialty: e.target.value})}
                     required
                     className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                   >
                     <option value="" disabled>Select Specialty</option>
                     {SPECIALIZATION_GROUPS.map(group => (
                       <optgroup key={group.group} label={group.group}>
                         {group.options.map(opt => (
                           <option key={opt} value={opt}>{opt}</option>
                         ))}
                       </optgroup>
                     ))}
                   </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Email</Label>
                  <Input type="email" value={docData.email} onChange={e => setDocData({...docData, email: e.target.value})} required className="rounded-xl border-slate-200" placeholder="doctor@email.com" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">License ID</Label>
                  <Input value={docData.license_no} onChange={e => setDocData({...docData, license_no: e.target.value})} required className="rounded-xl border-slate-200" placeholder="LIC-XXXXXXXX" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Qualification</Label>
                <Input value={docData.qualification} onChange={e => setDocData({...docData, qualification: e.target.value})} className="rounded-xl border-slate-200" placeholder="e.g. MBBS, MD, DNB" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Specialist ID (Login)</Label>
                  <Input value={docData.username} onChange={e => setDocData({...docData, username: e.target.value})} required className="rounded-xl border-slate-200" placeholder="e.g. dr.paul.medwell" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Password</Label>
                  <Input type="password" value={docData.password} onChange={e => setDocData({...docData, password: e.target.value})} required className="rounded-xl border-slate-200" placeholder="Min. 8 characters" />
                </div>
              </div>
              <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Phone Number</Label>
                 <Input value={docData.phone_number} onChange={e => setDocData({...docData, phone_number: e.target.value})} className="rounded-xl border-slate-200" placeholder="+91 XXXXX XXXXX" />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold px-1">Password must be at least 8 characters and not entirely numeric.</p>
              <Button
                type="submit"
                disabled={isSubmittingDoctor}
                className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl mt-2 shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                {isSubmittingDoctor ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
                ) : (
                  'Authorize Specialist Entry'
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ PATIENTS TAB ══════════════════════════════════════════ */}
      {activeTab === 'Patients' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
           <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Patient Directory</h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Consolidated record of all unique patients who have booked with this clinic</p>
              </div>
              <Badge className="bg-brand-50 text-brand-700 border-0 font-bold px-4 py-2">
                {uniquePatients.length} Unique Patients
              </Badge>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-50 dark:bg-slate-950 border-b border-brand-50 dark:border-slate-800">
                      {['Patient', 'Demographics', 'ID', 'Last Visit', 'Actions'].map((h, i) => (
                        <th key={i} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {uniquePatients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                           <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                           <p className="text-slate-400 dark:text-slate-500 font-bold">No patient history found.</p>
                        </td>
                      </tr>
                    ) : (
                      uniquePatients.map(p => {
                        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username || '—';
                        const lastAppt = appointments.filter(a => a.user?.id === p.id).sort((a,b) => new Date(b.date) - new Date(a.date))[0];
                        return (
                          <tr key={p.id} className="hover:bg-brand-50 dark:bg-slate-950/50 transition-colors group">
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-slate-950 text-brand-600 flex items-center justify-center font-black">
                                      {name[0].toUpperCase()}
                                   </div>
                                   <p className="font-black text-slate-900 dark:text-white text-sm">{name}</p>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex gap-2">
                                   <Badge className="bg-slate-50 text-slate-500 border-0 font-bold text-[9px]">{p.gender || 'N/A'}</Badge>
                                   <Badge className="bg-slate-50 text-slate-500 border-0 font-bold text-[9px]">{p.age || '—'} Yrs</Badge>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">PID-{String(p.id).substring(0,8)}</p>
                             </td>
                             <td className="px-8 py-5 text-sm font-bold text-slate-500">
                                {lastAppt ? new Date(lastAppt.date).toLocaleDateString() : 'N/A'}
                             </td>
                             <td className="px-8 py-5">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setSelectedPatientFile({ user: p })}
                                  className="h-9 px-4 border-slate-200 rounded-xl text-xs font-bold hover:bg-brand-50 hover:text-brand-600 transition-colors"
                                >
                                  Digital Record
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

      {/* Patient File Modal */}
      {selectedPatientFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/10 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
               <div>
                  <h3 className="text-2xl font-black tracking-tight mb-2">Patient Records</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-brand-600 text-white border-none font-black text-[9px] px-2">REGULATED ACCESS</Badge>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Digital Health ID: {String(selectedPatientFile.user.id).substring(0,12)}</span>
                  </div>
               </div>
               <button onClick={() => setSelectedPatientFile(null)} className="text-white/50 hover:text-white transition-colors">
                 <X className="w-6 h-6" />
               </button>
            </div>
            <div className="p-8">
               <div className="flex items-center gap-6 mb-8 p-4 bg-brand-50 dark:bg-slate-950 rounded-2xl border border-brand-50 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-slate-950 text-brand-600 flex items-center justify-center font-black text-2xl shadow-inner">
                    {(selectedPatientFile.user.first_name?.[0] || 'P').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{selectedPatientFile.user.first_name} {selectedPatientFile.user.last_name}</p>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{selectedPatientFile.user.email || 'No primary contact'}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Medical Logs</h4>
                  <div className="space-y-2">
                    <div className="p-4 rounded-xl border border-brand-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between group hover:border-brand-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-brand-500" />
                        <span className="text-sm font-black text-slate-700">Patient Profile & Demographic</span>
                      </div>
                      <Badge className="bg-brand-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-brand-50 dark:border-slate-800">Viewable</Badge>
                    </div>
                    <div className="p-4 rounded-xl border border-brand-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between opacity-50 cursor-not-allowed">
                       <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span className="text-sm font-black text-slate-700">Digital Prescriptions</span>
                      </div>
                      <Badge className="bg-brand-50 dark:bg-slate-950 text-slate-300 border-brand-50 dark:border-slate-800">Encrypted</Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold italic text-center pt-4">Clinical record integration is active. Full document access is restricted to verified HIPAA roles.</p>
               </div>
               
               <Button onClick={() => setSelectedPatientFile(null)} className="w-full h-12 bg-slate-900 text-white font-black rounded-xl mt-8">Close Records View</Button>
            </div>
          </div>
        </div>
      )}
      {/* Appointment View Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/10 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-brand-600 p-8 text-white flex justify-between items-start">
               <div>
                  <h3 className="text-2xl font-black tracking-tight mb-2">Appointment Details</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-brand-50 dark:bg-slate-950 text-brand-700 border-none font-black text-[9px] px-2">{selectedAppointment.status}</Badge>
                    <span className="text-[10px] font-black text-brand-50 uppercase tracking-widest">Appt ID: {selectedAppointment.id}</span>
                  </div>
               </div>
               <button onClick={() => setSelectedAppointment(null)} className="text-white/50 hover:text-white transition-colors">
                 <X className="w-6 h-6" />
               </button>
            </div>
            <div className="p-8 space-y-6">
                <div className="flex items-center gap-6 p-4 bg-brand-50 dark:bg-slate-950/50 rounded-2xl border border-brand-50 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 text-brand-600 flex items-center justify-center font-black text-2xl shadow-sm border border-brand-50 dark:border-slate-800">
                    {(selectedAppointment.user?.username?.[0] || selectedAppointment.user?.first_name?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{selectedAppointment.user?.username || `${selectedAppointment.user?.first_name || ''} ${selectedAppointment.user?.last_name || ''}`.trim() || 'Patient'}</p>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{selectedAppointment.user?.email || 'No email provided'}</p>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Patient ID: {String(selectedAppointment.user?.id || '').substring(0,8)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-brand-50 dark:border-slate-800 bg-white dark:bg-slate-900">
                     <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Schedule</p>
                     <p className="font-bold text-slate-900 dark:text-white">
                        {selectedAppointment.date ? new Date(selectedAppointment.date).toLocaleDateString() : 'N/A'} at {selectedAppointment.date ? new Date(selectedAppointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (selectedAppointment.time_slot || 'N/A')}
                     </p>
                  </div>
                  <div className="p-4 rounded-xl border border-brand-50 dark:border-slate-800 bg-white dark:bg-slate-900">
                     <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Doctor Assigned</p>
                     <p className="font-bold text-slate-900 dark:text-white">
                        {doctors.find(d => String(d.id) === String(selectedAppointment.entity_id))?.name?.replace(/^Dr\.?\s*/i, 'Dr. ') || 'Assigned MD'}
                     </p>
                  </div>
                  <div className="p-4 rounded-xl border border-brand-50 dark:border-slate-800 bg-white dark:bg-slate-900">
                     <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Payment Status</p>
                     <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {selectedAppointment.is_paid ? <span className="text-emerald-600">Paid</span> : <span className="text-amber-600">Pending</span>}
                        <span className="text-slate-300">|</span>
                        ₹{selectedAppointment.amount || 0}
                     </p>
                  </div>
                  <div className="p-4 rounded-xl border border-brand-50 dark:border-slate-800 bg-white dark:bg-slate-900">
                     <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Payment Mode</p>
                     <p className="font-bold text-slate-900 dark:text-white">
                        {selectedAppointment.payment_mode === 'PAY_AT_CLINIC' ? 'Pay at Clinic' : (selectedAppointment.payment_mode === 'ONLINE' ? 'Online Payment' : 'N/A')}
                     </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-brand-50 dark:border-slate-800 bg-brand-50 dark:bg-slate-950">
                    <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2">Reason / Notes</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                       {selectedAppointment.reason || 'No clinical notes provided.'}
                    </p>
                </div>
               
               <Button onClick={() => setSelectedAppointment(null)} className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-900 hover:text-black font-black rounded-xl mt-4 shadow-none">Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-8 duration-500 ${
           toast.type === 'success' ? 'bg-white dark:bg-slate-900 border-emerald-100 text-emerald-600' : 'bg-white dark:bg-slate-900 border-rose-100 text-rose-600'
        }`}>
           {toast.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
           <span className="font-black text-sm tracking-tight">{toast.message}</span>
        </div>
      )}
      {/* Cancel/Reschedule Modal */}
      {cancelAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-brand-50 dark:border-slate-800">
            <button 
              onClick={() => {
                setCancelAppointment(null);
                setCancellationReason('');
              }}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Cancel Appointment</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-medium leading-relaxed">
              Choose how to handle the cancellation for <span className="font-bold text-slate-900 dark:text-white">{(cancelAppointment?.user?.first_name || 'this patient')}</span>. {cancelAppointment.is_paid && cancelAppointment.payment_mode === 'ONLINE' ? 'You can initiate a full refund or request the patient to reschedule.' : 'You can cancel the appointment or offer to reschedule for a different time.'}
            </p>

            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 block">Mandatory Cancellation Reason</label>
              <select 
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 transition-all outline-none appearance-none"
              >
                <option value="">Select a reason...</option>
                {cancellationReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <Button 
                disabled={!cancellationReason}
                className={`w-full h-14 font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 ${!cancellationReason ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'}`}
                onClick={() => {
                  handleUpdateStatus(cancelAppointment.id, 'CANCELLED', { cancellation_reason: cancellationReason });
                  setCancelAppointment(null);
                  setCancellationReason('');
                }}
              >
                {cancelAppointment.is_paid && cancelAppointment.payment_mode === 'ONLINE' ? 'Cancel & Initiate Refund' : 'Cancel Appointment'}
              </Button>
              <Button 
                className="w-full h-14 bg-brand-50 dark:bg-slate-950 hover:bg-brand-100 dark:hover:bg-slate-900 text-brand-600 font-black text-sm rounded-2xl border-0 transition-all active:scale-95"
                onClick={() => {
                  showToast("Rescheduling request sent to patient.", "success");
                  setCancelAppointment(null);
                }}
              >
                Offer Reschedule
              </Button>
              <Button 
                variant="ghost"
                className="w-full h-14 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-bold text-sm rounded-2xl"
                onClick={() => {
                  setCancelAppointment(null);
                  setCancellationReason('');
                }}
              >
                Keep Appointment
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
