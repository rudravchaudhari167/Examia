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

export function formatMinutes24h(totalMinutes) {
  const clamped = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function resolveSessionStartTimes(config) {
  const maxPerDay = Number(config?.maxExamsPerDay) || 0;
  if (maxPerDay <= 0) return [];
  const durations = resolveSessionDurationsMinutes(config);
  const raw = Array.isArray(config?.sessionStartTimes) ? config.sessionStartTimes : [];
  const baseMin = parseTimeToMinutes(config?.dailyStartTime);
  const safeBreak = Number.isFinite(Number(config?.breakDurationMinutes))
    ? Math.max(0, Number(config.breakDurationMinutes))
    : 60;

  let cursorMin = baseMin !== null ? baseMin : 9 * 60;
  const resolved = [];
  for (let i = 0; i < maxPerDay; i++) {
    const candidateMin = i < raw.length ? parseTimeToMinutes(raw[i]) : null;
    const startMin = candidateMin !== null ? candidateMin : Math.min(1439, Math.max(0, cursorMin));
    resolved.push(formatMinutes24h(startMin));
    cursorMin = startMin + (durations[i] || 180) + safeBreak;
  }
  return resolved;
}

export function buildDailySessionPreview(config) {
  const breakMin = Number(config?.breakDurationMinutes);
  const maxPerDay = Number(config?.maxExamsPerDay) || 0;

  if (!Number.isFinite(breakMin) || breakMin < 0 || maxPerDay <= 0) {
    return { isValid: false, error: 'Enter valid timing values.', sessions: [] };
  }

  const durations = resolveSessionDurationsMinutes(config);
  const startTimes = resolveSessionStartTimes(config);
  const rawStartTimes = Array.isArray(config?.sessionStartTimes) ? config.sessionStartTimes : null;

  const sessions = [];
  let prevEnd = -1;

  for (let i = 0; i < maxPerDay; i++) {
    const startTime24 = startTimes[i];
    const explicitInvalid = rawStartTimes && i < rawStartTimes.length && parseTimeToMinutes(rawStartTimes[i]) === null;
    const s = parseTimeToMinutes(startTime24);
    if (explicitInvalid || s === null) {
      return {
        isValid: false,
        error: `Select a valid start time for Session ${i + 1}.`,
        sessions: [],
      };
    }

    const dur = durations[i];
    if (!Number.isFinite(dur) || dur < 15 || dur > 720) {
      return {
        isValid: false,
        error: `Session ${i + 1} duration must be between 0.25 and 12 hours (15 to 720 minutes).`,
        sessions: [],
      };
    }

    if (i > 0 && s < prevEnd) {
      return {
        isValid: false,
        error: `Session ${i + 1} start time (${formatMinutes12h(s)}) overlaps Session ${i} (ends at ${formatMinutes12h(prevEnd)}).`,
        sessions: [],
      };
    }

    const e = s + dur;
    if (e > 1440) {
      return {
        isValid: false,
        error: `Session ${i + 1} extends past midnight (${formatMinutes12h(s)} + ${dur} min). Adjust session time or duration.`,
        sessions: [],
      };
    }

    sessions.push({
      sessionIndex: i + 1,
      startTime24,
      durationMinutes: dur,
      startTime: formatMinutes12h(s),
      endTime: formatMinutes12h(e),
    });
    prevEnd = e;
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
