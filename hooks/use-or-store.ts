"use client";

import { create } from "zustand";

type ORStore = {
  selectedDate: string;
  selectedRoomId: string | null;
  setSelectedDate: (date: string) => void;
  setSelectedRoomId: (roomId: string | null) => void;
};

export const useORStore = create<ORStore>((set) => ({
  selectedDate: new Date().toISOString().slice(0, 10),
  selectedRoomId: null,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSelectedRoomId: (selectedRoomId) => set({ selectedRoomId }),
}));
