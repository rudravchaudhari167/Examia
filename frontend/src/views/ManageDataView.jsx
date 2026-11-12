import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  Edit3,
  Info,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Search,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import Modal from '../components/Modal';

const TABS = [
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'groups', label: 'Student Groups', icon: Users },
  { id: 'enrolments', label: 'Subject Enrolments', icon: Layers },
  { id: 'classrooms', label: 'Classrooms', icon: Building2 },
];

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
  const [enrolmentSearch, setEnrolmentSearch] = useState('');
  const [classroomSearch, setClassroomSearch] = useState('');

  // Add / Edit Subject Modal state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectCodeInput, setSubjectCodeInput] = useState('');
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [subjectGroupIdsInput, setSubjectGroupIdsInput] = useState([]);
  const [subjectFormError, setSubjectFormError] = useState('');

  // Add / Edit Student Group Modal state
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

  // Subject Enrolments state (Tab C: Subject-centric selection)
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null,
    [subjects, selectedSubjectId]
  );

  useEffect(() => {
    if (!subjects.length) {
      setSelectedSubjectId('');
      return;
    }
    if (!subjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  const savedGroupIdsForSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return Array.isArray(selectedSubject.groupIds) ? selectedSubject.groupIds : [];
  }, [selectedSubject]);

  const [draftGroupIds, setDraftGroupIds] = useState(savedGroupIdsForSubject);

  useEffect(() => {
    setDraftGroupIds(savedGroupIdsForSubject);
  }, [savedGroupIdsForSubject]);

  const isEnrolmentDirty = useMemo(() => {
    if (!selectedSubject) return false;
    if (draftGroupIds.length !== savedGroupIdsForSubject.length) return true;
    const savedSet = new Set(savedGroupIdsForSubject);
    return draftGroupIds.some((id) => !savedSet.has(id));
  }, [selectedSubject, draftGroupIds, savedGroupIdsForSubject]);

  const draftCalculatedStudents = useMemo(() => {
    const uniqueIds = new Set(draftGroupIds);
    return studentGroups.reduce(
      (sum, g) => sum + (uniqueIds.has(g.id) ? Number(g.studentCount) || 0 : 0),
      0
    );
  }, [draftGroupIds, studentGroups]);

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

  const filteredEnrolmentGroups = useMemo(() => {
    const q = enrolmentSearch.trim().toLowerCase();
    if (!q) return studentGroups;
    return studentGroups.filter((g) => g.name.toLowerCase().includes(q));
  }, [studentGroups, enrolmentSearch]);

  const filteredClassrooms = useMemo(() => {
    const q = classroomSearch.trim().toLowerCase();
    if (!q) return classrooms;
    return classrooms.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.building || '').toLowerCase().includes(q)
    );
  }, [classrooms, classroomSearch]);

  const sharedSubjects = useMemo(() => {
    return subjects.filter((s) => Array.isArray(s.divisions) && s.divisions.length >= 2);
  }, [subjects]);

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
      setSubjectFormError(err.message || 'Could not save subject.');
    } finally {
      setIsBusy(false);
    }
  };

  // --- Student Group Handlers ---
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
      setGroupFormError('Please enter a student group name (e.g., Division D).');
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
        showFeedback('success', `Updated student group "${cleanName}" (${parsedCount} students).`);
      } else {
        await onAddGroup({
          name: cleanName,
          studentCount: parsedCount,
        });
        showFeedback('success', `Added student group "${cleanName}" (${parsedCount} students).`);
      }
      setIsGroupModalOpen(false);
    } catch (err) {
      setGroupFormError(err.message || 'Could not save student group.');
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
      setRoomFormError(err.message || 'Could not save classroom.');
    } finally {
      setIsBusy(false);
    }
  };

  // --- Enrolment Handlers ---
  const toggleDraftGroup = (groupId) => {
    setDraftGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSaveEnrolments = async () => {
    if (!selectedSubject) {
      showFeedback('error', 'Select or add a subject before saving enrolments.');
      return;
    }
    setIsBusy(true);
    try {
      await onUpdateEnrolments({
        subjectId: selectedSubject.id,
        groupIds: draftGroupIds,
      });
      showFeedback(
        'success',
        `Updated enrolments for ${selectedSubject.code}: ${draftGroupIds.length} ${
          draftGroupIds.length === 1 ? 'group' : 'groups'
        } (${draftCalculatedStudents} students by group total).`
      );
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update enrolments.');
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
        showFeedback('success', `Deleted student group "${confirmAction.item.name}".`);
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
        showFeedback('success', 'Restored default sample subjects, groups, classrooms, and enrolments.');
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
          description: err.message,
          confirmLabel: 'Clear Timetable & Delete Room',
        });
      } else {
        showFeedback('error', err.message || 'Operation could not be completed.');
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
            Maintain subjects, student groups, enrolments, and examination classrooms in one workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setConfirmAction({
              type: 'reset',
              title: 'Restore Sample Dataset?',
              description:
                'This resets subjects, student groups, classrooms, and configuration in the database back to the sample dataset.',
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
                : tab.id === 'classrooms'
                  ? classrooms.length
                  : sharedSubjects.length;

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
                  Manage examination subjects with their codes, names, and enrolled group totals.
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
                        <th className="py-3 px-4 font-bold">Assigned Groups</th>
                        <th className="py-3 px-4 font-bold">Enrolled Students</th>
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
                          <span className="text-xs text-[#7D5563]">No student groups assigned</span>
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

      {/* B. STUDENT GROUPS */}
      {activeTab === 'groups' && (
        <div role="tabpanel" id={getPanelId('groups')} aria-labelledby={getTabId('groups')}>
          <section className="card-premium p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
                  Student Groups ({studentGroups.length})
                </h2>
                <p className="text-xs text-[#6F4253]">
                  Manage student cohorts and actual student counts per group.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddGroupModal}
                className="btn-primary text-xs sm:text-sm min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Student Group</span>
              </button>
            </div>

            <div className="relative">
              <Search
                className="w-4 h-4 text-[#7D5563] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search student groups by name"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search student groups..."
                className="input-editorial pl-10 w-full text-sm"
              />
            </div>

            {filteredGroups.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#FAF0F3]/75 border border-[#C58E9B]/35 text-center space-y-3">
                <Users className="w-8 h-8 text-[#C58E9B] mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#4A1F30]">
                  {studentGroups.length === 0
                    ? 'No student groups added yet'
                    : 'No matching student groups'}
                </p>
                {studentGroups.length === 0 ? (
                  <button
                    type="button"
                    onClick={openAddGroupModal}
                    className="btn-primary text-xs min-h-[40px] px-4 py-2 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add First Student Group</span>
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
                        <th className="py-3 px-4 font-bold">Group Name</th>
                        <th className="py-3 px-4 font-bold">Student Count</th>
                        <th className="py-3 px-4 font-bold">Enrolled Subjects</th>
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
                                      title: `Delete Student Group "${group.name}"?`,
                                      description: `Removing "${group.name}" will unenroll this group from all subjects.`,
                                      confirmLabel: 'Delete Group',
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
                                title: `Delete Student Group "${group.name}"?`,
                                description: `Removing "${group.name}" will unenroll this group from all subjects.`,
                                confirmLabel: 'Delete Group',
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

      {/* C. SUBJECT ENROLMENT MANAGEMENT */}
      {activeTab === 'enrolments' && (
        <div role="tabpanel" id={getPanelId('enrolments')} aria-labelledby={getTabId('enrolments')}>
          <div className="space-y-5">
            <section className="card-premium p-4 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
                    Subject Enrolments
                  </h2>
                  <p className="text-xs text-[#6F4253]">
                    Assign or remove student groups for each subject and inspect total enrolled student counts.
                  </p>
                </div>

                {selectedSubject && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleSaveEnrolments}
                    className="btn-primary text-xs sm:text-sm min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-2 shrink-0"
                  >
                    <Save className="w-4 h-4" aria-hidden="true" />
                    <span>{isEnrolmentDirty ? 'Save Enrolments' : 'Enrolments Saved'}</span>
                  </button>
                )}
              </div>

              {/* Truthful Group-Level Count Allocation Notice */}
              <div className="p-3.5 rounded-2xl bg-[#FAF0F3] border border-[#C58E9B]/45 flex items-start gap-2.5 text-xs text-[#4A1F30]">
                <Info className="w-4 h-4 text-[#642F43] shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong>Group-level count allocation:</strong> Each subject sums the student counts of its distinct assigned student groups (a group can never be counted twice for the same subject). Individual student rosters are not stored in this model.
                </p>
              </div>

              {subjects.length === 0 || studentGroups.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#FAF0F3]/80 border border-[#C58E9B]/35 text-center space-y-2">
                  <p className="text-sm font-semibold text-[#4A1F30]">
                    {subjects.length === 0 ? 'Add subjects first' : 'Add student groups first'}
                  </p>
                  <p className="text-xs text-[#6F4253]">
                    You need at least one subject and one student group to manage enrolments.
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. Subject Selector */}
                  <div className="p-4 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/40 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <label
                        htmlFor="examia-enrolment-subject-select"
                        className="text-xs font-bold uppercase tracking-wider text-[#642F43] block"
                      >
                        1. Select Subject to Manage Enrolments
                      </label>
                      <select
                        id="examia-enrolment-subject-select"
                        value={selectedSubject?.id || ''}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="input-editorial w-full sm:max-w-md text-sm font-semibold"
                      >
                        {subjects.map((subj) => (
                          <option key={subj.id} value={subj.id}>
                            {subj.code} — {subj.name} ({subj.studentCount} students)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="px-4 py-2.5 rounded-xl bg-white border border-[#C58E9B]/45 shrink-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6F4253] block">
                        Calculated Enrolled Total
                      </span>
                      <span className="text-lg font-serif font-bold text-[#642F43]">
                        {draftCalculatedStudents} students ({draftGroupIds.length}{' '}
                        {draftGroupIds.length === 1 ? 'group' : 'groups'})
                      </span>
                    </div>
                  </div>

                  {/* 2. Student Groups Checkboxes */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#642F43]">
                        2. Assign Student Groups to {selectedSubject?.code}
                        {isEnrolmentDirty && ' (unsaved changes)'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDraftGroupIds(studentGroups.map((g) => g.id))}
                          className="text-xs font-semibold text-[#642F43] hover:underline px-2 py-1"
                        >
                          Select All
                        </button>
                        <span aria-hidden="true" className="text-[#C58E9B]">|</span>
                        <button
                          type="button"
                          onClick={() => setDraftGroupIds([])}
                          className="text-xs font-semibold text-[#642F43] hover:underline px-2 py-1"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search
                        className="w-4 h-4 text-[#7D5563] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        aria-label="Filter student groups"
                        value={enrolmentSearch}
                        onChange={(e) => setEnrolmentSearch(e.target.value)}
                        placeholder="Filter student groups by name..."
                        className="input-editorial pl-10 w-full text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {filteredEnrolmentGroups.map((group) => {
                        const isChecked = draftGroupIds.includes(group.id);
                        return (
                          <label
                            key={group.id}
                            className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition-colors min-h-[56px] ${
                              isChecked
                                ? 'bg-[#FDF9FA] border-[#642F43] shadow-xs'
                                : 'bg-[#FAF0F3]/60 border-[#C58E9B]/40 hover:bg-[#FAF0F3]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleDraftGroup(group.id)}
                              className="sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? 'bg-[#642F43] border-[#642F43] text-white'
                                  : 'bg-white border-[#C58E9B]'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-[#361522]">{group.name}</p>
                              <p className="text-xs font-mono text-[#642F43] font-semibold">
                                {group.studentCount} students
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={handleSaveEnrolments}
                        className="btn-primary text-xs sm:text-sm min-h-[44px] px-5 py-2.5 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" aria-hidden="true" />
                        <span>Save Enrolments</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Enrolment Summary & Shared Conflict Subjects */}
            <section className="card-premium p-4 sm:p-6 space-y-3">
              <div className="flex items-start gap-2.5">
                <Share2 className="w-4 h-4 text-[#642F43] mt-1 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-[#642F43]">
                    Subject Enrolment Totals &amp; Shared Group Overlaps ({sharedSubjects.length} shared)
                  </h3>
                  <p className="text-xs text-[#6F4253]">
                    Any two subjects sharing one or more student groups cannot run in the same examination slot.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {subjects.map((subj) => {
                  const isShared = (subj.divisions || []).length >= 2;
                  return (
                    <div
                      key={subj.id}
                      className="p-3.5 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#642F43]">
                          {subj.code}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isShared
                              ? 'bg-[#642F43] text-[#FDF8FA]'
                              : 'bg-white text-[#642F43] border border-[#C58E9B]/40'
                          }`}
                        >
                          {subj.studentCount} students
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#361522] leading-snug">
                        {subj.name}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {subj.divisions?.length > 0 ? (
                          subj.divisions.map((gName) => (
                            <span
                              key={gName}
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white text-[#642F43] border border-[#C58E9B]/40"
                            >
                              {gName}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#7D5563]">No groups assigned</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* D. CLASSROOM MANAGEMENT */}
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
        subtitle="Enter the subject code, name, and enrolled student groups."
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
                Enrolled Student Groups
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

      {/* Add / Edit Student Group Modal */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title={editingGroup ? 'Edit Student Group' : 'Add Student Group'}
        subtitle="Specify the group name and actual student count."
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
              Group Name *
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
              {editingGroup ? 'Save Changes' : 'Add Student Group'}
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
