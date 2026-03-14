import type { Equipment, EquipmentInsert, EquipmentUpdate, ServiceResponse } from "./types";
import { createResource, deleteResource, getResourceByIdFromList, listResource, updateResource } from "./http";

const BASE = "/api/equipment";

export const equipmentService = {
  getAll(): Promise<ServiceResponse<Equipment[]>> {
    return listResource<Equipment>(BASE);
  },

  getById(id: string): Promise<ServiceResponse<Equipment>> {
    return getResourceByIdFromList<Equipment>(BASE, id);
  },

  create(payload: EquipmentInsert): Promise<ServiceResponse<Equipment>> {
    return createResource<Equipment, EquipmentInsert>(BASE, payload);
  },

  update(id: string, payload: EquipmentUpdate): Promise<ServiceResponse<Equipment>> {
    return updateResource<Equipment, EquipmentUpdate>(BASE, id, payload);
  },

  delete(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return deleteResource(BASE, id);
  },
};
