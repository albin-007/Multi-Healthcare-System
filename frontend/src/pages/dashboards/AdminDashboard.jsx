import { useState, useEffect } from 'react';

import {
  ShieldCheck, Activity, Users, CheckCircle2, Clock, AlertCircle,
  ArrowUpRight, ChevronRight, ActivitySquare, LogOut, ShieldAlert,
  Zap, LayoutDashboard, UserCog, FileSearch, MessageSquareWarning,
  Check, X, XCircle, Search, UserPlus, Trash2, Building2, FlaskConical,
  FileText, Eye, Download, Upload, Ban, Bell,
  IndianRupee, CalendarDays, Wallet, Briefcase
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';


// ── Reusable Status Badge ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${map[status] || 'bg-brand-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'APPROVED' ? 'bg-emerald-500' : status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'}`} />
      {status}
    </span>
  );
}

// ── Document Viewer Modal ────────────────────────────────────────────────────
function DocumentViewerModal({ documents, entityName, onClose }) {
  const [activeDoc, setActiveDoc] = useState(documents[0] || null);
  const docTypeLabels = {
    registration_cert: 'Registration Certificate',
    medical_license: 'Medical License',
    address_proof: 'Address Proof',
    identity_proof: 'Identity Proof',
    lab_license: 'Lab License',
    lab_photo: 'Lab Photo',
    other: 'Other Document',
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-md w-full shadow-2xl text-center">
          <FileText className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No Documents Uploaded</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mb-6">{entityName} has not uploaded any verification documents yet.</p>
          <Button onClick={onClose} className="w-full bg-slate-900 dark:bg-brand-600 text-white hover:bg-slate-800 dark:hover:bg-brand-700 rounded-xl font-black transition-all">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-brand-50 dark:border-slate-800 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white dark:text-white">Verification Documents</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">{entityName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-64 border-r border-brand-50 dark:border-slate-800 dark:border-slate-800 p-4 flex flex-col gap-2 overflow-y-auto shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 px-2 py-1 mb-1">Uploaded Files ({documents.length})</p>
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className={`w-full text-left p-3 rounded-2xl transition-all group ${activeDoc?.id === doc.id ? 'bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 border border-brand-200' : 'hover:bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 border border-transparent'}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeDoc?.id === doc.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-black truncate ${activeDoc?.id === doc.id ? 'text-brand-700' : 'text-slate-700'}`}>
                      {docTypeLabels[doc.document_type] || doc.document_type}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Viewer */}
          <div className="flex-1 bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 flex flex-col min-h-0">
            {activeDoc ? (
              <>
                <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-brand-50 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600 dark:text-teal-400" />
                    <span className="text-sm font-black text-slate-900 dark:text-white">{docTypeLabels[activeDoc.document_type] || activeDoc.document_type}</span>
                  </div>
                  <a
                    href={activeDoc.file_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-black hover:bg-brand-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
                <div className="flex-1 p-6 overflow-auto">
                  {activeDoc.file_url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                    <img
                      src={activeDoc.file_url}
                      alt={docTypeLabels[activeDoc.document_type]}
                      className="max-w-full max-h-full mx-auto rounded-2xl shadow-lg object-contain"
                    />
                  ) : activeDoc.file_url?.match(/\.pdf$/i) ? (
                    <iframe
                      src={activeDoc.file_url}
                      className="w-full h-full rounded-2xl border border-slate-200"
                      title={docTypeLabels[activeDoc.document_type]}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <FileText className="w-16 h-16 text-slate-300" />
                      <p className="text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-bold">Preview not available for this file type.</p>
                      <a
                        href={activeDoc.file_url}
                        download
                        className="px-6 py-3 bg-brand-600 text-white rounded-xl font-black text-sm hover:bg-brand-700 transition-colors"
                      >
                        Download to View
                      </a>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-bold">Select a document to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Entity Detail Modal ──────────────────────────────────────────────────────
function EntityDetailModal({ entity, entityType, onClose, onApprove, onReject, onViewDocs }) {
  const user = entity.admin_user;
  const isClinic = entityType === 'clinic';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-brand-600 to-teal-500 p-8 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white dark:bg-slate-900 dark:bg-slate-900/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 dark:bg-slate-900/20 backdrop-blur-sm flex items-center justify-center">
              {isClinic ? <Building2 className="w-8 h-8 text-white" /> : <FlaskConical className="w-8 h-8 text-white" />}
            </div>
            <div>
              <h3 className="text-2xl font-black">{entity.name}</h3>
              <p className="text-white/70 text-sm font-bold uppercase tracking-widest mt-1">
                {isClinic ? 'Clinic' : 'Laboratory'} Application
              </p>
            </div>
          </div>
          <div className="mt-6">
            <StatusBadge status={user?.status || 'PENDING'} />
          </div>
        </div>

        {/* Details */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Entity Name', value: entity.name },
              { label: isClinic ? 'Owner Name' : 'Contact Email', value: isClinic ? entity.owner_name : user?.email },
              { label: 'Username / Handle', value: user?.username },
              { label: 'Email', value: user?.email },
              { label: 'Phone', value: user?.phone_number || '—' },
              { label: 'Registration Date', value: entity.created_at ? new Date(entity.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—' },
            ].map((item, i) => (
              <div key={i} className="bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-1">{item.label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-white truncate">{item.value || '—'}</p>
              </div>
            ))}
          </div>

          {(entity.address || entity.description) && (
            <div className="space-y-3">
              {entity.address && (
                <div className="bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-1">Address</p>
                  <p className="text-sm font-medium text-slate-700">{entity.address}</p>
                </div>
              )}
              {entity.description && (
                <div className="bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-1">Description</p>
                  <p className="text-sm font-medium text-slate-700">{entity.description}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onViewDocs(entity)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-black text-sm hover:bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 flex items-center justify-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" /> View Documents ({entity.documents?.length || 0})
            </button>
            {user?.status === 'PENDING' && (
              <>
                <button
                  onClick={() => { onApprove(user.id); onClose(); }}
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => { onReject(user.id); onClose(); }}
                  className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white font-black text-sm hover:bg-rose-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-600/20"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Approval Card ─────────────────────────────────────────────────────────────
function ApprovalCard({ entity, entityType, onApprove, onReject, onViewDetails, onViewDocs, idx }) {
  const user = entity.admin_user;
  const isClinic = entityType === 'clinic';

  return (
    <div
      className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-brand-50 dark:border-slate-800 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-brand-200 hover:-translate-y-1 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 group-hover:bg-brand-600 transition-colors flex items-center justify-center shrink-0">
            {isClinic
              ? <Building2 className="w-5 h-5 text-brand-600 group-hover:text-white transition-colors" />
              : <FlaskConical className="w-5 h-5 text-brand-600 group-hover:text-white transition-colors" />}
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white dark:text-white text-base">{entity.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-bold mt-0.5">{user?.email}</p>
          </div>
        </div>
        <StatusBadge status={user?.status || 'PENDING'} />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {[
          { label: 'Phone', value: user?.phone_number || '—' },
          { label: 'Reg. Date', value: entity.created_at ? new Date(entity.created_at).toLocaleDateString('en-IN') : '—' },
          { label: 'Address', value: entity.address || '—', span: 2 },
        ].map((item, i) => (
          <div key={i} className={`bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 px-3 py-2.5 rounded-xl ${item.span ? `col-span-${item.span}` : ''}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-0.5">{item.label}</p>
            <p className="text-xs font-bold text-slate-700 truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Documents badge */}
      <button
        onClick={() => onViewDocs(entity)}
        className="w-full mb-3 flex items-center justify-between px-4 py-2.5 rounded-xl bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 hover:bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 hover:border-brand-200 border border-brand-50 dark:border-slate-800 dark:border-slate-800 transition-colors group/docs"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 group-hover/docs:text-brand-600" />
          <span className="text-xs font-black text-slate-600 group-hover/docs:text-brand-700">
            {entity.documents?.length || 0} Document{entity.documents?.length !== 1 ? 's' : ''} Uploaded
          </span>
        </div>
        <Eye className="w-3.5 h-3.5 text-slate-300 group-hover/docs:text-brand-500" />
      </button>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(entity)}
          className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[11px] font-black hover:bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" /> Details
        </button>
        {user?.status === 'PENDING' && (
          <>
            <button
              onClick={() => onApprove(user.id)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => onReject(user.id)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-black hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { setSubTabs, activeSubTab, setActiveSubTab } = useDashboard();
  const [activeApprovalFilter, setActiveApprovalFilter] = useState('pending_clinics');
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [approvalData, setApprovalData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [docViewEntity, setDocViewEntity] = useState(null);

  const { theme } = useTheme();


  const activeTab = activeSubTab || 'dashboard';

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };



  const fetchData = async () => {
    try {
      const [userRes, complaintRes, approvalRes, statsRes] = await Promise.all([
        api.get('users/profiles/'),
        api.get('users/complaints/'),
        api.get('users/approvals/'),
        api.get('users/admin-dashboard/'),
      ]);
      setUsers(userRes.data);
      setComplaints(complaintRes.data);
      setApprovalData(approvalRes.data);
      setDashboardStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const pendingCount = (approvalData?.pending_clinics?.length || 0) + (approvalData?.pending_labs?.length || 0);

  const unresolvedComplaintsCount = complaints.filter(c => !c.is_resolved).length;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ActivitySquare },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck, badge: pendingCount },
    { id: 'users', label: 'Users', icon: UserCog },
    { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning, badge: unresolvedComplaintsCount },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays },
    { id: 'revenue', label: 'Revenue', icon: Wallet },
  ];

  useEffect(() => {
    setSubTabs(tabs);
    if (!activeSubTab) setActiveSubTab('dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCount, unresolvedComplaintsCount]);

  const handleApprove = async (userId) => {
    try {
      await api.post(`users/profiles/${userId}/approve/`);
      showToast('✅ Entity approved successfully!', 'success');
      fetchData();
    } catch {
      showToast('Failed to approve. Please try again.', 'error');
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`users/profiles/${userId}/reject/`);
      showToast('❌ Entity rejected.', 'error');
      fetchData();
    } catch {
      showToast('Failed to reject. Please try again.', 'error');
    }
  };

  const resolveComplaint = async (complaintId) => {
    try {
      await api.post(`users/complaints/${complaintId}/resolve/`);
      fetchData();
    } catch (err) {
      console.error('Failed to resolve complaint', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Permanently delete this user and all their records?")) return;
    try {
      await api.delete(`users/profiles/${userId}/`);
      fetchData();
    } catch {
      showToast('Failed to delete user.', 'error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 border-4 border-brand-50 dark:border-slate-800/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">Loading Admin Console...</p>
      </div>
    </div>
  );

  const currentEntities = approvalData ? approvalData[activeApprovalFilter] || [] : [];
  const currentEntityType = activeApprovalFilter.includes('clinic') ? 'clinic' : 'lab';

  const filteredUsers = (users || []).filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvalFilters = [
    { id: 'pending_clinics', label: 'Pending Clinics', count: approvalData?.pending_clinics?.length, icon: Building2, color: 'amber' },
    { id: 'pending_labs', label: 'Pending Labs', count: approvalData?.pending_labs?.length, icon: FlaskConical, color: 'amber' },
    { id: 'approved_clinics', label: 'Approved Clinics', count: approvalData?.approved_clinics?.length, icon: Building2, color: 'emerald' },
    { id: 'approved_labs', label: 'Approved Labs', count: approvalData?.approved_labs?.length, icon: FlaskConical, color: 'emerald' },
    { id: 'rejected_clinics', label: 'Rejected Clinics', count: approvalData?.rejected_clinics?.length, icon: Building2, color: 'rose' },
    { id: 'rejected_labs', label: 'Rejected Labs', count: approvalData?.rejected_labs?.length, icon: FlaskConical, color: 'rose' },
  ];

  return (
    <div className="space-y-8 pb-10">
        <div className="space-y-8 flex-1">

          {/* ═══ DASHBOARD ═══════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Hero */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-brand-400 p-10 text-white shadow-2xl shadow-brand-600/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(0,200,177,0.08),transparent_60%)]" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-brand-teal text-[10px] font-black uppercase tracking-wider mb-8">
                    <Zap className="w-3.5 h-3.5" /> Live System Oversight
                  </div>
                  <h1 className="text-5xl font-black tracking-tight mb-4">
                    careNconnect <span className="text-brand-teal">Admin Center</span>
                  </h1>
                  <p className="text-brand-50/80 font-medium max-w-lg text-lg leading-relaxed">
                    Verify healthcare providers, manage platform resources, and monitor clinical network health through your unified command console.
                  </p>
                </div>
              </div>

              {/* Stats Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Total Users', val: dashboardStats?.stats?.total_users || 0, icon: Users, color: 'from-emerald-500 to-teal-600', trend: '+12%', trendColor: 'text-emerald-500' },
                  { label: 'Total Doctors', val: dashboardStats?.stats?.total_doctors || 0, icon: Briefcase, color: 'from-brand-600 to-brand-800', trend: '+5%', trendColor: 'text-brand-teal' },
                  { label: 'Total Clinics', val: dashboardStats?.stats?.total_clinics || 0, icon: Building2, color: 'from-violet-500 to-purple-600', trend: '+2', trendColor: 'text-violet-500' },
                  { label: 'Total Labs', val: dashboardStats?.stats?.total_labs || 0, icon: FlaskConical, color: 'from-amber-400 to-orange-500', trend: '+1', trendColor: 'text-amber-500' },
                  { label: 'Total Appts', val: dashboardStats?.stats?.total_appointments || 0, icon: CalendarDays, color: 'from-blue-500 to-indigo-600', trend: '+18%', trendColor: 'text-blue-500' },
                  { label: 'Total Lab Tests', val: dashboardStats?.stats?.total_lab_tests || 0, icon: Activity, color: 'from-rose-400 to-rose-600', trend: '+7%', trendColor: 'text-rose-500' },
                ].map((s, i) => (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    key={i} 
                    className="bg-white dark:bg-slate-900 border border-brand-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-brand-200 transition-all relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-6 shadow-lg shadow-black/10 text-white relative z-10`}>
                       <s.icon className="w-7 h-7" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-end justify-between">
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{s.val}</h3>
                        <span className={`text-[10px] font-black ${s.trendColor} bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg mb-1`}>{s.trend}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* System Health Indicator & AI Insight */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Health Status */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-brand-50 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 group-hover:scale-110 transition-all duration-700">
                     <Activity size={120} />
                  </div>
                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 animate-pulse">
                        <Activity size={24} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">System Health Indicator</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Status: Cluster Health Optimal</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                      Live
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                    {[
                      { label: 'API Gateway', val: '24ms', color: 'text-teal-500', desc: 'Latency (Avg)', status: 'Online' },
                      { label: 'Database Node', val: '12%', color: 'text-brand-600 dark:text-teal-400', desc: 'Query Load', status: 'Healthy' },
                      { label: 'Async Workers', val: 'Active', color: 'text-emerald-500', desc: 'Process Health', status: 'Optimal' }
                    ].map((h, i) => (
                      <div key={i} className="flex flex-col p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h.label}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                        <span className={`text-3xl font-black ${h.color} tracking-tight`}>{h.val}</span>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-[9px] text-slate-400 font-bold uppercase opacity-60">{h.desc}</p>
                          <p className="text-[8px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-widest">{h.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insight Card */}
                <div className="bg-gradient-to-br from-brand-teal to-brand-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-brand-teal/20 relative overflow-hidden flex flex-col justify-between group cursor-default">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider mb-6">
                      <Zap className="w-3.5 h-3.5 fill-current" /> AI Predictive Analytics
                    </div>
                    <h3 className="text-2xl font-black leading-tight mb-2">Peak Booking Window</h3>
                    <p className="text-white/80 text-sm font-medium">Platform activity peaks between <span className="text-white font-black">10:00 AM — 1:30 PM</span> weekdays.</p>
                  </div>
                  <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/60 mb-1">Recommendation</p>
                    <p className="text-xs font-bold leading-relaxed">Scale Node-2 instances during this window to maintain latency below 30ms.</p>
                  </div>
                </div>
              </div>

               {/* Data Visualization Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* User Distribution Chart */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-sm relative group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-50 dark:bg-violet-950/30 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400">
                        <Users size={20} />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">User Demographics</h3>
                    </div>
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
                      {['Doctors', 'Patients', 'Clinics'].map((l, idx) => (
                         <div key={l} className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-brand-900' : idx === 1 ? 'bg-brand-600' : 'bg-brand-teal'}`} />
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">{l}</span>
                         </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="h-[320px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Doctors', value: users.filter(u => u.role === 'DOCTOR').length || 15 },
                            { name: 'Patients', value: users.filter(u => u.role === 'USER').length || 65 },
                            { name: 'Clinics', value: users.filter(u => u.role === 'CLINIC').length || 10 },
                            { name: 'Labs', value: users.filter(u => u.role === 'LAB').length || 5 },
                          ]}
                          innerRadius={85}
                          outerRadius={115}
                          paddingAngle={10}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#1A3C34" className="hover:opacity-80 transition-opacity" />
                          <Cell fill="#3D7A68" className="hover:opacity-80 transition-opacity" />
                          <Cell fill="#00C9B1" className="hover:opacity-80 transition-opacity" />
                          <Cell fill="#A3CCBB" className="hover:opacity-80 transition-opacity" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '20px', 
                            border: 'none', 
                            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                            color: theme === 'dark' ? '#fff' : '#1A3C34',
                            padding: '12px 16px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
                       <motion.span 
                         initial={{ scale: 0.5, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.8 }}
                         className="text-5xl font-black text-slate-900 dark:text-white"
                        >
                          {users.length}
                        </motion.span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Souls</span>
                    </div>
                  </div>
                </div>

                {/* Activity Trend */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-brand-50 dark:border-slate-800 shadow-sm relative group overflow-hidden">
                   <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Zap size={20} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Platform Velocity</h3>
                  </div>

                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: 'Mon', val: 120 }, { name: 'Tue', val: 180 }, { name: 'Wed', val: 450 },
                        { name: 'Thu', val: 320 }, { name: 'Fri', val: 780 }, { name: 'Sat', val: 240 }, { name: 'Sun', val: 150 }
                      ]}>
                        <defs>
                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00C9B1" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#00C9B1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                        />
                        <Area 
                          activeDot={{ r: 8, strokeWidth: 0, fill: '#00C9B1' }}
                          type="monotone" 
                          dataKey="val" 
                          stroke="#00C9B1" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorVal)" 
                        />
                        <Tooltip cursor={{ stroke: '#00C9B1', strokeWidth: 1 }} content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             return (
                               <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{payload[0].payload.name}</p>
                                  <p className="text-lg font-black text-brand-teal">₹{payload[0].value}k <span className="text-[10px] opacity-80 text-white">Daily Volume</span></p>
                                </div>
                             );
                          }
                          return null;
                        }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            </div>
          )}




           {/* ═══ APPROVALS PIPELINE ═══════════════════════════════════════════ */}
          {activeTab === 'approvals' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50/50 dark:bg-brand-500/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/10 text-brand-600 text-[10px] font-black uppercase tracking-widest mb-4">
                    <ShieldCheck size={14} /> Security Pipeline
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Entity Verification Hub</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-base mt-2 max-w-xl">
                    Authorized oversight for medical facility registrations. Rigorous vetting of credentials ensures platform integrity.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center relative z-10">
                  {[
                    { label: 'Pending', count: (approvalData?.pending_clinics?.length || 0) + (approvalData?.pending_labs?.length || 0), color: 'bg-amber-500' },
                    { label: 'Total Scrutinized', count: Object.values(approvalData || {}).flat().length, color: 'bg-slate-200 dark:bg-slate-700' }
                  ].map((stat, i) => (
                    <div key={i} className="px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${stat.color} shadow-[0_0_12px_rgba(0,0,0,0.1)]`} />
                      <div className="leading-tight">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{stat.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Pipeline Navigation */}
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 p-2 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-brand-50 dark:border-slate-800 w-full shadow-sm">
                  {approvalFilters.map(f => {
                    const isActive = activeApprovalFilter === f.id;
                    const colorMap = {
                      amber: isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/5',
                      emerald: isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/5',
                      rose: isActive ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/5',
                    };
                    return (
                      <button
                        key={f.id}
                        onClick={() => setActiveApprovalFilter(f.id)}
                        className={`flex items-center justify-center w-full gap-3 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${colorMap[f.color] || ''} ${isActive ? 'scale-[1.02]' : 'opacity-70 hover:opacity-100'}`}
                      >
                        <f.icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                        {f.label}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          {f.count || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative min-h-[400px]">
                  <AnimatePresence mode="wait">
                    {currentEntities.length === 0 ? (
                      <motion.div 
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 py-32 text-center flex flex-col items-center gap-6"
                      >
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-700">
                          <CheckCircle2 size={48} />
                        </div>
                        <div>
                          <p className="text-xl font-black text-slate-900 dark:text-white">Pipeline Clean</p>
                          <p className="text-sm text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-widest">No requests pending in this category</p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key={activeApprovalFilter}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                      >
                        {currentEntities.map((entity, idx) => (
                          <ApprovalCard
                            key={entity.id}
                            entity={entity}
                            entityType={currentEntityType}
                            idx={idx}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onViewDetails={(e) => { setSelectedEntity(e); setSelectedEntityType(currentEntityType); }}
                            onViewDocs={setDocViewEntity}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {/* ═══ USERS ════════════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white dark:text-white tracking-tight">User Registry</h2>
                  <p className="text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage all registered platform users.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-500/10 focus:border-brand-50 dark:border-slate-800 w-72 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 rounded-2xl border border-brand-50 dark:border-slate-800 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="table-container no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-50 dark:bg-slate-950 dark:bg-slate-950/50 border-b border-brand-50 dark:border-slate-800 dark:border-slate-800">
                        {['Account Profile', 'Role', 'Status', 'Email', 'Registry ID', 'Actions'].map((h, i) => (
                          <th key={i} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ${h === 'Actions' ? 'sticky right-0 bg-brand-50 dark:bg-slate-950 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((u, idx) => (
                        <tr key={u.id} className="hover:bg-brand-50 dark:bg-slate-950 dark:bg-slate-950/20 transition-colors group animate-in fade-in duration-300" style={{ animationDelay: `${idx * 30}ms` }}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                                className="h-9 w-9 rounded-xl border border-brand-50 dark:border-slate-800 dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform"
                                alt={u.username}
                              />
                              <p className="font-black text-slate-900 dark:text-white dark:text-white text-sm">{u.username}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              u.role === 'ADMIN' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                              u.role === 'CLINIC' ? 'text-brand-600 bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 border-brand-100' :
                              u.role === 'DOCTOR' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                              u.role === 'LAB' ? 'text-violet-600 bg-violet-50 border-violet-100' :
                              'text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 bg-brand-50 dark:bg-slate-950 dark:bg-slate-950 border-slate-200'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={u.status} /></td>
                          <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-medium">{u.email}</td>
                          <td className="px-6 py-4 font-mono text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">#REG-{u.id.toString().padStart(5, '0')}</td>
                          <td className="px-6 py-4 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-brand-50 dark:group-hover:bg-slate-950 border-l border-brand-50 dark:border-slate-800 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] transition-colors">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {u.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleApprove(u.id)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors" title="Approve"><Check className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleReject(u.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors" title="Reject"><X className="w-3.5 h-3.5" /></button>
                                </>
                              )}
                              <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ COMPLAINTS ══════════════════════════════════════════════════ */}
          {activeTab === 'complaints' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white dark:text-white tracking-tight">Complaints</h2>
                <p className="text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Monitor and resolve user grievances.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {complaints.length > 0 ? complaints.map((c, idx) => (
                  <div key={c.id} className={`bg-white dark:bg-slate-900 dark:bg-slate-900 rounded-2xl border-l-4 ${c.is_resolved ? 'border-l-emerald-400' : 'border-l-rose-500'} border border-brand-50 dark:border-slate-800 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg transition-all animate-in fade-in duration-300`} style={{ animationDelay: `${idx * 60}ms` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className={`w-4 h-4 ${c.is_resolved ? 'text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400' : 'text-rose-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${c.is_resolved ? 'text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400' : 'text-rose-600'}`}>
                          {c.is_resolved ? 'Resolved' : 'Open'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white dark:text-white mb-2">{c.subject || 'Complaint'}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 font-medium leading-relaxed mb-4">"{c.description}"</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">From: {c.user_details?.username}</span>
                      {!c.is_resolved && (
                        <button onClick={() => resolveComplaint(c.id)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-600 transition-all">
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full bg-white dark:bg-slate-900 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                    <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-sm">No active complaints</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ APPOINTMENTS ══════════════════════════════════════════════════ */}
          {activeTab === 'appointments' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Appointments</h2>
                <p className="text-slate-400 dark:text-slate-500 font-medium text-sm mt-1">View all platform appointments and their current status.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="table-container no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-50 dark:bg-slate-950/50 border-b border-brand-50 dark:border-slate-800">
                        {['Patient', 'Entity', 'Date & Time', 'Status', 'Payment'].map((h, i) => (
                          <th key={i} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {dashboardStats?.recent_appointments?.map((a, idx) => (
                        <tr key={idx} className="hover:bg-brand-50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-sm text-slate-900 dark:text-white">{a.user_name}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{a.entity_name}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {new Date(a.date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${a.is_paid ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                              {a.is_paid ? 'PAID' : 'UNPAID'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!dashboardStats?.recent_appointments?.length && (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-slate-400">No appointments found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ REVENUE ═══════════════════════════════════════════════════════ */}
          {activeTab === 'revenue' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Revenue Management <span className="text-2xl">💰</span></h2>
                <p className="text-slate-400 dark:text-slate-500 font-medium text-sm mt-1">Track platform revenue, commissions, and recent transactions.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider mb-6">
                    <Wallet size={14} /> Platform Revenue
                  </div>
                  <h3 className="text-5xl font-black tracking-tight mb-2">
                    ₹{dashboardStats?.stats?.total_revenue?.toLocaleString() || 0}
                  </h3>
                  <p className="text-white/80 text-sm font-medium">Total volume processed through the platform.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-brand-50 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-50 dark:bg-brand-900/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase tracking-wider mb-6">
                      <Zap size={14} /> Commission Earned
                    </div>
                    <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                      ₹{dashboardStats?.stats?.commission_earned?.toLocaleString() || 0}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">10% platform fee from all successful transactions.</p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-8 mb-4">Transaction History</h3>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-50 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="table-container no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-50 dark:bg-slate-950/50 border-b border-brand-50 dark:border-slate-800">
                        {['Txn ID', 'User', 'Amount', 'Date', 'Method', 'Status'].map((h, i) => (
                          <th key={i} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {dashboardStats?.recent_payments?.map((p, idx) => (
                        <tr key={idx} className="hover:bg-brand-50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">{p.payment_id}</td>
                          <td className="px-6 py-4 font-bold text-sm text-slate-900 dark:text-white">{p.user_name}</td>
                          <td className="px-6 py-4 font-black text-brand-600 dark:text-teal-400">₹{p.amount}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {new Date(p.date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{p.method}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${p.status === 'SUCCESS' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : p.status === 'FAILED' ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!dashboardStats?.recent_payments?.length && (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-sm font-bold text-slate-400">No recent transactions found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedEntity && (
            <EntityDetailModal
              entity={selectedEntity}
              entityType={selectedEntityType}
              onClose={() => setSelectedEntity(null)}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewDocs={(entity) => {
                setDocViewEntity(entity);
                setSelectedEntity(null);
              }}
            />
          )}

          {docViewEntity && (
            <DocumentViewerModal
              documents={docViewEntity.documents || []}
              entityName={docViewEntity.name}
              onClose={() => setDocViewEntity(null)}
            />
          )}

          {toast.show && (
            <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 border-l-4 ${
              toast.type === 'success' ? 'bg-white dark:bg-slate-900 border-l-emerald-500 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 border-l-rose-500 text-rose-700 dark:text-rose-400'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'}`}>
                {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </div>
              <p className="font-extrabold text-sm">{toast.message}</p>
            </div>
          )}

        </div>
      </div>
    );

}
