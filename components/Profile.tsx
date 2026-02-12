
import React, { useState } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

const Profile: React.FC = () => {
  const { user, updateProfile } = useStore();
  const [editData, setEditData] = useState({
    name: user?.name || '',
    institution: user?.institution || '',
    department: user?.department || '',
    bio: user?.bio || '',
    whatsapp: user?.whatsapp || ''
  });

  const handleSave = () => {
    updateProfile(editData);
    alert('Academic node updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <div className="flex flex-col items-center text-center gap-4 mb-16">
         <div className="inline-block px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[5px]">
           Scholar Profile
         </div>
         <h1 className="text-5xl md:text-7xl font-heading font-black uppercase tracking-tighter text-white">
           {user?.name}
         </h1>
         <p className="text-slate-500 font-bold uppercase tracking-[4px]">Aristo ID: {user?.id}</p>
      </div>
      
      <div className="glass p-8 md:p-16 rounded-[50px] border-white/5 space-y-12 bg-slate-900/40 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-purple-600" />
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <ProfileInput label="Identity Name" value={editData.name} onChange={(v) => setEditData({...editData, name: v})} />
           <ProfileInput label="Educational Node" value={editData.institution} onChange={(v) => setEditData({...editData, institution: v})} />
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <ProfileInput label="Academic Department" value={editData.department} onChange={(v) => setEditData({...editData, department: v})} />
           <ProfileInput label="WhatsApp Nexus" value={editData.whatsapp} onChange={(v) => setEditData({...editData, whatsapp: v})} />
         </div>
         
         <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Learning Manifesto (Bio)</label>
            <textarea 
              value={editData.bio}
              onChange={(e) => setEditData({...editData, bio: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-[30px] px-8 py-6 text-base focus:ring-2 focus:ring-blue-500/50 outline-none transition-all mt-4 h-40 resize-none leading-relaxed placeholder:text-slate-800 font-medium text-slate-200"
              placeholder="Declare your academic mission and vision..."
            />
         </div>

         <motion.button 
           whileHover={{ scale: 1.01 }}
           whileTap={{ scale: 0.98 }}
           onClick={handleSave}
           className="w-full py-6 bg-blue-600 rounded-[30px] font-black text-lg shadow-2xl shadow-blue-500/20 transition-all uppercase tracking-[6px] text-white"
         >
           Save Academic Record
         </motion.button>
      </div>
    </div>
  );
};

const ProfileInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-3">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type="text" 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-base focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold text-white shadow-inner"
    />
  </div>
);

export default Profile;
