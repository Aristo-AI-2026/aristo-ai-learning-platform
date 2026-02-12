
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';

const LanguageAcademy: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isListening, setIsListening] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
         <div className="inline-block px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[5px] mb-6">Linguistic Core</div>
         <h1 className="text-6xl md:text-8xl font-heading font-black uppercase tracking-tighter text-white mb-4">Language Academy</h1>
         <p className="text-slate-400 max-w-2xl mx-auto text-xl font-medium">Master any language with Aristo's neural tutoring system.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
         <div className="space-y-8 order-2 lg:order-1">
            <div className="glass p-12 rounded-[50px] border-white/5 flex flex-col items-center text-center">
               <div className="w-24 h-24 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 mb-8 border border-blue-500/20">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0V3m9 9H3"/></svg>
               </div>
               <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter text-white">AI Conversation Practice</h3>
               <p className="text-slate-400 mb-10 leading-relaxed font-medium">Speak naturally with "Mohashoy" in {selectedLanguage} to improve your fluency and cultural understanding.</p>
               
               <div className="flex gap-4 mb-8">
                  {['English', 'Bangla', 'French'].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLanguage === lang ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                    >
                      {lang}
                    </button>
                  ))}
               </div>

               <button 
                 onClick={() => setIsListening(!isListening)}
                 className={`px-12 py-6 rounded-[30px] font-black text-xl uppercase tracking-[6px] transition-all shadow-2xl ${isListening ? 'bg-red-600 animate-pulse text-white' : 'bg-blue-600 text-white shadow-blue-500/40 hover:bg-blue-500'}`}
               >
                 {isListening ? 'Stop Listening' : 'Start Session'}
               </button>
            </div>
         </div>

         <div className="space-y-8 order-1 lg:order-2">
            <div className="glass p-10 rounded-[45px] border-white/5">
               <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-8">Fluency Metrics</h4>
               <div className="space-y-8">
                  <MetricBar label="Pronunciation" value={82} color="bg-blue-500" />
                  <MetricBar label="Vocabulary Range" value={65} color="bg-indigo-500" />
                  <MetricBar label="Grammar Accuracy" value={74} color="bg-purple-500" />
                  <MetricBar label="Cultural Context" value={90} color="bg-green-500" />
               </div>
            </div>

            <div className="glass p-10 rounded-[45px] border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent">
               <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4">Daily Challenge</h4>
               <p className="text-slate-400 mb-6 font-medium italic">"Explain your research goals using 5 new academic idioms."</p>
               <button className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-white transition-colors">Accept Challenge →</button>
            </div>
         </div>
      </div>
    </div>
  );
};

const MetricBar = ({ label, value, color }: any) => (
  <div>
    <div className="flex justify-between text-[10px] font-black uppercase mb-2 text-slate-400">
      <span>{label}</span>
      <span className="text-white">{value}%</span>
    </div>
    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={`h-full ${color}`} 
      />
    </div>
  </div>
);

export default LanguageAcademy;
