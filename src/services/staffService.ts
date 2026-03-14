import { staffService } from "./staff";
import type { StaffInsert, StaffUpdate } from "./types";

export const getAllStaff = () => staffService.getAll();
export const getStaffById = (id: string) => staffService.getById(id);
export const createStaff = (payload: StaffInsert) => staffService.create(payload);
export const updateStaff = (id: string, payload: StaffUpdate) => staffService.update(id, payload);
export const deleteStaff = (id: string) => staffService.delete(id);
