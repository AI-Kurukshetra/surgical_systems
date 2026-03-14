import type { ServiceResponse, Surgeon, SurgeonInsert, SurgeonUpdate } from "./types";
import { createResource, deleteResource, getResourceByIdFromList, listResource, updateResource } from "./http";

const BASE = "/api/surgeons";

export const surgeonsService = {
  getAll(): Promise<ServiceResponse<Surgeon[]>> {
    return listResource<Surgeon>(BASE);
  },

  getById(id: string): Promise<ServiceResponse<Surgeon>> {
    return getResourceByIdFromList<Surgeon>(BASE, id);
  },

  create(payload: SurgeonInsert): Promise<ServiceResponse<Surgeon>> {
    return createResource<Surgeon, SurgeonInsert>(BASE, payload);
  },

  update(id: string, payload: SurgeonUpdate): Promise<ServiceResponse<Surgeon>> {
    return updateResource<Surgeon, SurgeonUpdate>(BASE, id, payload);
  },

  delete(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return deleteResource(BASE, id);
  },
};
