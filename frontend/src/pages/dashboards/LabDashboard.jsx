import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../context/DashboardContext';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Badge } from '../../components/ui/Badge';
import { 
  Building2, MapPin, Stethoscope, PlusCircle, AlertCircle,
  Calendar, ActivitySquare, LogOut, ShieldCheck, ArrowUpRight, CheckCircle2, X,
  LayoutDashboard, Menu, Search, Clock, Eye, Ban, FileText, UserIcon, HeartPulse, Download,
  ClipboardList, CalendarDays, Bell, Settings, Activity, FlaskConical, FileCheck2, UploadCloud, File,
  ChevronDown, Share, Heart, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LabDashboard() {
  const navigate = useNavigate();
  const { logout, userName } = useAuth();
  
  const commonTests = [
    "Complete Blood Count (CBC)", "Lipid Profile (Cholesterol)", "Liver Function Test (LFT)",
    "Kidney Function Test (KFT)", "Thyroid Profile (T3, T4, TSH)",
    "Blood Glucose (Fasting/PP)", "Vitamin D (25-Hydroxy)", "Vitamin B12 (Cobalamin)",
    "Urine Routine & Microscopy", "HbA1c (Glycated Hemoglobin)", "Chest X-Ray", "ECG (Electrocardiogram)",
    "Ultrasound Whole Abdomen", "MRI Brain (Plain)", "CT Scan Chest (HRCT)", "Blood Grouping & Rh Factor",
    "Dengue NS1 Antigen", "Malaria Parasite (Smear)", "Widal Test (Typhoid)", "C-Reactive Protein (CRP)",
    "PSA (Prostate Specific Antigen)", "Calcium Total", "Iron Profile", "Electrolytes (Na, K, Cl)"
  ];

  const commonCategories = [
    "Hematology", "Biochemistry", "Immunology", "Microbiology",
    "Radiology", "Pathology", "Cardiology", "Neurology",
    "Endocrinology", "Serology", "General"
  ];
  
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [testRequests, setTestRequests] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [schedulingApt, setSchedulingApt] = useState(null);
  const [scheduleData, setScheduleData] = useState({ date: '', time: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [labAvailability, setLabAvailability] = useState([]);
  const [labHolidays, setLabHolidays] = useState([]);
  const [newAvail, setNewAvail] = useState({ day_of_week: 0, start_time: '09:00', end_time: '17:00', slot_duration: 15 });
  const [newHoliday, setNewHoliday] = useState({ date: '', reason: '' });
  
  // Lab Tests State
  const [labTests, setLabTests] = useState([]);
  const [newTest, setNewTest] = useState({ name: '', description: '', price: '', category: '' });
  const [isAddingTest, setIsAddingTest] = useState(false);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { setSubTabs, activeSubTab, setActiveSubTab, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useDashboard();
  const activeTab = activeSubTab || 'Dashboard';
  const setActiveTab = setActiveSubTab;
  
  // Upload Result State
  const [uploadData, setUploadData] = useState({ appointmentId: '', notes: '', file: null, isNormal: true });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelAppointment, setCancelAppointment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const cancellationReasons = [
    "Lab closed unexpectedly",
    "Equipment malfunction",
    "Staff unavailability",
    "Reagent shortage",
    "Emergency situation",
    "Patient request",
    "Other"
  ];

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [aptRes, resultRes, profileRes, availRes, holidayRes, reqsRes] = await Promise.all([
        api.get('appointments/'),
        api.get('records/test-results/'),
        api.get('users/labs/me/').catch(() => ({ data: null })),
        api.get('appointments/lab-availability/').catch(() => ({ data: [] })),
        api.get('appointments/lab-holidays/').catch(() => ({ data: [] })),
        api.get('users/test-requests/?status=PENDING').catch(() => ({ data: [] })),
      ]);
      setAppointments(aptRes.data);
      setTestResults(resultRes.data);
      setProfile(profileRes.data || null);
      setLabAvailability(availRes.data);
      setLabHolidays(holidayRes.data);
      setTestRequests(reqsRes.data);
      
      const testsRes = await api.get('users/lab-tests/');
      setLabTests(testsRes.data);
    } catch (err) {
      console.error('Failed to load lab data', err);
      setError("Failed to fetch data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // DERIVED DATA
  // ─────────────────────────────────────────────────────────────────────────────
  const pendingRequests = useMemo(() => {
    const bookedPending = (appointments || []).filter(a => a.status === 'PENDING').map(a => ({ ...a, type: 'APPOINTMENT' }));
    const floatingRequests = (testRequests || []).map(r => ({
      ...r,
      type: 'TEST_REQUEST',
      id: `tr-${r.id}`,
      originalId: r.id,
      user: r.patient_details,
      test_details: r.tests.map(t => ({ name: t })),
      test_request_details: { doctor_name: r.doctor_details?.name },
      date: r.created_at, // Use creation date as "Date Assigned"
      amount: 'N/A',
      payment_mode: 'PAY_AT_LAB',
      is_paid: false
    }));
    return [...bookedPending, ...floatingRequests].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [appointments, testRequests]);

  const scheduledTests = (appointments || []).filter(a => a.status === 'CONFIRMED');
  const completedTests = (appointments || []).filter(a => a.status === 'COMPLETED');


  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Test Requests', icon: ClipboardList, label: 'Test Requests' },
    { id: 'Test Schedule', icon: CalendarDays, label: 'Test Schedule' },
    { id: 'Cancelled', icon: Ban, label: 'Cancelled' },
    { id: 'Upload Results', icon: UploadCloud, label: 'Upload Results' },
    { id: 'Lab Schedule', icon: Calendar, label: 'Schedule' },
    { id: 'Payments', icon: ClipboardList, label: 'Payments' },
    { id: 'Notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { id: 'Tests & Pricing', icon: FlaskConical, label: 'Tests & Pricing' },
    { id: 'Settings', icon: Settings, label: 'Settings' }
  ];

  useEffect(() => {
    setSubTabs(navItems);
    if (!activeSubTab) setActiveSubTab('Dashboard');
  }, [pendingRequests.length]);

  const handleUpdateStatus = async (id, status, extraData = {}) => {
    try {
      await api.patch(`appointments/${id}/`, { status, ...extraData });
      await fetchData();
      showToast(`Request ${status === 'CONFIRMED' ? 'scheduled' : status.toLowerCase()} successfully.`, 'success');
      if (status === 'CONFIRMED') {
        setActiveTab('Test Schedule');
      }
    } catch (err) {
      showToast('Failed to update status.', 'error');
    }
  };
  const handleCancelRequest = async (id, reason) => {
    try {
      await api.patch(`appointments/${id}/`, { 
        status: 'CANCELLED',
        cancellation_reason: reason
      });
      await fetchData();
      showToast('Appointment cancelled successfully.', 'success');
      setCancelAppointment(null);
      setCancellationReason('');
    } catch (err) {
      showToast('Failed to cancel appointment.', 'error');
    }
  };

  const handleScheduleConfirm = async (e) => {
    e.preventDefault();
    if (!schedulingApt || !scheduleData.date || !scheduleData.time) return;

    try {
      const combinedDateTime = `${scheduleData.date}T${scheduleData.time}:00`;
      
      if (schedulingApt.type === 'TEST_REQUEST') {
        // Create a new appointment for this floating request
        await api.post('appointments/', {
          entity_type: 'LAB',
          entity_id: profile.id,
          date: combinedDateTime,
          test_request: schedulingApt.originalId,
          test_ids: [], // Backend will handle tests from the request
          payment_mode: 'PAY_AT_LAB',
          status: 'CONFIRMED'
        });
      } else {
        // Update existing appointment
        await api.patch(`appointments/${schedulingApt.id}/`, {
          status: 'CONFIRMED',
          date: combinedDateTime
        });
      }

      showToast('Appointment scheduled successfully');
      setSchedulingApt(null);
      await fetchData();
      setActiveTab('Test Schedule');
    } catch (err) {
      console.error('Failed to schedule appointment', err);
      showToast('Failed to schedule appointment', 'error');
    }
  };

  const handleLogout = () => {
    navigate('/logout');
  };

  const handleRegisterHours = async (e) => {
    e.preventDefault();
    try {
      await api.post('appointments/lab-availability/', newAvail);
      showToast('Working hours updated successfully');
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data ? Object.values(err.response.data)[0] : 'Failed to update working hours';
      showToast(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg, 'error');
    }
  };

  const handleDeleteAvail = async (id) => {
    try {
      await api.delete(`appointments/lab-availability/${id}/`);
      fetchData();
    } catch (err) {
      showToast('Failed to delete schedule', 'error');
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await api.post('appointments/lab-holidays/', newHoliday);
      showToast('Holiday added');
      setNewHoliday({ date: '', reason: '' });
      fetchData();
    } catch (err) {
      showToast('Failed to add holiday', 'error');
    }
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    try {
      await api.post('users/lab-tests/', newTest);
      showToast('Test added successfully');
      setNewTest({ name: '', description: '', price: '', category: '' });
      setIsAddingTest(false);
      fetchData();
    } catch (err) {
      showToast('Failed to add test', 'error');
    }
  };

  const handleDeleteTest = async (id) => {
    try {
      await api.delete(`users/lab-tests/${id}/`);
      showToast('Test deleted');
      fetchData();
    } catch (err) {
      showToast('Failed to delete test', 'error');
    }
  };

  const handleUploadResult = async (e) => {
    e.preventDefault();
    if (!uploadData.appointmentId) {
      showToast('Please select an appointment first.', 'error');
      return;
    }
    setIsUploading(true);
    
    try {
      const selectedApt = appointments.find(a => a.id.toString() === uploadData.appointmentId);
      if (!selectedApt) {
        showToast('Selected appointment not found. Please refresh.', 'error');
        return;
      }
      
      const formData = new FormData();
      formData.append('appointment_id', selectedApt.id);
      formData.append('patient_id', selectedApt.user.id);
      formData.append('result_data', uploadData.notes);
      formData.append('is_normal', uploadData.isNormal);
      if (uploadData.file) {
        formData.append('file', uploadData.file);
      }

      try {
        await api.post('records/test-results/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err) {
        const errorData = err.response?.data || {};
        const isDuplicate = (errorData.appointment?.[0]?.includes('already exists')) || 
                            (errorData.appointment_id?.[0]?.includes('already exists'));
                            
        if (isDuplicate) {
          // It was already uploaded, just proceed to update status
          console.log('Result already exists, proceeding to complete appointment.');
        } else {
          throw err;
        }
      }
      
      // Update appointment status to COMPLETED
      await api.patch(`appointments/${selectedApt.id}/`, { status: 'COMPLETED' });
      fetchData();
      showToast('Report uploaded and sent to doctor successfully!');
      
      setUploadData({ appointmentId: '', notes: '', file: null, isNormal: true });
      setActiveTab('Dashboard');
      await fetchData();
      showToast('Report uploaded and test marked as completed.', 'success');

    } catch (err) {
      console.error('Upload Error:', err.response?.data || err);
      let errorMessage = 'Failed to upload report.';
      if (err.response?.data) {
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
    } finally {
      setIsUploading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ERROR & LOADING STATES
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-brand-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        <ActivitySquare className="h-16 w-16 text-brand-500 animate-pulse" />
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Laboratory Environment...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-brand-50 dark:bg-slate-950 p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-brand-50 dark:border-slate-800 shadow-2xl shadow-slate-200/50 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Sync Failed</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">{error}</p>
        <div className="flex flex-col gap-3">
          <Button onClick={fetchData} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200">
            Retry Connection
          </Button>
          <Button variant="outline" onClick={handleLogout} className="w-full h-14 border-slate-200 text-slate-500 dark:text-slate-400 rounded-2xl font-bold">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      setIsSubmitting(true);
      const res = await api.post('users/labs/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
      showToast("Laboratory Hub Initialized Successfully");
    } catch (err) {
      console.error("Lab Init Error:", err.response?.data || err);
      showToast("Initialization Failed. Ensure all mandatory fields and documents are provided.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 dark:bg-slate-950 p-6">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-2xl max-w-2xl w-full">
        <div className="mx-auto w-16 h-16 bg-brand-50 dark:bg-slate-950 text-brand-600 rounded-2xl flex items-center justify-center mb-6">
          <FlaskConical className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Initialize Laboratory</h3>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 font-medium text-sm">Set up your diagnostic facility profile for administrative verification.</p>
        <form onSubmit={handleCreateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Laboratory Name</Label>
              <Input name="name" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="E.g. Precision Diagnostics" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Owner/Admin Name</Label>
              <Input name="owner_name" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="Full legal name" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Facility Address</Label>
              <Input name="address" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="Street, Building, Area..." />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">City</Label>
              <Input name="city" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="Operating city" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Pincode</Label>
              <Input name="pincode" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="6-digit PIN" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Website</Label>
              <Input name="website" type="url" className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="https://lab-web.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">License №</Label>
              <Input name="license_no" required className="rounded-xl border-slate-200 bg-brand-50 dark:bg-slate-950 h-12 font-bold" placeholder="LAB-XXXXXXXX" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Accreditation Document (PDF)</Label>
              <div className="relative h-24 border-2 border-dashed border-slate-200 rounded-xl bg-brand-50 dark:bg-slate-950 flex flex-col items-center justify-center group hover:bg-white dark:bg-slate-900 hover:border-brand-50 dark:border-slate-800 transition-all">
                <Input name="document" type="file" required className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 group-hover:text-brand-600">
                  <UploadCloud className="w-6 h-6" />
                  <span className="text-sm font-bold">Upload Verification Document</span>
                </div>
              </div>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-brand-600 hover:bg-brand-700 text-white font-black text-lg rounded-xl shadow-xl shadow-brand-500/20">
            {isSubmitting ? 'Syncing Infrastructure...' : 'Initialize Laboratory Hub'}
          </Button>
        </form>
      </div>
    </div>
  );

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Helper for generating deterministic initials
  const getInitials = (name, fallback = 'P') => {
    if (!name) return fallback;
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getPatientName = (user) => {
    if (!user) return 'Walk-in Patient';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Patient';
  };

  return (
    <div className="space-y-8">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
              
              {/* Welcome Hero (Like Patient Dashboard) */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 p-10 md:p-14 text-white shadow-2xl shadow-brand-600/20"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
                <FlaskConical className="absolute -bottom-10 -right-10 w-72 h-72 text-white/5 rotate-12" />
                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className="bg-white/20 text-white border-white/10 mb-6 backdrop-blur-md px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
                      Diagnostic Command Center
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight italic">
                      Welcome Back, <br />{userName}!
                    </h1>
                    <p className="text-brand-50 mt-6 font-medium opacity-90 max-w-xl text-lg">
                      Manage diagnostic requests, track sample workflows, and distribute authenticated digital reports.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-10">
                      <Button
                        onClick={() => setActiveTab('Test Requests')}
                        className="bg-white text-brand-600 hover:bg-brand-50 font-black rounded-2xl px-8 py-4 shadow-xl gap-3 text-base group"
                      >
                        Review New Orders 
                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                      <Button
                        onClick={() => setActiveTab('Digital Reports')}
                        className="bg-brand-teal/20 text-white border border-white/20 hover:bg-white/10 font-black rounded-2xl px-8 py-4 backdrop-blur-sm transition-all"
                      >
                        Archived Reports
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* UNIQUE FEATURE: Test Workflow Tracker */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Activity className="w-6 h-6 text-brand-500" /> Test Workflow Tracker
                      </h3>
                      <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Real-time status of active diagnostic procedures</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {(appointments || []).filter(a => a.status !== 'CANCELLED' && a.status !== 'COMPLETED').slice(0, 3).map((apt, i) => {
                      const steps = [
                        { label: 'Order', icon: ClipboardList, active: true },
                        { label: 'Sample', icon: Activity, active: apt.status === 'CONFIRMED' || apt.status === 'IN_PROGRESS' },
                        { label: 'Analyis', icon: FlaskConical, active: apt.status === 'IN_PROGRESS' },
                        { label: 'Report', icon: FileCheck2, active: apt.status === 'COMPLETED' }
                      ];
                      
                      return (
                        <motion.div 
                          key={apt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 min-w-[180px]">
                              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-slate-950 text-brand-600 flex items-center justify-center font-black">
                                {getPatientName(apt.user).charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 dark:text-white leading-tight">{getPatientName(apt.user)}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: PID-{apt.user?.id} • {apt.test_details?.map(t => t.name).join(', ') || 'General Test'}</p>
                              </div>
                            </div>

                            <div className="flex-1 flex items-center justify-between px-4">
                              {steps.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center relative gap-2 flex-1 group/step">
                                  {idx < steps.length - 1 && (
                                    <div className={`absolute left-1/2 top-4 w-full h-[2px] -z-0 ${steps[idx+1].active ? 'bg-brand-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
                                  )}
                                  <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${step.active ? 'bg-brand-600 text-white scale-110 shadow-lg shadow-brand-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'}`}>
                                    <step.icon className="w-4 h-4" />
                                  </div>
                                  <span className={`text-[9px] font-black uppercase tracking-tighter ${step.active ? 'text-brand-600' : 'text-slate-300'}`}>{step.label}</span>
                                </div>
                              ))}
                            </div>

                            <Button 
                              onClick={() => {
                                setUploadData({ ...uploadData, appointmentId: apt.id.toString() });
                                setActiveTab('Upload Results');
                              }}
                              className="bg-slate-50 hover:bg-brand-600 hover:text-white text-slate-400 font-bold text-[10px] h-10 px-4 rounded-xl transition-all"
                            >
                              Update Status
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                    {(appointments || []).filter(a => a.status !== 'CANCELLED' && a.status !== 'COMPLETED').length === 0 && (
                      <div className="bg-brand-50/50 dark:bg-slate-950/20 border border-dashed border-brand-100 dark:border-slate-800 p-12 rounded-[2rem] text-center">
                        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold">No active test workflows at the moment.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Insights */}
                <div className="space-y-6">
                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/10 blur-3xl rounded-full" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 mb-6">Efficiency Pulse</h4>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-400">Avg. Turnaround</span>
                        <span className="text-lg font-black text-brand-400 italic">4.2 hrs</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-400">Load Capacity</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-brand-500" />
                          </div>
                          <span className="text-xs font-black text-white italic">65%</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/5 mt-4">
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">Your laboratory is performing 12% faster than last week's average.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "New Test Requests", count: pendingRequests.length, icon: ClipboardList, color: "blue", bg: "bg-brand-50 dark:bg-slate-950", text: "text-brand-500", light: "bg-brand-50 dark:bg-slate-950", tab: 'Test Requests' },
                  { title: "Scheduled Tests", count: scheduledTests.length, icon: CalendarDays, color: "amber", bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-50", tab: 'Test Schedule' },
                  { title: "Tests In Progress", count: appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS').length, icon: Activity, color: "purple", bg: "bg-purple-500", text: "text-purple-500", light: "bg-purple-50", tab: 'Test Schedule' },
                  { title: "Completed Reports", count: completedTests.length, icon: CheckCircle2, color: "emerald", bg: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-50", tab: 'Upload Results' }
                ].map((stat, idx) => (
                  <div key={idx} onClick={() => setActiveTab(stat.tab)} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all group relative overflow-hidden cursor-pointer">
                     <div className="flex items-start justify-between">
                       <div>
                         <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{stat.title}</p>
                         <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{stat.count}</h3>
                       </div>
                       <div className={`w-14 h-14 rounded-2xl ${stat.light} ${stat.text} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                         <stat.icon className="w-6 h-6" />
                       </div>
                     </div>
                     <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ${stat.bg}`}></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recently Received (Pending) */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">New Requests</h3>
                    <Button variant="ghost" onClick={() => setActiveTab('Test Requests')} className="text-[10px] font-black uppercase text-brand-600 tracking-wider">Review All</Button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {pendingRequests.slice(0, 4).map(apt => (
                      <div key={apt.id} className="p-6 hover:bg-brand-50 dark:bg-slate-950 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getPatientName(apt.user)}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                            className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-slate-950 border border-brand-50 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-110"
                            alt={getPatientName(apt.user)}
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{getPatientName(apt.user)}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{new Date(apt.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSchedulingApt(apt);
                            const d = new Date(apt.date);
                            setScheduleData({
                              date: d.toISOString().split('T')[0],
                              time: d.toTimeString().split(' ')[0].substring(0, 5)
                            });
                          }}
                          className="rounded-xl bg-slate-900 text-white font-bold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Schedule
                        </Button>
                      </div>
                    ))}
                    {pendingRequests.length === 0 && (
                      <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm font-bold bg-brand-50 dark:bg-slate-950/50">No new orders today.</div>
                    )}
                  </div>
                </div>

                {/* Recently Scheduled */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Upcoming Tests</h3>
                    <Button variant="ghost" onClick={() => setActiveTab('Test Schedule')} className="text-[10px] font-black uppercase text-brand-600 tracking-wider">View Full</Button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {scheduledTests.slice(0, 4).map(apt => (
                      <div key={apt.id} className="p-6 hover:bg-brand-50 dark:bg-slate-950 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getPatientName(apt.user)}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                            className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-slate-950 border border-brand-50 dark:border-slate-800 shadow-sm"
                            alt={getPatientName(apt.user)}
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{getPatientName(apt.user)}</p>
                            <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest">{new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <Badge className="bg-amber-50 text-amber-600 border-amber-100 uppercase text-[9px] font-black">Scheduled</Badge>
                      </div>
                    ))}
                    {scheduledTests.length === 0 && (
                      <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm font-bold bg-brand-50 dark:bg-slate-950/50">No tests scheduled soon.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TEST REQUESTS */}
          {activeTab === 'Test Requests' && (
             <div className="animate-in slide-in-from-bottom-8 duration-700 bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Incoming Test Requests</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Review and accept diagnostic orders from doctors and direct patient bookings.</p>
                  </div>
                  <Badge className="bg-brand-50 dark:bg-slate-950 text-brand-700 border-0 font-bold px-4 py-2 text-sm">{pendingRequests.length} Pending</Badge>
                </div>
                
                <div className="flex-1 overflow-x-auto">
                   <table className="w-full text-left whitespace-nowrap">
                     <thead>
                       <tr className="bg-brand-50 dark:bg-slate-950 border-b border-brand-50 dark:border-slate-800">
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Patient Profile</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Requested Test</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Requested By</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Date Assigned</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Payment</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {pendingRequests.map(apt => (
                         <tr key={apt.id} className="hover:bg-brand-50 dark:bg-slate-950/80 transition-colors group">
                           <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                               <img 
                                 src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getPatientName(apt.user)}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                                 className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 shadow-sm"
                                 alt={getPatientName(apt.user)}
                               />
                               <div>
                                 <p className="font-black text-slate-900 dark:text-white">{getPatientName(apt.user)}</p>
                                 <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">ID: P-{apt.user?.id || '000'}</p>
                               </div>
                             </div>
                           </td>
                           <td className="px-8 py-5">
                             <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg text-sm">{apt.test_details?.map(t => t.name).join(', ') || 'Standard Diagnostic'}</span>
                           </td>
                           <td className="px-8 py-5">
                             <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                               <Stethoscope className="w-4 h-4 text-emerald-500" /> {apt.test_request_details?.doctor_name || 'Direct Booking'}
                             </div>
                           </td>
                           <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(apt.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                           </td>
                           <td className="px-8 py-5">
                              <div className="flex flex-col">
                                 <Badge className={`w-fit text-[10px] font-black uppercase tracking-widest ${apt.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {apt.type === 'TEST_REQUEST' ? 'Awaiting Booking' : (apt.is_paid ? 'Paid' : 'Unpaid')}
                                 </Badge>
                                 <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                   {apt.type === 'TEST_REQUEST' ? 'N/A' : `₹${apt.amount} • ${apt.payment_mode === 'ONLINE' ? 'Online' : 'At Lab'}`}
                                 </span>
                              </div>
                           </td>
                           <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <Button 
                                   onClick={() => setSelectedAppointment(apt)}
                                   variant="outline"
                                   className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 rounded-xl transition-all text-xs gap-2"
                                 >
                                   <Eye className="w-4 h-4" /> View
                                 </Button>
                                 <Button 
                                   onClick={() => setCancelAppointment(apt)}
                                   className="bg-white dark:bg-slate-900 text-rose-600 hover:bg-rose-50 font-bold px-4 rounded-xl border border-rose-100 transition-all text-xs"
                                 >
                                   Cancel
                                 </Button>
                                <Button 
                                  onClick={() => setSchedulingApt(apt)}
                                  className="bg-brand-600 hover:bg-brand-700 text-white font-black px-6 rounded-xl shadow-lg shadow-brand-500/20 transition-transform active:scale-95"
                                >
                                  Accept & Schedule
                                </Button>
                              </div>
                           </td>
                         </tr>
                       ))}
                       {pendingRequests.length === 0 && (
                         <tr>
                           <td colSpan="6" className="px-8 py-20 text-center">
                             <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-50 dark:bg-slate-950 mb-4">
                               <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                             </div>
                             <h4 className="text-xl font-bold text-slate-900 dark:text-white">All Caught Up!</h4>
                             <p className="text-slate-500 dark:text-slate-400 mt-2">No new test requests at this time.</p>
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                </div>
             </div>
          )}

          {/* TAB: TEST SCHEDULE */}
          {activeTab === 'Test Schedule' && (
             <div className="animate-in slide-in-from-bottom-8 duration-700 bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Active Test Schedule</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Manage scheduled patients and monitor diagnostic progress.</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input type="text" placeholder="Filter schedule..." className="pl-10 pr-4 py-2 bg-brand-50 dark:bg-slate-950 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-50 dark:border-slate-800" />
                  </div>
                </div>
                
                <div className="flex-1 overflow-x-auto">
                   <table className="w-full text-left whitespace-nowrap">
                     <thead>
                       <tr className="bg-brand-50 dark:bg-slate-950 border-b border-brand-50 dark:border-slate-800">
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Patient</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Test Procedure</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Schedule</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {scheduledTests.map(apt => (
                         <tr key={apt.id} className="hover:bg-brand-50 dark:bg-slate-950/80 transition-colors">
                           <td className="px-8 py-5">
                             <div className="font-bold text-slate-900 dark:text-white">{getPatientName(apt.user)}</div>
                           </td>
                           <td className="px-8 py-5 text-sm text-slate-600 font-medium">{apt.test_details?.map(t => t.name).join(', ') || 'Diagnostic'}</td>
                           <td className="px-8 py-5">
                             <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                               <Clock className="w-4 h-4 text-amber-500" />
                               {new Date(apt.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                             </div>
                           </td>
                           <td className="px-8 py-5">
                             <Badge className="bg-amber-50 text-amber-600 border border-amber-200/50 text-[10px] uppercase font-black px-3 py-1">Scheduled</Badge>
                           </td>
                           <td className="px-8 py-5 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <Button 
                                  onClick={() => setSelectedAppointment(apt)}
                                  variant="outline"
                                  className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 rounded-xl transition-all text-xs gap-2"
                                >
                                  <Eye className="w-4 h-4" /> View
                                </Button>
                               <Button 
                                 onClick={() => {
                                   setUploadData({ ...uploadData, appointmentId: apt.id.toString() });
                                   setActiveTab('Upload Results');
                                 }}
                                 className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold px-4 rounded-xl border border-emerald-200/50 hover:border-emerald-600 transition-all duration-300 gap-2 text-xs"
                               >
                                 <UploadCloud className="w-4 h-4" /> Go to Upload
                               </Button>
                             </div>
                           </td>
                         </tr>
                       ))}
                       {scheduledTests.length === 0 && (
                         <tr>
                           <td colSpan="6" className="px-8 py-20 text-center">
                             <CalendarDays className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                             <h4 className="text-xl font-bold text-slate-900 dark:text-white">Schedule Clear</h4>
                             <p className="text-slate-500 dark:text-slate-400 mt-2">No pending tests scheduled.</p>
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                </div>
             </div>
          )}

          {/* TAB: UPLOAD TEST RESULTS */}
          {activeTab === 'Upload Results' && (
             <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-700">
               <div className="bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden shadow-slate-200/40">
                 
                 <div className="bg-gradient-to-r from-brand-600 to-brand-800 p-10 text-white flex justify-between items-center">
                   <div>
                     <h2 className="text-3xl font-black tracking-tight">Upload Test Report</h2>
                     <p className="text-brand-100 font-medium mt-2">Attach medical findings and finalize patient diagnostics.</p>
                   </div>
                   <div className="hidden sm:flex w-20 h-20 bg-white dark:bg-slate-900/10 backdrop-blur-md rounded-2xl items-center justify-center border border-white/20">
                     <FileCheck2 className="w-10 h-10 text-white" />
                   </div>
                 </div>

                 <form onSubmit={handleUploadResult} className="p-10 space-y-8">
                   
                   {/* Target Selection */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500">Select Patient Target</Label>
                       <div className="relative">
                         <select 
                           value={uploadData.appointmentId}
                           onChange={e => setUploadData({...uploadData, appointmentId: e.target.value})}
                           className="w-full h-14 pl-4 pr-10 rounded-2xl border border-slate-200 bg-brand-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-50 dark:border-slate-800 focus:bg-white dark:bg-slate-900 transition-all cursor-pointer"
                           required
                         >
                           <option value="" disabled>-- Choose Scheduled Appointment --</option>
                           {scheduledTests.map(apt => (
                             <option key={apt.id} value={apt.id}>
                               {getPatientName(apt.user)} - {new Date(apt.date).toLocaleDateString()}
                             </option>
                           ))}
                         </select>
                         <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                       </div>
                     </div>
                     <div className="space-y-2 flex flex-col justify-end pb-1">
                        <div 
                          onClick={() => setUploadData({...uploadData, isNormal: !uploadData.isNormal})}
                          className={`h-14 rounded-2xl border flex items-center justify-between px-6 cursor-pointer select-none transition-all ${uploadData.isNormal ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm' : 'bg-brand-50 dark:bg-slate-950 border-slate-200 text-slate-500 dark:text-slate-400 hover:bg-slate-100'}`}
                        >
                          <span className="font-bold text-sm uppercase tracking-wide">Patient is Normal?</span>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${uploadData.isNormal ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-100'}`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </div>
                     </div>
                   </div>

                   {/* File Upload Area */}
                   <div className="space-y-2">
                     <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500">Diagnostic Document (PDF)</Label>
                     <div className="relative border-2 border-dashed border-slate-300 rounded-[2rem] bg-brand-50 dark:bg-slate-950 hover:bg-brand-50 dark:bg-slate-950/50 hover:border-brand-400 transition-colors p-10 flex flex-col items-center justify-center text-center group">
                       <input 
                         type="file" 
                         accept=".pdf,.doc,.docx,.jpg,.png" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         onChange={e => {
                           if(e.target.files && e.target.files.length > 0) {
                             setUploadData({...uploadData, file: e.target.files[0]});
                           }
                         }}
                       />
                       <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-brand-50 dark:border-slate-800 text-brand-500">
                         <UploadCloud className="w-8 h-8" />
                       </div>
                       {uploadData.file ? (
                         <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl">
                           <File className="w-5 h-5" /> 
                           File ready: {uploadData.file.name}
                         </div>
                       ) : (
                         <>
                           <h4 className="font-black text-slate-900 dark:text-white text-lg mb-1">Click to Upload or Drag and Drop</h4>
                           <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Standard PDF format recommended. Max 10MB.</p>
                         </>
                       )}
                     </div>
                   </div>

                   {/* Report Notes */}
                   <div className="space-y-2">
                     <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500">Tech Notes / Findings</Label>
                     <textarea 
                       required
                       value={uploadData.notes}
                       onChange={e => setUploadData({...uploadData, notes: e.target.value})}
                       placeholder="Enter clinical notes, metrics, array values, and specific findings here..."
                       className="w-full h-40 rounded-2xl border border-slate-200 bg-brand-50 dark:bg-slate-950 p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-50 dark:border-slate-800 focus:bg-white dark:bg-slate-900 transition-all resize-none shadow-inner"
                     ></textarea>
                   </div>

                   {/* Submit */}
                   <div className="pt-4 border-t border-brand-50 dark:border-slate-800 flex justify-end">
                     <Button type="submit" disabled={isUploading || !uploadData.appointmentId} className="h-14 px-10 rounded-2xl bg-brand-600 hover:bg-brand-700 font-black text-white text-lg shadow-xl shadow-brand-500/20 gap-3">
                       {isUploading ? 'Finalizing Report...' : (<>Finalize & Distribute <Share className="w-5 h-5" /></>)}
                     </Button>
                   </div>
                 </form>

               </div>
             </div>
          )}

          {/* TAB: DIGITAL REPORTS */}
          {activeTab === 'Digital Reports' && (
             <div className="animate-in slide-in-from-bottom-8 duration-700 bg-white dark:bg-slate-900 border border-brand-50 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Authenticated Digital Reports</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Verified diagnostic findings ready for distribution.</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-0 font-bold px-4 py-2 text-sm">{testResults.length} Reports</Badge>
                </div>
                
                <div className="flex-1 overflow-x-auto">
                   <table className="w-full text-left whitespace-nowrap">
                     <thead>
                       <tr className="bg-brand-50 dark:bg-slate-950 border-b border-brand-50 dark:border-slate-800">
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Recipient</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Report Status</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Date Generated</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {testResults.map(res => (
                         <tr key={res.id} className="hover:bg-brand-50 dark:bg-slate-950/80 transition-colors">
                           <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black">
                                 {getPatientName(res.patient).charAt(0)}
                               </div>
                               <div>
                                 <p className="font-bold text-slate-900 dark:text-white leading-none">{getPatientName(res.patient)}</p>
                                 <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase">PID-{res.patient?.id || '000'}</p>
                               </div>
                             </div>
                           </td>
                           <td className="px-8 py-5">
                             <Badge className={res.is_normal ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}>
                               {res.is_normal ? "Normal Result" : "Attention Required"}
                             </Badge>
                           </td>
                           <td className="px-8 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                             {new Date(res.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                           </td>
                           <td className="px-8 py-5 text-right">
                             <Button 
                               onClick={() => navigate(`/report/lab-test/${res.id}`)}
                               className="h-10 px-5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-all gap-2 text-[10px] font-black uppercase"
                             >
                               <FileText className="w-4 h-4" /> View Digital Report
                             </Button>
                           </td>
                         </tr>
                       ))}
                       {testResults.length === 0 && (
                         <tr>
                            <td colSpan="4" className="px-8 py-20 text-center">
                              <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                              <h4 className="text-xl font-bold text-slate-900 dark:text-white">No Reports Yet</h4>
                              <p className="text-slate-500 dark:text-slate-400 mt-2">Upload findings to generate encrypted digital reports.</p>
                            </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                </div>
             </div>
          )}

          {/* TAB: LAB SCHEDULE */}
          {activeTab === 'Lab Schedule' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 max-w-7xl mx-auto"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Operational Schedule</h2>
                  <p className="text-slate-500 font-medium mt-1">Configure your facility's heartbeat and public visibility.</p>
                </div>
                <div className="flex items-center gap-3 bg-brand-50 dark:bg-slate-950 p-2 rounded-2xl border border-brand-100 dark:border-slate-800">
                   <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
                      <Clock className="w-5 h-5 text-brand-600" />
                   </div>
                   <div className="pr-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timezone</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Local Standard (IST)</p>
                   </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-8">
                    <div className="space-y-1">
                       <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                          <PlusCircle className="w-6 h-6 text-brand-500" /> Add Session
                       </h3>
                       <p className="text-xs font-medium text-slate-400">Define a new working window for your lab.</p>
                    </div>

                    <form onSubmit={handleRegisterHours} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Day Selection</Label>
                        <select 
                          value={newAvail.day_of_week}
                          onChange={e => setNewAvail({...newAvail, day_of_week: parseInt(e.target.value)})}
                          className="w-full h-14 px-6 rounded-2xl border-2 border-slate-50 bg-slate-50 dark:bg-slate-950 dark:border-slate-900 font-bold text-slate-900 dark:text-white focus:bg-white focus:border-brand-500 transition-all outline-none"
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => (
                            <option key={idx} value={idx}>{day}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Opens At</Label>
                          <Input 
                            type="time" 
                            required 
                            value={newAvail.start_time}
                            onChange={e => setNewAvail({...newAvail, start_time: e.target.value})}
                            className="h-14 px-5 rounded-2xl border-slate-50 bg-slate-50 dark:bg-slate-950 dark:border-slate-900 font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Closes At</Label>
                          <Input 
                            type="time" 
                            required 
                            value={newAvail.end_time}
                            onChange={e => setNewAvail({...newAvail, end_time: e.target.value})}
                            className="h-14 px-5 rounded-2xl border-slate-50 bg-slate-50 dark:bg-slate-950 dark:border-slate-900 font-bold text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Slot Interval (Min)</Label>
                        <div className="relative">
                           <Input 
                             type="number" 
                             required 
                             min="5"
                             max="120"
                             value={newAvail.slot_duration}
                             onChange={e => setNewAvail({...newAvail, slot_duration: parseInt(e.target.value)})}
                             className="h-14 px-6 rounded-2xl border-slate-50 bg-slate-50 dark:bg-slate-950 dark:border-slate-900 font-bold pr-16"
                           />
                           <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400">Min</span>
                        </div>
                      </div>

                      <Button type="submit" className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95 text-xs">
                        Save Working Hours
                      </Button>
                    </form>
                  </div>

                  <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                     <div className="relative z-10 space-y-4">
                        <ShieldCheck className="w-10 h-10 text-white/40" />
                        <h4 className="text-xl font-black leading-tight">Patient Visibility Active</h4>
                        <p className="text-xs font-bold text-emerald-100">Your registered schedule is automatically synced to the patient booking portal.</p>
                     </div>
                  </div>
                </div>

                {/* Main Schedule Display */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                       <h3 className="text-xl font-black text-slate-900 dark:text-white">Active General Schedule</h3>
                       <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 border-0 font-black text-[10px] px-3">{labAvailability.length} Days Configured</Badge>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                      {labAvailability.sort((a,b) => a.day_of_week - b.day_of_week).map((avail) => (
                        <div key={avail.id} className="p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors group">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-lg shadow-brand-500/10">
                                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][avail.day_of_week]}
                              </div>
                              <div>
                                 <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{avail.day_display}</h4>
                                 <div className="flex items-center gap-4 mt-1">
                                    <span className="flex items-center gap-1.5 text-xs font-black text-brand-600 uppercase tracking-widest">
                                       <Clock className="w-3.5 h-3.5" />
                                       {avail.start_time.substring(0,5)} - {avail.end_time.substring(0,5)}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{avail.slot_duration} Min Intervals</span>
                                 </div>
                              </div>
                           </div>
                           <Button 
                             onClick={() => handleDeleteAvail(avail.id)} 
                             variant="ghost" 
                             className="mt-4 sm:mt-0 px-6 h-12 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                           >
                              Remove Session
                           </Button>
                        </div>
                      ))}
                      {labAvailability.length === 0 && (
                        <div className="px-10 py-24 text-center">
                           <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center mx-auto mb-6 text-slate-200">
                              <CalendarDays className="w-10 h-10" />
                           </div>
                           <h4 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Scheduled Sessions</h4>
                           <p className="text-slate-400 text-sm mt-2 font-medium">Use the left sidebar to define your clinic's working hours.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Holiday & Emergencies */}
                  <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-brand-500 to-emerald-500"></div>
                    <div className="p-10 space-y-10">
                       <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Public Holidays & Closures</h3>
                            <p className="text-slate-400 font-medium text-sm mt-1">Emergency closures will automatically notify booked patients.</p>
                          </div>
                       </div>

                       <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                          <div className="md:col-span-4 space-y-2">
                             <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500 ml-2">Locked Date</Label>
                             <Input 
                                type="date" 
                                required 
                                value={newHoliday.date}
                                onChange={e => setNewHoliday({...newHoliday, date: e.target.value})}
                                className="h-14 bg-white/5 border-white/10 text-white font-bold rounded-2xl focus:border-rose-500 transition-all outline-none"
                             />
                          </div>
                          <div className="md:col-span-4 space-y-2">
                             <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500 ml-2">Reason</Label>
                             <Input 
                                placeholder="E.g. National Day" 
                                required 
                                value={newHoliday.reason}
                                onChange={e => setNewHoliday({...newHoliday, reason: e.target.value})}
                                className="h-14 bg-white/5 border-white/10 text-white font-bold rounded-2xl placeholder:opacity-20"
                             />
                          </div>
                          <div className="md:col-span-4">
                             <Button type="submit" className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-900/20 active:scale-95 transition-all text-xs">
                                Lock Calendar Slot
                             </Button>
                          </div>
                       </form>

                       {labHolidays.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                             {labHolidays.map(hol => (
                                <div key={hol.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between animate-in zoom-in-95 duration-500 group">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-black">
                                         <Ban className="w-5 h-5" />
                                      </div>
                                      <div>
                                         <p className="font-bold text-white text-sm">{hol.reason}</p>
                                         <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-0.5">{new Date(hol.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                      </div>
                                   </div>
                                   <button 
                                     onClick={async () => {
                                       await api.delete(`appointments/lab-holidays/${hol.id}/`);
                                       fetchData();
                                     }}
                                     className="w-10 h-10 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all"
                                   >
                                      <X className="w-5 h-5" />
                                   </button>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ CANCELLED ══════════════════════════════════════════════════ */}
          {activeTab === 'Cancelled' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
               <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Cancelled Bookings</h2>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Audit log of all cancelled requests and refund statuses</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Patient</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Refund Status</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {appointments.filter(a => a.status === 'CANCELLED').length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Ban className="w-12 h-12 text-slate-200" />
                              <p className="text-slate-400 font-bold">No cancelled bookings found.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        appointments.filter(a => a.status === 'CANCELLED').map((apt) => (
                          <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400">
                                  {apt.user?.username?.[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 dark:text-white text-sm">{apt.user?.username}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {apt.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(apt.date).toLocaleDateString()}
                            </td>
                            <td className="px-8 py-5">
                              <p className="text-sm font-bold text-rose-500">{apt.cancellation_reason || 'Not specified'}</p>
                              <p className="text-[10px] font-medium text-slate-400 italic">By: {apt.cancelled_by || 'Unknown'}</p>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <Badge className={`uppercase text-[9px] font-black px-2 ${apt.payment_status === 'REFUNDED' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  {apt.payment_status === 'REFUNDED' ? 'Refunded' : 'N/A'}
                                </Badge>
                                {apt.refund_details && (
                                  <span className="text-[9px] font-bold text-slate-400 italic">ID: {apt.refund_details.refund_id?.substring(0,8)}...</span>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <Button 
                                  onClick={() => setSelectedAppointment(apt)}
                                  variant="outline"
                                  className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 rounded-xl transition-all text-xs"
                                >
                                  Details
                                </Button>
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


           {/* TAB: PAYMENTS */}
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
                            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-bold italic">No payment records found.</p>
                          </td>
                        </tr>
                      ) : (
                        appointments.map(appt => (
                          <tr key={appt.id} className="hover:bg-brand-50 dark:bg-slate-950/50 transition-colors">
                            <td className="px-6 py-5">
                               <p className="font-black text-slate-900 dark:text-white text-sm">{getPatientName(appt.user)}</p>
                               <p className="text-[10px] text-slate-400 font-bold">Appt #{appt.id}</p>
                            </td>
                            <td className="px-6 py-5 font-black text-slate-900 dark:text-white">
                               ₹{appt.amount}
                            </td>
                            <td className="px-6 py-5">
                               <Badge className="bg-slate-100 text-slate-600 font-bold px-2 py-1">{appt.payment_mode === 'PAY_AT_CLINIC' ? 'Pay at Lab' : 'Online'}</Badge>
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

           {/* TAB: TESTS & PRICING */}
           {activeTab === 'Tests & Pricing' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white">Diagnostic Tests & Pricing</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage your lab's test menu and set prices for each procedure.</p>
                 </div>
                 <Button 
                   onClick={() => setIsAddingTest(!isAddingTest)}
                   className="bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl px-6 py-3 flex items-center gap-2"
                 >
                   <PlusCircle className="w-5 h-5" />
                   {isAddingTest ? 'Cancel' : 'Add New Test'}
                 </Button>
               </div>

               {isAddingTest && (
                 <motion.div 
                   initial={{ opacity: 0, y: -20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-xl"
                 >
                   <form onSubmit={handleAddTest} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Test Name</Label>
                       <Input 
                         required
                         value={newTest.name}
                         onChange={e => setNewTest({...newTest, name: e.target.value})}
                         placeholder="e.g. Complete Blood Count (CBC)"
                         className="h-12 bg-brand-50 rounded-xl font-bold"
                         list="test-suggestions"
                       />
                       <datalist id="test-suggestions">
                         {commonTests.map(t => <option key={t} value={t} />)}
                       </datalist>
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</Label>
                       <Input 
                         value={newTest.category}
                         onChange={e => setNewTest({...newTest, category: e.target.value})}
                         placeholder="e.g. Hematology"
                         className="h-12 bg-brand-50 rounded-xl font-bold"
                         list="category-suggestions"
                       />
                       <datalist id="category-suggestions">
                         {commonCategories.map(c => <option key={c} value={c} />)}
                       </datalist>
                     </div>
                     <div className="space-y-2 md:col-span-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                       <textarea 
                         value={newTest.description}
                         onChange={e => setNewTest({...newTest, description: e.target.value})}
                         className="w-full p-4 bg-brand-50 rounded-xl font-bold border-0 focus:ring-2 focus:ring-brand-500/20 outline-none"
                         rows="3"
                         placeholder="Briefly describe the test..."
                       ></textarea>
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price (₹)</Label>
                       <Input 
                         required
                         type="number"
                         value={newTest.price}
                         onChange={e => setNewTest({...newTest, price: e.target.value})}
                         className="h-12 bg-brand-50 rounded-xl font-bold"
                       />
                     </div>
                     <div className="flex items-end">
                       <Button type="submit" className="w-full h-12 bg-slate-900 text-white font-black rounded-xl">
                         Save Test Profile
                       </Button>
                     </div>
                   </form>
                 </motion.div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {labTests.map(test => (
                   <div key={test.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                     <div className="flex justify-between items-start mb-4">
                       <Badge className="bg-brand-50 text-brand-600 border-0 text-[9px] font-black uppercase tracking-wider">
                         {test.category || 'General'}
                       </Badge>
                       <button 
                         onClick={() => handleDeleteTest(test.id)}
                         className="text-slate-300 hover:text-rose-500 transition-colors"
                       >
                         <X className="w-5 h-5" />
                       </button>
                     </div>
                     <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">{test.name}</h4>
                     <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-6">{test.description || 'No description provided.'}</p>
                     <div className="flex items-center justify-between mt-auto">
                       <span className="text-2xl font-black text-brand-600 italic">₹{test.price}</span>
                       <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                         <ActivitySquare className="w-5 h-5" />
                       </div>
                     </div>
                   </div>
                 ))}
                 {labTests.length === 0 && !isAddingTest && (
                   <div className="col-span-full py-20 text-center bg-brand-50/50 rounded-[2.5rem] border border-dashed border-brand-100">
                     <FlaskConical className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                     <h4 className="text-xl font-bold text-slate-900">No Tests Configured</h4>
                     <p className="text-slate-500 mt-2">Start adding diagnostic tests to show them to patients.</p>
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* TAB: SETTINGS */}
           {activeTab === 'Settings' && (
             <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-700 pb-20">
               <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20">
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Facility Settings</h3>
                 <form onSubmit={async (e) => {
                   e.preventDefault();
                   if (!profile?.id) return;
                   try {
                     const res = await api.patch(`users/labs/${profile.id}/`, profile);
                     setProfile(res.data);
                     showToast("Settings updated successfully");
                   } catch (err) {
                     showToast("Failed to update settings", "error");
                   }
                 }} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Facility Name</Label>
                        <Input 
                           value={profile?.name || ''}
                           onChange={(e) => setProfile({...profile, name: e.target.value})}
                           className="h-14 bg-brand-50 dark:bg-slate-950/50 border-brand-50 rounded-2xl font-black text-slate-900 text-sm"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Payment Options</Label>
                        <select
                           value={profile?.payment_type || 'BOTH'}
                           onChange={(e) => setProfile({...profile, payment_type: e.target.value})}
                           className="w-full h-14 px-4 bg-brand-50 dark:bg-slate-950/50 border-brand-50 rounded-2xl font-black text-slate-900 text-sm outline-none"
                        >
                           <option value="PAY_AT_CLINIC">Pay at Lab</option>
                           <option value="ONLINE">Online Payment</option>
                           <option value="BOTH">Both</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Advance Payment (₹) - Optional</Label>
                        <Input 
                           type="number"
                           value={profile?.advance_payment || ''}
                           onChange={(e) => setProfile({...profile, advance_payment: e.target.value})}
                           className="h-14 bg-brand-50 border-brand-50 rounded-2xl font-black text-slate-900 text-sm"
                           placeholder="Leave empty for no advance"
                        />
                     </div>
                   </div>

                   <div className="bg-brand-50/50 dark:bg-slate-950/30 p-8 rounded-3xl border border-brand-50 dark:border-slate-800 space-y-6">
                     <div className="flex items-center justify-between">
                       <div>
                         <h4 className="font-black text-slate-900 dark:text-white">Home Sample Collection</h4>
                         <p className="text-xs text-slate-500 font-bold">Offer doorstep service to your patients</p>
                       </div>
                       <div 
                         onClick={() => setProfile({...profile, home_collection_available: !profile?.home_collection_available})}
                         className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 ${profile?.home_collection_available ? 'bg-brand-600 shadow-lg shadow-brand-500/50' : 'bg-slate-300'}`}
                       >
                         <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${profile?.home_collection_available ? 'translate-x-7' : 'translate-x-0'}`} />
                       </div>
                     </div>

                     {profile?.home_collection_available && (
                       <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                         <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Collection Charge (₹)</Label>
                           <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                             <Input 
                               type="number"
                               value={profile?.home_collection_charge || ''}
                               onChange={(e) => setProfile({...profile, home_collection_charge: e.target.value})}
                               className="h-14 pl-10 bg-white dark:bg-slate-950 border-brand-50 rounded-2xl font-black text-slate-900 text-sm"
                               placeholder="0.00"
                             />
                           </div>
                         </div>
                         <p className="text-[10px] text-slate-400 font-bold italic">* This fee will be added to the total test price when patients choose home collection.</p>
                       </div>
                     )}
                   </div>

                   <Button type="submit" className="w-full h-14 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl">
                     Save Changes
                   </Button>
                 </form>
               </div>
             </div>
           )}

           {/* Generic Fallback Tabs (Notifications, etc.) */}
           {/* ── NOTIFICATIONS TAB ─────────────────────────────────────────── */}
           {activeTab === 'Notifications' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Notification Feed</h3>
                   <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Stay updated with patient bookings and session status</p>
                 </div>
                 {notifications.length > 0 && (
                   <Button 
                     variant="outline" 
                     onClick={markAllNotificationsAsRead}
                     className="rounded-xl font-bold text-xs uppercase tracking-widest h-10 border-slate-200 hover:bg-brand-50 hover:text-brand-600 transition-all"
                   >
                     Clear All
                   </Button>
                 )}
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-xl shadow-slate-200/20 overflow-hidden min-h-[500px]">
                 {notifications.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-[500px] text-center">
                     <div className="w-20 h-20 bg-brand-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-6">
                        <Bell className="w-10 h-10 text-brand-200" />
                     </div>
                     <h4 className="text-xl font-black text-slate-900 dark:text-white">Quiet in here...</h4>
                     <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2 italic">You'll see alerts here when patients book tests or confirm payments.</p>
                   </div>
                 ) : (
                   <div className="divide-y divide-slate-50 dark:divide-slate-800">
                     {notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((n, idx) => (
                       <div 
                         key={n.id} 
                         onClick={() => !n.is_read && markNotificationAsRead(n.id)}
                         className={`p-8 transition-all hover:bg-brand-50/50 cursor-pointer group flex items-start gap-6 ${!n.is_read ? 'bg-brand-50/30' : ''}`}
                       >
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                           !n.is_read ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                         }`}>
                           {n.title.toLowerCase().includes('payment') ? <ClipboardList className="w-6 h-6" /> : 
                            n.title.toLowerCase().includes('cancel') ? <X className="w-6 h-6" /> : 
                            <Bell className="w-6 h-6" />}
                         </div>
                         <div className="flex-1 space-y-1">
                           <div className="flex items-center justify-between">
                             <h4 className={`font-black tracking-tight ${!n.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                               {n.title}
                             </h4>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
                               {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                           </div>
                           <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-slate-600 dark:text-slate-300 font-bold' : 'text-slate-400 dark:text-slate-500 font-medium'}`}>
                             {n.message}
                           </p>
                           {!n.is_read && (
                             <div className="pt-2">
                               <Badge className="bg-brand-100 text-brand-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-0">New Update</Badge>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           )}


      {/* ── Appointment Scheduling Modal ────────────────────────────────── */}
      {schedulingApt && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-brand-50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Set Appointment Time</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 mt-1">Patient: {getPatientName(schedulingApt.user)}</p>
              </div>
              <button onClick={() => setSchedulingApt(null)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </header>

            <form onSubmit={handleScheduleConfirm} className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500">Pick Date</Label>
                <Input 
                  type="date" 
                  required 
                  value={scheduleData.date}
                  onChange={e => setScheduleData({...scheduleData, date: e.target.value})}
                  className="h-12 px-4 rounded-xl border-slate-100 bg-brand-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500">Pick Time Slot</Label>
                <Input 
                  type="time" 
                  required 
                  value={scheduleData.time}
                  onChange={e => setScheduleData({...scheduleData, time: e.target.value})}
                  className="h-12 px-4 rounded-xl border-slate-100 bg-brand-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSchedulingApt(null)}
                  className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest border-slate-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 h-12 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20"
                >
                  Confirm Slot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

       {/* Toast Notifications */}
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
              Choose how to handle the cancellation for <span className="font-bold text-slate-900 dark:text-white">{(cancelAppointment?.user?.first_name || cancelAppointment?.user?.username || 'this patient')}</span>. {cancelAppointment.is_paid && cancelAppointment.payment_mode === 'ONLINE' ? 'You can initiate a full refund or request the patient to reschedule.' : 'You can cancel the request or offer to reschedule for a different time.'}
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
                onClick={() => handleCancelRequest(cancelAppointment.id, cancellationReason)}
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
                onClick={() => setCancelAppointment(null)}
              >
                Keep Appointment
              </Button>
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
                  <h3 className="text-2xl font-black tracking-tight mb-2">Test Request Details</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-brand-50 dark:bg-slate-950 text-brand-700 border-none font-black text-[9px] px-2">{selectedAppointment.status}</Badge>
                    <span className="text-[10px] font-black text-brand-50 uppercase tracking-widest">Request ID: {selectedAppointment.id}</span>
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
                     <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Target Date</p>
                     <p className="font-bold text-slate-900 dark:text-white">{selectedAppointment.date ? new Date(selectedAppointment.date).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-brand-50 dark:border-slate-800 bg-white dark:bg-slate-900">
                     <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Requested By</p>
                     <p className="font-bold text-slate-900 dark:text-white">
                        {selectedAppointment.test_request_details?.doctor_name || 'Direct Patient Booking'}
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
                     <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Collection Mode</p>
                     <p className="font-bold text-slate-900 dark:text-white">
                        {selectedAppointment.is_home_collection ? 'Home Collection' : 'Lab Visit'}
                     </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-brand-50 dark:border-slate-800 bg-brand-50 dark:bg-slate-950">
                    <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2">Tests Requested</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAppointment.test_details?.map(test => (
                        <Badge key={test.id} className="bg-white dark:bg-slate-900 border-slate-200 text-slate-700 font-bold">
                          {test.name} (₹{test.price})
                        </Badge>
                      ))}
                      {(!selectedAppointment.test_details || selectedAppointment.test_details.length === 0) && (
                        <p className="text-sm font-bold text-slate-500 italic">Standard Diagnostic Protocol</p>
                      )}
                    </div>
                </div>
               
               <Button onClick={() => setSelectedAppointment(null)} className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black rounded-2xl mt-4 shadow-xl shadow-slate-900/10">Close Details</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
