/**
 * Unified REST API Client for Examia's Java + SQLite Backend.
 * Prefers /api/* (proxied to localhost:8080) and automatically falls back
 * to persistent localFallbackApi when running statically (e.g., Vercel)
 * or without the Java backend started.
 */

import { localFallbackApi } from './localFallbackStore';

const API_BASE = '/api';

function extractErrorMessage(data, status) {
  if (!data) return `Request failed with status ${status}`;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed && trimmed !== '[object Object]' ? trimmed : `Request failed with status ${status}`;
  }
  if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
  if (data.error && typeof data.error === 'object') {
    if (typeof data.error.message === 'string' && data.error.message.trim()) {
      return data.error.message.trim();
    }
    if (typeof data.error.error === 'string' && data.error.error.trim()) {
      return data.error.error.trim();
    }
    if (typeof data.error.code === 'string') {
      return `Error ${data.error.code}`;
    }
  }
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  if (data.message && typeof data.message === 'object') {
    if (typeof data.message.text === 'string' && data.message.text.trim()) {
      return data.message.text.trim();
    }
    if (typeof data.message.error === 'string' && data.message.error.trim()) {
      return data.message.error.trim();
    }
  }
  return `Request failed with status ${status}`;
}

function isBackendUnavailableStatus(status, data) {
  if (status === 404 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  // Vite / static host 500 without an Examia JSON { error } payload means proxy target is unreachable
  if (status === 500 && (!data || !data.error || typeof data.error !== 'string')) {
    return true;
  }
  // Non-JSON HTML responses on /api routes indicate static host fallback
  if (data && typeof data.raw === 'string' && /<html|<!doctype/i.test(data.raw)) {
    return true;
  }
  return false;
}

async function apiRequest(path, options = {}, fallbackFn = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      method: options.method || 'GET',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!res.ok) {
      if (fallbackFn && isBackendUnavailableStatus(res.status, data)) {
        return fallbackFn();
      }
      const err = new Error(extractErrorMessage(data, res.status));
      err.status = res.status;
      err.payload = data;
      throw err;
    }

    if (fallbackFn && data && typeof data.raw === 'string') {
      return fallbackFn();
    }

    return data;
  } catch (err) {
    const isNetworkOrAbort =
      err?.name === 'AbortError' || err instanceof TypeError || err?.isNetworkError;
    if (isNetworkOrAbort && fallbackFn) {
      return fallbackFn();
    }
    if (err?.name === 'AbortError') {
      throw new Error('Backend request timed out. Ensure the Java server is running on port 8080.');
    }
    if (err instanceof TypeError) {
      const connErr = new Error(
        'Cannot connect to the Examia Java backend server (port 8080). Start it with ./run-backend.sh or ./start.sh.'
      );
      connErr.isNetworkError = true;
      throw connErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkBackendHealth() {
  return apiRequest('/health', { timeoutMs: 2500 });
}

export async function fetchBootstrapState() {
  return apiRequest('/bootstrap', {}, () => localFallbackApi.fetchBootstrapState());
}

export async function createSubject(subject) {
  return apiRequest('/subjects', { method: 'POST', body: subject }, () =>
    localFallbackApi.createSubject(subject)
  );
}

export async function updateSubject(subject) {
  return apiRequest('/subjects', { method: 'PUT', body: subject }, () =>
    localFallbackApi.updateSubject(subject)
  );
}

export async function deleteSubject(id) {
  return apiRequest(`/subjects?id=${encodeURIComponent(id)}`, { method: 'DELETE' }, () =>
    localFallbackApi.deleteSubject(id)
  );
}

export async function createStudentGroup(group) {
  return apiRequest('/groups', { method: 'POST', body: group }, () =>
    localFallbackApi.createStudentGroup(group)
  );
}

export async function updateStudentGroup(group) {
  return apiRequest('/groups', { method: 'PUT', body: group }, () =>
    localFallbackApi.updateStudentGroup(group)
  );
}

export async function deleteStudentGroup(id) {
  return apiRequest(`/groups?id=${encodeURIComponent(id)}`, { method: 'DELETE' }, () =>
    localFallbackApi.deleteStudentGroup(id)
  );
}

export async function updateSubjectEnrolments({ subjectId, groupIds, groupId, subjectIds }) {
  return apiRequest(
    '/enrolments',
    {
      method: 'PUT',
      body: { subjectId, groupIds, groupId, subjectIds },
    },
    () => localFallbackApi.updateSubjectEnrolments({ subjectId, groupIds, groupId, subjectIds })
  );
}

export async function createClassroom(classroom) {
  return apiRequest('/classrooms', { method: 'POST', body: classroom }, () =>
    localFallbackApi.createClassroom(classroom)
  );
}

export async function updateClassroom(classroom) {
  return apiRequest('/classrooms', { method: 'PUT', body: classroom }, () =>
    localFallbackApi.updateClassroom(classroom)
  );
}

export async function deleteClassroom(id, clearSchedule = false) {
  return apiRequest(
    `/classrooms?id=${encodeURIComponent(id)}&clearSchedule=${clearSchedule ? 'true' : 'false'}`,
    { method: 'DELETE' },
    () => localFallbackApi.deleteClassroom(id, clearSchedule)
  );
}

export async function saveExamConfiguration(config) {
  return apiRequest('/config', { method: 'PUT', body: config }, () =>
    localFallbackApi.saveExamConfiguration(config)
  );
}

export async function generateExaminationTimetable({ algorithm, maxSlots = 0, config }) {
  return apiRequest(
    '/timetable/generate',
    {
      method: 'POST',
      body: { algorithm, maxSlots, config },
      timeoutMs: 15000,
    },
    () => localFallbackApi.generateExaminationTimetable({ algorithm, maxSlots, config })
  );
}

export async function clearGeneratedTimetable() {
  return apiRequest('/timetable', { method: 'DELETE' }, () =>
    localFallbackApi.clearGeneratedTimetable()
  );
}

export async function resetSampleDataset() {
  return apiRequest('/reset', { method: 'POST' }, () => localFallbackApi.resetSampleDataset());
}
