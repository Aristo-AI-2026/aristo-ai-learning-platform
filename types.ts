
export enum AppView {
  LANDING = 'landing',
  DASHBOARD = 'dashboard',
  NOTES = 'notes',
  READ_NOTE = 'read_note',
  ADMIN = 'admin',
  RESOURCES = 'resources',
  PROFILE = 'profile',
  AI_HUB = 'ai_hub',
  ASSIGNMENT_COVER = 'assignment_cover',
  AI_EXPLAINER = 'ai_explainer'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  whatsapp?: string;
  dob?: string;
  institution?: string;
  department?: string;
  isAdmin: boolean;
  avatar?: string;
  bio?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  authorId: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'link';
  url: string;
  size?: string;
  uploadedAt: number;
}
