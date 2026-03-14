import { NextResponse } from "next/server";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
};

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

function defaultMessageForStatus(status: number) {
  if (status === 401) return "Authentication required";
  if (status === 403) return "Access denied";
  if (status === 404) return "Resource not found";
  if (status >= 500) return "Unexpected server error";
  return "Request failed";
}

function normalizeErrorMessage(message: string, status: number) {
  const trimmed = message.trim();
  if (!trimmed) return defaultMessageForStatus(status);

  if (trimmed.toLowerCase() === "forbidden") return "Access denied";
  if (trimmed.toLowerCase() === "unauthorized") return "Authentication required";

  return trimmed;
}

export function errorResponse(message: string, status = 400, options?: { code?: string }) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      message: normalizeErrorMessage(message, status),
      ...(options?.code ? { code: options.code } : {}),
    },
    { status },
  );
}
