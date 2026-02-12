import { create } from 'zustand';
import type { View, AIProvider } from '../types/index';

interface UIState {
  // Navigation
  currentView: View;
  sidebarOpen: boolean;

  // Theme
  darkMode: boolean;

  // Settings
  aiProvider: AIProvider;
  aiModel: string;

  // Actions
  setCurrentView: (view: View) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setAIProvider: (provider: AIProvider) => void;
  setAIModel: (model: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  currentView: 'dashboard',
  sidebarOpen: typeof window !== 'undefined' && window.innerWidth >= 768,
  darkMode: localStorage.getItem('darkMode') === 'true',
  aiProvider: (localStorage.getItem('ai_provider') as AIProvider) || 'gemini',
  aiModel: localStorage.getItem('ai_model') || 'gemini-2.0-flash',

  // Actions
  setCurrentView: (view: View) => set({ currentView: view }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  toggleDarkMode: () => set((state) => {
    const newDarkMode = !state.darkMode;
    localStorage.setItem('darkMode', String(newDarkMode));
    return { darkMode: newDarkMode };
  }),

  setAIProvider: (provider: AIProvider) => {
    localStorage.setItem('ai_provider', provider);
    set({ aiProvider: provider });
  },

  setAIModel: (model: string) => {
    localStorage.setItem('ai_model', model);
    set({ aiModel: model });
  },
}));
