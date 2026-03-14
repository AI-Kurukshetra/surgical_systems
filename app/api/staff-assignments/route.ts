import { createCrudHandlers } from "@/src/lib/crudRoute";

const handlers = createCrudHandlers({
  table: "staff_assignments",
  readRoles: ["admin", "scheduler", "surgeon", "staff"],
  createRoles: ["admin", "scheduler", "staff"],
  updateRoles: ["admin", "scheduler", "staff"],
  deleteRoles: ["admin", "scheduler"],
  defaultOrderBy: { column: "created_at", ascending: false },
});

export const { GET, POST, PUT, DELETE } = handlers;
