import { buildConflictGraph } from '../algorithms/graph';
import { runGreedyColoring } from '../algorithms/greedyColoring';
import { runBacktrackingColoring } from '../algorithms/backtrackingColoring';
import {
  buildDailySessionPreview,
  resolveSessionDurationsMinutes,
  resolveSessionStartTimes,
} from '../algorithms/roomAllocator';

const STORAGE_KEY = 'examia_local_fallback_db_v1';

function createInitialDb() {
  return {
    studentGroups: [
      { id: 'div-a', name: 'Division A', studentCount: 45, department: 'Computer Engineering', semester: 'Semester IV' },
      { id: 'div-b', name: 'Division B', studentCount: 45, department: 'Computer Engineering', semester: 'Semester IV' },
      { id: 'div-c', name: 'Division C', studentCount: 40, department: 'Information Technology', semester: 'Semester IV' },
    ],
    subjects: [
      { id: 'sub-1', code: 'CS201', name: 'Java Programming', category: 'Core Computer Science', groupIds: ['div-a', 'div-b'] },
      { id: 'sub-2', code: 'CS202', name: 'Data Structures', category: 'Core Computer Science', groupIds: ['div-a'] },
      { id: 'sub-3', code: 'CS203', name: 'DBMS', category: 'Information Systems', groupIds: ['div-b', 'div-c'] },
      { id: 'sub-4', code: 'CS204', name: 'Operating Systems', category: 'Systems & Infrastructure', groupIds: ['div-a', 'div-c'] },
      { id: 'sub-5', code: 'MA201', name: 'Mathematics', category: 'Applied Mathematics', groupIds: ['div-a', 'div-b', 'div-c'] },
    ],
    classrooms: [
      { id: 'room-101', name: 'A101', building: 'Main Block', capacity: 60, isAvailable: true },
      { id: 'room-102', name: 'A102', building: 'Main Block', capacity: 40, isAvailable: true },
      { id: 'room-103', name: 'Auditorium 103', building: 'Academic Wing', capacity: 100, isAvailable: true },
      { id: 'room-104', name: 'Hall 104', building: 'Academic Wing', capacity: 80, isAvailable: true },
      { id: 'room-105', name: 'Mega Hall 201', building: 'Examination Complex', capacity: 150, isAvailable: true },
    ],
    config: {
      startDate: '2026-11-20',
      dailyStartTime: '09:00',
      examDurationMinutes: 180,
      breakDurationMinutes: 60,
      numDays: 5,
      maxExamsPerDay: 2,
      sessionDurationsMinutes: [180, 180],
      sessionStartTimes: ['09:00', '13:00'],
    },
    latestTimetable: null,
    algoRuns: { greedy: null, backtracking: null },
  };
}

function makeError(status, message, extra = {}) {
  const err = new Error(message);
  err.status = status;
  err.payload = { error: message, ...extra };
  return err;
}

function readDb() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createInitialDb();
      saveDb(seed);
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.studentGroups)) {
      const seed = createInitialDb();
      saveDb(seed);
      return seed;
    }
    return parsed;
  } catch {
    return createInitialDb();
  }
}

function saveDb(db) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore storage quota issues cleanly
  }
}

function enrichSubjects(db) {
  const groupMap = new Map(db.studentGroups.map((g) => [g.id, g]));
  return [...db.subjects]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((s) => {
      const distinctGroupIds = Array.from(new Set(s.groupIds || [])).filter((gid) =>
        groupMap.has(gid)
      );
      const divisions = distinctGroupIds.map((gid) => groupMap.get(gid).name);
      const studentCount = distinctGroupIds.reduce(
        (sum, gid) => sum + (Number(groupMap.get(gid)?.studentCount) || 0),
        0
      );
      return {
        ...s,
        groupIds: distinctGroupIds,
        divisions,
        studentCount,
        allocationBasis: 'group_count',
      };
    });
}

function enrichGroups(db) {
  return [...db.studentGroups]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((g) => {
      const subjectCount = db.subjects.filter((s) => (s.groupIds || []).includes(g.id)).length;
      return { ...g, subjectCount };
    });
}

function enrichClassrooms(db) {
  const allocCounts = new Map();
  if (db.latestTimetable?.scheduledExams) {
    for (const exam of db.latestTimetable.scheduledExams) {
      for (const alloc of exam.classroomAllocations || []) {
        allocCounts.set(alloc.classroomId, (allocCounts.get(alloc.classroomId) || 0) + 1);
      }
    }
  }
  return [...db.classrooms]
    .sort((a, b) => Number(a.capacity) - Number(b.capacity) || a.name.localeCompare(b.name))
    .map((c) => ({
      ...c,
      scheduledAssignmentsCount: allocCounts.get(c.id) || 0,
    }));
}

function buildBootstrap(db) {
  return {
    subjects: enrichSubjects(db),
    studentGroups: enrichGroups(db),
    classrooms: enrichClassrooms(db),
    config: db.config,
    latestTimetable: db.latestTimetable,
    algoRuns: db.algoRuns || { greedy: null, backtracking: null },
    allocationMode: 'group_count',
    storageMode: 'browser',
  };
}

function clearSchedulesOnMutation(db) {
  db.latestTimetable = null;
  db.algoRuns = { greedy: null, backtracking: null };
}

function addDaysIso(isoDate, daysToAdd) {
  const [y, m, d] = isoDate.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d + daysToAdd));
  return dt.toISOString().slice(0, 10);
}

function allocateClassrooms(studentCount, freeRooms) {
  if (studentCount <= 0) {
    return [];
  }
  const byAsc = [...freeRooms].sort(
    (a, b) => a.capacity - b.capacity || a.name.localeCompare(b.name)
  );
  const singleFit = byAsc.find((r) => r.capacity >= studentCount);
  if (singleFit) {
    return [
      {
        id: `alloc-${singleFit.id}`,
        classroomId: singleFit.id,
        classroomName: singleFit.name,
        building: singleFit.building || '',
        capacity: singleFit.capacity,
        allocatedStudents: studentCount,
        remainingSeats: singleFit.capacity - studentCount,
      },
    ];
  }

  const byDesc = [...freeRooms].sort(
    (a, b) => b.capacity - a.capacity || a.name.localeCompare(b.name)
  );
  const pool = [...byDesc];
  const chosen = [];
  let remaining = studentCount;

  while (remaining > 0 && pool.length > 0) {
    const ascPool = [...pool].sort(
      (a, b) => a.capacity - b.capacity || a.name.localeCompare(b.name)
    );
    const fitIdx = ascPool.findIndex((r) => r.capacity >= remaining);
    const picked = fitIdx !== -1 ? ascPool[fitIdx] : pool[0];
    const pIdx = pool.findIndex((r) => r.id === picked.id);
    if (pIdx !== -1) pool.splice(pIdx, 1);

    const allocCount = Math.min(picked.capacity, remaining);
    chosen.push({
      id: `alloc-${picked.id}`,
      classroomId: picked.id,
      classroomName: picked.name,
      building: picked.building || '',
      capacity: picked.capacity,
      allocatedStudents: allocCount,
      remainingSeats: picked.capacity - allocCount,
    });
    remaining -= allocCount;
  }

  return chosen;
}

export const localFallbackApi = {
  fetchBootstrapState() {
    return buildBootstrap(readDb());
  },

  createSubject(subject) {
    const db = readDb();
    const code = String(subject?.code || '').trim().toUpperCase();
    const name = String(subject?.name || '').trim();
    const category = String(subject?.category || 'General').trim() || 'General';
    if (!code || !name) {
      throw makeError(400, 'Subject code and subject name are required.');
    }
    if (db.subjects.some((s) => s.code.toUpperCase() === code)) {
      throw makeError(400, `A subject with code "${code}" already exists.`);
    }
    const validGroupIds = new Set(db.studentGroups.map((g) => g.id));
    const groupIds = Array.from(new Set(subject?.groupIds || [])).filter((id) =>
      validGroupIds.has(id)
    );
    const created = {
      id: `sub-${crypto?.randomUUID ? crypto.randomUUID() : Date.now()}`,
      code,
      name,
      category,
      groupIds,
    };
    db.subjects.push(created);
    clearSchedulesOnMutation(db);
    saveDb(db);
    return enrichSubjects(db).find((s) => s.id === created.id);
  },

  updateSubject(subject) {
    const db = readDb();
    const id = String(subject?.id || '').trim();
    const code = String(subject?.code || '').trim().toUpperCase();
    const name = String(subject?.name || '').trim();
    if (!id || !code || !name) {
      throw makeError(400, 'Subject id, code, and name are required.');
    }
    const idx = db.subjects.findIndex((s) => s.id === id);
    if (idx === -1) throw makeError(400, 'Subject not found.');
    if (db.subjects.some((s) => s.id !== id && s.code.toUpperCase() === code)) {
      throw makeError(400, `Another subject already uses code "${code}".`);
    }
    const validGroupIds = new Set(db.studentGroups.map((g) => g.id));
    const nextGroupIds = Array.isArray(subject?.groupIds)
      ? Array.from(new Set(subject.groupIds)).filter((gid) => validGroupIds.has(gid))
      : db.subjects[idx].groupIds;
    db.subjects[idx] = {
      ...db.subjects[idx],
      code,
      name,
      category: String(subject?.category || db.subjects[idx].category || 'General').trim() || 'General',
      groupIds: nextGroupIds,
    };
    clearSchedulesOnMutation(db);
    saveDb(db);
    return enrichSubjects(db).find((s) => s.id === id);
  },

  deleteSubject(id) {
    const db = readDb();
    db.subjects = db.subjects.filter((s) => s.id !== id);
    clearSchedulesOnMutation(db);
    saveDb(db);
    return buildBootstrap(db);
  },

  createStudentGroup(group) {
    const db = readDb();
    const name = String(group?.name || '').trim();
    const studentCount = parseInt(group?.studentCount, 10);
    if (!name || Number.isNaN(studentCount) || studentCount <= 0) {
      throw makeError(400, 'Division name and positive student count are required.');
    }
    if (db.studentGroups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      throw makeError(400, `Division "${name}" already exists.`);
    }
    const created = {
      id: `div-${crypto?.randomUUID ? crypto.randomUUID() : Date.now()}`,
      name,
      studentCount,
      department: String(group?.department || '').trim(),
      semester: String(group?.semester || '').trim(),
    };
    db.studentGroups.push(created);
    clearSchedulesOnMutation(db);
    saveDb(db);
    return enrichGroups(db).find((g) => g.id === created.id);
  },

  updateStudentGroup(group) {
    const db = readDb();
    const id = String(group?.id || '').trim();
    const name = String(group?.name || '').trim();
    const studentCount = parseInt(group?.studentCount, 10);
    if (!id || !name || Number.isNaN(studentCount) || studentCount <= 0) {
      throw makeError(400, 'Division id, name, and positive student count are required.');
    }
    const idx = db.studentGroups.findIndex((g) => g.id === id);
    if (idx === -1) throw makeError(400, 'Division not found.');
    if (db.studentGroups.some((g) => g.id !== id && g.name.toLowerCase() === name.toLowerCase())) {
      throw makeError(400, `Another division is already named "${name}".`);
    }
    db.studentGroups[idx] = {
      ...db.studentGroups[idx],
      name,
      studentCount,
      department: String(group?.department ?? db.studentGroups[idx].department ?? '').trim(),
      semester: String(group?.semester ?? db.studentGroups[idx].semester ?? '').trim(),
    };
    clearSchedulesOnMutation(db);
    saveDb(db);
    return enrichGroups(db).find((g) => g.id === id);
  },

  deleteStudentGroup(id) {
    const db = readDb();
    db.studentGroups = db.studentGroups.filter((g) => g.id !== id);
    db.subjects = db.subjects.map((s) => ({
      ...s,
      groupIds: (s.groupIds || []).filter((gid) => gid !== id),
    }));
    clearSchedulesOnMutation(db);
    saveDb(db);
    return buildBootstrap(db);
  },

  updateSubjectEnrolments({ subjectId, groupIds, groupId, subjectIds }) {
    const db = readDb();
    if (subjectId) {
      const idx = db.subjects.findIndex((s) => s.id === subjectId);
      if (idx === -1) throw makeError(400, 'Subject not found.');
      const validGroups = new Set(db.studentGroups.map((g) => g.id));
      db.subjects[idx] = {
        ...db.subjects[idx],
        groupIds: Array.from(new Set(groupIds || [])).filter((gid) => validGroups.has(gid)),
      };
    } else if (groupId) {
      const targetSubjIds = new Set(subjectIds || []);
      db.subjects = db.subjects.map((s) => {
        const nextIds = new Set(s.groupIds || []);
        if (targetSubjIds.has(s.id)) nextIds.add(groupId);
        else nextIds.delete(groupId);
        return { ...s, groupIds: Array.from(nextIds) };
      });
    } else {
      throw makeError(400, 'Provide subjectId+groupIds or groupId+subjectIds.');
    }
    clearSchedulesOnMutation(db);
    saveDb(db);
    return buildBootstrap(db);
  },

  createClassroom(classroom) {
    const db = readDb();
    const name = String(classroom?.name || '').trim();
    const building = String(classroom?.building || '').trim();
    const capacity = parseInt(classroom?.capacity, 10);
    const isAvailable = classroom?.isAvailable !== false;
    if (!name || Number.isNaN(capacity) || capacity <= 0) {
      throw makeError(400, 'Classroom name and positive capacity are required.');
    }
    if (db.classrooms.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      throw makeError(400, `Classroom "${name}" already exists.`);
    }
    const created = {
      id: `room-${crypto?.randomUUID ? crypto.randomUUID() : Date.now()}`,
      name,
      building,
      capacity,
      isAvailable,
    };
    db.classrooms.push(created);
    saveDb(db);
    return { ...created, scheduledAssignmentsCount: 0 };
  },

  updateClassroom(classroom) {
    const db = readDb();
    const id = String(classroom?.id || '').trim();
    const name = String(classroom?.name || '').trim();
    const building = String(classroom?.building || '').trim();
    const capacity = parseInt(classroom?.capacity, 10);
    const isAvailable = classroom?.isAvailable !== false;
    if (!id || !name || Number.isNaN(capacity) || capacity <= 0) {
      throw makeError(400, 'Classroom id, name, and positive capacity are required.');
    }
    const idx = db.classrooms.findIndex((c) => c.id === id);
    if (idx === -1) throw makeError(400, 'Classroom not found.');
    if (db.classrooms.some((c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) {
      throw makeError(400, `Another classroom is already named "${name}".`);
    }
    db.classrooms[idx] = { ...db.classrooms[idx], name, building, capacity, isAvailable };
    clearSchedulesOnMutation(db);
    saveDb(db);
    return enrichClassrooms(db).find((c) => c.id === id);
  },

  deleteClassroom(id, clearSchedule = false) {
    const db = readDb();
    const usages = [];
    if (db.latestTimetable?.scheduledExams) {
      for (const exam of db.latestTimetable.scheduledExams) {
        if ((exam.classroomAllocations || []).some((a) => a.classroomId === id)) {
          usages.push({
            subjectCode: exam.subjectCode,
            subjectName: exam.subjectName,
            examDate: exam.examDate,
            startTime: exam.startTime,
            endTime: exam.endTime,
          });
        }
      }
    }
    if (usages.length > 0 && !clearSchedule) {
      const roomName = db.classrooms.find((c) => c.id === id)?.name || id;
      throw makeError(
        409,
        `Classroom "${roomName}" is currently assigned to ${usages.length} scheduled examination(s). Clear the current timetable and delete it, or cancel to keep the schedule.`,
        { inUse: true, usages }
      );
    }
    if (usages.length > 0 && clearSchedule) {
      clearSchedulesOnMutation(db);
    }
    db.classrooms = db.classrooms.filter((c) => c.id !== id);
    saveDb(db);
    return buildBootstrap(db);
  },

  saveExamConfiguration(cfg) {
    const db = readDb();
    const normalizedDurations = resolveSessionDurationsMinutes(cfg);
    const normalizedStarts = resolveSessionStartTimes({
      ...cfg,
      sessionDurationsMinutes: normalizedDurations,
    });
    const normalizedCfg = {
      ...cfg,
      dailyStartTime: normalizedStarts[0] || cfg.dailyStartTime || '09:00',
      examDurationMinutes: normalizedDurations[0] || Number(cfg.examDurationMinutes) || 180,
      sessionDurationsMinutes: normalizedDurations,
      sessionStartTimes: normalizedStarts,
    };
    const preview = buildDailySessionPreview(normalizedCfg);
    if (!preview.isValid) {
      throw makeError(400, preview.error || 'Invalid examination schedule configuration.');
    }
    db.config = {
      startDate: normalizedCfg.startDate,
      dailyStartTime: normalizedCfg.dailyStartTime,
      examDurationMinutes: normalizedDurations[0] || Number(normalizedCfg.examDurationMinutes),
      breakDurationMinutes: Number(normalizedCfg.breakDurationMinutes),
      numDays: Number(normalizedCfg.numDays),
      maxExamsPerDay: Number(normalizedCfg.maxExamsPerDay),
      sessionDurationsMinutes: normalizedDurations,
      sessionStartTimes: normalizedStarts,
    };
    saveDb(db);
    return db.config;
  },

  generateExaminationTimetable({ algorithm = 'greedy', maxSlots = 0, config: incomingConfig }) {
    const db = readDb();
    const cfg = incomingConfig ? this.saveExamConfiguration(incomingConfig) : db.config;
    const subjects = enrichSubjects(db);
    if (subjects.length === 0) {
      throw makeError(400, 'Add at least one subject in Manage Data before generating a timetable.');
    }

    const availableRooms = db.classrooms.filter((c) => c.isAvailable !== false && c.capacity > 0);
    if (availableRooms.length === 0) {
      throw makeError(400, 'Add at least one available classroom in Manage Data before generating a timetable.');
    }

    const graph = buildConflictGraph(subjects);
    const algoKey = algorithm === 'backtracking' ? 'backtracking' : 'greedy';
    const result =
      algoKey === 'backtracking'
        ? runBacktrackingColoring(graph, Number(maxSlots) || 0)
        : runGreedyColoring(graph);

    if (!result.isValid || !result.assignments || Object.keys(result.assignments).length === 0) {
      throw makeError(400, result.statusMessage || 'Unable to generate a valid conflict-free schedule.');
    }

    const totalWindow = cfg.numDays * cfg.maxExamsPerDay;
    if (result.numSlots > totalWindow) {
      throw makeError(
        400,
        `Generated ${result.numSlots} examination slot(s), exceeding the configured window of ${totalWindow} slot(s) (${cfg.numDays} days × ${cfg.maxExamsPerDay} exams/day). Increase exam days or max exams per day.`
      );
    }

    const dailySessions = buildDailySessionPreview(cfg).sessions;
    const examsBySlot = new Map();
    for (const s of subjects) {
      const slot = result.assignments[s.id];
      if (!examsBySlot.has(slot)) examsBySlot.set(slot, []);
      examsBySlot.get(slot).push(s);
    }

    const scheduledExams = [];
    for (let slot = 0; slot < result.numSlots; slot++) {
      const slotSubjects = (examsBySlot.get(slot) || []).sort(
        (a, b) => b.studentCount - a.studentCount || a.code.localeCompare(b.code)
      );
      if (slotSubjects.length === 0) continue;

      const dayIdx = Math.floor(slot / cfg.maxExamsPerDay);
      const sessIdx = slot % cfg.maxExamsPerDay;
      const examDate = addDaysIso(cfg.startDate, dayIdx);
      const session = dailySessions[sessIdx];
      let freeRooms = [...availableRooms];

      for (const s of slotSubjects) {
        const remainingCapacity = freeRooms.reduce((sum, r) => sum + r.capacity, 0);
        if (s.studentCount > remainingCapacity) {
          const deficit = s.studentCount - remainingCapacity;
          throw makeError(
            400,
            `Insufficient classroom capacity in Slot ${slot + 1} (${examDate}, ${session.startTime} – ${session.endTime}) for ${s.code} – ${s.name}: needs ${s.studentCount} seats, only ${remainingCapacity} remaining seats available in this slot. ${deficit} additional seat(s) required.`
          );
        }

        const allocations = allocateClassrooms(s.studentCount, freeRooms).map((a) => ({
          ...a,
          id: `alloc-${s.id}-${a.classroomId}`,
        }));
        const usedIds = new Set(allocations.map((a) => a.classroomId));
        freeRooms = freeRooms.filter((r) => !usedIds.has(r.id));

        scheduledExams.push({
          id: `exam-${slot}-${s.id}`,
          subjectId: s.id,
          subjectCode: s.code,
          subjectName: s.name,
          slotIndex: slot,
          examDate,
          startTime: session.startTime,
          endTime: session.endTime,
          totalStudents: s.studentCount,
          enrolledGroups: s.divisions,
          classroomsAssignedCount: allocations.length,
          classroomAllocations: allocations,
        });
      }
    }

    const ops = result.operationsCount ?? result.recursiveCalls ?? 0;
    const timetable = {
      id: `tt-${Date.now()}`,
      algorithmKey: algoKey,
      algorithmName: result.algorithmName,
      numSlots: result.numSlots,
      executionTimeMs: result.executionTimeMs,
      operationsCount: ops,
      isValid: true,
      statusMessage: result.statusMessage,
      config: cfg,
      allocationMode: 'group_count',
      createdAt: new Date().toISOString(),
      assignments: result.assignments,
      scheduledExams,
    };

    const runSummary = {
      algorithmKey: algoKey,
      algorithmName: result.algorithmName,
      numSlots: result.numSlots,
      executionTimeMs: result.executionTimeMs,
      operationsCount: ops,
      isValid: true,
      statusMessage: result.statusMessage,
    };

    const updatedDb = readDb();
    updatedDb.latestTimetable = timetable;
    updatedDb.algoRuns = { ...(updatedDb.algoRuns || {}), [algoKey]: runSummary };
    saveDb(updatedDb);

    return {
      timetable,
      algoRuns: updatedDb.algoRuns,
      config: updatedDb.config,
      classrooms: enrichClassrooms(updatedDb),
      storageMode: 'browser',
    };
  },

  clearGeneratedTimetable() {
    const db = readDb();
    clearSchedulesOnMutation(db);
    saveDb(db);
    return buildBootstrap(db);
  },

  resetSampleDataset() {
    const seed = createInitialDb();
    saveDb(seed);
    return buildBootstrap(seed);
  },
};

