"use client";

import { create } from "zustand";
import type { UserRole } from "@/types/domain";

type AppState = {
  role: UserRole | null;
  activeHospitalId: string | null;
  setRole: (role: UserRole | null) => void;
  setActiveHospitalId: (id: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  role: null,
  activeHospitalId: null,
  setRole: (role) => set({ role }),
  setActiveHospitalId: (id) => set({ activeHospitalId: id }),
}));
