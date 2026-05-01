import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import UserDashboard from './pages/dashboards/UserDashboard';
import ClinicDashboard from './pages/dashboards/ClinicDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import LabDashboard from './pages/dashboards/LabDashboard';
import BookAppointment from './pages/dashboards/BookAppointment';
import MedicalReport from './pages/MedicalReport';
import DashboardLayout from './components/layout/DashboardLayout';
import Logout from './pages/Logout';
import Home from './pages/Home';
import FindDoctors from './pages/FindDoctors';
import FindLabs from './pages/FindLabs';
import FindTests from './pages/FindTests';
import FindClinics from './pages/FindClinics';
import BackendHealthMonitor from './components/BackendHealthMonitor';
import { DashboardProvider } from './context/DashboardContext';
import { ThemeProvider } from './context/ThemeContext';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated, userRole } = useAuth();

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-surface-50 dark:bg-slate-950 transition-colors duration-500">
          <BackendHealthMonitor />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            
            {/* Protected Dashboards wrapped in DashboardLayout */}
            <Route element={<ProtectedRoute><DashboardProvider><DashboardLayout /></DashboardProvider></ProtectedRoute>}>
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/patient" element={<ProtectedRoute allowedRoles={['USER']}><UserDashboard /></ProtectedRoute>} />
              <Route path="/patient/book" element={<ProtectedRoute allowedRoles={['USER']}><BookAppointment /></ProtectedRoute>} />
              <Route path="/clinic" element={<ProtectedRoute allowedRoles={['CLINIC']}><ClinicDashboard /></ProtectedRoute>} />
              <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>} />
              <Route path="/lab" element={<ProtectedRoute allowedRoles={['LAB']}><LabDashboard /></ProtectedRoute>} />
            </Route>

            <Route path="/report/:type/:id" element={
              <ProtectedRoute><MedicalReport /></ProtectedRoute>
            } />

            {/* Root Application Pages - Publicly Viewable */}
            <Route path="/" element={<Home />} />
            <Route path="/find-doctors" element={<FindDoctors />} />
            <Route path="/find-labs" element={<FindLabs />} />
            <Route path="/find-tests" element={<FindTests />} />
            <Route path="/find-clinics" element={<FindClinics />} />
            
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-surface-50 dark:bg-slate-950">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-8 border-4 border-red-100 dark:border-red-500/20 animate-pulse">
                  <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Access Denied</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-md text-lg">You don't have the necessary permissions to access this page. This area is reserved for patients only.</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/" className="px-8 py-4 border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-slate-900 transition-all no-underline">
                    Back to Home
                  </Link>
                  <Link 
                    to={userRole === 'ADMIN' ? '/admin' : userRole === 'CLINIC' ? '/clinic' : userRole === 'DOCTOR' ? '/doctor' : userRole === 'LAB' ? '/lab' : '/patient'} 
                    className="px-8 py-4 bg-[#1A3C34] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-[#1A3C34]/20 no-underline"
                  >
                    Go to Your Dashboard
                  </Link>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}


export default App;
