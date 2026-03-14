import { patientsService } from "./patients";
import type { PatientInsert, PatientUpdate } from "./types";

export const getAllPatients = () => patientsService.getAll();
export const getPatientById = (id: string) => patientsService.getById(id);
export const createPatient = (payload: PatientInsert) => patientsService.create(payload);
export const updatePatient = (id: string, payload: PatientUpdate) => patientsService.update(id, payload);
export const deletePatient = (id: string) => patientsService.delete(id);
