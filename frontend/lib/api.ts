import axios from "axios";
import type {
  FinalContentOutput,
  GeneratePayload,
  Generation,
  GenerationList,
  GenerationMetrics,
} from "@/lib/schemas";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("contentai_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
};

export type SettingsPayload = {
  selected_model: string;
  auto_retry: boolean;
  max_retries: number;
  include_source_urls: boolean;
  auto_generate_image: boolean;
  strict_compliance: boolean;
  custom_blocked_words: string[];
};

export type SettingsResponse = SettingsPayload & {
  has_api_key: boolean;
};

export type GenerationCreatePayload = {
  topic: string;
  audience: string;
  content_type?: string;
  tone?: string;
  additional_context?: string;
  linkedin_post?: string;
  twitter_post?: string;
  image_prompt?: string;
  compliance_status?: string;
  compliance_notes?: string;
  status?: string;
  error_message?: string;
  duration_ms?: number;
};

export type PolicyUploadResponse = {
  filename: string;
  extension: string;
  char_count: number;
  truncated: boolean;
  policy_text: string;
};

export type ProgressEvent = {
  stage: string;
  message: string;
};

export async function signup(payload: LoginPayload): Promise<AuthTokenResponse> {
  const response = await api.post<AuthTokenResponse>("/api/auth/signup", payload);
  return response.data;
}

export async function login(payload: LoginPayload): Promise<AuthTokenResponse> {
  const response = await api.post<AuthTokenResponse>("/api/auth/login", payload);
  return response.data;
}

export async function getMe(): Promise<{ id: string; email: string; is_active: boolean; }> {
  const response = await api.get<{ id: string; email: string; is_active: boolean; }>("/api/auth/me");
  return response.data;
}

export async function generateContent(payload: GeneratePayload): Promise<FinalContentOutput> {
  const response = await api.post<FinalContentOutput>("/api/generate", payload);
  return response.data;
}

export async function generateContentStream(
  payload: GeneratePayload,
  onProgress: (event: ProgressEvent) => void,
): Promise<FinalContentOutput> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("contentai_access_token") : null;
  const response = await fetch(`${api.defaults.baseURL}/api/generate/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error("Failed to open generation stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";
  let finalOutput: FinalContentOutput | null = null;
  let streamError: string | null = null;

  const parseEventChunk = (chunk: string): { eventName: string; dataText: string; } => {
    const lines = chunk.split(/\r?\n/);
    let eventName = "message";
    const dataParts: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataParts.push(line.slice(5).trim());
      }
    }

    return { eventName, dataText: dataParts.join("\n") };
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split(/\r?\n\r?\n/);
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      if (!chunk.trim() || chunk.startsWith(":")) {
        continue;
      }

      const parsedEvent = parseEventChunk(chunk);
      currentEvent = parsedEvent.eventName;
      const data = parsedEvent.dataText;

      if (!data) {
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        throw new Error(`Invalid stream payload for event '${currentEvent}'`);
      }

      if (currentEvent === "progress") {
        onProgress(parsed as ProgressEvent);
      } else if (currentEvent === "result") {
        finalOutput = parsed as FinalContentOutput;
      } else if (currentEvent === "error") {
        const errorObj = parsed as { detail?: unknown; error?: unknown; };
        if (typeof errorObj.detail === "string") {
          streamError = errorObj.detail;
        } else if (errorObj.detail != null) {
          streamError = JSON.stringify(errorObj.detail);
        } else if (typeof errorObj.error === "string") {
          streamError = errorObj.error;
        } else {
          streamError = "Generation failed on the backend.";
        }
      } else if (currentEvent === "done") {
        if (streamError) {
          throw new Error(streamError);
        }
        if (!finalOutput) {
          throw new Error("Generation stream ended without result");
        }
        return finalOutput;
      }
    }
  }

  if (streamError) {
    throw new Error(streamError);
  }
  if (!finalOutput) {
    throw new Error("Generation stream closed unexpectedly");
  }
  return finalOutput;
}

export async function createGeneration(payload: GenerationCreatePayload): Promise<Generation> {
  const response = await api.post<Generation>("/api/generations", payload);
  return response.data;
}

export async function listGenerations(params?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<GenerationList> {
  const response = await api.get<GenerationList>("/api/generations", { params });
  return response.data;
}

export async function getGenerationMetrics(): Promise<GenerationMetrics> {
  const response = await api.get<GenerationMetrics>("/api/generations/metrics");
  return response.data;
}

export async function getGeneration(generationId: string): Promise<Generation> {
  const response = await api.get<Generation>(`/api/generations/${generationId}`);
  return response.data;
}

export async function deleteGeneration(generationId: string): Promise<void> {
  await api.delete(`/api/generations/${generationId}`);
}

export async function clearGenerations(): Promise<{ deleted: number; }> {
  const response = await api.delete<{ deleted: number; }>("/api/generations");
  return response.data;
}

export async function approveGeneration(generationId: string, notes?: string): Promise<Generation> {
  const response = await api.post<Generation>(`/api/generations/${generationId}/approve`, { notes: notes ?? null });
  return response.data;
}

export async function rejectGeneration(generationId: string, notes?: string): Promise<Generation> {
  const response = await api.post<Generation>(`/api/generations/${generationId}/reject`, { notes: notes ?? null });
  return response.data;
}

export async function publishGeneration(generationId: string, notes?: string): Promise<Generation> {
  const response = await api.post<Generation>(`/api/generations/${generationId}/publish`, { notes: notes ?? null });
  return response.data;
}

export async function getSettings(): Promise<SettingsResponse> {
  const response = await api.get<SettingsResponse>("/api/settings");
  return response.data;
}

export async function updateSettings(payload: SettingsPayload): Promise<SettingsResponse> {
  const response = await api.put<SettingsResponse>("/api/settings", payload);
  return response.data;
}

export async function setApiKey(apiKey: string): Promise<void> {
  await api.put("/api/settings/api-key", { api_key: apiKey });
}

export async function testApiKey(): Promise<{ ok: boolean; detail: string; }> {
  const response = await api.post<{ ok: boolean; detail: string; }>("/api/settings/test-api-key");
  return response.data;
}

export async function uploadPolicyFile(file: File): Promise<PolicyUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<PolicyUploadResponse>("/api/policies/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
