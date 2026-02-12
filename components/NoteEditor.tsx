
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { AppView } from '../types';

const NoteEditor: React.FC = () => {
  const { upsertNote, user, setView, notes, selectedNoteId } = useStore();
  const [title, setTitle] = useState('নতুন নোট');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedNoteId) {
      const existingNote = notes.find(n => n.id === selectedNoteId);
      if (existingNote) {
        setTitle(existingNote.title);
        setNoteId(existingNote.id);
        if (editorRef.current) {
          editorRef.current.innerHTML = existingNote.content;
        }
      }
    } else {
      setTitle('নতুন নোট');
      const newId = Date.now().toString();
      setNoteId(newId);
      if (editorRef.current) {
        editorRef.current.innerHTML = ''; // Start empty for placeholder CSS
      }
    }
  }, [selectedNoteId, notes]);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const img = `<img src="${base64}" style="max-width: 100%; border-radius: 20px; margin: 24px 0; display: block; box-shadow: 0 10px 30px rgba(0,0,0,0.2);" />`;
        execCommand('insertHTML', img);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const finalId = noteId || Date.now().toString();
    const content = editorRef.current?.innerHTML || '';
    
    await upsertNote({
      id: finalId,
      title,
      content,
      lastModified: Date.now(),
      authorId: user.id
    });
    
    setTimeout(() => setIsSaving(false), 1500);
  };

  const exportPDF = () => {
    const content = editorRef.current?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: 'Inter', 'SolaimanLipi', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; }
              h1 { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; font-size: 28px; margin-bottom: 30px; font-weight: 800; color: #0f172a; }
              img { max-width: 100%; border-radius: 12px; margin: 20px 0; }
              p { margin-bottom: 15px; font-size: 16px; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div>${content}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 h-[calc(100vh-80px)] flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-grow w-full">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setView(AppView.RESOURCES)} 
            className="w-12 h-12 flex items-center justify-center glass rounded-xl hover:bg-white/10 transition-all text-blue-400 border-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
          </motion.button>
          <div className="flex-grow">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-lg md:text-xl font-heading font-black focus:outline-none w-full border-b-2 border-transparent focus:border-blue-500/30 pb-1 placeholder:text-slate-800 transition-all"
              placeholder="গবেষণার শিরোনাম..."
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportPDF}
            className="flex-1 lg:flex-none px-6 py-3 glass rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 flex items-center justify-center gap-2 border-white/5"
          >
            PDF
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 15px 30px rgba(37, 99, 235, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 lg:flex-none px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSaving ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'} text-white flex items-center justify-center gap-2`}
          >
            {isSaving ? "Saving..." : "Save Record"}
          </motion.button>
        </div>
      </div>

      <div className="flex-grow flex flex-col glass rounded-[30px] border-white/5 overflow-hidden shadow-2xl bg-slate-900/40">
        <div className="p-2 md:p-3 bg-white/5 border-b border-white/10 flex flex-wrap gap-2 items-center justify-between backdrop-blur-xl">
          <div className="flex flex-wrap gap-1 md:gap-2">
            <ToolbarButtonGroup>
              <ToolbarBtn onClick={() => execCommand('bold')} icon={<span className="font-bold">B</span>} />
              <ToolbarBtn onClick={() => execCommand('italic')} icon={<span className="italic font-serif">I</span>} />
            </ToolbarButtonGroup>
            <div className="w-px h-6 bg-white/10 my-auto" />
            <ToolbarButtonGroup>
              <ToolbarBtn onClick={() => execCommand('insertUnorderedList')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>} />
            </ToolbarButtonGroup>
          </div>
          <div className="flex items-center gap-2">
            <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={insertImage} />
            <motion.button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 md:px-4 md:py-2 flex items-center gap-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest"
            >
              Media
            </motion.button>
          </div>
        </div>

        <div 
          ref={editorRef}
          contentEditable
          spellCheck={false}
          data-placeholder="আপনার আজকের গবেষণার নোট এবং তথ্যসমূহ এখানে লিপিবদ্ধ করুন..."
          className="flex-grow p-8 md:p-16 focus:outline-none overflow-y-auto text-lg md:text-xl leading-relaxed text-slate-200 selection:bg-blue-500/30 font-medium whitespace-pre-wrap"
          style={{ minHeight: '300px' }}
        />
        
        <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
           <span>Academic Freedom Protocol</span>
           <span>অ্যারিস্টো ক্লাউড এডিটর</span>
        </div>
      </div>
    </div>
  );
};

const ToolbarButtonGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`flex bg-white/5 rounded-lg p-0.5 border border-white/5 ${className || ''}`}>
    {children}
  </div>
);

const ToolbarBtn: React.FC<{ onClick: () => void; icon: React.ReactNode; active?: boolean }> = ({ onClick, icon, active }) => (
  <motion.button
    whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`w-9 h-9 flex items-center justify-center rounded-md transition-all ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
  >
    {icon}
  </motion.button>
);

export default NoteEditor;
