/**
 * Default sample data for Examia.
 * Includes the required benchmark subjects with shared divisions creating non-trivial conflicts.
 */

export const INITIAL_SUBJECTS = [
  {
    id: "sub-1",
    code: "CS201",
    name: "Java Programming",
    divisions: ["Division A", "Division B"],
    studentCount: 90,
    category: "Core Computer Science"
  },
  {
    id: "sub-2",
    code: "CS202",
    name: "Data Structures",
    divisions: ["Division A"],
    studentCount: 45,
    category: "Core Computer Science"
  },
  {
    id: "sub-3",
    code: "CS203",
    name: "DBMS",
    divisions: ["Division B", "Division C"],
    studentCount: 85,
    category: "Information Systems"
  },
  {
    id: "sub-4",
    code: "CS204",
    name: "Operating Systems",
    divisions: ["Division A", "Division C"],
    studentCount: 80,
    category: "Systems & Infrastructure"
  },
  {
    id: "sub-5",
    code: "MA201",
    name: "Mathematics",
    divisions: ["Division A", "Division B", "Division C"],
    studentCount: 130,
    category: "Applied Mathematics"
  }
];

export const INITIAL_DIVISIONS = [
  {
    id: "div-a",
    name: "Division A",
    studentCount: 45,
    department: "Computer Engineering",
    semester: "Semester IV"
  },
  {
    id: "div-b",
    name: "Division B",
    studentCount: 45,
    department: "Computer Engineering",
    semester: "Semester IV"
  },
  {
    id: "div-c",
    name: "Division C",
    studentCount: 40,
    department: "Information Technology",
    semester: "Semester IV"
  }
];

export const INITIAL_ROOMS = [
  { id: "room-101", name: "Hall 101", capacity: 60, building: "Main Block", floor: "Ground" },
  { id: "room-102", name: "Hall 102", capacity: 40, building: "Main Block", floor: "Ground" },
  { id: "room-103", name: "Auditorium 103", capacity: 100, building: "Academic Wing", floor: "1st Floor" },
  { id: "room-104", name: "Hall 104", capacity: 80, building: "Academic Wing", floor: "1st Floor" },
  { id: "room-105", name: "Mega Hall 201", capacity: 150, building: "Examination Complex", floor: "2nd Floor" }
];

export const SLOT_PALETTES = [
  {
    slot: 0,
    name: "Slot 1 – Blush",
    badgeBg: "#F8EAEE",
    badgeBorder: "#C58E9B",
    textColor: "#642F43",
    fillColor: "#F8EAEE",
    strokeColor: "#C58E9B"
  },
  {
    slot: 1,
    name: "Slot 2 – Dusty Rose",
    badgeBg: "#C58E9B",
    badgeBorder: "#642F43",
    textColor: "#361522",
    fillColor: "#C58E9B",
    strokeColor: "#642F43"
  },
  {
    slot: 2,
    name: "Slot 3 – Soft Rose",
    badgeBg: "#E8CBD3",
    badgeBorder: "#8C4C63",
    textColor: "#361522",
    fillColor: "#E8CBD3",
    strokeColor: "#8C4C63"
  },
  {
    slot: 3,
    name: "Slot 4 – Rich Mauve",
    badgeBg: "#8F4B63",
    badgeBorder: "#4E2132",
    textColor: "#FDF8FA",
    fillColor: "#8F4B63",
    strokeColor: "#4E2132"
  },
  {
    slot: 4,
    name: "Slot 5 – Vintage Burgundy",
    badgeBg: "#642F43",
    badgeBorder: "#D8A9B6",
    textColor: "#FDF8FA",
    fillColor: "#642F43",
    strokeColor: "#D8A9B6"
  },
  {
    slot: 5,
    name: "Slot 6 – Deep Claret",
    badgeBg: "#471D2E",
    badgeBorder: "#C58E9B",
    textColor: "#FDF8FA",
    fillColor: "#471D2E",
    strokeColor: "#C58E9B"
  }
];

export const DEFAULT_TIMETABLE_CONFIG = {
  startDate: "2026-12-01",
  examDaysCount: 5,
  sessionsPerDay: 2,
  morningTiming: "09:30 AM - 12:30 PM",
  afternoonTiming: "02:00 PM - 05:00 PM",
  algorithm: "greedy", // 'greedy' or 'backtracking'
  maxSlots: 0 // 0 means auto-find minimum slots
};

