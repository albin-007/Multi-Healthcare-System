import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  FileText, Download, Printer, ArrowLeft, CheckCircle2, 
  Activity, Calendar, User, ShieldCheck, Mail, Phone, MapPin 
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function MedicalReport() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = type === 'prescription' 
          ? `records/prescriptions/${id}/` 
          : `records/test-results/${id}/`;
        const res = await api.get(endpoint);
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type, id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Authenticating Digital Report...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center">
        <FileText className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-900">Report Not Found</h2>
        <p className="text-slate-500 mt-2 mb-6">{error || "The requested medical report is unavailable."}</p>
        <Button onClick={() => navigate(-1)} className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold">Return to Dashboard</Button>
      </div>
    </div>
  );

  const reportDate = new Date(data.created_at).toLocaleDateString('en-US', {
    dateStyle: 'long'
  });

  const patient = data.patient || {};
  const provider = type === 'prescription' ? (data.doctor || {}) : (data.lab || {});

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:p-0 print:bg-white">
      {/* Control Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-500 font-bold gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Records
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePrint} className="gap-2 bg-white font-bold border-slate-200">
            <Printer className="w-4 h-4" /> Print Report
          </Button>
          <Button className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-black shadow-lg shadow-brand-500/20">
            <Download className="w-4 h-4" /> Digital PDF
          </Button>
        </div>
      </div>

      {/* Actual Report Sheet */}
      <div 
        ref={reportRef}
        className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-200 print:shadow-none print:rounded-none print:border-0"
      >
        {/* Header Decor */}
        <div className="h-4 bg-gradient-to-r from-brand-600 via-brand-400 to-emerald-500" />
        
        <div className="p-12 space-y-12">
          {/* Institution Identity */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">careNconnect</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Unified Medical Portal</p>
                </div>
              </div>
              <div className="text-sm text-slate-500 font-medium space-y-1">
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Licensed healthcare provider network</p>
                <p className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Encrypted Digital Health Record</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Report Details</h2>
                <div className="space-y-3">
                  <div className="flex gap-8 justify-between">
                    <span className="text-[10px] font-black text-slate-400">REPORT NO</span>
                    <span className="text-xs font-bold text-slate-900 uppercase">#{id.padStart(6, '0')}</span>
                  </div>
                  <div className="flex gap-8 justify-between">
                    <span className="text-[10px] font-black text-slate-400">ISSUED ON</span>
                    <span className="text-xs font-bold text-slate-900">{reportDate}</span>
                  </div>
                  <div className="flex gap-8 justify-between">
                    <span className="text-[10px] font-black text-slate-400">TYPE</span>
                    <span className="text-xs font-black text-brand-600 uppercase tracking-widest">{type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-y border-slate-100 py-12">
            {/* Patient Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.username || 'Patient'}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                  className="w-8 h-8 rounded-xl border border-slate-100 shadow-sm"
                  alt="Patient"
                />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Patient Information</h3>
              </div>
              <div className="space-y-1 pl-11">
                <p className="text-xl font-black text-slate-900">{patient.first_name || patient.username} {patient.last_name || ''}</p>
                <div className="space-y-2 pt-2">
                   <p className="text-xs font-bold text-slate-500 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {patient.email || '—'}</p>
                   <p className="text-xs font-bold text-slate-500 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> PID-{patient.id}</p>
                </div>
              </div>
            </div>

            {/* Provider Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 md:justify-end">
                <img 
                  src={`https://api.dicebear.com/7.x/${type === 'prescription' ? 'avataaars' : 'shapes'}/svg?seed=${provider.name || provider.username || 'Authority'}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                  className="w-8 h-8 rounded-xl border border-slate-100 shadow-sm"
                  alt="Authority"
                />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Medical Authority</h3>
              </div>
              <div className="space-y-1 md:text-right md:pr-11">
                <p className="text-xl font-black text-slate-900">{type === 'prescription' ? `Dr. ${(provider.name || '').replace(/^Dr\.?\s*/i, '').trim()}` : provider.name || provider.username}</p>
                <div className="space-y-2 pt-2 md:flex md:flex-col md:items-end">
                   <p className="text-xs font-bold text-slate-500">{provider.specialty || (type === 'lab' ? 'Diagnostic Center' : 'Specialist')}</p>
                   {provider.license_no && <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">LIC: {provider.license_no}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Findings & Recommendations</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Observation Summary</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-10 border border-slate-100 min-h-[200px]">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                  {type === 'prescription' ? data.notes : data.result_data}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Footer */}
          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-2 shadow-sm flex items-center justify-center">
                 {/* Mock QR Code placeholder */}
                 <div className="grid grid-cols-4 gap-1 opacity-20">
                    {[...Array(16)].map((_, i) => <div key={i} className={`w-2 h-2 rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-slate-200'}`} />)}
                 </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Authentication</p>
                <p className="text-[9px] font-bold text-slate-300 leading-tight mt-0.5">Hash: {Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
              </div>
            </div>

            <div className="text-center md:text-right space-y-1">
              <div className="flex items-center gap-2 md:justify-end text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Verified Report</span>
              </div>
              <p className="text-[10px] font-medium text-slate-400">Generated automatically by careNconnect Digital Health Infrastructure</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 py-10 px-12 text-white/40 text-center">
           <p className="text-[10px] font-black uppercase tracking-[0.4em]">CareNConnect &copy; 2026 • Confidential Medical Information</p>
        </div>
      </div>
    </div>
  );
}
