import { caseRequestsService } from "./case_requests";
import type { CaseRequestInsert, CaseRequestUpdate } from "./types";

export const getAllCaseRequests = () => caseRequestsService.getAll();
export const getCaseRequestById = (id: string) => caseRequestsService.getById(id);
export const createCaseRequest = (payload: CaseRequestInsert) => caseRequestsService.create(payload);
export const updateCaseRequest = (id: string, payload: CaseRequestUpdate) => caseRequestsService.update(id, payload);
export const deleteCaseRequest = (id: string) => caseRequestsService.delete(id);
