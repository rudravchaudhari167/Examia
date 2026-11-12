/**
 * Unified REST API Client for Examia's Java + SQLite Backend.
 * Interfaces with /api/* (proxied by Vite to localhost:8080).
 */

const API_BASE = '/api';

async function apiRequest(path, options = {}) {
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
      const err = new Error(data?.error || `Request failed with status ${res.status}`);
      err.status = res.status;
      err.payload = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
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
  return apiRequest('/bootstrap');
}

export async function createSubject(subject) {
  return apiRequest('/subjects', { method: 'POST', body: subject });
}

export async function updateSubject(subject) {
  return apiRequest('/subjects', { method: 'PUT', body: subject });
}

export async function deleteSubject(id) {
  return apiRequest(`/subjects?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function createStudentGroup(group) {
  return apiRequest('/groups', { method: 'POST', body: group });
}

export async function updateStudentGroup(group) {
  return apiRequest('/groups', { method: 'PUT', body: group });
}

export async function deleteStudentGroup(id) {
  return apiRequest(`/groups?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function updateSubjectEnrolments({ subjectId, groupIds, groupId, subjectIds }) {
  return apiRequest('/enrolments', {
    method: 'PUT',
    body: { subjectId, groupIds, groupId, subjectIds },
  });
}

export async function createClassroom(classroom) {
  return apiRequest('/classrooms', { method: 'POST', body: classroom });
}

export async function updateClassroom(classroom) {
  return apiRequest('/classrooms', { method: 'PUT', body: classroom });
}

export async function deleteClassroom(id, clearSchedule = false) {
  return apiRequest(
    `/classrooms?id=${encodeURIComponent(id)}&clearSchedule=${clearSchedule ? 'true' : 'false'}`,
    { method: 'DELETE' }
  );
}

export async function saveExamConfiguration(config) {
  return apiRequest('/config', { method: 'PUT', body: config });
}

export async function generateExaminationTimetable({ algorithm, maxSlots = 0, config }) {
  return apiRequest('/timetable/generate', {
    method: 'POST',
    body: { algorithm, maxSlots, config },
    timeoutMs: 15000,
  });
}

export async function clearGeneratedTimetable() {
  return apiRequest('/timetable', { method: 'DELETE' });
}

export async function resetSampleDataset() {
  return apiRequest('/reset', { method: 'POST' });
}
