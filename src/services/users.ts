import type { Role, ServiceResponse, UserProfile } from "./types";
import { listResource, updateResource } from "./http";

const BASE = "/api/users";

export const usersService = {
  getAll(): Promise<ServiceResponse<UserProfile[]>> {
    return listResource<UserProfile>(BASE);
  },

  updateRole(id: string, role: Role): Promise<ServiceResponse<UserProfile>> {
    return updateResource<UserProfile, { role: Role }>(BASE, id, { role });
  },
};
