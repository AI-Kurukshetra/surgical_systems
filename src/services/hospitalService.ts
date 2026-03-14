import { hospitalsService } from "./hospitals";
import type { HospitalInsert, HospitalUpdate } from "./types";

export const getAllHospitals = () => hospitalsService.getAll();
export const getHospitalById = (id: string) => hospitalsService.getById(id);
export const createHospital = (payload: HospitalInsert) => hospitalsService.create(payload);
export const updateHospital = (id: string, payload: HospitalUpdate) => hospitalsService.update(id, payload);
export const deleteHospital = (id: string) => hospitalsService.delete(id);
