import type { ServiceResponse } from "./types";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
};

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    return { success: false, error: "Invalid API response" };
  }
}

function toFriendlyMessage(status: number) {
  if (status === 401) return "Please sign in to continue.";
  if (status === 403) return "You don't have permission to view this resource.";
  if (status === 404) return "Requested data is unavailable.";
  if (status >= 400 && status < 500) return "Unable to process your request right now.";
  if (status >= 500) return "Unable to load data. Please try again later.";

  return "Unable to load data. Please try again later.";
}

function hasStructuredSuccess(value: unknown): value is ApiEnvelope<unknown> {
  return typeof value === "object" && value !== null && "success" in value;
}

export async function requestApi<T>(path: string, init?: RequestInit): Promise<ServiceResponse<T>> {
  try {
    const response = await fetch(path, {
      credentials: "include",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const envelope = await parseEnvelope<T>(response);
    const structured = hasStructuredSuccess(envelope);
    const apiMessage = structured ? envelope.message ?? envelope.error : undefined;

    if (!response.ok || (structured && !envelope.success)) {
      console.error("[requestApi] request failed", {
        path,
        method: init?.method ?? "GET",
        status: response.status,
        apiMessage,
        apiCode: envelope.code,
      });

      return {
        data: null,
        error: {
          message: toFriendlyMessage(response.status),
          code: envelope.code ?? String(response.status),
          details: apiMessage,
        },
      };
    }

    if (!structured) {
      return {
        data: envelope as T,
        error: null,
      };
    }

    return {
      data: (envelope.data ?? null) as T | null,
      error: null,
    };
  } catch (error) {
    console.error("[requestApi] network or parsing failure", {
      path,
      method: init?.method ?? "GET",
      error,
    });

    return {
      data: null,
      error: {
        message: "Unable to load data. Please check your connection and try again.",
      },
    };
  }
}

export async function listResource<T>(basePath: string): Promise<ServiceResponse<T[]>> {
  return requestApi<T[]>(basePath, { method: "GET" });
}

export async function getResourceByIdFromList<T extends { id: string }>(basePath: string, id: string): Promise<ServiceResponse<T>> {
  const result = await listResource<T>(basePath);
  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error ?? { message: "Failed to fetch resource" },
    };
  }

  const item = result.data.find((entry) => entry.id === id) ?? null;
  if (!item) {
    return { data: null, error: { message: "Resource not found" } };
  }

  return { data: item, error: null };
}

export async function createResource<T, P>(basePath: string, payload: P): Promise<ServiceResponse<T>> {
  return requestApi<T>(basePath, { method: "POST", body: JSON.stringify(payload) });
}

export async function updateResource<T, P>(basePath: string, id: string, payload: P): Promise<ServiceResponse<T>> {
  return requestApi<T>(`${basePath}?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, id }),
  });
}

export async function deleteResource(basePath: string, id: string): Promise<ServiceResponse<{ success: boolean }>> {
  const result = await requestApi<{ deleted?: boolean }>(`${basePath}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });

  if (result.error) {
    return { data: null, error: result.error };
  }

  return { data: { success: true }, error: null };
}
