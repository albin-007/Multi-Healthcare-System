import { useState, useEffect } from 'react';
import { X, Camera, Save, User, Mail, Phone, Calendar, Users, MapPin, Building2, Globe, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function ProfileEditModal({ isOpen, onClose, user, onUpdate }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    age: '',
    gender: '',
    // Facility specific fields
    name: '',
    address: '',
    pincode: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFacility = user?.role === 'CLINIC' || user?.role === 'LAB';

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        age: user.age || '',
        gender: user.gender || '',
        name: user.facility_details?.name || '',
        address: user.facility_details?.address || '',
        pincode: user.facility_details?.pincode || ''
      });
      setAvatarPreview(user.avatar_url);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const data = new FormData();
    
    // Clean and append data
    Object.keys(formData).forEach(key => {
      let value = formData[key];
      
      // Handle empty numeric fields for the backend
      if (key === 'age' && value === '') return;
      
      data.append(key, value);
    });

    if (avatar) {
      data.append('avatar', avatar);
    }

    try {
      const response = await api.patch('users/profiles/update_me/', data);
      onUpdate(response.data);
      onClose();
    } catch (err) {
      console.error("Profile Update Error:", err.response?.data);
      const errorData = err.response?.data;
      if (errorData && typeof errorData === 'object') {
        const fieldErrors = Object.entries(errorData)
          .map(([field, msgs]) => {
            const message = Array.isArray(msgs) ? msgs[0] : msgs;
            return `${field.replace('_', ' ')}: ${message}`;
          })
          .join(' | ');
        setError(fieldErrors || 'Failed to update profile');
      } else {
        setError(err.response?.data?.detail || 'An unexpected error occurred during update.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-brand-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-white tracking-tight italic">
                {isFacility ? 'Manage Facility Profile' : 'Edit Personal Profile'}
              </h2>
              <p className="text-brand-100 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-80">
                Updating: {user?.display_name || user?.username}
              </p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all relative z-10">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-10">
            <div className="grid lg:grid-cols-12 gap-10">
              {/* Left Column: Avatar & Map */}
              <div className="lg:col-span-4 space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="h-40 w-40 rounded-[2.5rem] overflow-hidden bg-brand-50 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-2xl">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-brand-600 dark:text-brand-400">
                          {isFacility ? <Building2 size={60} /> : <User size={60} />}
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-2 right-2 p-3 bg-brand-600 text-white rounded-2xl shadow-lg cursor-pointer hover:bg-brand-700 transition-all hover:scale-110 active:scale-95 border-2 border-white">
                      <Camera size={20} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    {isFacility ? 'Facility Brand Image' : 'Profile Picture'}
                  </p>
                </div>
              </div>

              {/* Right Column: Fields */}
              <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Common Fields */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                      {isFacility ? 'Official Facility Name' : 'First Name'}
                    </label>
                    <div className="relative">
                      {isFacility ? <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /> : <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
                      <input
                        type="text"
                        name={isFacility ? 'name' : 'first_name'}
                        value={isFacility ? formData.name : formData.first_name}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm font-black text-slate-900 dark:text-white"
                        placeholder={isFacility ? "Facility Name" : "First Name"}
                      />
                    </div>
                  </div>

                  {!isFacility && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm font-black text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Official Email (Gmail)</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm font-black text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm font-black text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {isFacility ? (
                    <>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Physical Address / Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm font-black text-slate-900 dark:text-white"
                            placeholder="Street, City, State"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Pincode</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm font-black text-slate-900 dark:text-white"
                            placeholder="6-digit PIN"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Age</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm font-black text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Gender</label>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm font-black text-slate-900 dark:text-white appearance-none"
                          >
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-[11px] font-black border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-14 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-black shadow-2xl shadow-brand-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Authorize & Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
