import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';

import {
  HeartPulse, AlertCircle, Eye, EyeOff, User, Building2,
  ActivitySquare, ShieldCheck, ChevronRight, ChevronLeft,
  ArrowRight, Lock, Upload, FileText, X, CheckCircle2,
  Loader2, Phone, Mail, Hash, MapPin, Sparkles, FileUp,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logo from '../components/ui/Logo';

/* ─── Document types ──────────────────────────────────────────────────── */
const CLINIC_DOC_TYPES = [
  { value: 'registration_cert', label: 'Registration Certificate' },
  { value: 'medical_license',   label: 'Medical License' },
  { value: 'address_proof',     label: 'Address Proof' },
  { value: 'identity_proof',    label: 'Identity Proof' },
  { value: 'other',             label: 'Other' },
];
const LAB_DOC_TYPES = [
  { value: 'lab_license',       label: 'Lab License' },
  { value: 'registration_cert', label: 'Registration Certificate' },
  { value: 'address_proof',     label: 'Address Proof' },
  { value: 'lab_photo',         label: 'Lab Photo' },
  { value: 'other',             label: 'Other' },
];

const getBaseUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:8000/api/`;
};
const API_URL = getBaseUrl();

/* ─── Reusable field component ────────────────────────────────────────── */
function Field({ icon: Icon, label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</label>}
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-500 transition-colors pointer-events-none z-10" />
        )}
        {children}
      </div>
      {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}
    </div>
  );
}

/* ─── Input wrapper ───────────────────────────────────────────────────── */
function Inp({ icon, ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-11 ${icon ? 'pl-10' : 'pl-4'} pr-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 transition-all ${props.className || ''}`}
    />
  );
}

/* ─── Step indicator ─────────────────────────────────────────────────── */
function StepDots({ step, total }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i < step ? 'bg-teal-500 w-6' : i === step - 1 ? 'bg-teal-500 w-4' : 'bg-slate-200 w-4'}`} />
      ))}
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Step {step} of {total}</span>
    </div>
  );
}

export default function Register() {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && userRole) {
      const paths = { ADMIN: '/admin', USER: '/patient', CLINIC: '/clinic', DOCTOR: '/doctor', LAB: '/lab' };
      navigate(paths[userRole] || '/');
    }
  }, [isAuthenticated, userRole, navigate]);

  /* ── State ─────────────────────────────────────────────────────────── */
  const [role, setRole]                 = useState('USER');
  const [step, setStep]                 = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [success, setSuccess]           = useState(false);
  const [documents, setDocuments]       = useState([]);
  const fileRef = useRef();

  const isPro = role === 'CLINIC' || role === 'LAB';
  const totalSteps = isPro ? 2 : 1;

  // Step 1 fields
  const [s1, setS1] = useState({ username: '', email: '', phone_number: '', password: '', confirm: '', age: '', gender: '' });
  // Step 2 fields
  const [s2, setS2] = useState({ entity_name: '', owner_name: '', license_no: '', address: '', city: '', pincode: '' });

  // Reset state on initial mount only
  useEffect(() => {
    setStep(1); 
    setError('');
    // Initial state is already empty, so we just clear errors/steps
  }, []);

  const changeRole = (r) => {
    setRole(r); setStep(1); setError('');
    setS1({ username: '', email: '', phone_number: '', password: '', confirm: '', age: '', gender: '' });
    setS2({ entity_name: '', owner_name: '', license_no: '', address: '', city: '', pincode: '' });
    setDocuments([]);
  };

  /* ── Document helpers ─────────────────────────────────────────────── */
  const docTypes = role === 'CLINIC' ? CLINIC_DOC_TYPES : LAB_DOC_TYPES;

  const addDocs = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(p => [...p, ...files.map(f => ({ file: f, docType: docTypes[0].value, id: Math.random().toString(36).slice(2) }))]);
    e.target.value = '';
  };

  /* ── Step 1 → Step 2 ─────────────────────────────────────────────── */
  const goNext = (e) => {
    e.preventDefault();
    setError('');
    if (!s1.username.trim()) { setError('Profile ID is required for login.'); return; }
    if (!s1.email.trim())    { setError('Email is required.'); return; }
    if (!s1.phone_number.trim()) { setError('Phone number is required.'); return; }
    if (s1.password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    if (s1.password !== s1.confirm) { setError('Passwords do not match.'); return; }
    setStep(2);
  };

  /* ── Final submit ─────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isPro) {
      if (!s2.entity_name.trim()) { setError(`${role === 'CLINIC' ? 'Clinic' : 'Lab'} name is required.`); return; }
      if (!s2.owner_name.trim())  { setError('Owner/Contact name is required.'); return; }
      if (!s2.license_no.trim())  { setError('License number is required.'); return; }
      if (!s2.city.trim())        { setError('City is required.'); return; }
      if (!s2.pincode.trim())     { setError('Pincode is required.'); return; }
      if (documents.length === 0) { setError('At least one verification document is required for admin approval.'); return; }
    }

    setLoading(true);
    try {
      const payload = {
        username: s1.username, email: s1.email, password: s1.password,
        phone_number: s1.phone_number, role,
        entity_name: s2.entity_name, owner_name: s2.owner_name, 
        license_no: s2.license_no, address: s2.address,
        city: s2.city, pincode: s2.pincode,
        age: s1.age ? parseInt(s1.age) : null,
        gender: s1.gender || null,
      };
      await api.post('users/auth/register/', payload);

      // Upload documents for CLINIC / LAB
      if (documents.length > 0 && isPro) {
        setUploadStatus('Authenticating...');
        const loginRes = await axios.post(`${API_URL}users/auth/login/`, {
          username: s1.username, password: s1.password,
        });
        const token = loginRes.data.access;

        setUploadStatus('Fetching profile...');
        const endpoint = role === 'CLINIC' ? 'users/clinics/' : 'users/labs/';
        const profRes = await axios.get(`${API_URL}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
        const entityId   = profRes.data?.[0]?.id;
        const entityType = role === 'CLINIC' ? 'clinic' : 'lab';

        if (entityId) {
          for (let i = 0; i < documents.length; i++) {
            setUploadStatus(`Uploading document ${i + 1} of ${documents.length}...`);
            const fd = new FormData();
            fd.append('entity_type', entityType);
            fd.append('entity_id', entityId);
            fd.append('document_type', documents[i].docType);
            fd.append('file', documents[i].file);
            await axios.post(`${API_URL}users/documents/`, fd, {
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
          }
        }
      }

      setSuccess(true);
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        const targetHost = window.location.hostname;
        setError(`Server unreachable. Please check if the backend is running at http://${targetHost}:8000`);
      } else if (err.response?.data) {
        const d = err.response.data;
        const msg = typeof d === 'object' ? Object.values(d).flat()[0] : d;
        setError(String(msg) || 'Registration failed. Please check your details.');
      } else {
        setError('Connection failed. Please check your network.');
      }
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  /* ── Success screen ───────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 p-12 max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-teal-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Account Created!</h2>
          {isPro ? (
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Your <strong>{role === 'CLINIC' ? 'clinic' : 'laboratory'}</strong> account is <strong>pending admin approval</strong>.
              {documents.length > 0 && ` ${documents.length} verification document${documents.length > 1 ? 's' : ''} uploaded.`}{' '}
              You'll be notified once approved.
            </p>
          ) : (
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Your patient account is ready. You can now sign in and book appointments.
            </p>
          )}
          {isPro && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-left flex gap-3">
              <ShieldCheck className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-amber-800 mb-0.5">Pending Admin Review</p>
                <p className="text-[11px] text-amber-600">Dashboard access is activated after document verification by an administrator.</p>
              </div>
            </div>
          )}
          <button onClick={() => navigate('/login')}
            className="w-full h-12 bg-[#002D33] hover:bg-teal-900 text-white rounded-xl font-black tracking-widest transition-all text-xs flex items-center justify-center gap-2 uppercase shadow-xl shadow-slate-900/10">
            Go to Sign In <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  /* ── Main layout ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/20 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col lg:flex-row">

        {/* ── Left brand panel ─────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-5/12 bg-[#002D33] p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,201,177,0.15),transparent_65%)]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600/5 rounded-full -ml-32 -mb-32 blur-3xl" />

          <div className="relative z-10">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 mb-12 group">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight">careN<span className="text-teal-400">connect</span></span>
            </Link>

            {/* Headline */}
            <div className="space-y-3 mb-10">
              <h1 className="text-3xl font-black leading-tight tracking-tight">
                Your health,<br />connected.
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Join thousands of patients, clinics and labs on a unified platform.
              </p>
            </div>

            {/* Role descriptions */}
            <div className="space-y-3">
              {[
                { icon: User,           color: 'bg-blue-500/20 text-blue-300',   title: 'Patients',    desc: 'Book appointments, view prescriptions' },
                { icon: Building2,      color: 'bg-teal-500/20 text-teal-300',   title: 'Clinics',     desc: 'Manage doctors and appointments' },
                { icon: ActivitySquare, color: 'bg-violet-500/20 text-violet-300', title: 'Labs',      desc: 'Upload and manage test results' },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-center gap-3 group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">{title}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="h-px bg-white/5 mb-5" />
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <span className="text-xs text-slate-400 font-medium">Secure · HIPAA-aligned · Encrypted</span>
            </div>
            <p className="text-[9px] text-slate-600 uppercase tracking-widest">© 2026 careNconnect Systems</p>
          </div>
        </div>

        {/* ── Right form panel ──────────────────────────────────────── */}
        <div className="w-full lg:w-7/12 p-8 lg:p-10 flex flex-col overflow-y-auto max-h-[90vh]">
          
          {/* Logo on mobile viewports */}
          <div className="lg:hidden mb-6 flex justify-center">
            <Link to="/" className="no-underline">
              <Logo size="md" variant="dark" />
            </Link>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h2>
              <StepDots step={step} total={totalSteps} />
            </div>
            <button onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-teal-600 transition-colors">
              <ArrowRight className="w-3 h-3 rotate-180" /> Home
            </button>
          </div>

          {/* Role tabs */}
          <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100 mb-6">
            {[
              { value: 'USER',  label: 'Patient',     icon: User },
              { value: 'CLINIC', label: 'Clinic',     icon: Building2 },
              { value: 'LAB',   label: 'Laboratory',  icon: ActivitySquare },
            ].map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => changeRole(value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  role === value
                    ? 'bg-white text-teal-600 shadow-sm border border-slate-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          {/* ════ STEP 1: Account Details ════ */}
          {step === 1 && (
            <form onSubmit={isPro ? goNext : handleSubmit} className="space-y-4">
              {/* hidden honeypots */}
              <input type="text" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" />
              <input type="password" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" />

              <div className="flex items-center gap-2 mb-1">
                <User className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Profile ID" icon={User}>
                  <Inp icon type="text" required placeholder="e.g. john_doe"
                    value={s1.username} onChange={e => setS1({ ...s1, username: e.target.value })}
                    autoComplete="username" />
                </Field>
                <Field label="Email Address" icon={Mail}>
                  <Inp icon type="email" required placeholder="you@example.com"
                    value={s1.email} onChange={e => setS1({ ...s1, email: e.target.value })}
                    autoComplete="email" />
                </Field>
              </div>

              <Field label="Phone Number" icon={Phone}>
                <Inp icon type="tel" required placeholder="+91 00000 00000"
                  value={s1.phone_number} onChange={e => setS1({ ...s1, phone_number: e.target.value })}
                  autoComplete="tel" />
              </Field>

              {role === 'USER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Age" icon={Hash}>
                    <Inp icon type="number" placeholder="Enter age"
                      value={s1.age} onChange={e => setS1({ ...s1, age: e.target.value })} />
                  </Field>
                  <Field label="Gender" icon={User}>
                    <select
                      value={s1.gender}
                      onChange={e => setS1({ ...s1, gender: e.target.value })}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 transition-all font-sans"
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </Field>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Password" icon={Lock}>
                  <Inp icon type={showPassword ? 'text' : 'password'} required placeholder="Min. 8 characters"
                    value={s1.password} onChange={e => setS1({ ...s1, password: e.target.value })}
                    autoComplete="new-password" className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>
                <Field label="Confirm Password" icon={ShieldCheck}>
                  <Inp icon type="password" required placeholder="Repeat password"
                    value={s1.confirm} onChange={e => setS1({ ...s1, confirm: e.target.value })} />
                </Field>
              </div>

              {/* Password hint */}
              <p className="text-[10px] text-slate-400 font-medium -mt-1">
                Must be at least 8 characters and not entirely numeric.
              </p>

              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="w-full h-12 bg-[#002D33] hover:bg-teal-900 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-900/10 hover:shadow-teal-900/20 active:scale-[0.98] disabled:opacity-60">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    : isPro ? <>Continue <ChevronRight className="w-4 h-4" /></>
                    : <>Create Account <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>

              <p className="text-center text-[11px] text-slate-400 pt-1">
                Already have an account?{' '}
                <Link to="/login" className="text-teal-600 font-black hover:underline">Sign In</Link>
              </p>
            </form>
          )}

          {/* ════ STEP 2: Professional + Documents ════ */}
          {step === 2 && isPro && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Org details */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {role === 'CLINIC' ? 'Clinic' : 'Laboratory'} Details
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={role === 'CLINIC' ? 'Clinic Name' : 'Laboratory Name'} icon={Building2}>
                      <Inp icon required placeholder={role === 'CLINIC' ? 'e.g. Sunrise Medical Center' : 'e.g. PathCare Diagnostics'}
                        value={s2.entity_name} onChange={e => setS2({ ...s2, entity_name: e.target.value })} />
                    </Field>
                    <Field label="Owner / Administrator Name" icon={User}>
                      <Inp icon required placeholder="Full Name"
                        value={s2.owner_name} onChange={e => setS2({ ...s2, owner_name: e.target.value })} />
                    </Field>
                  </div>

                  <div className="block">
                    <Field label="License Number" icon={Hash}>
                      <Inp icon required placeholder="e.g. LIC-XXXXXXXX"
                        value={s2.license_no} onChange={e => setS2({ ...s2, license_no: e.target.value })} />
                    </Field>
                  </div>

                  <Field label="Complete Address" icon={MapPin}>
                    <Inp icon required placeholder="Street address, locality..."
                      value={s2.address} onChange={e => setS2({ ...s2, address: e.target.value })} />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="City" icon={MapPin}>
                      <Inp icon required placeholder="Enter city"
                        value={s2.city} onChange={e => setS2({ ...s2, city: e.target.value })} />
                    </Field>
                    <Field label="Pincode" icon={Hash}>
                      <Inp icon required placeholder="6-digit Pincode"
                        value={s2.pincode} onChange={e => setS2({ ...s2, pincode: e.target.value })} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Document upload */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileUp className="w-3.5 h-3.5 text-teal-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Documents</span>
                  </div>
                  {documents.length === 0 ? (
                    <span className="text-[10px] text-red-500 font-semibold bg-red-50 px-2 py-1 rounded-lg border border-red-100 animate-pulse">
                      Required for Verification
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      Files Ready
                    </span>
                  )}
                </div>

                {/* Drop zone */}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 rounded-2xl p-6 flex flex-col items-center gap-2 text-slate-400 transition-all group">
                  <div className="w-10 h-10 bg-slate-50 group-hover:bg-teal-50 rounded-xl flex items-center justify-center transition-colors border border-slate-100 group-hover:border-teal-100">
                    <Upload className="w-5 h-5 group-hover:text-teal-500 transition-colors" />
                  </div>
                  <span className="text-xs font-black text-slate-500 group-hover:text-teal-600 transition-colors">Click to attach files</span>
                  <span className="text-[10px] text-slate-300 font-medium">PDF, JPG, PNG · Multiple allowed</span>
                </button>
                <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={addDocs} />

                {/* File list */}
                {documents.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id}
                        className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shrink-0 border border-teal-100">
                          <FileText className="w-4 h-4 text-teal-500" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{doc.file.name}</span>
                        <select value={doc.docType}
                          onChange={e => setDocuments(p => p.map(d => d.id === doc.id ? { ...d, docType: e.target.value } : d))}
                          className="h-7 px-2 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 shrink-0 font-sans">
                          {docTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <button type="button" onClick={() => setDocuments(p => p.filter(d => d.id !== doc.id))}
                          className="text-slate-300 hover:text-red-400 transition-colors shrink-0 ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-400 font-medium text-center pt-1">
                      {documents.length} file{documents.length > 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </div>

              {/* Step 2 actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setStep(1); setError(''); }}
                  className="h-12 px-5 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 h-12 bg-[#002D33] hover:bg-teal-900 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-60">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {uploadStatus || 'Creating account...'}</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Create Account</>
                  )}
                </button>
              </div>

              <p className="text-center text-[11px] text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-teal-600 font-black hover:underline">Sign In</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
