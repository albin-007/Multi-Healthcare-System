import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { HeartPulse, AlertCircle, Eye, EyeOff, ShieldCheck, Lock, ArrowRight, User } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const userRef = useRef();
  const passRef = useRef();

  // Redirect authenticated users silently
  useEffect(() => {
    if (isAuthenticated && userRole) {
      const paths = {
        'ADMIN': '/admin',
        'USER': '/patient',
        'CLINIC': '/clinic',
        'DOCTOR': '/doctor',
        'LAB': '/lab'
      };
      navigate(paths[userRole] || '/');
    }
  }, [isAuthenticated, userRole, navigate]);

  // Clear error on navigation
  useEffect(() => {
    setError('');
  }, [location.pathname]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Store current values before potentially clearing them
    const currentUsername = username;
    const currentPassword = password;

    try {
      const authRes = await api.post('users/auth/login/', { username: currentUsername, password: currentPassword });
      const userRes = await api.get('users/profiles/me/', {
        headers: { Authorization: `Bearer ${authRes.data.access}` }
      });

      const fullName = userRes.data.display_name || userRes.data.username;
      const role = userRes.data.role;
      const status = userRes.data.status;

      // Block pending/rejected clinic, lab, or doctor accounts
      const rolesRequiringApproval = ['CLINIC', 'LAB', 'DOCTOR'];
      if (rolesRequiringApproval.includes(role)) {
        if (status === 'PENDING') {
          setError('Your account is pending admin approval. You will be notified once verified.');
          setLoading(false);
          return;
        }
        if (status === 'REJECTED') {
          setError('Your registration was rejected by the administrator. Please contact support.');
          setLoading(false);
          return;
        }
      }

      login(authRes.data.access, authRes.data.refresh, role, fullName);

      console.log(`User ${fullName} logged in with role: ${role}`);
      
      const paths = {
        'ADMIN': '/admin',
        'USER': '/patient',
        'CLINIC': '/clinic',
        'DOCTOR': '/doctor',
        'LAB': '/lab'
      };
      
      navigate(paths[role] || '/');
      
    } catch (err) {
      console.error("Login verification failed:", err.response?.data || err);
      
      // Clear fields on error as requested
      setUsername('');
      setPassword('');

      if (err.response?.status === 401) {
        setError('Invalid username or password. Please check your credentials.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.code === 'ERR_NETWORK') {
        const targetHost = window.location.hostname;
        setError(`Server unreachable. Please ensure the backend is running at http://${targetHost}:8000`);
      } else {
        setError('Authentication service error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#00C9B1]/20">
      {/* Main Dual-Tone Card (Reduced to max-w-3xl) */}
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,42,51,0.15)] overflow-hidden flex flex-col md:flex-row min-h-[580px]">
        
        {/* Left Section: Brand Showcase (Dark) */}
        <div className="md:w-4/12 bg-[#002D33] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(0,201,177,0.12),transparent_70%)]"></div>
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2.5 group mb-12">
              <div className="bg-[#00C9B1] p-2 rounded-lg shadow-lg shadow-[#00C9B1]/20">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight">careN<span className="text-[#00C9B1]">connect</span></span>
            </Link>

            <div className="space-y-4">
              <h1 className="text-3xl font-black leading-tight tracking-tight">
                Access <br />
                your <br />
                portal.
              </h1>
              <p className="text-slate-300 text-sm font-medium leading-relaxed">
                Securely manage your medical records and life.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-6 mt-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#00C9B1] group-hover:border-[#00C9B1] transition-all">
                <ShieldCheck className="w-4 h-4 text-[#00C9B1]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs">Verified Auth</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Secure Node</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#00C9B1] group-hover:border-[#00C9B1] transition-all">
                <Lock className="w-4 h-4 text-[#00C9B1]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs">HIPAA Layer</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Data Protected</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            © 2026 careNconnect Systems.
          </div>
        </div>

        {/* Right Section: Sign In Form (Light) */}
        <div className="md:w-8/12 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h2>
              <p className="text-slate-500 font-medium text-xs mt-0.5">Access your medical consoles.</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/')} className="h-8 rounded-lg border border-slate-100 hover:bg-slate-50 gap-1.5 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
              <ArrowRight className="w-3 h-3 rotate-180" /> Home
            </Button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2.5 animate-in shake duration-500">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-[11px] font-bold text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#00C9B1] transition-colors" />
                <Input 
                  ref={userRef}
                  type="text" required value={username} onChange={(e) => setUsername(e.target.value)} 
                  className="h-12 pl-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white font-bold placeholder:text-slate-300 text-xs"
                  placeholder="Account Handle / Login ID"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#00C9B1] transition-colors" />
                <Input 
                  ref={passRef}
                  type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} 
                  className="h-12 pl-11 pr-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white font-bold placeholder:text-slate-300 text-xs"
                  placeholder="Master Password"
                  autoComplete="new-password"
                />
                <button 
                  type="button" 
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-[#00C9B1] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 h-4" /> : <Eye className="h-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button type="button" className="text-[10px] font-bold text-slate-400 hover:text-[#00C9B1] transition-colors">Forgot Password?</button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-slate-900 hover:bg-[#002D33] text-white rounded-xl shadow-lg shadow-slate-200/50 font-black uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 disabled:opacity-70 group flex items-center justify-center gap-2 text-xs"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Auth...
                  </div>
                ) : (
                  <>Authorize Entry <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 duration-300" /></>
                )}
              </button>
            </div>

            <div className="text-center pt-8">
               <span className="text-slate-400 text-[11px] font-medium">New to the network? </span>
               <Link to="/register" className="text-[#00C9B1] font-black text-[11px] hover:underline">Create Account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
