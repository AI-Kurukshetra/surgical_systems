import type {
  EquipmentAssignment,
  EquipmentAssignmentInsert,
  EquipmentAssignmentUpdate,
  ServiceResponse,
} from "./types";
import { createResource, deleteResource, getResourceByIdFromList, listResource, updateResource } from "./http";

const BASE = "/api/equipment-assignments";

export const equipmentAssignmentsService = {
  getAll(): Promise<ServiceResponse<EquipmentAssignment[]>> {
    return listResource<EquipmentAssignment>(BASE);
  },

  getById(id: string): Promise<ServiceResponse<EquipmentAssignment>> {
    return getResourceByIdFromList<EquipmentAssignment>(BASE, id);
  },

  create(payload: EquipmentAssignmentInsert): Promise<ServiceResponse<EquipmentAssignment>> {
    return createResource<EquipmentAssignment, EquipmentAssignmentInsert>(BASE, payload);
  },

  update(id: string, payload: EquipmentAssignmentUpdate): Promise<ServiceResponse<EquipmentAssignment>> {
    return updateResource<EquipmentAssignment, EquipmentAssignmentUpdate>(BASE, id, payload);
  },

  delete(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return deleteResource(BASE, id);
  },
};
