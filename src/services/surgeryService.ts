import { surgeriesService } from "./surgeries";
import type { SurgeryInsert, SurgeryUpdate } from "./types";

export const getAllSurgeries = () => surgeriesService.getAll();
export const getSurgeryById = (id: string) => surgeriesService.getById(id);
export const createSurgery = (payload: SurgeryInsert) => surgeriesService.create(payload);
export const updateSurgery = (id: string, payload: SurgeryUpdate) => surgeriesService.update(id, payload);
export const deleteSurgery = (id: string) => surgeriesService.delete(id);
