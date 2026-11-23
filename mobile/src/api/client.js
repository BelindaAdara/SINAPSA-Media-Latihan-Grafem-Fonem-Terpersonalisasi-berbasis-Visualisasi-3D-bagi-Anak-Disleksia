const API_URL = process.env.EXPO_PUBLIC_API_URL;
const REQUEST_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details || [];
  }
}

export async function request(path, { method = 'GET', body, query, signal } = {}) {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL belum diatur pada mobile/.env.');
  const url = new URL(`${API_URL.replace(/\/$/, '')}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const relayAbort = () => controller.abort();
  signal?.addEventListener('abort', relayAbort, { once: true });

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok) {
      const error = payload?.error;
      throw new ApiError(error?.message || 'Permintaan belum berhasil. Coba lagi ya.', response.status, error?.code, error?.details);
    }
    if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data')) {
      throw new Error('Respons API belum sesuai format.');
    }
    return payload.data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Koneksi terlalu lama. Coba lagi ya.');
    if (error instanceof ApiError) throw error;
    if (error instanceof TypeError) throw new Error('Koneksi belum tersambung. Coba lagi ya.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', relayAbort);
  }
}
