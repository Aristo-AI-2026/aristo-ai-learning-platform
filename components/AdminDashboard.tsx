
import React from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

const AdminDashboard: React.FC = () => {
  const { resources, user } = useStore();

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center glass p-12 rounded-3xl border-red-500/20">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-slate-400">This sector is restricted to platform administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <h1 className="text-4xl font-heading font-bold">Admin Headquarters</h1>
          <p className="text-slate-400">Global system oversight and content orchestration.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        <div className="lg:col-span-3 space-y-8">
          {/* Content Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminToolCard 
              title="Blog Management" 
              desc="Create and curate educational insights." 
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>}
            />
            <AdminToolCard 
              title="User Control" 
              desc="Manage permissions and academic tiers." 
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            />
          </div>

          <div className="glass rounded-3xl p-8 border-white/5">
            <h3 className="text-xl font-bold mb-6">Global Asset Hub</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="pb-4 px-2">File Name</th>
                  <th className="pb-4 px-2">Owner</th>
                  <th className="pb-4 px-2">Visibility</th>
                  <th className="pb-4 px-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {resources.map(res => (
                  <tr key={res.id} className="text-sm">
                    <td className="py-4 px-2 font-medium">{res.name}</td>
                    <td className="py-4 px-2 text-slate-400">System</td>
                    <td className="py-4 px-2">
                      <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold">PUBLIC</span>
                    </td>
                    <td className="py-4 px-2">
                      <button className="text-blue-400 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="glass rounded-3xl p-6 border-white/5">
             <h3 className="font-bold mb-4">System Vitals</h3>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-xs mb-1">
                   <span>Server Load</span>
                   <span>24%</span>
                 </div>
                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-green-400 w-[24%]" />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-xs mb-1">
                   <span>Storage Used</span>
                   <span>68%</span>
                 </div>
                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 w-[68%]" />
                 </div>
               </div>
             </div>
           </div>

           <div className="glass rounded-3xl p-6 border-white/5 bg-gradient-to-br from-blue-600/20 to-transparent">
             <h3 className="font-bold mb-2">Platform Announcements</h3>
             <p className="text-xs text-slate-400 leading-relaxed mb-4">
               The v2.4 Neural Sync update is scheduled for next Tuesday. Ensure all nodes are calibrated.
             </p>
             <button className="text-xs font-bold text-blue-400 hover:underline">Send Broadcast →</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const AdminToolCard: React.FC<{ title: string; desc: string; icon: React.ReactNode }> = ({ title, desc, icon }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass p-6 rounded-3xl border-white/5 hover:border-blue-500/30 transition-all cursor-pointer flex items-center gap-6"
  >
    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400">
      {icon}
    </div>
    <div>
      <h3 className="font-bold">{title}</h3>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </div>
  </motion.div>
);

export default AdminDashboard;
