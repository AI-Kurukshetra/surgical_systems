export type Role = "admin" | "scheduler" | "surgeon" | "staff";

export type ORStatus = "available" | "in_surgery" | "cleaning" | "maintenance";
export type EquipmentStatus = "available" | "in_use" | "maintenance";
export type CaseRequestStatus = "pending" | "approved" | "rejected";
export type SurgeryStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface ServiceError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
}

export interface Hospital {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export type HospitalInsert = Omit<Hospital, "id" | "created_at">;
export type HospitalUpdate = Partial<HospitalInsert>;

export interface Patient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export type PatientInsert = Omit<Patient, "id" | "created_at">;
export type PatientUpdate = Partial<PatientInsert>;

export interface Surgeon {
  id: string;
  hospital_id: string | null;
  name: string | null;
  specialization: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export type SurgeonInsert = Omit<Surgeon, "id" | "created_at">;
export type SurgeonUpdate = Partial<SurgeonInsert>;

export interface Surgery {
  id: string;
  case_request_id: string | null;
  operating_room_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: SurgeryStatus | null;
  created_at: string;
}

export type SurgeryInsert = Omit<Surgery, "id" | "created_at">;
export type SurgeryUpdate = Partial<SurgeryInsert>;

export interface CaseRequest {
  id: string;
  surgeon_id: string | null;
  patient_id: string | null;
  procedure_name: string | null;
  requested_date: string | null;
  status: CaseRequestStatus;
  created_at: string;
}

export type CaseRequestInsert = Omit<CaseRequest, "id" | "created_at">;
export type CaseRequestUpdate = Partial<CaseRequestInsert>;

export interface Staff {
  id: string;
  hospital_id: string | null;
  name: string | null;
  role: string | null;
  created_at: string;
}

export type StaffInsert = Omit<Staff, "id" | "created_at">;
export type StaffUpdate = Partial<StaffInsert>;

export interface OperatingRoom {
  id: string;
  hospital_id: string | null;
  room_name: string | null;
  status: ORStatus | null;
  created_at: string;
}

export type OperatingRoomInsert = Omit<OperatingRoom, "id" | "created_at">;
export type OperatingRoomUpdate = Partial<OperatingRoomInsert>;

export interface Equipment {
  id: string;
  hospital_id: string | null;
  name: string | null;
  status: EquipmentStatus | null;
  created_at: string;
}

export type EquipmentInsert = Omit<Equipment, "id" | "created_at">;
export type EquipmentUpdate = Partial<EquipmentInsert>;

export interface StaffAssignment {
  id: string;
  surgery_id: string | null;
  staff_id: string | null;
  created_at: string;
}

export type StaffAssignmentInsert = Omit<StaffAssignment, "id" | "created_at">;
export type StaffAssignmentUpdate = Partial<StaffAssignmentInsert>;

export interface EquipmentAssignment {
  id: string;
  surgery_id: string | null;
  equipment_id: string | null;
  created_at: string;
}

export type EquipmentAssignmentInsert = Omit<EquipmentAssignment, "id" | "created_at">;
export type EquipmentAssignmentUpdate = Partial<EquipmentAssignmentInsert>;

export interface Notification {
  id: string;
  user_id: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationInsert = Omit<Notification, "id" | "created_at">;
export type NotificationUpdate = Partial<NotificationInsert>;

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role | null;
  created_at: string;
}
