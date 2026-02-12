
import React, { useEffect } from 'react';
import { useStore } from './store';
import { AppView } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AICompanion from './components/AICompanion';
import Navbar from './components/Navbar';
import NoteEditor from './components/NoteEditor';
import NoteReader from './components/NoteReader';
import AdminDashboard from './components/AdminDashboard';
import ResourceHub from './components/ResourceHub';
import AuthModal from './components/AuthModal';
import Profile from './components/Profile';
import AssignmentCoverGenerator from './components/AssignmentCoverGenerator';
import AIConceptExplainer from './components/AIConceptExplainer';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const { currentView, user, isChatOpen, setChatOpen, isAuthModalOpen, initAuth } = useStore();

  useEffect(() => {
    initAuth();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case AppView.LANDING:
        return <LandingPage />;
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.NOTES:
        return <NoteEditor />;
      case AppView.READ_NOTE:
        return <NoteReader />;
      case AppView.ADMIN:
        return <AdminDashboard />;
      case AppView.RESOURCES:
        return <ResourceHub />;
      case AppView.PROFILE:
        return <Profile />;
      case AppView.AI_HUB:
        return (
          <div className="h-[calc(100vh-64px)] w-full max-w-6xl mx-auto p-6">
            <AICompanion onClose={() => {}} />
          </div>
        );
      case AppView.ASSIGNMENT_COVER:
        return <AssignmentCoverGenerator />;
      case AppView.AI_EXPLAINER:
        return <AIConceptExplainer />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30">
      <Navbar />
      
      <main className="flex-grow pt-16 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isAuthModalOpen && <AuthModal />}
      </AnimatePresence>

      {user && currentView !== AppView.AI_HUB && currentView !== AppView.LANDING && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setChatOpen(!isChatOpen)}
          className="fixed bottom-10 right-10 z-50 p-6 rounded-[30px] bg-blue-600 shadow-2xl shadow-blue-500/40 hover:bg-blue-500 transition-all border border-blue-400/20 lg:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
        </motion.button>
      )}

      <AnimatePresence>
        {isChatOpen && user && currentView !== AppView.AI_HUB && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-[40px] z-[55]" 
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg z-[60] glass-dark border-l border-white/10 shadow-2xl"
            >
              <AICompanion onClose={() => setChatOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
