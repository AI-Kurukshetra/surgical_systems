import { equipmentService } from "./equipment";
import type { EquipmentInsert, EquipmentUpdate } from "./types";

export const getAllEquipment = () => equipmentService.getAll();
export const getEquipmentById = (id: string) => equipmentService.getById(id);
export const createEquipment = (payload: EquipmentInsert) => equipmentService.create(payload);
export const updateEquipment = (id: string, payload: EquipmentUpdate) => equipmentService.update(id, payload);
export const deleteEquipment = (id: string) => equipmentService.delete(id);
