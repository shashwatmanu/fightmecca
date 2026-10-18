import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  pageTitle: 'Dashboard',
  setPageTitle: (title) => set({ pageTitle: title }),
}));
