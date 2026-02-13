
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

  // Extremely robust JSON extractor to handle any malformed or decorated AI responses
  const extractJSON = (text: string) => {
    if (!text) throw new Error("Empty response");
    try {
      // Step 1: Try direct parse
      const cleaned = text.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      // Step 2: Search for the JSON object manually
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          const substring = text.substring(firstBrace, lastBrace + 1);
          return JSON.parse(substring);
        } catch (innerE) {
          throw new Error("Could not extract valid JSON from response");
        }
      }
      throw new Error("No JSON structure detected in response");
    }
  };

  const generateContent = async (mode: ExplainerMode) => {
    const currentTopic = topicInputRef.current?.value.trim() || topic.trim();
    
    if (!currentTopic) {
      alert("অনুগ্রহ করে একটি টপিক লিখুন।");
      return;
    }

    setIsGenerating(true);
    setActiveMode(mode);
    setResult(null);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("Neural Link Offline: API Key missing in environment.");
      setIsGenerating(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are a core part of ARISTO AI Educational Platform.
IDENTITY & CREATOR: If asked who created you, respond ONLY in Bengali: "আমাকে তৈরি করেছে মোঃ শুভ আলী, তিনি এই ARISTO প্ল্যাটফর্মের প্রতিষ্ঠাতা। তাঁর লক্ষ্য শিক্ষার্থীদের জন্য একটি আধুনিক, AI-চালিত শিক্ষাব্যবস্থা গড়ে তোলা। আমি তাঁর সেই স্বপ্নের অংশীদার।"
Topic: ${currentTopic}
Language: ${language}
Selected Mode: ${mode === 'UNDERSTANDING' ? 'Explain for Understanding' : 'Write as Exam Answer'}

RULES:
- Respond ONLY with valid JSON. Do not include extra text.
- Headings MUST be bilingual (e.g., ভূমিকা | Introduction).
- If Explain mode: 700-1000 words, friendly tone.
- If Exam mode: 1200-1500 words, formal academic tone.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Provide a comprehensive ${mode === 'EXAM' ? 'university exam answer' : 'lesson'} on "${currentTopic}" in ${language}. Ensure the content is deep and thorough.` }] }],
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

      const data = extractJSON(response.text || '');
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Critical AI Error:", error);
      alert("Neural sync instability detected on Vercel. Please refine your topic or re-sync your connection.");
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
    const htmlContent = `
      <html><head><title>${result.title}</title><style>
        body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.8; color: #000; }
        h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 22pt; text-transform: uppercase; }
        h2 { border-bottom: 1px solid #777; margin-top: 30px; font-size: 16pt; }
        p { text-align: justify; font-size: 12pt; margin-bottom: 15px; }
        .summary { border: 1px solid #000; padding: 20px; margin-top: 30px; }
      </style></head><body>
        <h1>${result.title}</h1>
        ${result.sections.map(s => `<h2>${s.heading}</h2><p>${s.content}</p>`).join('')}
        <div class="summary">
          <p><strong>Summary:</strong> ${result.summary}</p>
          <p><strong>Conclusion:</strong> ${result.conclusion}</p>
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body></html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      const link = document.createElement('a');
      link.href = url; link.target = '_blank'; link.click();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 min-h-screen">
      <AnimatePresence>
        {saveSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 border border-green-500/30 px-6 py-3 rounded-full text-green-400 font-bold text-xs shadow-2xl">
            Success: Academic Data Synchronized
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button onClick={() => setView(AppView.DASHBOARD)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center glass rounded-xl text-blue-400 border-white/10 hover:bg-white/5 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-black uppercase text-white tracking-tighter">AI Concept Explainer</h1>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[3px]">Academic Node: Online</p>
          </div>
        </div>

        <div className="relative p-1 glass-dark border-white/5 rounded-xl flex items-center w-fit overflow-hidden">
          <motion.div layoutId="lang-bg" className="absolute h-[calc(100%-8px)] rounded-lg bg-blue-600 z-0" animate={{ left: language === 'Bangla' ? '4px' : 'calc(50% + 0px)', width: 'calc(50% - 4px)' }} />
          <button onClick={() => setLanguage('Bangla')} className={`relative z-10 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors ${language === 'Bangla' ? 'text-white' : 'text-slate-500'}`}>বাংলা</button>
          <button onClick={() => setLanguage('English')} className={`relative z-10 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors ${language === 'English' ? 'text-white' : 'text-slate-500'}`}>English</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4">
          <div className="glass p-6 md:p-8 rounded-[35px] border-white/10 bg-slate-900/60 shadow-2xl space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Research Topic</label>
              <input 
                ref={topicInputRef}
                type="text"
                defaultValue={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') generateContent('UNDERSTANDING'); }}
                placeholder="যেমন: ডিমান্ড অ্যান্ড সাপ্লাই"
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/60 transition-all placeholder:text-slate-800 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => generateContent('UNDERSTANDING')} 
                disabled={isGenerating} 
                className="py-4 rounded-xl font-black text-[9px] uppercase tracking-widest bg-blue-600 text-white disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-2 shadow-lg"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Explain
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => generateContent('EXAM')} 
                disabled={isGenerating} 
                className="py-4 rounded-xl font-black text-[9px] uppercase tracking-widest bg-indigo-600 text-white disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-2 shadow-lg"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Exam Mode
              </motion.button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!result && !isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[350px] glass rounded-[40px] border-white/5 border-dashed flex flex-col items-center justify-center text-center p-10 bg-slate-900/10">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-6 text-slate-700">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <h2 className="text-xl font-black text-slate-500 uppercase tracking-tighter">Academic Synthesis Ready</h2>
                <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mt-2">Enter topic to begin orchestration</p>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/10 rounded-full" />
                  <div className="absolute top-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase animate-pulse tracking-tighter">সংশ্লেষণ করা হচ্ছে...</h3>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[4px]">Generating ${activeMode} Content Protocol...</p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pb-20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/60 p-6 md:p-8 rounded-[35px] border border-white/10 shadow-3xl">
                  <h2 className="text-2xl md:text-3xl font-heading font-black uppercase text-white tracking-tighter leading-tight">{result.title}</h2>
                  <div className="flex gap-3">
                    <button onClick={downloadPDF} className="px-5 py-2 glass rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-300 border-white/10 hover:bg-white/10 transition-all">PDF</button>
                    <button onClick={handleSaveToNotes} disabled={isSaving} className="px-5 py-2 bg-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg transition-all">{isSaving ? 'Saving' : 'Save'}</button>
                  </div>
                </div>

                <div className="space-y-8">
                  {result.sections.map((section, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass p-8 md:p-12 rounded-[40px] border-white/5 bg-slate-900/40 border-l-[4px] border-l-blue-600 shadow-xl">
                      <h4 className="text-xl md:text-2xl font-black text-blue-400 mb-6 tracking-tight">{section.heading}</h4>
                      <p className="text-slate-300 font-medium text-base md:text-lg text-justify whitespace-pre-wrap leading-relaxed opacity-90">{section.content}</p>
                    </motion.div>
                  ))}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="glass p-8 rounded-[40px] border-white/5 bg-blue-600/5">
                        <h4 className="text-[9px] font-black uppercase text-blue-400 mb-5 tracking-[4px]">Key Insights</h4>
                        <ul className="space-y-3">
                          {result.keyPoints.map((p, i) => (
                            <li key={i} className="flex gap-3 text-slate-200 text-sm font-bold">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" /> {p}
                            </li>
                          ))}
                        </ul>
                     </div>
                     <div className="glass p-8 rounded-[40px] border-white/5 bg-slate-900/80">
                        <h4 className="text-[9px] font-black uppercase text-indigo-400 mb-5 tracking-[4px]">Summary</h4>
                        <p className="text-slate-200 italic font-medium leading-relaxed text-base mb-6">"{result.summary}"</p>
                        <div className="pt-6 border-t border-white/5">
                           <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-black tracking-widest">Final Conclusion</p>
                           <p className="text-sm text-slate-300 mt-2 leading-relaxed">{result.conclusion}</p>
                        </div>
                     </div>
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
