import type {
  ServiceResponse,
  StaffAssignment,
  StaffAssignmentInsert,
  StaffAssignmentUpdate,
} from "./types";
import { createResource, deleteResource, getResourceByIdFromList, listResource, updateResource } from "./http";

const BASE = "/api/staff-assignments";

export const staffAssignmentsService = {
  getAll(): Promise<ServiceResponse<StaffAssignment[]>> {
    return listResource<StaffAssignment>(BASE);
  },

  getById(id: string): Promise<ServiceResponse<StaffAssignment>> {
    return getResourceByIdFromList<StaffAssignment>(BASE, id);
  },

  create(payload: StaffAssignmentInsert): Promise<ServiceResponse<StaffAssignment>> {
    return createResource<StaffAssignment, StaffAssignmentInsert>(BASE, payload);
  },

  update(id: string, payload: StaffAssignmentUpdate): Promise<ServiceResponse<StaffAssignment>> {
    return updateResource<StaffAssignment, StaffAssignmentUpdate>(BASE, id, payload);
  },

  delete(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return deleteResource(BASE, id);
  },
};
