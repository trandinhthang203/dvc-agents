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
  node: string;
  message: string;
};

export type SSEResultEvent = {
  type: 'result';
  node: string;
  message: string;
  answer?: string;
};

export type SSEDoneEvent = {
  type: 'done';
  idchatmessage: string;
};

export type SSEErrorEvent = {
  type: 'error';
  message: string;
};

export type SSEEvent = SSEProgressEvent | SSEResultEvent | SSEDoneEvent | SSEErrorEvent;

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
