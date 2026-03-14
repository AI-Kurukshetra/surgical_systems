import type { PostgrestError } from "@supabase/supabase-js";
import type { ServiceError, ServiceResponse } from "./types";

export function ok<T>(data: T): ServiceResponse<T> {
  return { data, error: null };
}

export function fail<T>(error: unknown): ServiceResponse<T> {
  return { data: null, error: toServiceError(error) };
}

export function fromPostgrestError<T>(error: PostgrestError): ServiceResponse<T> {
  return {
    data: null,
    error: {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
  };
}

export function toServiceError(error: unknown): ServiceError {
  if (typeof error === "object" && error !== null && "message" in error) {
    const e = error as { message: string; code?: string; details?: string; hint?: string };
    return {
      message: e.message,
      code: e.code,
      details: e.details,
      hint: e.hint,
    };
  }

  return {
    message: "Unexpected service error",
  };
}
