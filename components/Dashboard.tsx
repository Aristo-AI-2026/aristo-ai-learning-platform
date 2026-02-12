
import React from 'react';
import { useStore } from '../store';
import { AppView } from '../types';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const { setView, user, setAuthModalOpen, setVoiceActive } = useStore();

  const handleProtectedAction = (view: AppView, activateVoice: boolean = false) => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      // Set voice state before switching view
      setVoiceActive(activateVoice);
      setView(view);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16">
        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
           <div>
              <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tighter text-white mb-2 uppercase">
                Welcome, {user?.name.split(' ')[0] || 'Explorer'}
              </h1>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-[6px] flex items-center justify-center md:justify-start gap-4">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,1)]"></span>
                {user?.institution || 'Global Knowledge Core'}
              </p>
           </div>
        </div>
      </header>

      {/* Refined AI HUB Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="relative group mb-12 overflow-hidden rounded-[40px] md:rounded-[50px]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-900/10 to-transparent" />
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 blur-[80px] opacity-5 group-hover:opacity-15 transition-all duration-700" />
        <div className="relative glass p-10 md:p-16 border-white/5 flex flex-col items-center text-center gap-6 bg-slate-950/20">
           <div className="w-16 h-16 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center animate-pulse border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M12 8V4H8"/><path d="M2 14h2"/><path d="M20 14h2"/></svg>
           </div>
           <div className="max-w-3xl">
             <h2 className="text-3xl md:text-6xl font-heading font-black mb-4 tracking-tight leading-none uppercase text-white">
                ARISTO AI HUB
             </h2>
             <p className="text-sm md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
               আপনার ব্যক্তিগত এআই সহযোগী "অ্যারিস্টো" এর সাথে কথোপকথন শুরু করুন এবং যেকোনো গবেষণামূলক তথ্য তাৎক্ষণিক বিশ্লেষণ করুন।
             </p>
           </div>
           
           <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
             <button 
               onClick={() => handleProtectedAction(AppView.AI_HUB, false)}
               className="w-full sm:w-auto px-8 py-4 bg-blue-600 rounded-2xl font-black text-xs shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-3 uppercase tracking-[3px] group text-white border border-blue-400/20"
             >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
               Chat With Aristo
             </button>
             
             <button 
               onClick={() => handleProtectedAction(AppView.AI_HUB, true)}
               className="w-full sm:w-auto px-8 py-4 bg-blue-600 rounded-2xl font-black text-xs shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-3 uppercase tracking-[3px] group text-white border border-blue-400/20"
             >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
               Talk with Aristo
             </button>
           </div>
        </div>
      </motion.div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <ActionCard 
            title="Your Library" 
            desc="আপনার সকল একাডেমিক নোট এবং গবেষণাপত্র এক জায়গায় গুছিয়ে রাখুন।" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>} 
            onClick={() => handleProtectedAction(AppView.RESOURCES)} 
            isHighlight={true}
         />
         
         <ActionCard 
            title="Cover Page" 
            desc="১০০% প্রফেশনাল অ্যাসাইনমেন্ট কভার পেজ তৈরি করুন এবং পিডিএফ ডাউনলোড করুন।" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>} 
            onClick={() => handleProtectedAction(AppView.ASSIGNMENT_COVER)} 
            isHighlight={true}
         />

         <ActionCard 
            title="AI Explainer" 
            desc="যেকোনো জটিল কনসেপ্টকে AI-এর মাধ্যমে সহজ এবং সুন্দরভাবে বুঝে নিন।" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>} 
            onClick={() => handleProtectedAction(AppView.AI_EXPLAINER)} 
            isHighlight={true}
         />
      </div>
    </div>
  );
};

const ActionCard = ({ title, desc, icon, onClick, isHighlight = false }: any) => (
  <motion.div 
    whileHover={{ y: -6, backgroundColor: "rgba(255, 255, 255, 0.08)" }} 
    onClick={onClick} 
    className={`glass p-8 md:p-10 rounded-[35px] border-white/5 cursor-pointer transition-all group relative overflow-hidden flex flex-col items-start ${isHighlight ? 'bg-white/5' : ''}`}
  >
    <div className={`w-12 h-12 rounded-xl ${isHighlight ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-600/10 text-blue-500'} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-blue-500/10 shadow-lg shadow-blue-900/10`}>
      {icon}
    </div>
    <h3 className={`text-xl md:text-2xl font-black mb-3 uppercase tracking-tighter text-white ${isHighlight ? 'underline decoration-blue-500/40 decoration-2 underline-offset-4' : ''}`}>{title}</h3>
    <p className={`text-xs md:text-sm leading-relaxed font-medium ${isHighlight ? 'text-slate-300' : 'text-slate-500'} line-clamp-2`}>{desc}</p>
    
    <div className="mt-6 self-end opacity-0 group-hover:opacity-100 transition-opacity">
       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    </div>
  </motion.div>
);

export default Dashboard;
