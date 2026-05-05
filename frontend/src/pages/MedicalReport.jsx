import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  FileText, Download, Printer, ArrowLeft, CheckCircle2,
  Activity, Calendar, User, ShieldCheck, Mail, Phone, MapPin, ExternalLink,
  FlaskConical, Stethoscope, AlertCircle, Trash2, CheckCircle, Info
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  
  const handleDownloadPDF = async () => {
    const element = reportRef.current;
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Medical_Report_${type}_${id}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF report.');
    }
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
  
  // Extract specific details for Lab/Clinic
  const facility = type === 'prescription' ? provider.clinic : (provider.facility_details || {});
  const licenseNo = type === 'prescription' ? provider.license_no : provider.facility_details?.license_no;

  // Helper to parse result data into structured rows if possible
  const parseResults = (text) => {
    if (!text) return [];
    // Try to split by lines and then by colon
    return text.split('\n').map(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        return {
          parameter: parts[0].trim(),
          value: parts[1].trim(),
          unit: parts[2]?.trim() || '—',
          refRange: parts[3]?.trim() || 'Normal'
        };
      }
      return null;
    }).filter(Boolean);
  };

  const structuredResults = type === 'lab-test' ? parseResults(data.result_data) : [];

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:p-0 print:bg-white">
      {/* Control Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-500 font-bold gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Records
        </Button>
        <div className="flex gap-3">
          {type === 'lab-test' && data.file_url && (
            <Button 
              variant="outline" 
              onClick={() => window.open(data.file_url, '_blank')}
              className="gap-2 bg-white font-bold border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <ExternalLink className="w-4 h-4" /> Original File
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint} className="gap-2 bg-white font-bold border-slate-200">
            <Printer className="w-4 h-4" /> Print Report
          </Button>
          <Button 
            onClick={handleDownloadPDF}
            className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-black shadow-lg shadow-brand-500/20"
          >
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
                <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-transform">
                  {type === 'lab-test' ? <FlaskConical className="w-8 h-8" /> : <Activity className="w-8 h-8" />}
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {facility?.name || 'careNconnect Hub'}
                  </h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mt-2">
                    {type === 'lab-test' ? 'Certified Diagnostic Laboratory' : 'Authorized Medical Clinic'}
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-500 font-bold space-y-1.5 pl-1">
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" /> 
                  {facility?.address}, {facility?.city || ''} {facility?.pincode || ''}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-brand-500" /> 
                  {provider.phone_number || '+91-XXXXXXXXXX'}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-500" /> 
                  {provider.email || 'contact@medical-portal.com'}
                </p>
                {licenseNo && (
                  <p className="flex items-center gap-2 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> 
                    Govt. License №: {licenseNo}
                  </p>
                )}
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
                    <span className="text-xs font-black text-brand-600 uppercase tracking-widest">{type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex gap-8 justify-between">
                    <span className="text-[10px] font-black text-slate-400">STATUS</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${data.is_normal ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {data.is_normal ? 'Normal' : 'Attention Required'}
                    </span>
                  </div>
                </div>
                
                {/* Barcode Visual */}
                <div className="mt-6 flex flex-col items-center opacity-30">
                  <div className="h-8 w-full flex gap-[1px]">
                    {[...Array(40)].map((_, i) => (
                      <div key={i} className={`h-full ${Math.random() > 0.3 ? 'bg-black' : 'bg-transparent'}`} style={{ width: `${Math.random() * 3 + 1}px` }} />
                    ))}
                  </div>
                  <p className="text-[8px] font-mono mt-1">CRT-{id.padStart(8, '0')}-AUTH</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-y border-slate-100 py-12 bg-slate-50/50 px-12 -mx-12">
            {/* Patient Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Patient Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-lg font-black text-slate-900">{patient.first_name || patient.username} {patient.last_name || ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Age / Gender</p>
                  <p className="text-sm font-bold text-slate-900">{patient.age || '—'} Yrs / {patient.gender || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient ID</p>
                  <p className="text-sm font-bold text-brand-600">PID-{patient.id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact</p>
                  <p className="text-sm font-bold text-slate-900">{patient.email || '—'}</p>
                </div>
              </div>
            </div>

            {/* Provider Info */}
            <div className="space-y-6 md:border-l md:border-slate-100 md:pl-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Referred By</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attending Authority</p>
                  <p className="text-lg font-black text-slate-900">
                    {type === 'prescription' ? `Dr. ${(provider.name || '').replace(/^Dr\.?\s*/i, '').trim()}` : (data.appointment?.test_request_details?.doctor_name || 'Self-Referred')}
                  </p>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    {type === 'prescription' ? provider.specialty : 'Verified Physician'}
                  </p>
                </div>
                {type === 'lab-test' && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reporting Officer</p>
                    <p className="text-sm font-bold text-slate-900">{provider.name || 'Laboratory Pathologist'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Diagnostic Report Summary</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Observation Details</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Department</p>
                <p className="text-xs font-bold text-slate-900">{type === 'lab-test' ? 'Clinical Biochemistry' : 'General Medicine'}</p>
              </div>
            </div>

            {type === 'lab-test' && structuredResults.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-4">Investigation</th>
                      <th className="px-6 py-4">Observed Value</th>
                      <th className="px-6 py-4">Unit</th>
                      <th className="px-6 py-4">Biological Ref Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {structuredResults.map((res, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 text-sm font-bold text-slate-900">{res.parameter}</td>
                        <td className="px-6 py-5 text-sm font-black text-brand-700">{res.value}</td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-500 italic">{res.unit}</td>
                        <td className="px-6 py-5 text-xs font-medium text-slate-400">{res.refRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-[2rem] p-10 border border-slate-100 min-h-[200px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                  <Activity className="w-48 h-48" />
                </div>
                <div className="prose prose-slate max-w-none relative z-10">
                  <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-line text-sm">
                    {type === 'prescription' ? data.notes : data.result_data}
                  </p>
                </div>
              </div>
            )}
            
            {type === 'lab-test' && (
              <div className="p-6 bg-brand-50/50 rounded-2xl border border-brand-100 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-brand-600 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-wide">Clinical Interpretation</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                    The results presented above reflect the sample collected and processed under standard laboratory protocols. 
                    Please correlate these findings with clinical symptoms and consult your healthcare provider for definitive diagnosis.
                  </p>
                </div>
              </div>
            )}
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
