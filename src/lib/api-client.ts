/**
 * Fight Mecca API Client Base & Domain Services
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error (${response.status}): ${errText}`);
  }
  return response.json();
}

export const referenceApi = {
  list: (techniqueId?: string, type?: string) => {
    let url = '/api/references';
    const params = new URLSearchParams();
    if (techniqueId) params.append('technique_id', techniqueId);
    if (type) params.append('reference_type', type);
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient<any[]>(url);
  },
  getById: (id: string) => apiClient<any>(`/api/references/${id}`),
  create: (payload: any) => apiClient<any>('/api/references', { method: 'POST', body: JSON.stringify(payload) }),
};

export const captureApi = {
  createSession: (payload: any) => apiClient<any>('/api/capture/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  getSession: (sessionId: string) => apiClient<any>(`/api/capture/sessions/${sessionId}`),
  createTemplate: (payload: any) => apiClient<any>('/api/capture/templates', { method: 'POST', body: JSON.stringify(payload) }),
  getTemplate: (templateId: string) => apiClient<any>(`/api/capture/templates/${templateId}`),
};

export const trainingApi = {
  listSessions: (mode?: string, techniqueId?: string) => {
    let url = '/api/training/sessions';
    const params = new URLSearchParams();
    if (mode) params.append('mode', mode);
    if (techniqueId) params.append('technique_id', techniqueId);
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient<any[]>(url);
  },
  getSession: (id: string) => apiClient<any>(`/api/training/sessions/${id}`),
  createSession: (payload: any) => apiClient<any>('/api/training/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  finalizeTechnique: (payload: any) => apiClient<any>('/api/training/technique/finalize', { method: 'POST', body: JSON.stringify(payload) }),
};

export const analysisApi = {
  createComparison: (payload: any) => apiClient<any>('/api/analysis/comparisons', { method: 'POST', body: JSON.stringify(payload) }),
  getComparison: (id: string) => apiClient<any>(`/api/analysis/comparisons/${id}`),
  createJudgement: (payload: any) => apiClient<any>('/api/analysis/judgements', { method: 'POST', body: JSON.stringify(payload) }),
  getJudgement: (id: string) => apiClient<any>(`/api/analysis/judgements/${id}`),
};

export const avatarApi = {
  saveProfile: (payload: any) => apiClient<any>('/api/avatar/profiles', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: (id: string) => apiClient<any>(`/api/avatar/profiles/${id}`),
  getLatestAthleteProfile: (athleteId: string) => apiClient<any>(`/api/avatar/profiles/athlete/${athleteId}`),
};
