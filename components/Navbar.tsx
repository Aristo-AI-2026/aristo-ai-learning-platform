
import React, { useState } from 'react';
import { useStore } from '../store';
import { AppView } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { currentView, setView, user, logout, setAuthModalOpen } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Explore', view: AppView.LANDING },
    { label: 'Studio', view: AppView.DASHBOARD },
    { label: 'AI Hub', view: AppView.AI_HUB },
    { label: 'Library', view: AppView.RESOURCES },
  ];

  if (user?.isAdmin) {
    navItems.push({ label: 'Admin', view: AppView.ADMIN });
  }

  const handleNavClick = (view: AppView) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-[100] px-4 md:px-6 py-4 glass-dark border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative z-[110]">
        {/* Futuristic Aesthetic Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setView(AppView.LANDING)}
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-10 h-10 md:w-11 md:h-11 bg-slate-900 rounded-xl flex items-center justify-center border border-white/10 shadow-2xl group-hover:rotate-6 transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
                <path d="M12 2L2 19.5H22L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6L5.5 17.5H18.5L12 6Z" fill="currentColor" fillOpacity="0.2"/>
                <circle cx="12" cy="13" r="2" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <span className="text-2xl md:text-3xl font-heading font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Aristo
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.view)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                currentView === item.view 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setView(AppView.PROFILE)}
                className="hidden md:flex flex-col items-end group"
               >
                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-blue-300">{user.name}</span>
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Academic Status: Online</span>
               </button>
               <button 
                 onClick={handleLogout}
                 className="px-6 py-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
               >
                 Logout
               </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20"
            >
              Join
            </button>
          )}
          
          <button 
            className="md:hidden p-2 text-slate-400"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-slate-950 border-b border-white/5 p-6 md:hidden z-[105] backdrop-blur-3xl"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.view)}
                  className="text-left py-4 px-4 rounded-xl text-xl font-heading font-bold flex items-center justify-between group hover:bg-white/5"
                >
                  {item.label}
                  <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              ))}
              {user && (
                <button
                  onClick={() => handleNavClick(AppView.PROFILE)}
                  className="text-left py-4 px-4 rounded-xl text-xl font-heading font-bold hover:bg-white/5"
                >
                  My Profile
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
