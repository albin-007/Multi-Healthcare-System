import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // Clear auth data
    logout();
    
    // Redirect straight to home page
    navigate('/');
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#f8fafc]">
      {/* Background Luxury Accents */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-50/50 rounded-full blur-[120px] -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-brand-50/50 rounded-full blur-[120px] -ml-40 -mb-40"></div>
      
      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_40px_100px_rgba(0,0,0,0.05)] rounded-[3rem] p-12 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-500 to-indigo-500"></div>
          
          <div className="mb-8 relative flex justify-center">
            <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-150 group-hover:scale-175 transition-transform duration-1000"></div>
            <div className="relative h-24 w-24 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl transition-transform hover:rotate-12 duration-500">
              <LogOut className="w-10 h-10" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Safely Signed Out</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Your session has ended successfully. Your medical data remains protected under our medical-grade encryption.
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100/60 flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" /> All sessions terminated
            </div>
            
            <Button 
              onClick={() => navigate('/')}
              size="lg"
              className="w-full bg-slate-900 hover:bg-brand-600 text-white rounded-2xl py-7 font-black text-lg shadow-xl hover:shadow-brand-500/20 transition-all group/btn"
            >
              Return to Home
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>

          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Healthcare Intelligence Suite &bull; v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
