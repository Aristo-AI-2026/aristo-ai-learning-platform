
import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { AppView } from '../types';

const NoteReader: React.FC = () => {
  const { notes, selectedNoteId, setView } = useStore();
  const note = notes.find(n => n.id === selectedNoteId);

  if (!note) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500 font-bold uppercase tracking-widest">নোটটি খুঁজে পাওয়া যায়নি।</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8"
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setView(AppView.RESOURCES)}
            className="w-12 h-12 flex items-center justify-center glass rounded-2xl hover:bg-white/10 transition-all text-blue-400 border-white/10"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Last Modified</span>
            <span className="text-xs font-bold text-blue-400">{new Date(note.lastModified).toLocaleDateString()}</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tighter text-white uppercase leading-none">
          {note.title}
        </h1>

        <div className="w-full h-px bg-gradient-to-r from-blue-600/50 to-transparent mb-4" />

        <div 
          className="prose prose-invert prose-blue max-w-none text-slate-300 text-lg md:text-xl leading-relaxed font-medium"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
        
        <div className="mt-20 pt-10 border-t border-white/5 flex justify-center">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[10px]">End of Research</p>
        </div>
      </motion.div>
    </div>
  );
};

export default NoteReader;
