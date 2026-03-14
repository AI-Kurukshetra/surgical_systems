import type { Notification, NotificationInsert, NotificationUpdate, ServiceResponse } from "./types";
import { createResource, getResourceByIdFromList, listResource, updateResource } from "./http";

const BASE = "/api/notifications";

export const notificationsService = {
  getAll(): Promise<ServiceResponse<Notification[]>> {
    return listResource<Notification>(BASE);
  },

  async getUnread(): Promise<ServiceResponse<Notification[]>> {
    const result = await listResource<Notification>(BASE);
    if (result.error || !result.data) return result;
    return {
      data: result.data.filter((n) => !n.is_read),
      error: null,
    };
  },

  getById(id: string): Promise<ServiceResponse<Notification>> {
    return getResourceByIdFromList<Notification>(BASE, id);
  },

  create(payload: NotificationInsert): Promise<ServiceResponse<Notification>> {
    return createResource<Notification, NotificationInsert>(BASE, payload);
  },

  update(id: string, payload: NotificationUpdate): Promise<ServiceResponse<Notification>> {
    return updateResource<Notification, NotificationUpdate>(BASE, id, payload);
  },

  markAsRead(id: string): Promise<ServiceResponse<Notification>> {
    return updateResource<Notification, NotificationUpdate>(BASE, id, { is_read: true });
  },
};
