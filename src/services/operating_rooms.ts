import type {
  OperatingRoom,
  OperatingRoomInsert,
  OperatingRoomUpdate,
  ServiceResponse,
} from "./types";
import { createResource, deleteResource, getResourceByIdFromList, listResource, updateResource } from "./http";

const BASE = "/api/operating-rooms";

export const operatingRoomsService = {
  getAll(): Promise<ServiceResponse<OperatingRoom[]>> {
    return listResource<OperatingRoom>(BASE);
  },

  getById(id: string): Promise<ServiceResponse<OperatingRoom>> {
    return getResourceByIdFromList<OperatingRoom>(BASE, id);
  },

  create(payload: OperatingRoomInsert): Promise<ServiceResponse<OperatingRoom>> {
    return createResource<OperatingRoom, OperatingRoomInsert>(BASE, payload);
  },

  update(id: string, payload: OperatingRoomUpdate): Promise<ServiceResponse<OperatingRoom>> {
    return updateResource<OperatingRoom, OperatingRoomUpdate>(BASE, id, payload);
  },

  delete(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return deleteResource(BASE, id);
  },
};
