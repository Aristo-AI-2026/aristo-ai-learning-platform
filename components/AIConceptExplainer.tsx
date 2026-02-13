
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
  const [level] = useState('Advanced');
  const [language, setLanguage] = useState<'Bangla' | 'English'>('Bangla');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMode, setActiveMode] = useState<ExplainerMode | null>(null);
  const [result, setResult] = useState<ConceptExplanation | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const generateContent = async (mode: ExplainerMode) => {
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    setIsGenerating(true);
    setActiveMode(mode);
    setResult(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("Neural Link Offline: API Key Missing. Please add API_KEY to Vercel Environment Variables.");
      setIsGenerating(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are part of ARISTO AI Educational Platform.
The user will select one of two modes: 1) Explain for Understanding, 2) Write as Exam Answer.
You MUST strictly follow the selected mode instructions.
Topic: ${topic}
Language: ${language}
Selected Mode: ${mode === 'UNDERSTANDING' ? 'Explain for Understanding' : 'Write as Exam Answer'}

------------------------------------------------------------
IF MODE = "Explain for Understanding"
------------------------------------------------------------
Style: Friendly teacher, simple natural language, daily life examples.
Structure (Bangla Title | English Title):
  1. সহজ পরিচিতি | Simple Introduction
  2. আসল ধারণা সহজভাবে | Core Idea
  3. বাস্তব জীবনের উদাহরণ | Real-life Example
  4. ধাপে ধাপে বিশ্লেষণ | Step-by-step Breakdown
  5. কেন গুরুত্বপূর্ণ | Why It Matters
  6. ছোট সারাংশ | Simple Summary
Length: 700-1000 words.

------------------------------------------------------------
IF MODE = "Write as Exam Answer"
------------------------------------------------------------
Style: Strict university academic writer, formal tone, structured paragraphs.
Structure (Bangla Title | English Title):
  1. ভূমিকা | Introduction
  2. সংজ্ঞা | Definition
  3. পটভূমি | Background
  4. বিস্তারিত আলোচনা | Detailed Discussion
  5. বিশ্লেষণাত্মক পর্যালোচনা | Analytical Evaluation
  6. প্রয়োগ | Application
  7. সমালোচনামূলক আলোচনা | Critical Discussion
  8. উপসংহার | Conclusion
Length: 1200-1500 words. Provide extreme depth.

Return ONLY a raw JSON object matching the requested schema. No backticks, no extra text.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Switched to Flash for faster processing on Vercel
        contents: { parts: [{ text: `Generate a high-density, structured academic ${mode === 'EXAM' ? 'exam answer' : 'explanation'} for the topic: "${topic}".` }] },
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

      let jsonStr = response.text || '{}';
      
      // Sanitizing JSON response in case markdown backticks are present
      jsonStr = jsonStr.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const data = JSON.parse(jsonStr) as ConceptExplanation;
      if (!data.title || !data.sections) throw new Error("Invalid schema received");
      
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Neural sync error: AI failed to process complex logic. Please check your internet or API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToNotes = async () => {
    if (!result || !user) return;
    setIsSaving(true);
    
    const htmlContent = `
      <div style="font-family: 'Inter', sans-serif; line-height: 1.8;">
        <h1 style="color: #3b82f6; text-transform: uppercase; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">${result.title}</h1>
        ${result.sections.map(section => `
          <h2 style="color: #2563eb; border-left: 5px solid #2563eb; padding-left: 15px; margin-top: 30px;">${section.heading}</h2>
          <p>${section.content}</p>
        `).join('')}
        <h2>মূল পয়েন্টসমূহ | Key Points</h2>
        <ul>${result.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
        <h2>সারসংক্ষেপ | Summary</h2>
        <p>${result.summary}</p>
        <h2>উপসংহার | Conclusion</h2>
        <p>${result.conclusion}</p>
      </div>
    `;

    await upsertNote({
      id: Date.now().toString(),
      title: `${result.title} (${activeMode === 'EXAM' ? 'Exam Mode' : 'Explain Mode'})`,
      content: htmlContent,
      lastModified: Date.now(),
      authorId: user.id
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const downloadPDF = () => {
    if (!result) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${result.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 25mm 20mm; color: #000; line-height: 1.7; font-size: 11pt; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .header-text { font-size: 14pt; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px; }
            h1 { font-size: 24pt; margin: 10px 0; text-align: center; text-transform: uppercase; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h2 { font-size: 14pt; border-bottom: 1px solid #3b82f6; padding-bottom: 5px; margin-top: 30px; font-weight: 800; color: #1e40af; }
            p { margin-bottom: 15px; text-align: justify; white-space: pre-wrap; }
            ul { margin-bottom: 20px; }
            li { margin-bottom: 8px; }
            @page { size: A4; margin: 20mm 0; }
            .footer { position: fixed; bottom: 10mm; left: 0; width: 100%; text-align: center; font-size: 9pt; color: #666; }
            .page-number:after { content: "Page " counter(page); }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-text">Created with ARISTO</div>
          </div>
          <h1>${result.title}</h1>
          ${result.sections.map(section => `
            <h2>${section.heading}</h2>
            <p>${section.content}</p>
          `).join('')}
          <h2>মূল পয়েন্টসমূহ | Key Points</h2>
          <ul>${result.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
          <h2>সারসংক্ষেপ | Summary</h2>
          <p>${result.summary}</p>
          <h2>উপসংহার | Conclusion</h2>
          <p>${result.conclusion}</p>
          <div class="footer"><span class="page-number"></span></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 750);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 min-h-screen">
      <AnimatePresence>
        {saveSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 border border-green-500/30 px-8 py-5 rounded-3xl shadow-2xl flex flex-col items-center gap-2 backdrop-blur-xl"
          >
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs">আপনার নোট সফলভাবে সেভ হয়েছে</h4>
            <p className="text-slate-500 text-[10px] font-bold">Your note has been saved successfully.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setView(AppView.DASHBOARD)} 
            className="w-12 h-12 flex items-center justify-center glass rounded-xl hover:bg-white/10 transition-all text-blue-400 border-white/10"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
          </motion.button>
          <div>
            <h1 className="text-3xl font-heading font-black mb-1 uppercase tracking-tighter text-white">AI Concept Explainer</h1>
            <p className="text-slate-400 text-sm font-medium italic">Advanced academic logic engine.</p>
          </div>
        </div>

        <div className="relative p-1 glass-dark border-white/5 rounded-2xl flex items-center w-fit overflow-hidden">
          <motion.div 
            layoutId="lang-bg"
            className="absolute h-[calc(100%-8px)] rounded-xl bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)] z-0"
            animate={{ 
              left: language === 'Bangla' ? '4px' : 'calc(50% + 0px)',
              width: 'calc(50% - 4px)'
            }}
          />
          <button 
            onClick={() => setLanguage('Bangla')}
            className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${language === 'Bangla' ? 'text-white' : 'text-slate-500 hover:text-white'}`}
          >
            বাংলা
          </button>
          <button 
            onClick={() => setLanguage('English')}
            className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${language === 'English' ? 'text-white' : 'text-slate-500 hover:text-white'}`}
          >
            English
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <motion.div className="glass p-8 rounded-[40px] border-white/10 bg-slate-900/40 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-500" />
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Topic</label>
                <input 
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Theory of Relativity"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-slate-800 shadow-inner"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => generateContent('UNDERSTANDING')}
                  disabled={isGenerating}
                  className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest text-white transition-all border border-blue-400/20 bg-gradient-to-br from-blue-600 to-blue-700 disabled:opacity-50`}
                >
                  বোঝার জন্য | Explain
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => generateContent('EXAM')}
                  disabled={isGenerating}
                  className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest text-white transition-all border border-purple-400/20 bg-gradient-to-br from-indigo-600 to-purple-700 disabled:opacity-50`}
                >
                  পরীক্ষার উত্তর | Exam Mode
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!result && !isGenerating && (
              <motion.div key="empty" className="h-[600px] glass rounded-[50px] border-white/5 border-dashed flex flex-col items-center justify-center text-center p-10">
                <div className="w-24 h-24 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 mb-6 animate-pulse shadow-lg border border-blue-500/10">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Academic Core Idle</h2>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Select a topic and processing mode to begin synthesis.</p>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div key="loading" className="h-[600px] flex flex-col items-center justify-center text-center space-y-8">
                 <div className="relative flex items-center justify-center">
                    <motion.div 
                      animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360], borderRadius: ["40%", "50%", "40%"] }} 
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-40 h-40 bg-blue-600/10 rounded-full border border-blue-500/20 shadow-[0_0_60px_rgba(37,99,235,0.2)]"
                    />
                    <div className="absolute w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-white animate-pulse">
                      অপেক্ষা করুন... আপনার উত্তর প্রস্তুত করা হচ্ছে
                    </h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[8px]">
                      Please wait… Generating your response
                    </p>
                    <div className="flex justify-center gap-2 mt-6">
                      <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                      <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                      <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                 </div>
              </motion.div>
            )}

            {result && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-[40px] border border-white/5 shadow-2xl">
                  <h2 className="text-3xl md:text-5xl font-heading font-black uppercase tracking-tighter text-white leading-tight">{result.title}</h2>
                  <div className="flex gap-3">
                    <button onClick={downloadPDF} className="px-6 py-3 glass rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-slate-300 border-white/10 transition-all flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      PDF
                    </button>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveToNotes} 
                      disabled={isSaving}
                      className="px-6 py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                      )}
                      Save Note
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-12">
                  {result.sections.map((section, idx) => (
                    <StreamingSection 
                      key={idx} 
                      title={section.heading} 
                      content={section.content} 
                      delay={idx * 0.15} 
                    />
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="glass p-8 rounded-[40px] border-white/5 bg-blue-600/5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 underline decoration-blue-500/40 underline-offset-8">মূল পয়েন্টসমূহ | Key Points</h4>
                      <ul className="space-y-4">
                        {result.keyPoints.map((point, i) => (
                          <li key={i} className="flex gap-4 items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(59,130,246,1)]" />
                            <span className="text-sm md:text-base font-bold text-slate-300 leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }} className="glass p-8 rounded-[40px] border-white/5 flex flex-col justify-center bg-slate-900/60">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 underline decoration-blue-500/40 underline-offset-8">সারসংক্ষেপ | Summary</h4>
                      <p className="text-xl md:text-2xl font-black text-white italic leading-tight tracking-tight">"{result.summary}"</p>
                      <div className="mt-8 pt-8 border-t border-white/5">
                         <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-3">উপসংহার | Conclusion</h4>
                         <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium">{result.conclusion}</p>
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

const StreamingSection: React.FC<{ 
  title: string; 
  content: string; 
  delay: number;
}> = ({ title, content, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 1, ease: "easeOut" }}
    className="glass p-10 md:p-14 rounded-[50px] border-white/5 bg-slate-900/40 relative overflow-hidden group shadow-2xl"
  >
    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600/20 group-hover:bg-blue-600 transition-all duration-500" />
    <h4 className="text-xl md:text-3xl font-black uppercase tracking-tight text-white mb-8 flex flex-col gap-3">
       <span className="text-blue-400">{title}</span>
       <motion.span 
         initial={{ width: 0 }}
         animate={{ width: 120 }}
         transition={{ delay: delay + 0.5, duration: 1.2 }}
         className="h-1 bg-blue-500/60 rounded-full" 
       />
    </h4>
    <div className="prose prose-invert max-w-none">
       <motion.p 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: delay + 0.3, duration: 1.5 }}
         className="text-slate-300 font-medium text-lg md:text-xl leading-relaxed text-justify whitespace-pre-wrap selection:bg-blue-500/40"
       >
         {content}
       </motion.p>
    </div>
  </motion.div>
);

export default AIConceptExplainer;
