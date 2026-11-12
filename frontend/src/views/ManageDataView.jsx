import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  Edit3,
  Info,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import Modal from '../components/Modal';

const TABS = [
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'groups', label: 'Divisions', icon: Users },
  { id: 'classrooms', label: 'Classrooms', icon: Building2 },
];

function formatFormError(err, fallback = 'Operation failed.') {
  if (!err) return fallback;
  if (typeof err === 'string') {
    const trimmed = err.trim();
    return trimmed && trimmed !== '[object Object]' ? trimmed : fallback;
  }
  if (err.payload) {
    if (typeof err.payload === 'string' && err.payload.trim()) return err.payload.trim();
    if (typeof err.payload.error === 'string' && err.payload.error.trim()) return err.payload.error.trim();
    if (typeof err.payload.message === 'string' && err.payload.message.trim()) return err.payload.message.trim();
  }
  if (typeof err.error === 'string' && err.error.trim()) {
    return err.error.trim();
  }
  if (err.error && typeof err.error === 'object') {
    if (typeof err.error.message === 'string' && err.error.message.trim()) {
      return err.error.message.trim();
    }
  }
  if (typeof err.message === 'string' && err.message.trim() && err.message !== '[object Object]') {
    return err.message.trim();
  }
  if (err.message && typeof err.message === 'object') {
    if (typeof err.message.text === 'string' && err.message.text.trim()) {
      return err.message.text.trim();
    }
    if (typeof err.message.error === 'string' && err.message.error.trim()) {
      return err.message.error.trim();
    }
  }
  try {
    const json = JSON.stringify(err);
    if (json && json !== '{}') return json;
  } catch {}
  return fallback;
}

export default function ManageDataView({
  subjects,
  studentGroups,
  classrooms,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onUpdateEnrolments,
  onAddClassroom,
  onEditClassroom,
  onDeleteClassroom,
  onResetSampleData,
}) {
  const baseId = useId();
  const [activeTab, setActiveTab] = useState('subjects');
  const tabRefs = useRef({});
  const [isBusy, setIsBusy] = useState(false);

  // Inline feedback banner (Burgundy/Dusty Rose palette only)
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
  };

  // Search states
  const [subjectSearch, setSubjectSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [classroomSearch, setClassroomSearch] = useState('');

  // Add / Edit Subject Modal state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectCodeInput, setSubjectCodeInput] = useState('');
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [subjectGroupIdsInput, setSubjectGroupIdsInput] = useState([]);
  const [subjectFormError, setSubjectFormError] = useState('');

  // Add / Edit Division Modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupCountInput, setGroupCountInput] = useState('45');
  const [groupFormError, setGroupFormError] = useState('');

  // Add / Edit Classroom Modal state
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [roomNameInput, setRoomNameInput] = useState('');
  const [roomBuildingInput, setRoomBuildingInput] = useState('');
  const [roomCapacityInput, setRoomCapacityInput] = useState('60');
  const [roomAvailableInput, setRoomAvailableInput] = useState(true);
  const [roomFormError, setRoomFormError] = useState('');

  // Delete / Safe Unassign / Reset confirmation modal state
  const [confirmAction, setConfirmAction] = useState(null);

  // Filtered views
  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [subjects, subjectSearch]);

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    if (!q) return studentGroups;
    return studentGroups.filter((g) => g.name.toLowerCase().includes(q));
  }, [studentGroups, groupSearch]);

  const filteredClassrooms = useMemo(() => {
    const q = classroomSearch.trim().toLowerCase();
    if (!q) return classrooms;
    return classrooms.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.building || '').toLowerCase().includes(q)
    );
  }, [classrooms, classroomSearch]);

  // Tab keyboard navigation
  const handleTabKeyDown = (event, index) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = TABS.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      const nextTab = TABS[nextIndex];
      setActiveTab(nextTab.id);
      tabRefs.current[nextTab.id]?.focus();
    }
  };

  // --- Subject Handlers ---
  const openAddSubjectModal = () => {
    setEditingSubject(null);
    setSubjectCodeInput('');
    setSubjectNameInput('');
    setSubjectGroupIdsInput(studentGroups.slice(0, 1).map((g) => g.id));
    setSubjectFormError('');
    setIsSubjectModalOpen(true);
  };

  const openEditSubjectModal = (subj) => {
    setEditingSubject(subj);
    setSubjectCodeInput(subj.code);
    setSubjectNameInput(subj.name);
    setSubjectGroupIdsInput(Array.isArray(subj.groupIds) ? subj.groupIds : []);
    setSubjectFormError('');
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    const cleanCode = subjectCodeInput.trim().toUpperCase();
    const cleanName = subjectNameInput.trim();
    if (!cleanCode) {
      setSubjectFormError('Please enter a subject code (e.g., CS301).');
      return;
    }
    if (!cleanName) {
      setSubjectFormError('Please enter a subject name.');
      return;
    }

    setIsBusy(true);
    setSubjectFormError('');
    try {
      if (editingSubject) {
        await onEditSubject({
          id: editingSubject.id,
          code: cleanCode,
          name: cleanName,
          category: editingSubject.category || 'General',
          groupIds: subjectGroupIdsInput,
        });
        showFeedback('success', `Updated subject ${cleanCode} (${cleanName}).`);
      } else {
        await onAddSubject({
          code: cleanCode,
          name: cleanName,
          category: 'General',
          groupIds: subjectGroupIdsInput,
        });
        showFeedback('success', `Added subject ${cleanCode} (${cleanName}).`);
      }
      setIsSubjectModalOpen(false);
    } catch (err) {
      setSubjectFormError(formatFormError(err, 'Could not save subject.'));
    } finally {
      setIsBusy(false);
    }
  };

  // --- Division Handlers ---
  const openAddGroupModal = () => {
    setEditingGroup(null);
    setGroupNameInput('');
    setGroupCountInput('45');
    setGroupFormError('');
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (group) => {
    setEditingGroup(group);
    setGroupNameInput(group.name);
    setGroupCountInput(String(group.studentCount ?? 45));
    setGroupFormError('');
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    const cleanName = groupNameInput.trim();
    const parsedCount = parseInt(groupCountInput, 10);
    if (!cleanName) {
      setGroupFormError('Please enter a division name (e.g., Division D or Section 2).');
      return;
    }
    if (Number.isNaN(parsedCount) || parsedCount <= 0) {
      setGroupFormError('Student count must be a positive number.');
      return;
    }

    setIsBusy(true);
    setGroupFormError('');
    try {
      if (editingGroup) {
        await onEditGroup({
          id: editingGroup.id,
          name: cleanName,
          studentCount: parsedCount,
          department: editingGroup.department || '',
          semester: editingGroup.semester || '',
        });
        showFeedback('success', `Updated division "${cleanName}" (${parsedCount} students).`);
      } else {
        await onAddGroup({
          name: cleanName,
          studentCount: parsedCount,
        });
        showFeedback('success', `Added division "${cleanName}" (${parsedCount} students).`);
      }
      setIsGroupModalOpen(false);
    } catch (err) {
      setGroupFormError(formatFormError(err, 'Could not save division.'));
    } finally {
      setIsBusy(false);
    }
  };

  // --- Classroom Handlers ---
  const openAddClassroomModal = () => {
    setEditingClassroom(null);
    setRoomNameInput('');
    setRoomBuildingInput('');
    setRoomCapacityInput('60');
    setRoomAvailableInput(true);
    setRoomFormError('');
    setIsClassroomModalOpen(true);
  };

  const openEditClassroomModal = (room) => {
    setEditingClassroom(room);
    setRoomNameInput(room.name);
    setRoomBuildingInput(room.building || '');
    setRoomCapacityInput(String(room.capacity ?? 60));
    setRoomAvailableInput(Boolean(room.isAvailable));
    setRoomFormError('');
    setIsClassroomModalOpen(true);
  };

  const handleSaveClassroom = async (e) => {
    e.preventDefault();
    const cleanName = roomNameInput.trim();
    const cleanBuilding = roomBuildingInput.trim();
    const parsedCap = parseInt(roomCapacityInput, 10);

    if (!cleanName) {
      setRoomFormError('Please enter a classroom name or room number (e.g., A101).');
      return;
    }
    if (Number.isNaN(parsedCap) || parsedCap <= 0) {
      setRoomFormError('Maximum seating capacity must be a positive number.');
      return;
    }

    setIsBusy(true);
    setRoomFormError('');
    try {
      if (editingClassroom) {
        await onEditClassroom({
          id: editingClassroom.id,
          name: cleanName,
          building: cleanBuilding,
          capacity: parsedCap,
          isAvailable: roomAvailableInput,
        });
        showFeedback('success', `Updated classroom "${cleanName}" (Capacity: ${parsedCap}).`);
      } else {
        await onAddClassroom({
          name: cleanName,
          building: cleanBuilding,
          capacity: parsedCap,
          isAvailable: roomAvailableInput,
        });
        showFeedback('success', `Added classroom "${cleanName}" (Capacity: ${parsedCap}).`);
      }
      setIsClassroomModalOpen(false);
    } catch (err) {
      setRoomFormError(formatFormError(err, 'Could not save classroom.'));
    } finally {
      setIsBusy(false);
    }
  };

  // --- Confirmation Modal Execution ---
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsBusy(true);
    try {
      if (confirmAction.type === 'subject') {
        await onDeleteSubject(confirmAction.item.id);
        showFeedback('success', `Deleted subject ${confirmAction.item.code}.`);
        setConfirmAction(null);
      } else if (confirmAction.type === 'group') {
        await onDeleteGroup(confirmAction.item.id);
        showFeedback('success', `Deleted division "${confirmAction.item.name}".`);
        setConfirmAction(null);
      } else if (confirmAction.type === 'classroom') {
        await onDeleteClassroom(confirmAction.item.id, Boolean(confirmAction.clearSchedule));
        showFeedback(
          'success',
          confirmAction.clearSchedule
            ? `Cleared current timetable assignment and deleted classroom "${confirmAction.item.name}".`
            : `Deleted classroom "${confirmAction.item.name}".`
        );
        setConfirmAction(null);
      } else if (confirmAction.type === 'reset') {
        await onResetSampleData();
        showFeedback('success', 'Restored default sample subjects, divisions, and classrooms.');
        setConfirmAction(null);
      }
    } catch (err) {
      if (confirmAction.type === 'classroom' && err.status === 409 && err.payload?.inUse) {
        // Safely escalate to user: show exact scheduled assignments blocking delete
        setConfirmAction({
          type: 'classroom',
          item: confirmAction.item,
          clearSchedule: true,
          title: `Classroom "${confirmAction.item.name}" Is In Use`,
          description: formatFormError(err, 'Classroom is currently assigned to active examinations.'),
          confirmLabel: 'Clear Timetable & Delete Room',
        });
      } else {
        showFeedback('error', formatFormError(err, 'Operation could not be completed.'));
        setConfirmAction(null);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const requestDeleteClassroom = (room) => {
    if (room.scheduledAssignmentsCount > 0) {
      setConfirmAction({
        type: 'classroom',
        item: room,
        clearSchedule: true,
        title: `Classroom "${room.name}" Is Assigned`,
        description: `"${room.name}" is currently assigned to ${room.scheduledAssignmentsCount} scheduled examination(s) in the active timetable. To delete this room safely without leaving broken assignments, clear the current timetable and delete it, or cancel and regenerate first.`,
        confirmLabel: 'Clear Timetable & Delete Room',
      });
    } else {
      setConfirmAction({
        type: 'classroom',
        item: room,
        clearSchedule: false,
        title: `Delete Classroom "${room.name}"?`,
        description: `Remove "${room.name}" (Capacity: ${room.capacity}) from the database?`,
        confirmLabel: 'Delete Classroom',
      });
    }
  };

  const getTabId = (id) => `${baseId}-tab-${id}`;
  const getPanelId = (id) => `${baseId}-panel-${id}`;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#642F43] tracking-tight">
            Manage Exam Data
          </h1>
          <p className="text-xs sm:text-sm text-[#6F4253] mt-0.5">
            Maintain subjects, divisions, and examination classrooms in one workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setConfirmAction({
              type: 'reset',
              title: 'Restore Sample Dataset?',
              description:
                'This resets subjects, divisions, classrooms, and configuration in the database back to the sample dataset.',
              confirmLabel: 'Restore Sample Data',
            })
          }
          className="btn-secondary text-xs min-h-[40px] px-3.5 py-2 flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Restore Sample Data</span>
        </button>
      </div>

      {/* Inline Feedback Banner (strict Burgundy / Dusty Rose palette) */}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium ${
            feedback.type === 'error'
              ? 'bg-[#F8EAEF] border-[#642F43] text-[#4A1F30]'
              : 'bg-[#FAF0F3] border-[#C58E9B] text-[#361522]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#642F43]" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#642F43]" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold text-[#642F43] underline underline-offset-2 shrink-0 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Single-Row Accessible Tablist (4 modules) */}
      <div
        role="tablist"
        aria-label="Exam data management sections"
        className="examia-tablist"
      >
        {TABS.map((tab, index) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          const badgeCount =
            tab.id === 'subjects'
              ? subjects.length
              : tab.id === 'groups'
                ? studentGroups.length
                : classrooms.length;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              id={getTabId(tab.id)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={getPanelId(tab.id)}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className="examia-tab"
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-[#F4E4E9] text-[#642F43]">
                {badgeCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* A. SUBJECTS */}
      {activeTab === 'subjects' && (
        <div role="tabpanel" id={getPanelId('subjects')} aria-labelledby={getTabId('subjects')}>
          <section className="card-premium p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
                  Subjects ({subjects.length})
                </h2>
                <p className="text-xs text-[#6F4253]">
                  Manage examination subjects with their codes, names, and assigned division totals.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddSubjectModal}
                className="btn-primary text-xs sm:text-sm min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Subject</span>
              </button>
            </div>

            <div className="relative">
              <Search
                className="w-4 h-4 text-[#7D5563] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search subjects by code or name"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Search subjects by name or code..."
                className="input-editorial pl-10 w-full text-sm"
              />
            </div>

            {filteredSubjects.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#FAF0F3]/75 border border-[#C58E9B]/35 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-[#C58E9B] mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#4A1F30]">
                  {subjects.length === 0 ? 'No subjects added yet' : 'No matching subjects found'}
                </p>
                {subjects.length === 0 ? (
                  <button
                    type="button"
                    onClick={openAddSubjectModal}
                    className="btn-primary text-xs min-h-[40px] px-4 py-2 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add First Subject</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSubjectSearch('')}
                    className="btn-secondary text-xs min-h-[40px] px-4 py-2"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#C58E9B]/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F4E4E9] text-[#642F43] text-xs uppercase tracking-wider border-b border-[#C58E9B]/40">
                        <th className="py-3 px-4 font-bold">Subject Code</th>
                        <th className="py-3 px-4 font-bold">Subject Name</th>
                        <th className="py-3 px-4 font-bold">Assigned Divisions</th>
                        <th className="py-3 px-4 font-bold">Total Students</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EED8DF] text-sm bg-[#FDF9FA]">
                      {filteredSubjects.map((subj) => (
                        <tr key={subj.id} className="hover:bg-[#FAF0F3]/75 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#642F43] whitespace-nowrap">
                            {subj.code}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#361522]">{subj.name}</td>
                          <td className="py-3 px-4">
                            {subj.divisions?.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {subj.divisions.map((divName) => (
                                  <span
                                    key={divName}
                                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F4E4E9] text-[#642F43] border border-[#C58E9B]/40"
                                  >
                                    {divName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-[#7D5563] italic">No groups assigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#642F43] whitespace-nowrap">
                            {subj.studentCount ?? 0}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditSubjectModal(subj)}
                                aria-label={`Edit ${subj.code}`}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#C58E9B]/45 bg-white text-xs font-semibold text-[#642F43] hover:bg-[#F4E4E9] inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'subject',
                                    item: subj,
                                    title: `Delete Subject ${subj.code}?`,
                                    description: `Are you sure you want to remove "${subj.name}" (${subj.code})?`,
                                    confirmLabel: 'Delete Subject',
                                  })
                                }
                                aria-label={`Delete ${subj.code}`}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#C58E9B]/45 bg-[#F8EAEF] text-xs font-semibold text-[#4A1F30] hover:bg-[#EED8DF] inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {filteredSubjects.map((subj) => (
                    <div
                      key={subj.id}
                      className="p-4 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#642F43] text-[#FDF8FA]">
                            {subj.code}
                          </span>
                          <h3 className="text-sm font-bold text-[#361522] mt-1.5">{subj.name}</h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#642F43] bg-white px-2.5 py-1 rounded-full border border-[#C58E9B]/40">
                          {subj.studentCount ?? 0} students
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {subj.divisions?.length > 0 ? (
                          subj.divisions.map((divName) => (
                            <span
                              key={divName}
                              className="px-2 py-0.5 rounded-full text-xs font-medium bg-white text-[#642F43] border border-[#C58E9B]/40"
                            >
                              {divName}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#7D5563]">No divisions assigned</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#C58E9B]/25">
                        <button
                          type="button"
                          onClick={() => openEditSubjectModal(subj)}
                          className="flex-1 min-h-[44px] rounded-xl border border-[#C58E9B]/50 bg-white text-xs font-semibold text-[#642F43] inline-flex items-center justify-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: 'subject',
                              item: subj,
                              title: `Delete Subject ${subj.code}?`,
                              description: `Are you sure you want to remove "${subj.name}" (${subj.code})?`,
                              confirmLabel: 'Delete Subject',
                            })
                          }
                          className="flex-1 min-h-[44px] rounded-xl border border-[#C58E9B]/50 bg-[#F8EAEF] text-xs font-semibold text-[#4A1F30] inline-flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* B. DIVISIONS */}
      {activeTab === 'groups' && (
        <div role="tabpanel" id={getPanelId('groups')} aria-labelledby={getTabId('groups')}>
          <section className="card-premium p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
                  Divisions ({studentGroups.length})
                </h2>
                <p className="text-xs text-[#6F4253]">
                  Manage academic divisions or sections and actual student counts per division.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddGroupModal}
                className="btn-primary text-xs sm:text-sm min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Division</span>
              </button>
            </div>

            <div className="relative">
              <Search
                className="w-4 h-4 text-[#7D5563] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search divisions by name"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search divisions..."
                className="input-editorial pl-10 w-full text-sm"
              />
            </div>

            {filteredGroups.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#FAF0F3]/75 border border-[#C58E9B]/35 text-center space-y-3">
                <Users className="w-8 h-8 text-[#C58E9B] mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#4A1F30]">
                  {studentGroups.length === 0
                    ? 'No divisions added yet'
                    : 'No matching divisions'}
                </p>
                {studentGroups.length === 0 ? (
                  <button
                    type="button"
                    onClick={openAddGroupModal}
                    className="btn-primary text-xs min-h-[40px] px-4 py-2 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add First Division</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setGroupSearch('')}
                    className="btn-secondary text-xs min-h-[40px] px-4 py-2"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#C58E9B]/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F4E4E9] text-[#642F43] text-xs uppercase tracking-wider border-b border-[#C58E9B]/40">
                        <th className="py-3 px-4 font-bold">Division Name</th>
                        <th className="py-3 px-4 font-bold">Student Count</th>
                        <th className="py-3 px-4 font-bold">Assigned Subjects</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EED8DF] text-sm bg-[#FDF9FA]">
                      {filteredGroups.map((group) => {
                        const groupSubjects = subjects.filter((s) =>
                          s.divisions?.includes(group.name)
                        );
                        return (
                          <tr key={group.id} className="hover:bg-[#FAF0F3]/75 transition-colors">
                            <td className="py-3 px-4 font-bold text-[#361522]">{group.name}</td>
                            <td className="py-3 px-4 font-mono text-[#642F43] font-semibold">
                              {group.studentCount} students
                            </td>
                            <td className="py-3 px-4 text-xs text-[#6F4253]">
                              {groupSubjects.length === 0
                                ? 'No subjects assigned'
                                : `${groupSubjects.length} ${
                                    groupSubjects.length === 1 ? 'subject' : 'subjects'
                                  } (${groupSubjects.map((s) => s.code).join(', ')})`}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditGroupModal(group)}
                                  aria-label={`Edit ${group.name}`}
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#C58E9B]/45 bg-white text-xs font-semibold text-[#642F43] hover:bg-[#F4E4E9] inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmAction({
                                      type: 'group',
                                      item: group,
                                      title: `Delete Division "${group.name}"?`,
                                      description: `Removing "${group.name}" will unassign this division from all subjects.`,
                                      confirmLabel: 'Delete Division',
                                    })
                                  }
                                  aria-label={`Delete ${group.name}`}
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#C58E9B]/45 bg-[#F8EAEF] text-xs font-semibold text-[#4A1F30] hover:bg-[#EED8DF] inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {filteredGroups.map((group) => {
                    const groupSubjects = subjects.filter((s) =>
                      s.divisions?.includes(group.name)
                    );
                    return (
                      <div
                        key={group.id}
                        className="p-4 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/40 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-[#361522]">{group.name}</h3>
                            <p className="text-xs font-mono text-[#642F43] font-semibold mt-0.5">
                              {group.studentCount} students
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#C58E9B]/40 text-[#642F43]">
                            {groupSubjects.length} subjects
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#C58E9B]/25">
                          <button
                            type="button"
                            onClick={() => openEditGroupModal(group)}
                            className="flex-1 min-h-[44px] rounded-xl border border-[#C58E9B]/50 bg-white text-xs font-semibold text-[#642F43] inline-flex items-center justify-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                type: 'group',
                                item: group,
                                title: `Delete Division "${group.name}"?`,
                                description: `Removing "${group.name}" will unassign this division from all subjects.`,
                                confirmLabel: 'Delete Division',
                              })
                            }
                            className="flex-1 min-h-[44px] rounded-xl border border-[#C58E9B]/50 bg-[#F8EAEF] text-xs font-semibold text-[#4A1F30] inline-flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* C. CLASSROOM MANAGEMENT */}
      {activeTab === 'classrooms' && (
        <div role="tabpanel" id={getPanelId('classrooms')} aria-labelledby={getTabId('classrooms')}>
          <section className="card-premium p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
                  Classrooms ({classrooms.length})
                </h2>
                <p className="text-xs text-[#6F4253]">
                  Add, edit, or remove examination rooms stored in the SQLite database.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddClassroomModal}
                className="btn-primary text-xs sm:text-sm min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Classroom</span>
              </button>
            </div>

            <div className="relative">
              <Search
                className="w-4 h-4 text-[#7D5563] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search classrooms by name or building"
                value={classroomSearch}
                onChange={(e) => setClassroomSearch(e.target.value)}
                placeholder="Search classrooms by room number or building..."
                className="input-editorial pl-10 w-full text-sm"
              />
            </div>

            {filteredClassrooms.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#FAF0F3]/75 border border-[#C58E9B]/35 text-center space-y-3">
                <Building2 className="w-8 h-8 text-[#C58E9B] mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#4A1F30]">
                  {classrooms.length === 0 ? 'No classrooms configured' : 'No matching classrooms found'}
                </p>
                {classrooms.length === 0 ? (
                  <button
                    type="button"
                    onClick={openAddClassroomModal}
                    className="btn-primary text-xs min-h-[40px] px-4 py-2 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add First Classroom</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setClassroomSearch('')}
                    className="btn-secondary text-xs min-h-[40px] px-4 py-2"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#C58E9B]/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F4E4E9] text-[#642F43] text-xs uppercase tracking-wider border-b border-[#C58E9B]/40">
                        <th className="py-3 px-4 font-bold">Classroom</th>
                        <th className="py-3 px-4 font-bold">Building / Location</th>
                        <th className="py-3 px-4 font-bold">Max Capacity</th>
                        <th className="py-3 px-4 font-bold">Availability</th>
                        <th className="py-3 px-4 font-bold">Schedule Status</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EED8DF] text-sm bg-[#FDF9FA]">
                      {filteredClassrooms.map((room) => (
                        <tr key={room.id} className="hover:bg-[#FAF0F3]/75 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#642F43] whitespace-nowrap">
                            {room.name}
                          </td>
                          <td className="py-3 px-4 text-[#361522]">
                            {room.building || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#642F43]">
                            {room.capacity} seats
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                room.isAvailable
                                  ? 'bg-[#FAF0F3] text-[#642F43] border-[#C58E9B]/60'
                                  : 'bg-[#F8EAEF] text-[#4A1F30] border-[#642F43]/40'
                              }`}
                            >
                              {room.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-[#6F4253]">
                            {room.scheduledAssignmentsCount > 0
                              ? `Assigned (${room.scheduledAssignmentsCount} exam${
                                  room.scheduledAssignmentsCount === 1 ? '' : 's'
                                })`
                              : 'Unassigned'}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditClassroomModal(room)}
                                aria-label={`Edit classroom ${room.name}`}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#C58E9B]/45 bg-white text-xs font-semibold text-[#642F43] hover:bg-[#F4E4E9] inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeleteClassroom(room)}
                                aria-label={`Delete classroom ${room.name}`}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#C58E9B]/45 bg-[#F8EAEF] text-xs font-semibold text-[#4A1F30] hover:bg-[#EED8DF] inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {filteredClassrooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-4 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/40 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#361522]">{room.name}</h3>
                          <p className="text-xs text-[#6F4253]">{room.building || 'No building specified'}</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#642F43] text-[#FDF8FA]">
                          {room.capacity} seats
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-white border border-[#C58E9B]/40 font-semibold text-[#642F43]">
                          {room.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        <span className="text-[#6F4253]">
                          {room.scheduledAssignmentsCount > 0
                            ? `Assigned to ${room.scheduledAssignmentsCount} exam(s)`
                            : 'Not currently scheduled'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#C58E9B]/25">
                        <button
                          type="button"
                          onClick={() => openEditClassroomModal(room)}
                          className="flex-1 min-h-[44px] rounded-xl border border-[#C58E9B]/50 bg-white text-xs font-semibold text-[#642F43] inline-flex items-center justify-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeleteClassroom(room)}
                          className="flex-1 min-h-[44px] rounded-xl border border-[#C58E9B]/50 bg-[#F8EAEF] text-xs font-semibold text-[#4A1F30] inline-flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}
        subtitle="Enter the subject code, name, and assigned divisions."
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          {subjectFormError && (
            <p
              role="alert"
              className="p-3 rounded-xl bg-[#F8EAEF] border border-[#642F43] text-xs font-semibold text-[#4A1F30]"
            >
              {subjectFormError}
            </p>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="examia-subject-code-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#642F43]"
            >
              Subject Code *
            </label>
            <input
              id="examia-subject-code-input"
              type="text"
              value={subjectCodeInput}
              onChange={(e) => setSubjectCodeInput(e.target.value)}
              placeholder="e.g., CS301"
              className="input-editorial w-full text-sm font-mono uppercase"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="examia-subject-name-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#642F43]"
            >
              Subject Name *
            </label>
            <input
              id="examia-subject-name-input"
              type="text"
              value={subjectNameInput}
              onChange={(e) => setSubjectNameInput(e.target.value)}
              placeholder="e.g., Database Management Systems"
              className="input-editorial w-full text-sm"
              required
            />
          </div>

          {studentGroups.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#642F43]">
                Assigned Divisions
              </span>
              <div className="flex flex-wrap gap-2">
                {studentGroups.map((group) => {
                  const active = subjectGroupIdsInput.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() =>
                        setSubjectGroupIdsInput((prev) =>
                          prev.includes(group.id)
                            ? prev.filter((id) => id !== group.id)
                            : [...prev, group.id]
                        )
                      }
                      aria-pressed={active}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        active
                          ? 'bg-[#642F43] text-[#FDF8FA] border-[#642F43]'
                          : 'bg-[#FAF0F3] text-[#642F43] border-[#C58E9B]/50 hover:bg-[#F3E2E7]'
                      }`}
                    >
                      {group.name} ({group.studentCount})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(false)}
              className="btn-secondary min-h-[44px] px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold"
            >
              {editingSubject ? 'Save Changes' : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Division Modal */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title={editingGroup ? 'Edit Division' : 'Add Division'}
        subtitle="Specify the division name (e.g. Division A, Section 1) and student count."
      >
        <form onSubmit={handleSaveGroup} className="space-y-4">
          {groupFormError && (
            <p
              role="alert"
              className="p-3 rounded-xl bg-[#F8EAEF] border border-[#642F43] text-xs font-semibold text-[#4A1F30]"
            >
              {groupFormError}
            </p>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="examia-group-name-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#642F43]"
            >
              Division / Section Name *
            </label>
            <input
              id="examia-group-name-input"
              type="text"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              placeholder="e.g., Division D"
              className="input-editorial w-full text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="examia-group-count-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#642F43]"
            >
              Number of Students *
            </label>
            <input
              id="examia-group-count-input"
              type="number"
              min="1"
              max="10000"
              value={groupCountInput}
              onChange={(e) => setGroupCountInput(e.target.value)}
              className="input-editorial w-full text-sm font-mono"
              required
            />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsGroupModalOpen(false)}
              className="btn-secondary min-h-[44px] px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold"
            >
              {editingGroup ? 'Save Changes' : 'Add Division'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Classroom Modal */}
      <Modal
        isOpen={isClassroomModalOpen}
        onClose={() => setIsClassroomModalOpen(false)}
        title={editingClassroom ? 'Edit Classroom' : 'Add Classroom'}
        subtitle="Enter room details, building location, and maximum seating capacity."
      >
        <form onSubmit={handleSaveClassroom} className="space-y-4">
          {roomFormError && (
            <p
              role="alert"
              className="p-3 rounded-xl bg-[#F8EAEF] border border-[#642F43] text-xs font-semibold text-[#4A1F30]"
            >
              {roomFormError}
            </p>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="examia-room-name-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#642F43]"
            >
              Classroom Name / Room Number *
            </label>
            <input
              id="examia-room-name-input"
              type="text"
              value={roomNameInput}
              onChange={(e) => setRoomNameInput(e.target.value)}
              placeholder="e.g., A105"
              className="input-editorial w-full text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="examia-room-building-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#642F43]"
            >
              Building / Location
            </label>
            <input
              id="examia-room-building-input"
              type="text"
              value={roomBuildingInput}
              onChange={(e) => setRoomBuildingInput(e.target.value)}
              placeholder="e.g., Main Block"
              className="input-editorial w-full text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="examia-room-capacity-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#642F43]"
            >
              Maximum Seating Capacity *
            </label>
            <input
              id="examia-room-capacity-input"
              type="number"
              min="1"
              max="5000"
              value={roomCapacityInput}
              onChange={(e) => setRoomCapacityInput(e.target.value)}
              className="input-editorial w-full text-sm font-mono"
              required
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#361522]">
            <input
              type="checkbox"
              checked={roomAvailableInput}
              onChange={(e) => setRoomAvailableInput(e.target.checked)}
              className="w-4 h-4 accent-[#642F43]"
            />
            <span>Available for examination scheduling</span>
          </label>

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsClassroomModalOpen(false)}
              className="btn-secondary min-h-[44px] px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold"
            >
              {editingClassroom ? 'Save Changes' : 'Add Classroom'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Safe Classroom Unassign / Reset Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.title || 'Confirm Action'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#361522] leading-relaxed">{confirmAction?.description}</p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="btn-secondary min-h-[44px] px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleConfirmAction}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#642F43] text-[#FDF8FA] text-xs font-semibold hover:bg-[#4A1F30] transition-colors"
            >
              {confirmAction?.confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
