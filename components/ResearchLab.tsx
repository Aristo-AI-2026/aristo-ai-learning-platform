
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';

const ResearchLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'citations' | 'plagiarism'>('analysis');
  const [inputText, setInputText] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
        <div>
           <div className="inline-block px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[5px] mb-4">Research Node</div>
           <h1 className="text-5xl font-heading font-black uppercase tracking-tighter text-white">Research Lab</h1>
           <p className="text-slate-400 mt-2 font-medium text-lg">Advanced synthesis and academic orchestration.</p>
        </div>
        
        <div className="flex bg-slate-900/60 p-1.5 rounded-[25px] border border-white/10 glass">
           {(['analysis', 'citations', 'plagiarism'] as const).map((t) => (
             <button
               key={t}
               onClick={() => setActiveTab(t)}
               className={`px-8 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <div className="glass p-10 rounded-[45px] border-white/5 bg-slate-950/20 min-h-[500px] flex flex-col">
               <h3 className="text-xl font-black mb-6 uppercase text-white">Input Workspace</h3>
               <textarea 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 className="flex-grow bg-transparent border-none focus:outline-none text-lg text-slate-300 placeholder:text-slate-800 leading-relaxed font-medium resize-none"
                 placeholder="Paste your research notes or paper text here for AI orchestration..."
               />
               <div className="mt-8 flex justify-end gap-4">
                  <button className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Clear Node</button>
                  <button className="px-10 py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:bg-blue-500 transition-all text-white">Analyze with Aristo</button>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="glass p-8 rounded-[40px] border-white/5">
               <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-6">Citation Generator</h4>
               <div className="space-y-4">
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold uppercase tracking-widest focus:outline-none">
                     <option>APA 7th Edition</option>
                     <option>MLA 9th Edition</option>
                     <option>Chicago Style</option>
                  </select>
                  <button className="w-full py-4 bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Generate Bibliography</button>
               </div>
            </div>

            <div className="glass p-8 rounded-[40px] border-white/5">
               <h4 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-6">Integrity Metrics</h4>
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase mb-2"><span>Originality Score</span><span>98%</span></div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[98%]" /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase mb-2"><span>Source Match</span><span>2%</span></div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[2%]" /></div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ResearchLab;
