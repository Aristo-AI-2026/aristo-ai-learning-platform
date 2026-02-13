
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

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("Neural Link Offline: API Key Missing.");
      setIsGenerating(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    // Constructing the strict system instruction based on user requirements
    const systemInstruction = `You are part of ARISTO AI Educational Platform.
The user will select one of two modes: 1) Explain for Understanding, 2) Write as Exam Answer.
You MUST strictly follow the selected mode instructions.
The writing style, tone, structure, and depth MUST be completely different for each mode.
Topic: ${currentTopic}
Language: ${language}
Selected Mode: ${mode === 'UNDERSTANDING' ? 'Explain for Understanding' : 'Write as Exam Answer'}

------------------------------------------------------------
IF MODE = "Explain for Understanding"
------------------------------------------------------------
Style: Friendly, patient teacher. Goal: Make the student truly understand in the simplest way.
Strict Rules:
- Use very simple, natural language. Avoid complex academic vocabulary.
- Do NOT write like an exam script or structure like a university answer.
- Make it feel like a real classroom explanation. Use daily life examples and comparisons.
- Break complex ideas into small steps. 
- Ask reflective mini-questions like: "ভাবো তো...", "ধরো যদি...", "এখন প্রশ্ন হলো..."
Structure (Use bilingual titles):
  1. সহজ পরিচিতি | Simple Introduction
  2. আসল ধারণা সহজভাবে | Core Idea in Simple Words
  3. বাস্তব জীবনের উদাহরণ | Real-life Example
  4. ধাপে ধাপে বিশ্লেষণ | Step-by-step Breakdown
  5. কেন গুরুত্বপূর্ণ | Why It Matters
  6. ছোট সারাংশ | Simple Summary
Length: Minimum 700–1000 words. Focus on clarity over complexity.

------------------------------------------------------------
IF MODE = "Write as Exam Answer"
------------------------------------------------------------
Style: Strict university-level academic writer. Goal: High-scoring, full-mark exam answer.
Strict Rules:
- Use formal academic tone and structured paragraphs.
- No storytelling or casual language. No oversimplified explanation.
- Include definitions, theoretical foundations, and analytical discussion.
- Structure:
  1. ভূমিকা | Introduction
  2. সংজ্ঞা | Definition
  3. ঐতিহাসিক বা তাত্ত্বিক পটভূমি | Background / Theoretical Foundation
  4. বিস্তারিত আলোচনা | Detailed Discussion
  5. বিশ্লেষণাত্মক পর্যালোচনা | Analytical Evaluation
  6. প্রয়োগ বা উদাহরণ | Application / Example
  7. সমালোচনামূলক আলোচনা | Critical Discussion
  8. উপসংহার | Conclusion
Length: Minimum 1200–1500 words. Must look like a university exam script.

------------------------------------------------------------
GENERAL RULES:
- Each heading MUST include both Bangla and English titles (e.g., ভূমিকা | Introduction).
- Return ONLY a raw JSON object matching the schema. No markdown blocks.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: `Generate the ${mode === 'EXAM' ? 'exam answer' : 'explanation'} for topic: "${currentTopic}".` }] },
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

      let jsonStr = response.text || '';
      jsonStr = jsonStr.trim();
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}') + 1;
      if (start !== -1 && end !== -1) {
        jsonStr = jsonStr.substring(start, end);
      }

      const data = JSON.parse(jsonStr) as ConceptExplanation;
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("AI Error:", error);
      alert("Neural sync error: Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToNotes = async () => {
    if (!result || !user) return;
    setIsSaving(true);
    
    const htmlContent = `
      <div style="font-family: 'Inter', sans-serif; line-height: 1.8;">
        <h1 style="color: #3b82f6; border-bottom: 2px solid #3b82f6;">${result.title}</h1>
        ${result.sections.map(section => `
          <h2 style="color: #2563eb; border-left: 5px solid #2563eb; padding-left: 10px;">${section.heading}</h2>
          <p>${section.content}</p>
        `).join('')}
        <h3>মূল পয়েন্টসমূহ | Key Points</h3>
        <ul>${result.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
        <p><strong>সারসংক্ষেপ | Summary:</strong> ${result.summary}</p>
        <p><strong>উপসংহার | Conclusion:</strong> ${result.conclusion}</p>
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
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${result.title}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }
            h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            h2 { color: #1e40af; border-bottom: 1px solid #ccc; margin-top: 30px; }
            p { text-align: justify; }
          </style>
        </head>
        <body>
          <h1>${result.title}</h1>
          ${result.sections.map(s => `<h2>${s.heading}</h2><p>${s.content}</p>`).join('')}
          <h2>মূল পয়েন্টসমূহ | Key Points</h2>
          <ul>${result.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
          <p><strong>সারসংক্ষেপ | Summary:</strong> ${result.summary}</p>
          <p><strong>উপসংহার | Conclusion:</strong> ${result.conclusion}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
          <button onClick={() => setView(AppView.DASHBOARD)} className="w-12 h-12 flex items-center justify-center glass rounded-xl text-blue-400 border-white/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 className="text-3xl font-heading font-black uppercase text-white">AI Concept Explainer</h1>
            <p className="text-slate-400 text-sm italic">Academic logic protocol active.</p>
          </div>
        </div>

        <div className="relative p-1 glass-dark border-white/5 rounded-2xl flex items-center w-fit overflow-hidden">
          <motion.div layoutId="lang-bg" className="absolute h-[calc(100%-8px)] rounded-xl bg-blue-600 z-0" animate={{ left: language === 'Bangla' ? '4px' : 'calc(50% + 0px)', width: 'calc(50% - 4px)' }} />
          <button onClick={() => setLanguage('Bangla')} className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest ${language === 'Bangla' ? 'text-white' : 'text-slate-500'}`}>বাংলা</button>
          <button onClick={() => setLanguage('English')} className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest ${language === 'English' ? 'text-white' : 'text-slate-500'}`}>English</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-[40px] border-white/10 bg-slate-900/40 shadow-2xl">
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Topic</label>
                <input 
                  ref={topicInputRef}
                  type="text"
                  defaultValue={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generateContent('UNDERSTANDING')}
                  placeholder="যেমন: ভাববাদ ও বাস্তববাদ"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => generateContent('UNDERSTANDING')} disabled={isGenerating} className="flex-1 py-4 rounded-2xl font-black text-[9px] uppercase bg-blue-600 text-white disabled:opacity-50">Explain</button>
                <button onClick={() => generateContent('EXAM')} disabled={isGenerating} className="flex-1 py-4 rounded-2xl font-black text-[9px] uppercase bg-indigo-600 text-white disabled:opacity-50">Exam Mode</button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!result && !isGenerating && (
              <div className="h-[500px] glass rounded-[50px] border-white/5 border-dashed flex flex-col items-center justify-center text-center p-10">
                <h2 className="text-xl font-black text-white uppercase mb-2">Academic Core Idle</h2>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Ready for synthesis</p>
              </div>
            )}

            {isGenerating && (
              <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <h3 className="text-2xl font-black text-white uppercase animate-pulse">অপেক্ষা করুন... উত্তর প্রস্তুত হচ্ছে</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Applying ${activeMode} Mode Protocols...</p>
              </div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-[40px] border border-white/5">
                  <h2 className="text-3xl font-heading font-black uppercase text-white leading-tight">{result.title}</h2>
                  <div className="flex gap-3">
                    <button onClick={downloadPDF} className="px-5 py-2 glass rounded-xl text-[10px] font-black uppercase text-slate-300">PDF</button>
                    <button onClick={handleSaveToNotes} disabled={isSaving} className="px-5 py-2 bg-blue-600 rounded-xl text-[10px] font-black uppercase text-white">{isSaving ? 'Saving' : 'Save Note'}</button>
                  </div>
                </div>

                <div className="space-y-10">
                  {result.sections.map((section, idx) => (
                    <div key={idx} className="glass p-10 rounded-[40px] border-white/5 bg-slate-900/40 border-l-4 border-l-blue-500">
                      <h4 className="text-2xl font-black text-blue-400 mb-6">{section.heading}</h4>
                      <p className="text-slate-300 font-medium text-lg text-justify whitespace-pre-wrap leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="glass p-8 rounded-[40px] border-white/5 bg-blue-600/5">
                        <h4 className="text-[10px] font-black uppercase text-blue-400 mb-4 tracking-widest">Key Points | মূল পয়েন্টসমূহ</h4>
                        <ul className="space-y-3">
                          {result.keyPoints.map((p, i) => (
                            <li key={i} className="flex gap-3 text-slate-300 text-sm font-bold">
                               <span className="text-blue-500">•</span> {p}
                            </li>
                          ))}
                        </ul>
                     </div>
                     <div className="glass p-8 rounded-[40px] border-white/5 bg-slate-900/60">
                        <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Summary | সারসংক্ষেপ</h4>
                        <p className="text-slate-300 italic font-medium leading-relaxed">"{result.summary}"</p>
                        <div className="mt-6 pt-6 border-t border-white/5">
                           <h4 className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-widest">Conclusion | উপসংহার</h4>
                           <p className="text-sm text-slate-400">{result.conclusion}</p>
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
