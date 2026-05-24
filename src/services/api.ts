import axios from 'axios';

// All requests use the /api prefix which Vite proxies to the real backend.
// The proxy target is configured in vite.config.ts via VITE_API_BASE_URL.
const BASE = '/api';

const api = axios.create({
  baseURL: BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptor: attach token automatically ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RegisterPayload {
  fullname: string;
  citizenid: string;
  phonenumber: string;
  dateofbirth: string; // format: YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  province: string;
  district: string;
  ward: string;
  avatarurl?: string;
  password: string;
}

export const authService = {
  register: async (userData: RegisterPayload) => {
    const response = await api.post('auth/register', userData);
    return response.data;
  },
  login: async (credentials: { citizenid: string; password: string }) => {
    // OAuth2 Password Flow requires application/x-www-form-urlencoded
    // and the field must be named "username"
    const formBody = new URLSearchParams({
      username: credentials.citizenid,
      password: credentials.password,
    });
    const response = await api.post('auth/login', formBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
};

// ─── Chat types ───────────────────────────────────────────────────────────────
export interface ChatMessageCreate {
  idchatsession: string;
  msgcontent: string;
  isfromuser?: boolean;
}

export type SSEProgressEvent = {
  type: 'progress';
  node?: string;
  message?: string;
  /** Present when backend wraps a dynamic_form payload inside a progress event */
  data?: Record<string, any>;
};

export type SSEResultEvent = {
  type: 'result';
  node?: string;
  message: string;
  answer?: string;
  data?: any;
};

export type SSEDoneEvent = {
  type: 'done';
  idchatmessage: string;
};

export type SSEErrorEvent = {
  type: 'error';
  message: string;
};

/** Emitted when the backend wants the UI to render a dynamic form */
export type SSEDynamicFormEvent = {
  type: 'dynamic_form';
  kind: 'dynamic_form';
  request_id: string;
  title: string;
  description?: string;
  submit_label?: string;
  pdf_path?: string | null;
  fields: Array<{
    field_id: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    x?: number | null;
    y?: number | null;
  }>;
};

export type SSEEvent =
  | SSEProgressEvent
  | SSEResultEvent
  | SSEDoneEvent
  | SSEErrorEvent
  | SSEDynamicFormEvent;

// ─── Chat service ─────────────────────────────────────────────────────────────
export const chatService = {
  /**
   * Opens an SSE stream to /message/stream.
   * Calls `onEvent` for every parsed SSE event.
   * Returns an AbortController so the caller can cancel the request.
   */
  streamMessage(
    payload: ChatMessageCreate,
    onEvent: (event: SSEEvent) => void,
    onError?: (err: Error) => void,
    onFinish?: () => void,
  ): AbortController {
    const controller = new AbortController();

    const url = '/api/message/stream';
    const token = localStorage.getItem('access_token');

    (async () => {
      try {
        console.debug('[stream] token:', token ? `${token.slice(0, 20)}...` : 'MISSING');
        console.debug('[stream] POST', url, payload);

        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
          const errorBody = await response.text().catch(() => '');
          console.error('[stream] error body:', errorBody);
          throw new Error(`HTTP ${response.status}: ${response.statusText} — ${errorBody}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE messages are separated by double newlines
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data:')) continue;

            const jsonStr = line.slice('data:'.length).trim();
            if (!jsonStr) continue;

            try {
              const parsed: SSEEvent = JSON.parse(jsonStr);
              onEvent(parsed);
            } catch {
              // malformed JSON – ignore
            }
          }
        }
        onFinish?.();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          onError?.(err as Error);
        }
      }
    })();

    return controller;
  },
};

// ─── Session service ──────────────────────────────────────────────────────────
export interface ChatSession {
  idchatsession: string;
  iduser?: number;
  status?: string;
  endeddate?: string | null;
  createddate: string;
  title?: string;
  first_message?: string;
  [key: string]: any;
}

export interface BackendChatMessage {
  idchatmessage?: string;
  idchatsession?: string;
  msgcontent?: string;
  isfromuser?: boolean;
  sentat?: string;
  [key: string]: any;
}

export const sessionService = {
  createSession: async (): Promise<ChatSession> => {
    const response = await api.post('chat/new');
    return response.data;
  },
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await api.get('chat');
    return response.data;
  },
  deleteSession: async (sessionId: string): Promise<any> => {
    const response = await api.delete(`chat/${sessionId}`);
    return response.data;
  },
  getSessionDetails: async (sessionId: string): Promise<BackendChatMessage[]> => {
    const response = await api.get(`chat/${sessionId}`);
    return response.data;
  },
};

// ─── Dynamic Form service ────────────────────────────────────────────────────
export interface DynamicFormSubmitRequest {
  request_id: string;
  idchatsession: string;
  values: Record<string, string | boolean>;
}

export const formService = {
  /**
   * Submits a filled dynamic form and streams the assistant reply via SSE.
   * Mirrors chatService.streamMessage but POSTs to /message/forms/submit.
   */
  submitForm(
    payload: DynamicFormSubmitRequest,
    onEvent: (event: SSEEvent) => void,
    onError?: (err: Error) => void,
    onFinish?: () => void,
  ): AbortController {
    const controller = new AbortController();
    const url = '/api/message/forms/submit';
    const token = localStorage.getItem('access_token');

    (async () => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
          const errorBody = await response.text().catch(() => '');
          throw new Error(`HTTP ${response.status}: ${response.statusText} — ${errorBody}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data:')) continue;
            const jsonStr = line.slice('data:'.length).trim();
            if (!jsonStr) continue;
            try {
              const parsed: SSEEvent = JSON.parse(jsonStr);
              onEvent(parsed);
            } catch {
              // malformed JSON – ignore
            }
          }
        }
        onFinish?.();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          onError?.(err as Error);
        }
      }
    })();

    return controller;
  },
};

export default api;
