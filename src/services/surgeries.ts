import type { ServiceResponse, Surgery, SurgeryInsert, SurgeryUpdate } from "./types";
import { createResource, deleteResource, getResourceByIdFromList, listResource, updateResource } from "./http";

const BASE = "/api/surgeries";

export const surgeriesService = {
  getAll(): Promise<ServiceResponse<Surgery[]>> {
    return listResource<Surgery>(BASE);
  },

  getById(id: string): Promise<ServiceResponse<Surgery>> {
    return getResourceByIdFromList<Surgery>(BASE, id);
  },

  create(payload: SurgeryInsert): Promise<ServiceResponse<Surgery>> {
    return createResource<Surgery, SurgeryInsert>(BASE, payload);
  },

  update(id: string, payload: SurgeryUpdate): Promise<ServiceResponse<Surgery>> {
    return updateResource<Surgery, SurgeryUpdate>(BASE, id, payload);
  },

  delete(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return deleteResource(BASE, id);
  },
};
