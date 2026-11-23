import { request } from './client';

export const api = {
  health: () => request('/health'),
  letters: (query) => request('/letters', { query }),
  letter: (symbol, query) => request(`/letters/${encodeURIComponent(symbol)}`, { query }),
  words: (limit = 50) => request('/words', { query: { limit } }),
  exerciseTypes: () => request('/exercise-types'),
  exerciseType: (id) => request(`/exercise-types/${encodeURIComponent(id)}`),
  createChild: (payload) => request('/children', { method: 'POST', body: payload }),
  child: (id) => request(`/children/${encodeURIComponent(id)}`),
  updateChild: (id, payload) => request(`/children/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  updateSettings: (id, payload) => request(`/children/${encodeURIComponent(id)}/settings`, { method: 'PUT', body: payload }),
  sessions: (query) => request('/sessions', { query }),
  createSession: (payload) => request('/sessions', { method: 'POST', body: payload }),
  session: (id) => request(`/sessions/${encodeURIComponent(id)}`),
  updateSession: (id, payload) => request(`/sessions/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteSession: (id) => request(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  dashboard: (id) => request(`/dashboard/${encodeURIComponent(id)}`),
  progress: (id, month) => request(`/progress/${encodeURIComponent(id)}`, { query: { month } }),
  recommendations: (id, limit = 3) => request(`/recommendations/${encodeURIComponent(id)}`, { query: { limit } }),
};
