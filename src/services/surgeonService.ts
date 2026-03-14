import { surgeonsService } from "./surgeons";
import type { SurgeonInsert, SurgeonUpdate } from "./types";

export const getAllSurgeons = () => surgeonsService.getAll();
export const getSurgeonById = (id: string) => surgeonsService.getById(id);
export const createSurgeon = (payload: SurgeonInsert) => surgeonsService.create(payload);
export const updateSurgeon = (id: string, payload: SurgeonUpdate) => surgeonsService.update(id, payload);
export const deleteSurgeon = (id: string) => surgeonsService.delete(id);
