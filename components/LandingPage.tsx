
import React, { useState, useEffect } from 'react';
import Hero3D from './Hero3D';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { AppView } from '../types';

const TypewriterText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (index < text.length) {
        setDisplayText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }
    }, 70);
    return () => clearTimeout(timeout);
  }, [index, text]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {displayText}
      {index < text.length && <span className="animate-pulse">|</span>}
    </motion.span>
  );
};

const LandingPage: React.FC = () => {
  const { setAuthModalOpen, user, setView } = useStore();

  const handleStart = () => {
    if (user) {
      setView(AppView.DASHBOARD);
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Hero3D />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-8xl font-heading font-bold mb-8 leading-tight tracking-tighter min-h-[160px] md:min-h-[220px]">
            <TypewriterText text="Elevate Your Learning" /><br />
            <span className="gradient-text">Beyond Reality</span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
          >
            ARISTO-তে আপনার বুদ্ধিমত্তা এবং AI-এর মেলবন্ধনে শুরু হোক এক নতুন পথচলা।
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 px-6"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className="w-full sm:w-auto px-12 py-5 bg-blue-600 rounded-[20px] font-black text-xl hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-3 group"
            >
              Start Learning Free
              <svg className="group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
