export type UserRole = "admin" | "surgeon" | "staff" | "scheduler";

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface User extends BaseEntity {
  email: string;
  full_name: string;
  role_id: string;
  hospital_id: string | null;
}

export interface Role extends BaseEntity {
  name: UserRole;
  description: string | null;
}

export interface Hospital extends BaseEntity {
  name: string;
  code: string;
}

export interface Department extends BaseEntity {
  hospital_id: string;
  name: string;
}

export interface OperatingRoom extends BaseEntity {
  department_id: string;
  name: string;
  status: "available" | "in_use" | "maintenance";
}

export interface Patient extends BaseEntity {
  hospital_id: string;
  mrn: string;
  full_name: string;
  dob: string;
  pre_op_status: "pending" | "cleared" | "blocked";
  lab_results_status: "pending" | "ready" | "critical";
}

export interface Surgery extends BaseEntity {
  hospital_id: string;
  patient_id: string;
  surgeon_id: string;
  operating_room_id: string;
  procedure_id: string;
  status: "scheduled" | "in_progress" | "completed" | "delayed" | "cancelled";
  priority: "elective" | "urgent" | "emergency";
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
}

export interface Equipment extends BaseEntity {
  hospital_id: string;
  name: string;
  code: string;
  quantity_total: number;
  quantity_available: number;
}

export interface Notification extends BaseEntity {
  hospital_id: string;
  surgery_id: string | null;
  type: "delay" | "schedule_update" | "emergency";
  message: string;
  read_at: string | null;
}

export interface AnalyticsMetric extends BaseEntity {
  hospital_id: string;
  metric_key: string;
  metric_value: number;
  measured_on: string;
}
