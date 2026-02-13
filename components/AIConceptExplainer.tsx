
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { AppView } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

interface Section {
  heading: string;
  content: string;
}

interface ConceptExplanation {
  title: string;
  sections: Section[];
  summary: string;
  keyPoints: string[];
  conclusion: string;
}

type ExplainerMode = 'UNDERSTANDING' | 'EXAM';

const AIConceptExplainer: React.FC = () => {
  const { setView, upsertNote, user } = useStore();
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<'Bangla' | 'English'>('Bangla');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMode, setActiveMode] = useState<ExplainerMode | null>(null);
  const [result, setResult] = useState<ConceptExplanation | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const topicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const generateContent = async (mode: ExplainerMode) => {
    const currentTopic = topicInputRef.current?.value.trim() || topic.trim();
    
    if (!currentTopic) {
      alert("অনুগ্রহ করে একটি টপিক লিখুন। (Please enter a topic)");
      return;
    }

    setIsGenerating(true);
    setActiveMode(mode);
    setResult(null);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("Neural Link Offline: API Key Missing.");
      setIsGenerating(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a core part of ARISTO AI Educational Platform.
You must strictly follow the selected mode instructions. Word counts and tone are mandatory.
Topic: ${currentTopic}
Language: ${language}
Selected Mode: ${mode === 'UNDERSTANDING' ? 'Explain for Understanding' : 'Write as Exam Answer'}

------------------------------------------------------------
IF MODE = "Explain for Understanding"
------------------------------------------------------------
Style: Friendly, patient, supportive teacher.
Goal: Student must truly understand in the simplest way.
Strict Rules:
- Use very simple, natural, conversational language. No academic jargon.
- Use daily life examples and comparisons. Feel like a real classroom.
- Structure (Mandatory bilingual titles):
  1. সহজ পরিচিতি | Simple Introduction
  2. আসল ধারণা সহজভাবে | Core Idea in Simple Words
  3. বাস্তব জীবনের উদাহরণ | Real-life Example
  4. ধাপে ধাপে বিশ্লেষণ | Step-by-step Breakdown
  5. কেন গুরুত্বপূর্ণ | Why It Matters
  6. ছোট সারাংশ | Simple Summary
- Length: 700–1000 words. Be deep but simple.
- Ask mini-questions like: "ভাবো তো...", "ধরো যদি..."

------------------------------------------------------------
IF MODE = "Write as Exam Answer"
------------------------------------------------------------
Style: Strict university-level academic writer.
Goal: High-scoring, full-mark exam script.
Strict Rules:
- Formal academic tone, structured paragraphs. No casual stories.
- Structure (Mandatory bilingual titles):
  1. ভূমিকা | Introduction
  2. সংজ্ঞা | Definition
  3. ঐতিহাসিক বা তাত্ত্বিক পটভূমি | Background / Theoretical Foundation
  4. বিস্তারিত আলোচনা | Detailed Discussion
  5. বিশ্লেষণাত্মক পর্যালোচনা | Analytical Evaluation
  6. প্রয়োগ বা উদাহরণ | Application / Example
  7. সমালোচনামূলক আলোচনা | Critical Discussion
  8. উপসংহার | Conclusion
- Length: 1200–1500 words. Provide massive depth.

------------------------------------------------------------
GENERAL RULES:
- Every heading MUST be bilingual (e.g., ভূমিকা | Introduction).
- Return ONLY valid JSON.
- If the topic is scientific include formulas. If philosophical include arguments.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: `Generate a comprehensive ${mode === 'EXAM' ? 'exam answer' : 'explanation'} for: "${currentTopic}" in ${language}. Ensure the length is met.` }] },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["heading", "content"]
                }
              },
              summary: { type: Type.STRING },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              conclusion: { type: Type.STRING }
            },
            required: ["title", "sections", "summary", "keyPoints", "conclusion"]
          }
        }
      });

      const text = response.text || '';
      const data = JSON.parse(text) as ConceptExplanation;
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Neural sync error: Failed to generate content. Please try a more specific topic or check connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToNotes = async () => {
    if (!result || !user) return;
    setIsSaving(true);
    
    const htmlContent = `
      <div style="font-family: 'Inter', sans-serif; line-height: 1.8; color: #1e293b;">
        <h1 style="color: #2563eb; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">${result.title}</h1>
        ${result.sections.map(section => `
          <h2 style="color: #1e40af; border-left: 6px solid #2563eb; padding-left: 15px; margin-top: 30px;">${section.heading}</h2>
          <p style="text-align: justify; font-size: 16px;">${section.content}</p>
        `).join('')}
        <h3 style="color: #4338ca;">মূল পয়েন্টসমূহ | Key Points</h3>
        <ul>${result.keyPoints.map(p => `<li style="margin-bottom: 8px;">${p}</li>`).join('')}</ul>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 15px; margin-top: 30px;">
          <p><strong>সারসংক্ষেপ | Summary:</strong> ${result.summary}</p>
          <p><strong>উপসংহার | Conclusion:</strong> ${result.conclusion}</p>
        </div>
      </div>
    `;

    await upsertNote({
      id: Date.now().toString(),
      title: `${result.title} (${activeMode === 'EXAM' ? 'Exam' : 'Explain'})`,
      content: htmlContent,
      lastModified: Date.now(),
      authorId: user.id
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const downloadPDF = () => {
    if (!result) return;
    
    // Stable Blob Method for mobile compatibility
    const htmlContent = `
      <html>
        <head>
          <title>${result.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Times New Roman', serif; padding: 50px; line-height: 1.8; color: #000; }
            h1 { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; text-transform: uppercase; font-size: 24pt; }
            h2 { color: #000; border-bottom: 1px solid #444; margin-top: 40px; font-size: 18pt; }
            p { text-align: justify; font-size: 13pt; margin-bottom: 15px; }
            .summary-box { border: 1.5px solid #000; padding: 20px; margin-top: 40px; border-radius: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>${result.title}</h1>
          ${result.sections.map(s => `<h2>${s.heading}</h2><p>${s.content}</p>`).join('')}
          <h2>মূল পয়েন্টসমূহ | Key Points</h2>
          <ul>${result.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
          <div class="summary-box">
            <p><strong>সারসংক্ষেপ | Summary:</strong> ${result.summary}</p>
            <p><strong>উপসংহার | Conclusion:</strong> ${result.conclusion}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 min-h-screen">
      <AnimatePresence>
        {saveSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 border border-green-500/30 px-6 py-3 rounded-full text-green-400 font-bold text-xs shadow-2xl">
            Success: Note Saved Successfully
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button onClick={() => setView(AppView.DASHBOARD)} className="w-12 h-12 flex items-center justify-center glass rounded-xl text-blue-400 border-white/10 hover:bg-white/5 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 className="text-3xl font-heading font-black uppercase text-white tracking-tighter">AI Concept Explainer</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px]">Academic logic protocol: ACTIVE</p>
          </div>
        </div>

        <div className="relative p-1.5 glass-dark border-white/5 rounded-2xl flex items-center w-fit overflow-hidden">
          <motion.div layoutId="lang-bg" className="absolute h-[calc(100%-12px)] rounded-xl bg-blue-600 z-0" animate={{ left: language === 'Bangla' ? '6px' : 'calc(50% + 0px)', width: 'calc(50% - 6px)' }} />
          <button onClick={() => setLanguage('Bangla')} className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${language === 'Bangla' ? 'text-white' : 'text-slate-500'}`}>বাংলা</button>
          <button onClick={() => setLanguage('English')} className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${language === 'English' ? 'text-white' : 'text-slate-500'}`}>English</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-[40px] border-white/10 bg-slate-900/60 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="space-y-6 relative z-10">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Research Topic</label>
                <input 
                  ref={topicInputRef}
                  type="text"
                  defaultValue={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') generateContent('UNDERSTANDING');
                  }}
                  placeholder="যেমন: ডিমান্ড অ্যান্ড সাপ্লাই"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/60 transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(37, 99, 235, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => generateContent('UNDERSTANDING')} 
                  disabled={isGenerating} 
                  className="w-full py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[3px] bg-blue-600 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  Explain Concept
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => generateContent('EXAM')} 
                  disabled={isGenerating} 
                  className="w-full py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[3px] bg-indigo-600 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  University Exam Mode
                </motion.button>
              </div>
            </div>
          </div>
          
          <div className="p-6 glass rounded-3xl border-white/5 bg-slate-900/20">
             <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Protocol Status</h4>
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                   <span className="text-slate-400">Word Count Engine</span>
                   <span className="text-blue-400">READY</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                   <span className="text-slate-400">Tone Synthesis</span>
                   <span className="text-indigo-400">DYNAMIC</span>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!result && !isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[500px] glass rounded-[50px] border-white/5 border-dashed flex flex-col items-center justify-center text-center p-10 bg-slate-900/10">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 text-slate-700">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter mb-2">Academic Core Idle</h2>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Enter a topic to begin synthesis protocol</p>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[500px] flex flex-col items-center justify-center text-center space-y-8">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-blue-500/20 rounded-full" />
                  <div className="absolute top-0 w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_40px_rgba(59,130,246,0.2)]" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-white uppercase animate-pulse tracking-tighter">অপেক্ষা করুন...</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[4px]">Applying ${activeMode} Mode Optimization...</p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 pb-20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/60 p-8 md:p-10 rounded-[45px] border border-white/10 shadow-3xl">
                  <h2 className="text-3xl md:text-4xl font-heading font-black uppercase text-white leading-tight tracking-tighter">{result.title}</h2>
                  <div className="flex gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={downloadPDF} 
                      className="px-8 py-3 glass rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 border-white/10 hover:bg-white/10"
                    >
                      Export PDF
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveToNotes} 
                      disabled={isSaving} 
                      className="px-8 py-3 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20"
                    >
                      {isSaving ? 'Saving' : 'Save as Note'}
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-12">
                  {result.sections.map((section, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="glass p-10 md:p-14 rounded-[50px] border-white/5 bg-slate-900/40 border-l-[6px] border-l-blue-600 shadow-xl"
                    >
                      <h4 className="text-2xl md:text-3xl font-black text-blue-400 mb-8 tracking-tight">{section.heading}</h4>
                      <p className="text-slate-300 font-medium text-lg md:text-xl text-justify whitespace-pre-wrap leading-relaxed opacity-90">{section.content}</p>
                    </motion.div>
                  ))}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass p-10 rounded-[50px] border-white/5 bg-blue-600/5"
                     >
                        <h4 className="text-[10px] font-black uppercase text-blue-400 mb-6 tracking-[5px]">Key Points | মূল পয়েন্ট</h4>
                        <ul className="space-y-4">
                          {result.keyPoints.map((p, i) => (
                            <li key={i} className="flex gap-4 text-slate-200 text-base md:text-lg font-bold">
                               <span className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 shrink-0" /> {p}
                            </li>
                          ))}
                        </ul>
                     </motion.div>
                     
                     <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass p-10 rounded-[50px] border-white/5 bg-slate-900/80"
                     >
                        <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-6 tracking-[5px]">Synthesis | সারসংক্ষেপ</h4>
                        <p className="text-slate-200 italic font-medium leading-relaxed text-lg md:text-xl mb-8">"{result.summary}"</p>
                        <div className="pt-8 border-t border-white/5">
                           <h4 className="text-[9px] font-black uppercase text-slate-500 mb-3 tracking-widest">Final Conclusion</h4>
                           <p className="text-sm md:text-base text-slate-400 leading-relaxed">{result.conclusion}</p>
                        </div>
                     </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AIConceptExplainer;
