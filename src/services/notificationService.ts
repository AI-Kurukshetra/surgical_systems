import { notificationsService } from "./notifications";
import type { NotificationInsert, NotificationUpdate } from "./types";

export const getAllNotifications = () => notificationsService.getAll();
export const getUnreadNotifications = () => notificationsService.getUnread();
export const getNotificationById = (id: string) => notificationsService.getById(id);
export const createNotification = (payload: NotificationInsert) => notificationsService.create(payload);
export const updateNotification = (id: string, payload: NotificationUpdate) => notificationsService.update(id, payload);
export const markNotificationAsRead = (id: string) => notificationsService.markAsRead(id);
