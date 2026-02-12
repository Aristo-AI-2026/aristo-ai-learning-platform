
import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useStore } from '../store';
import { AppView, User } from '../types';
import { supabase } from '../services/supabase';

const AuthModal: React.FC = () => {
  const { setAuthModalOpen, setUser, setView } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    whatsapp: '',
    institution: '',
    department: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      if (isLogin) {
        // LOGIN LOGIC
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (authError) throw authError;

        if (data.user) {
          const userObj: User = {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata.name || 'Scholar',
            gender: data.user.user_metadata.gender || 'other',
            whatsapp: data.user.user_metadata.whatsapp,
            institution: data.user.user_metadata.institution,
            department: data.user.user_metadata.department,
            isAdmin: data.user.email!.includes('admin'),
            bio: data.user.user_metadata.bio
          };
          setUser(userObj);
          setView(AppView.DASHBOARD);
        }
      } else {
        // SIGNUP LOGIC
        const { data, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              whatsapp: formData.whatsapp,
              institution: formData.institution,
              department: formData.department,
              bio: 'অ্যারিস্টো একাডেমিক স্কলার।'
            }
          }
        });

        if (authError) throw authError;

        if (data.user) {
          setSuccessMessage("অ্যারিস্টো-তে স্বাগতম! আপনার অ্যাকাউন্ট তৈরি হয়েছে। এখন ইমেইল এবং পাসওয়ার্ড দিয়ে লগইন করুন।");
          setIsLogin(true);
          setIsProcessing(false);
        }
      }
    } catch (err: any) {
      setError(err.message || "Neural link failed. Verify credentials.");
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Reset Protocol requires your email address.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
    if (error) setError(error.message);
    else alert(`Reset protocol initiated for ${formData.email}. Check your inbox.`);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => !isProcessing && setAuthModalOpen(false)}
        className="fixed inset-0" 
      />
      
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`relative w-full max-h-[95vh] overflow-y-auto overflow-x-hidden glass-dark rounded-[40px] md:rounded-[60px] p-6 md:p-12 border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.3)] scrollbar-hide transition-all duration-700 ${isLogin ? 'max-w-md' : 'max-w-2xl'}`}
      >
        <AnimatePresence>
          {isProcessing && (
            <motion.div 
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-1.5 bg-blue-500 shadow-[0_0_25px_rgba(59,130,246,1)] z-30 pointer-events-none opacity-80"
            />
          )}
        </AnimatePresence>

        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-[40px] md:rounded-t-[60px] sticky top-0 z-20" />
        
        <div style={{ transform: "translateZ(60px)" }} className="text-center mb-8 mt-4">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-[5px] mb-3">
            {isLogin ? 'Access Point' : 'Identity Protocol'}
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-black mb-2 tracking-tighter uppercase text-white">
            {isLogin ? 'Login' : 'Register Now'}
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{error}</span>
            </motion.div>
          )}
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 p-5 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-bold flex flex-col items-center text-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAuth} style={{ transform: "translateZ(40px)" }} className="space-y-6">
          <div className={`grid grid-cols-1 gap-6 ${isLogin ? '' : 'md:grid-cols-2'}`}>
            {!isLogin && (
              <div className="md:col-span-2">
                 <InputField 
                    label="Full Name" 
                    type="text" 
                    name="name"
                    placeholder="Your academic identity" 
                    autoComplete="name"
                    onChange={(v) => setFormData({...formData, name: v})} 
                 />
              </div>
            )}
            
            <InputField 
                label="Email Address" 
                type="email" 
                name="email"
                placeholder="name@nexus.com" 
                autoComplete={isLogin ? "username" : "email"}
                value={formData.email} 
                onChange={(v) => setFormData({...formData, email: v})} 
            />
            
            <div className="relative">
              <InputField 
                label="Secret Password" 
                type="password" 
                name="password"
                placeholder="••••••••" 
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={formData.password} 
                onChange={(v) => setFormData({...formData, password: v})} 
              />
              {isLogin && (
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="absolute right-0 top-0 text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Forgot?
                </button>
              )}
            </div>

            {!isLogin && (
              <>
                <InputField 
                    label="WhatsApp Number" 
                    type="tel" 
                    name="whatsapp"
                    placeholder="+880..." 
                    autoComplete="tel"
                    onChange={(v) => setFormData({...formData, whatsapp: v})} 
                />
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Institution" name="institution" type="text" placeholder="University / School" onChange={(v) => setFormData({...formData, institution: v})} />
                  <InputField label="Department" name="department" type="text" placeholder="Field of Study" onChange={(v) => setFormData({...formData, department: v})} />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <motion.button 
              type="submit"
              disabled={isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-5 rounded-[25px] font-black text-xl shadow-2xl transition-all uppercase tracking-[6px] text-white flex items-center justify-center gap-4 ${isProcessing ? 'bg-blue-800 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              {isProcessing ? 'SYNCHRONIZING' : (isLogin ? 'LOG IN' : 'SIGN UP')}
            </motion.button>
          </div>
        </form>

        <div style={{ transform: "translateZ(50px)" }} className="mt-10 text-center border-t border-white/5 pt-8 mb-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">
            {isLogin ? "No identity node?" : "Already recognized?"}
            <button 
              disabled={isProcessing}
              onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMessage(null); }} 
              className="ml-4 text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-8 decoration-2"
            >
              {isLogin ? 'Register Now' : 'Link Identity'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const InputField: React.FC<{ 
    label: string; 
    type: string; 
    name: string;
    placeholder: string; 
    autoComplete?: string;
    onChange: (v: string) => void; 
    value?: string 
}> = ({ label, type, name, placeholder, autoComplete, onChange, value }) => (
  <div className="flex flex-col gap-2 group w-full">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-blue-400 transition-colors">{label}</label>
    <div className="relative">
      <input 
        required
        type={type} 
        name={name}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-base focus:ring-2 focus:ring-blue-500/40 outline-none transition-all placeholder:text-slate-800 font-bold text-white shadow-inner"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

export default AuthModal;
