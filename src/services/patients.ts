import type { Patient, PatientInsert, PatientUpdate, ServiceResponse } from "./types";
import { createResource, deleteResource, getResourceByIdFromList, listResource, updateResource } from "./http";

const BASE = "/api/patients";

export const patientsService = {
  getAll(): Promise<ServiceResponse<Patient[]>> {
    return listResource<Patient>(BASE);
  },

  getById(id: string): Promise<ServiceResponse<Patient>> {
    return getResourceByIdFromList<Patient>(BASE, id);
  },

  create(payload: PatientInsert): Promise<ServiceResponse<Patient>> {
    return createResource<Patient, PatientInsert>(BASE, payload);
  },

  update(id: string, payload: PatientUpdate): Promise<ServiceResponse<Patient>> {
    return updateResource<Patient, PatientUpdate>(BASE, id, payload);
  },

  delete(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return deleteResource(BASE, id);
  },
};
