import { createCrudHandlers } from "@/src/lib/crudRoute";

const handlers = createCrudHandlers({
  table: "surgeons",
  readRoles: ["admin", "scheduler", "surgeon", "staff"],
  createRoles: ["admin", "scheduler"],
  updateRoles: ["admin", "scheduler"],
  deleteRoles: ["admin"],
  defaultOrderBy: { column: "created_at", ascending: false },
});

export const { GET, POST, PUT, DELETE } = handlers;
