"use client";

import { apiClient } from "@/services/api-client";
import type { Surgery } from "@/types/domain";

export async function getSurgeries() {
  return apiClient<Surgery[]>("/api/surgeries");
}

export async function createSurgery(payload: Partial<Surgery>) {
  return apiClient<Surgery>("/api/surgeries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
