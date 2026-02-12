
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { AppView } from '../types';

const ResourceHub: React.FC = () => {
  const { resources, addResource, deleteResource, updateResourceName, user, setAuthModalOpen, setView, notes, deleteNote, editNote, readNote } = useStore();
  const [dragActive, setDragActive] = useState(false);
  const [tab, setTab] = useState<'library' | 'notes'>('library');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleAction = (callback: () => void) => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      callback();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        addResource({
          id: Date.now().toString(),
          name: file.name,
          type: file.type.includes('pdf') ? 'pdf' : 'video',
          url: base64,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: Date.now()
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleAction(() => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          addResource({
            id: Date.now().toString(),
            name: file.name,
            type: file.type.includes('pdf') ? 'pdf' : 'video',
            url: base64,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            uploadedAt: Date.now()
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-heading font-black mb-1">Academic Library</h1>
          <p className="text-slate-400 text-sm font-medium">Manage your research assets and study records.</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setTab('library')}
            className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'library' ? 'bg-blue-600 shadow-xl text-white' : 'text-slate-500 hover:text-white'}`}
          >
            Resources
          </button>
          <button 
            onClick={() => setTab('notes')}
            className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'notes' ? 'bg-blue-600 shadow-xl text-white' : 'text-slate-500 hover:text-white'}`}
          >
            Notes ({notes.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'library' ? (
          <motion.div key="lib" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div 
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              className={`mb-10 border-2 border-dashed rounded-[30px] p-8 flex flex-col items-center justify-center transition-all ${dragActive ? 'border-blue-500 bg-blue-500/10 scale-[0.99]' : 'border-white/10 bg-white/5'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Upload research materials</h3>
              <p className="text-slate-500 text-xs font-medium">PDFs, lecture videos or academic documents</p>
              <input type="file" className="hidden" id="file-upload" onChange={handleFileUpload} />
              <label htmlFor="file-upload" className="mt-6 px-8 py-3 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">
                Browse Files
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {resources.map((res) => (
                <ResourceCard key={res.id} res={res} onDelete={() => deleteResource(res.id)} onRename={(name) => updateResourceName(res.id, name)} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex justify-end mb-8">
               <button 
                 onClick={() => handleAction(() => editNote(null))}
                 className="px-6 py-3 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/30 flex items-center gap-2"
               >
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                 New Note
               </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {notes.map((note) => (
                <div key={note.id} className="glass p-4 rounded-2xl border-white/10 group hover:border-blue-500/40 transition-all relative overflow-hidden flex flex-col gap-3">
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deleteNote(note.id)} className="text-red-400 hover:text-red-300">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                   </div>
                   <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                   </div>
                   <h3 className="text-xs font-bold truncate text-slate-200">{note.title}</h3>
                   
                   <div className="flex flex-col gap-1.5 mt-auto">
                     <button 
                       onClick={() => readNote(note.id)}
                       className="w-full py-2 bg-blue-600/10 rounded-lg text-blue-400 text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-500/10"
                     >
                       Read
                     </button>
                     <button 
                       onClick={() => editNote(note.id)}
                       className="w-full py-2 bg-white/5 rounded-lg text-slate-500 text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                     >
                       Edit
                     </button>
                   </div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="col-span-full py-20 text-center glass rounded-[30px] border-dashed border-white/5">
                   <p className="text-slate-600 text-[10px] font-black uppercase tracking-[5px]">Empty Notebook</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ResourceCard = ({ res, onDelete, onRename }: any) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(res.name);

  // Sync state if prop changes from store
  useEffect(() => {
    setNewName(res.name);
  }, [res.name]);

  const openResource = () => {
    try {
      const parts = res.url.split(';base64,');
      if (parts.length < 2) throw new Error("Invalid resource URL");
      
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      const blob = new Blob([uInt8Array], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      
      const win = window.open();
      if (win) {
        win.location.href = blobUrl;
      } else {
        alert("Pop-up blocked. Please allow pop-ups for this site.");
      }
    } catch (e) {
      console.error("Resource Access Error:", e);
      window.open(res.url);
    }
  };

  const submitRename = () => {
    if (newName.trim() && newName !== res.name) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitRename();
    } else if (e.key === 'Escape') {
      setNewName(res.name);
      setIsRenaming(false);
    }
  };

  return (
    <motion.div layout className="glass p-3 rounded-2xl border-white/10 group hover:border-blue-500/30 transition-all flex flex-col h-full">
      <div className="aspect-square rounded-xl bg-slate-900 mb-3 flex items-center justify-center border border-white/5 relative overflow-hidden shrink-0">
         <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={res.type === 'pdf' ? '#ef4444' : '#3b82f6'} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      
      <div className="flex flex-col gap-2 flex-grow">
        {isRenaming ? (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-blue-500/40">
            <input 
              autoFocus
              className="bg-transparent text-[10px] text-white outline-none w-full px-1 font-bold"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={(e) => {
                // Delay blur to allow button click
                setTimeout(submitRename, 150);
              }}
            />
            <button onClick={submitRename} className="text-green-500 hover:text-green-400 p-0.5">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-1 group/name min-h-[16px]">
            <h3 className="font-bold text-[10px] text-slate-200 truncate flex-grow cursor-default" title={res.name}>{res.name}</h3>
            <button 
              onClick={() => setIsRenaming(true)}
              className="opacity-0 group-hover/name:opacity-100 text-slate-500 hover:text-blue-400 transition-all p-0.5"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between text-[8px] text-slate-500 font-black uppercase tracking-tighter">
          <span>{res.size}</span>
          <button onClick={onDelete} className="text-red-400/40 hover:text-red-500 transition-colors">
            REMOVE
          </button>
        </div>
      </div>

      <button onClick={openResource} className="w-full mt-3 py-2 rounded-lg bg-blue-600/10 text-blue-400 text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20">
         Read/View
      </button>
    </motion.div>
  );
};

export default ResourceHub;
