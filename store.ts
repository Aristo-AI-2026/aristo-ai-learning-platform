
import { create } from 'zustand';
import { AppView, User, Message, Note, Resource, ChatSession } from './types';
import { supabase } from './services/supabase';

interface AppState {
  currentView: AppView;
  user: User | null;
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  notes: Note[];
  selectedNoteId: string | null;
  resources: Resource[];
  isChatOpen: boolean;
  isAuthModalOpen: boolean;
  isVoiceActive: boolean;
  
  initAuth: () => Promise<void>;
  setView: (view: AppView) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  setVoiceActive: (active: boolean) => void;
  
  // Chat Actions
  startNewChat: () => Promise<void>;
  addMessage: (msg: Message) => Promise<void>;
  updateLastMessage: (content: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  setCurrentSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;

  setChatOpen: (isOpen: boolean) => void;
  setAuthModalOpen: (isOpen: boolean) => void;
  
  // Cloud Sync Actions
  fetchUserData: () => Promise<void>;
  editNote: (id: string | null) => void;
  readNote: (id: string) => void;
  upsertNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addResource: (resource: Resource) => Promise<void>;
  updateResourceName: (id: string, name: string) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentView: AppView.LANDING,
  user: null,
  isAuthModalOpen: false,
  isVoiceActive: false,
  chatSessions: [],
  currentSessionId: null,
  notes: [],
  selectedNoteId: null,
  resources: [],
  isChatOpen: false,

  initAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { user } = session;
      const userObj: User = {
        id: user.id,
        email: user.email!,
        name: user.user_metadata.name || 'Scholar',
        gender: user.user_metadata.gender || 'other',
        whatsapp: user.user_metadata.whatsapp,
        institution: user.user_metadata.institution,
        department: user.user_metadata.department,
        isAdmin: user.email!.includes('admin'),
        bio: user.user_metadata.bio
      };
      set({ user: userObj, currentView: AppView.DASHBOARD });
      await get().fetchUserData();
    }
  },

  setView: (view) => set((state) => {
    if (!state.user && view !== AppView.LANDING) {
      return { isAuthModalOpen: true };
    }
    const resetNote = (view !== AppView.NOTES && view !== AppView.READ_NOTE) ? { selectedNoteId: null } : {};
    return { currentView: view, ...resetNote };
  }),

  setUser: (user) => {
    set({ user, isAuthModalOpen: false, currentView: user ? AppView.DASHBOARD : AppView.LANDING });
    if (user) get().fetchUserData();
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, currentView: AppView.LANDING, chatSessions: [], currentSessionId: null, notes: [], resources: [], selectedNoteId: null });
  },

  setVoiceActive: (active) => set({ isVoiceActive: active }),

  fetchUserData: async () => {
    const user = get().user;
    if (!user) return;

    try {
      // Fetch Notes
      const { data: notesData } = await supabase.from('notes').select('*').eq('author_id', user.id);
      if (notesData) {
        const formattedNotes = notesData.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          lastModified: parseInt(n.last_modified),
          authorId: n.author_id
        }));
        set({ notes: formattedNotes });
      }

      // Fetch Resources
      const { data: resData } = await supabase.from('resources').select('*').eq('user_id', user.id);
      if (resData) {
        const formattedResources = resData.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          url: r.url,
          size: r.size,
          uploadedAt: parseInt(r.uploaded_at)
        }));
        set({ resources: formattedResources });
      }

      // Fetch Chat Sessions
      const { data: chatData } = await supabase.from('chat_sessions').select('*').eq('user_id', user.id).order('last_updated', { ascending: false });
      if (chatData && chatData.length > 0) {
        const sessions = chatData.map(s => ({
          id: s.id,
          title: s.title,
          messages: s.messages,
          lastUpdated: s.last_updated
        }));
        set({ chatSessions: sessions, currentSessionId: sessions[0].id });
      }
    } catch (e) {
      console.error("Data Sync Error:", e);
    }
  },

  startNewChat: async () => {
    const user = get().user;
    if (!user) return;

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'নতুন আলোচনা',
      messages: [{ id: '1', role: 'assistant', content: "স্বাগতম! আমি অ্যারিস্টো। আমি কীভাবে সাহায্য করতে পারি?", timestamp: Date.now() }],
      lastUpdated: Date.now()
    };

    set((state) => ({
      chatSessions: [newSession, ...state.chatSessions],
      currentSessionId: newSession.id
    }));

    await supabase.from('chat_sessions').insert({
      id: newSession.id,
      user_id: user.id,
      title: newSession.title,
      messages: newSession.messages,
      last_updated: newSession.lastUpdated
    });
  },

  addMessage: async (msg) => {
    const currentId = get().currentSessionId;
    const user = get().user;
    if (!currentId || !user) return;

    set((state) => {
      const updatedSessions = state.chatSessions.map(session => {
        if (session.id === currentId) {
          const title = msg.role === 'user' && session.messages.length <= 1 ? msg.content.substring(0, 30) + '...' : session.title;
          return {
            ...session,
            title,
            messages: [...session.messages, msg],
            lastUpdated: Date.now()
          };
        }
        return session;
      });
      return { chatSessions: updatedSessions };
    });

    const session = get().chatSessions.find(s => s.id === currentId);
    if (session) {
      await supabase.from('chat_sessions').upsert({
        id: session.id,
        user_id: user.id,
        title: session.title,
        messages: session.messages,
        last_updated: session.lastUpdated
      });
    }
  },

  updateLastMessage: async (content) => {
    const currentId = get().currentSessionId;
    if (!currentId) return;

    set((state) => {
      const updatedSessions = state.chatSessions.map(session => {
        if (session.id === currentId) {
          const lastMsgIndex = session.messages.length - 1;
          const updatedMessages = [...session.messages];
          updatedMessages[lastMsgIndex] = { ...updatedMessages[lastMsgIndex], content };
          return { ...session, messages: updatedMessages };
        }
        return session;
      });
      return { chatSessions: updatedSessions };
    });
  },

  deleteMessage: async (id) => {
    const currentId = get().currentSessionId;
    if (!currentId) return;

    set((state) => {
      const updatedSessions = state.chatSessions.map(session => {
        if (session.id === currentId) {
          return { ...session, messages: session.messages.filter(m => m.id !== id) };
        }
        return session;
      });
      return { chatSessions: updatedSessions };
    });

    const session = get().chatSessions.find(s => s.id === currentId);
    if (session) {
      await supabase.from('chat_sessions').update({ messages: session.messages }).eq('id', session.id);
    }
  },

  setCurrentSession: (id) => set({ currentSessionId: id }),
  
  deleteSession: async (id) => {
    set((state) => ({
      chatSessions: state.chatSessions.filter(s => s.id !== id),
      currentSessionId: state.currentSessionId === id ? null : state.currentSessionId
    }));
    await supabase.from('chat_sessions').delete().eq('id', id);
  },

  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  
  editNote: (id) => set({ selectedNoteId: id, currentView: AppView.NOTES }),
  readNote: (id) => set({ selectedNoteId: id, currentView: AppView.READ_NOTE }),

  upsertNote: async (note) => {
    const user = get().user;
    if (!user) return;
    
    set((state) => {
      const existingIdx = state.notes.findIndex(n => n.id === note.id);
      let newNotes = [];
      if (existingIdx >= 0) {
        newNotes = [...state.notes];
        newNotes[existingIdx] = note;
      } else {
        newNotes = [note, ...state.notes];
      }
      return { notes: newNotes };
    });

    await supabase.from('notes').upsert({
      id: note.id,
      title: note.title,
      content: note.content,
      last_modified: note.lastModified.toString(),
      author_id: user.id
    });
  },

  deleteNote: async (id) => {
    set({ notes: get().notes.filter(n => n.id !== id) });
    await supabase.from('notes').delete().eq('id', id);
  },

  addResource: async (resource) => {
    const user = get().user;
    if (!user) return;
    
    set({ resources: [resource, ...get().resources] });
    await supabase.from('resources').insert({
      id: resource.id,
      name: resource.name,
      type: resource.type,
      url: resource.url,
      size: resource.size,
      uploaded_at: resource.uploadedAt.toString(),
      user_id: user.id
    });
  },

  updateResourceName: async (id, name) => {
    set((state) => ({
      resources: state.resources.map(r => r.id === id ? { ...r, name } : r)
    }));
    await supabase.from('resources').update({ name }).eq('id', id);
  },

  deleteResource: async (id) => {
    set({ resources: get().resources.filter(r => r.id !== id) });
    await supabase.from('resources').delete().eq('id', id);
  },

  updateProfile: async (data) => {
    const user = get().user;
    if (!user) return;
    
    const updatedUser = { ...user, ...data };
    set({ user: updatedUser });

    await supabase.auth.updateUser({
      data: { ...data }
    });
  },
}));
