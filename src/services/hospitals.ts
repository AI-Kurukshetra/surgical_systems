import type { Hospital, HospitalInsert, HospitalUpdate, ServiceResponse } from "./types";
import { createResource, getResourceByIdFromList, listResource, requestApi } from "./http";

const BASE = "/api/hospitals";

export const hospitalsService = {
  getAll(): Promise<ServiceResponse<Hospital[]>> {
    return listResource<Hospital>(BASE);
  },

  getById(id: string): Promise<ServiceResponse<Hospital>> {
    return getResourceByIdFromList<Hospital>(BASE, id);
  },

  create(payload: HospitalInsert): Promise<ServiceResponse<Hospital>> {
    return createResource<Hospital, HospitalInsert>(BASE, payload);
  },

  update(id: string, payload: HospitalUpdate): Promise<ServiceResponse<Hospital>> {
    return requestApi<Hospital>(`/api/hospitals/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  delete(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return requestApi<{ deleted?: boolean }>(`/api/hospitals/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then((result) => {
      if (result.error) return { data: null, error: result.error };
      return { data: { success: true }, error: null };
    });
  },
};
