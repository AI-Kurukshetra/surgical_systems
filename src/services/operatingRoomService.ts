import { operatingRoomsService } from "./operating_rooms";
import type { OperatingRoomInsert, OperatingRoomUpdate } from "./types";

export const getAllOperatingRooms = () => operatingRoomsService.getAll();
export const getOperatingRoomById = (id: string) => operatingRoomsService.getById(id);
export const createOperatingRoom = (payload: OperatingRoomInsert) => operatingRoomsService.create(payload);
export const updateOperatingRoom = (id: string, payload: OperatingRoomUpdate) => operatingRoomsService.update(id, payload);
export const deleteOperatingRoom = (id: string) => operatingRoomsService.delete(id);
