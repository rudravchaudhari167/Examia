/**
 * Date/time schedule helpers & multi-classroom utility functions.
 */

export function formatMinutes12h(totalMinutes) {
  const minsInDay = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(minsInDay / 60);
  const m = minsInDay % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return null;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
}

export function resolveSessionDurationsMinutes(config) {
  const maxPerDay = Number(config?.maxExamsPerDay) || 0;
  const fallback = Number(config?.examDurationMinutes) > 0 ? Math.round(Number(config.examDurationMinutes)) : 180;
  if (maxPerDay <= 0) return [];
  const raw = Array.isArray(config?.sessionDurationsMinutes) ? config.sessionDurationsMinutes : [];
  const resolved = [];
  for (let i = 0; i < maxPerDay; i++) {
    const candidate = i < raw.length ? Number(raw[i]) : NaN;
    if (Number.isFinite(candidate) && candidate > 0) {
      resolved.push(Math.round(candidate));
    } else {
      resolved.push(i > 0 ? resolved[i - 1] : fallback);
    }
  }
  return resolved;
}

export function buildDailySessionPreview(config) {
  const startMin = parseTimeToMinutes(config?.dailyStartTime);
  const breakMin = Number(config?.breakDurationMinutes);
  const maxPerDay = Number(config?.maxExamsPerDay) || 0;

  if (startMin === null || !Number.isFinite(breakMin) || breakMin < 0 || maxPerDay <= 0) {
    return { isValid: false, error: 'Enter valid timing values.', sessions: [] };
  }

  const durations = resolveSessionDurationsMinutes(config);
  for (let i = 0; i < durations.length; i++) {
    if (!Number.isFinite(durations[i]) || durations[i] < 15 || durations[i] > 720) {
      return {
        isValid: false,
        error: `Session ${i + 1} duration must be between 0.25 and 12 hours (15 to 720 minutes).`,
        sessions: [],
      };
    }
  }

  let cursor = startMin;
  const sessions = [];
  for (let i = 0; i < maxPerDay; i++) {
    const dur = durations[i];
    const s = cursor;
    const e = s + dur;
    sessions.push({
      sessionIndex: i + 1,
      durationMinutes: dur,
      startTime: formatMinutes12h(s),
      endTime: formatMinutes12h(e),
    });
    cursor = e + breakMin;
  }

  const lastEnd = startMin + durations.reduce((sum, d) => sum + d, 0) + (maxPerDay - 1) * breakMin;
  if (lastEnd > 1440) {
    return {
      isValid: false,
      error: 'Daily exams and breaks extend past midnight. Reduce exams per day, session durations, or start earlier.',
      sessions: [],
    };
  }

  return { isValid: true, error: null, sessions };
}

export function formatIsoDateDisplay(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || '—';
  const [y, m, d] = isoDate.split('-').map((n) => parseInt(n, 10));
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
