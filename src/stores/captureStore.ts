import { create } from 'zustand';
import { CaptureMode } from '../types/motion';

interface CaptureState {
  mode: CaptureMode;
  setMode: (mode: CaptureMode) => void;
  isCapturing: boolean;
  setIsCapturing: (isCapturing: boolean) => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  mode: CaptureMode.SINGLE,
  setMode: (mode) => set({ mode }),
  isCapturing: false,
  setIsCapturing: (isCapturing) => set({ isCapturing }),
}));
