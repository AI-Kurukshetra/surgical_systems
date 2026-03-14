export { hospitalsService } from "./hospitals";
export { patientsService } from "./patients";
export { surgeriesService } from "./surgeries";
export { caseRequestsService } from "./case_requests";
export { surgeonsService } from "./surgeons";
export { staffService } from "./staff";
export { equipmentService } from "./equipment";
export { notificationsService } from "./notifications";
export { operatingRoomsService } from "./operating_rooms";
export { staffAssignmentsService } from "./staff_assignments";
export { equipmentAssignmentsService } from "./equipment_assignments";
export { usersService } from "./users";
export * from "./hospitalService";
export * from "./patientService";
export * from "./surgeonService";
export * from "./staffService";
export * from "./operatingRoomService";
export * from "./caseRequestService";
export * from "./surgeryService";
export * from "./equipmentService";
export * from "./notificationService";

export type {
  ServiceError,
  ServiceResponse,
  Hospital,
  HospitalInsert,
  HospitalUpdate,
  Patient,
  PatientInsert,
  PatientUpdate,
  Surgeon,
  SurgeonInsert,
  SurgeonUpdate,
  Surgery,
  SurgeryInsert,
  SurgeryUpdate,
  CaseRequest,
  CaseRequestInsert,
  CaseRequestUpdate,
  Staff,
  StaffInsert,
  StaffUpdate,
  Equipment,
  EquipmentInsert,
  EquipmentUpdate,
  Notification,
  NotificationInsert,
  NotificationUpdate,
  UserProfile,
  StaffAssignment,
  StaffAssignmentInsert,
  StaffAssignmentUpdate,
  EquipmentAssignment,
  EquipmentAssignmentInsert,
  EquipmentAssignmentUpdate,
  OperatingRoom,
  OperatingRoomInsert,
  OperatingRoomUpdate,
} from "./types";
