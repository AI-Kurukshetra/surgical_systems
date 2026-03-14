import type { ServiceResponse, Staff, StaffInsert, StaffUpdate } from "./types";
import { createResource, deleteResource, getResourceByIdFromList, listResource, updateResource } from "./http";

const BASE = "/api/staff";

export const staffService = {
  getAll(): Promise<ServiceResponse<Staff[]>> {
    return listResource<Staff>(BASE);
  },

  getById(id: string): Promise<ServiceResponse<Staff>> {
    return getResourceByIdFromList<Staff>(BASE, id);
  },

  create(payload: StaffInsert): Promise<ServiceResponse<Staff>> {
    return createResource<Staff, StaffInsert>(BASE, payload);
  },

  update(id: string, payload: StaffUpdate): Promise<ServiceResponse<Staff>> {
    return updateResource<Staff, StaffUpdate>(BASE, id, payload);
  },

  delete(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return deleteResource(BASE, id);
  },
};
