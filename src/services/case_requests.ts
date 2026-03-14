import type { CaseRequest, CaseRequestInsert, CaseRequestUpdate, ServiceResponse } from "./types";
import { createResource, deleteResource, getResourceByIdFromList, listResource, updateResource } from "./http";

const BASE = "/api/case-requests";

export const caseRequestsService = {
  getAll(): Promise<ServiceResponse<CaseRequest[]>> {
    return listResource<CaseRequest>(BASE);
  },

  getById(id: string): Promise<ServiceResponse<CaseRequest>> {
    return getResourceByIdFromList<CaseRequest>(BASE, id);
  },

  create(payload: CaseRequestInsert): Promise<ServiceResponse<CaseRequest>> {
    return createResource<CaseRequest, CaseRequestInsert>(BASE, payload);
  },

  update(id: string, payload: CaseRequestUpdate): Promise<ServiceResponse<CaseRequest>> {
    return updateResource<CaseRequest, CaseRequestUpdate>(BASE, id, payload);
  },

  delete(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return deleteResource(BASE, id);
  },
};
