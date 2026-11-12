import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
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
];

export default function ManageDataView({
  subjects,
  divisions,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onAddDivision,
  onEditDivision,
  onDeleteDivision,
  onUpdateDivisionEnrolments,
  onResetSampleData,
}) {
  const baseId = useId();
  const [activeTab, setActiveTab] = useState('subjects');
  const tabRefs = useRef({});

  // Inline feedback banner for clear success & error messages
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
  };

  // Search states
  const [subjectSearch, setSubjectSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [enrolmentSearch, setEnrolmentSearch] = useState('');

  // Add / Edit Subject Modal state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectCodeInput, setSubjectCodeInput] = useState('');
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [subjectGroupsInput, setSubjectGroupsInput] = useState([]);
  const [subjectFormError, setSubjectFormError] = useState('');

  // Add / Edit Student Group Modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupCountInput, setGroupCountInput] = useState('45');
  const [groupFormError, setGroupFormError] = useState('');

  // Delete / Reset confirmation modal state
  const [confirmAction, setConfirmAction] = useState(null);

  // Subject Enrolments state (Tab C)
  const [selectedGroupId, setSelectedGroupId] = useState(divisions[0]?.id || '');
  const selectedGroup = useMemo(
    () => divisions.find((d) => d.id === selectedGroupId) || divisions[0] || null,
    [divisions, selectedGroupId]
  );

  // Keep selectedGroupId synced when groups are added/removed
  useEffect(() => {
    if (!divisions.length) {
      setSelectedGroupId('');
      return;
    }
    if (!divisions.some((d) => d.id === selectedGroupId)) {
      setSelectedGroupId(divisions[0].id);
    }
  }, [divisions, selectedGroupId]);

  const savedSubjectIdsForGroup = useMemo(() => {
    if (!selectedGroup) return [];
    return subjects
      .filter((s) => Array.isArray(s.divisions) && s.divisions.includes(selectedGroup.name))
      .map((s) => s.id);
  }, [subjects, selectedGroup]);

  const [draftSubjectIds, setDraftSubjectIds] = useState(savedSubjectIdsForGroup);

  useEffect(() => {
    setDraftSubjectIds(savedSubjectIdsForGroup);
  }, [savedSubjectIdsForGroup]);

  const isEnrolmentDirty = useMemo(() => {
    if (!selectedGroup) return false;
    if (draftSubjectIds.length !== savedSubjectIdsForGroup.length) return true;
    const savedSet = new Set(savedSubjectIdsForGroup);
    return draftSubjectIds.some((id) => !savedSet.has(id));
  }, [selectedGroup, draftSubjectIds, savedSubjectIdsForGroup]);

  // Filtered lists
  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
  }, [subjects, subjectSearch]);

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    if (!q) return divisions;
    return divisions.filter((d) => d.name.toLowerCase().includes(q));
  }, [divisions, groupSearch]);

  const filteredEnrolmentSubjects = useMemo(() => {
    const q = enrolmentSearch.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
  }, [subjects, enrolmentSearch]);

  // Subjects shared across 2+ student groups
  const sharedSubjects = useMemo(() => {
    return subjects.filter(
      (s) => Array.isArray(s.divisions) && s.divisions.length >= 2
    );
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

  // Helper: compute student count total from group names
  const computeStudentCount = (groupNames, fallbackCount = 45) => {
    const sum = groupNames.reduce((acc, gName) => {
      const found = divisions.find((d) => d.name === gName);
      return acc + (Number(found?.studentCount) || 0);
    }, 0);
    return sum > 0 ? sum : fallbackCount;
  };

  // Subject Handlers
  const openAddSubjectModal = () => {
    setEditingSubject(null);
    setSubjectCodeInput('');
    setSubjectNameInput('');
    setSubjectGroupsInput(divisions.slice(0, 1).map((d) => d.name));
    setSubjectFormError('');
    setIsSubjectModalOpen(true);
  };

  const openEditSubjectModal = (subj) => {
    setEditingSubject(subj);
    setSubjectCodeInput(subj.code);
    setSubjectNameInput(subj.name);
    setSubjectGroupsInput(Array.isArray(subj.divisions) ? subj.divisions : []);
    setSubjectFormError('');
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e) => {
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

    const duplicate = subjects.find(
      (s) => s.code.toLowerCase() === cleanCode.toLowerCase() && s.id !== editingSubject?.id
    );
    if (duplicate) {
      setSubjectFormError(`A subject with code "${cleanCode}" already exists.`);
      return;
    }

    const computedStudents = computeStudentCount(
      subjectGroupsInput,
      editingSubject?.studentCount || 45
    );

    if (editingSubject) {
      onEditSubject({
        ...editingSubject,
        code: cleanCode,
        name: cleanName,
        divisions: subjectGroupsInput,
        studentCount: computedStudents,
      });
      showFeedback('success', `Updated subject ${cleanCode} (${cleanName}).`);
    } else {
      onAddSubject({
        id: `subj-${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        divisions: subjectGroupsInput,
        studentCount: computedStudents,
      });
      showFeedback('success', `Added subject ${cleanCode} (${cleanName}).`);
    }

    setIsSubjectModalOpen(false);
  };

  // Student Group Handlers
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

  const handleSaveGroup = (e) => {
    e.preventDefault();
    const cleanName = groupNameInput.trim();
    const parsedCount = parseInt(groupCountInput, 10);

    if (!cleanName) {
      setGroupFormError('Please enter a student group name (e.g., Division D).');
      return;
    }
    if (Number.isNaN(parsedCount) || parsedCount <= 0) {
      setGroupFormError('Number of students must be a positive number.');
      return;
    }

    const duplicate = divisions.find(
      (d) => d.name.toLowerCase() === cleanName.toLowerCase() && d.id !== editingGroup?.id
    );
    if (duplicate) {
      setGroupFormError(`Student group "${cleanName}" already exists.`);
      return;
    }

    if (editingGroup) {
      onEditDivision(
        {
          ...editingGroup,
          name: cleanName,
          studentCount: parsedCount,
        },
        editingGroup.name
      );
      showFeedback('success', `Updated student group "${cleanName}" (${parsedCount} students).`);
    } else {
      onAddDivision({
        id: `div-${Date.now()}`,
        name: cleanName,
        studentCount: parsedCount,
      });
      showFeedback('success', `Added student group "${cleanName}" (${parsedCount} students).`);
    }

    setIsGroupModalOpen(false);
  };

  // Enrolment Handlers
  const toggleDraftSubject = (subjectId) => {
    setDraftSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSaveEnrolments = () => {
    if (!selectedGroup) {
      showFeedback('error', 'Add at least one student group first before saving enrolments.');
      return;
    }
    onUpdateDivisionEnrolments(selectedGroup.name, draftSubjectIds);
    showFeedback(
      'success',
      `Saved ${draftSubjectIds.length} ${draftSubjectIds.length === 1 ? 'subject' : 'subjects'} for ${selectedGroup.name}.`
    );
  };

  // Confirm Deletion / Reset Handler
  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'subject') {
      onDeleteSubject(confirmAction.item.id);
      showFeedback('success', `Deleted subject ${confirmAction.item.code}.`);
    } else if (confirmAction.type === 'group') {
      onDeleteDivision(confirmAction.item.id);
      showFeedback('success', `Deleted student group "${confirmAction.item.name}".`);
    } else if (confirmAction.type === 'reset') {
      onResetSampleData();
      showFeedback('success', 'Restored default sample subjects, groups, and enrolments.');
    }
    setConfirmAction(null);
  };

  const getTabId = (id) => `${baseId}-tab-${id}`;
  const getPanelId = (id) => `${baseId}-panel-${id}`;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header & Restore Sample Data */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#642F43] tracking-tight">
            Manage Exam Data
          </h1>
          <p className="text-xs sm:text-sm text-[#6F4253] mt-0.5">
            Set up subjects, student groups, and group enrolments before generating your timetable.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setConfirmAction({
              type: 'reset',
              title: 'Restore Sample Dataset?',
              description:
                'This replaces your current subjects, student groups, and generated timetable with the default sample dataset.',
              confirmLabel: 'Restore Sample Data',
            })
          }
          className="btn-secondary text-xs min-h-[40px] px-3.5 py-2 flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Restore Sample Data</span>
        </button>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium ${
            feedback.type === 'error'
              ? 'bg-[#FFF1F3] border-[#642F43]/40 text-[#4A1F30]'
              : 'bg-[#F0FAF3] border-[#2E7D4F]/30 text-[#1B4D31]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#642F43]" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D4F]" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline underline-offset-2 shrink-0 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Single-Row Accessible Tablist */}
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
                ? divisions.length
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

      {/* TAB A: SUBJECTS */}
      {activeTab === 'subjects' && (
        <div
          role="tabpanel"
          id={getPanelId('subjects')}
          aria-labelledby={getTabId('subjects')}
        >
          <section className="card-premium p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
                  Subjects ({subjects.length})
                </h2>
                <p className="text-xs text-[#6F4253]">
                  Add, edit, or remove exam subjects with their subject codes.
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

            {/* Search */}
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
                <p className="text-xs text-[#6F4253]">
                  {subjects.length === 0
                    ? 'Add your first examination subject to begin scheduling.'
                    : 'Try clearing the search box or add a new subject.'}
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
                {/* Desktop / Tablet Table */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#C58E9B]/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F4E4E9] text-[#642F43] text-xs uppercase tracking-wider border-b border-[#C58E9B]/40">
                        <th className="py-3 px-4 font-bold">Subject Code</th>
                        <th className="py-3 px-4 font-bold">Subject Name</th>
                        <th className="py-3 px-4 font-bold">Enrolled Groups</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EED8DF] text-sm bg-[#FDF9FA]">
                      {filteredSubjects.map((subj) => (
                        <tr key={subj.id} className="hover:bg-[#FAF0F3]/75 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#642F43] whitespace-nowrap">
                            {subj.code}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#361522]">
                            {subj.name}
                          </td>
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
                              <span className="text-xs text-[#7D5563] italic">
                                None assigned yet
                              </span>
                            )}
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
                                    description: `Are you sure you want to remove "${subj.name}" (${subj.code})? This will also update conflict checks.`,
                                    confirmLabel: 'Delete Subject',
                                  })
                                }
                                aria-label={`Delete ${subj.code}`}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#C58E9B]/45 bg-[#FFF1F3] text-xs font-semibold text-[#4A1F30] hover:bg-[#F3D7DE] inline-flex items-center gap-1"
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

                {/* Mobile Cards (< md) */}
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
                          <h3 className="text-sm font-bold text-[#361522] mt-1.5">
                            {subj.name}
                          </h3>
                        </div>
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
                          className="flex-1 min-h-[44px] rounded-xl border border-[#C58E9B]/50 bg-[#FFF1F3] text-xs font-semibold text-[#4A1F30] inline-flex items-center justify-center gap-1.5"
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

      {/* TAB B: STUDENT GROUPS */}
      {activeTab === 'groups' && (
        <div
          role="tabpanel"
          id={getPanelId('groups')}
          aria-labelledby={getTabId('groups')}
        >
          <section className="card-premium p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
                  Student Groups ({divisions.length})
                </h2>
                <p className="text-xs text-[#6F4253]">
                  Manage student cohorts and the number of students in each group.
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
                  {divisions.length === 0
                    ? 'No student groups added yet'
                    : 'No matching student groups'}
                </p>
                {divisions.length === 0 ? (
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
                {/* Desktop / Tablet Table */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#C58E9B]/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F4E4E9] text-[#642F43] text-xs uppercase tracking-wider border-b border-[#C58E9B]/40">
                        <th className="py-3 px-4 font-bold">Group Name</th>
                        <th className="py-3 px-4 font-bold">Number of Students</th>
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
                            <td className="py-3 px-4 font-bold text-[#361522]">
                              {group.name}
                            </td>
                            <td className="py-3 px-4 font-mono text-[#642F43] font-semibold">
                              {group.studentCount} students
                            </td>
                            <td className="py-3 px-4 text-xs text-[#6F4253]">
                              {groupSubjects.length === 0
                                ? 'No subjects assigned'
                                : `${groupSubjects.length} ${groupSubjects.length === 1 ? 'subject' : 'subjects'} (${groupSubjects.map((s) => s.code).join(', ')})`}
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
                                      description: `Removing "${group.name}" will also unenroll this group from all subjects.`,
                                      confirmLabel: 'Delete Group',
                                    })
                                  }
                                  aria-label={`Delete ${group.name}`}
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#C58E9B]/45 bg-[#FFF1F3] text-xs font-semibold text-[#4A1F30] hover:bg-[#F3D7DE] inline-flex items-center gap-1"
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

                {/* Mobile Cards (< md) */}
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
                            className="flex-1 min-h-[44px] rounded-xl border border-[#C58E9B]/50 bg-[#FFF1F3] text-xs font-semibold text-[#4A1F30] inline-flex items-center justify-center gap-1.5"
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

      {/* TAB C: SUBJECT ENROLMENTS */}
      {activeTab === 'enrolments' && (
        <div
          role="tabpanel"
          id={getPanelId('enrolments')}
          aria-labelledby={getTabId('enrolments')}
        >
          <div className="space-y-5">
            <section className="card-premium p-4 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
                    Subject Enrolments
                  </h2>
                  <p className="text-xs text-[#6F4253]">
                    Choose a student group, select the subjects they take, and save to update conflict checks.
                  </p>
                </div>

                {selectedGroup && (
                  <button
                    type="button"
                    onClick={handleSaveEnrolments}
                    className="btn-primary text-xs sm:text-sm min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-2 shrink-0"
                  >
                    <Save className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {isEnrolmentDirty ? 'Save Enrolments' : 'Enrolments Saved'}
                    </span>
                  </button>
                )}
              </div>

              {divisions.length === 0 || subjects.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#FAF0F3]/80 border border-[#C58E9B]/35 text-center space-y-2">
                  <p className="text-sm font-semibold text-[#4A1F30]">
                    {divisions.length === 0
                      ? 'Add a student group first'
                      : 'Add subjects first'}
                  </p>
                  <p className="text-xs text-[#6F4253]">
                    You need at least one student group and one subject to manage enrolments.
                  </p>
                  <div className="pt-1 flex justify-center gap-2">
                    {divisions.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('groups')}
                        className="btn-secondary text-xs min-h-[40px] px-4 py-2"
                      >
                        Go to Student Groups
                      </button>
                    )}
                    {subjects.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('subjects')}
                        className="btn-secondary text-xs min-h-[40px] px-4 py-2"
                      >
                        Go to Subjects
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* 1. Group Selector */}
                  <div className="p-4 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label
                        htmlFor="examia-enrolment-group-select"
                        className="text-xs font-bold uppercase tracking-wider text-[#642F43]"
                      >
                        1. Select Student Group
                      </label>
                      {isEnrolmentDirty && (
                        <span className="text-xs font-semibold text-[#642F43]">
                          Unsaved changes — click &ldquo;Save Enrolments&rdquo; to apply
                        </span>
                      )}
                    </div>

                    <select
                      id="examia-enrolment-group-select"
                      value={selectedGroup?.id || ''}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="input-editorial w-full sm:max-w-sm text-sm font-semibold"
                    >
                      {divisions.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.studentCount} students)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Subjects Selection */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#642F43]">
                        2. Subjects Taken by {selectedGroup?.name} ({draftSubjectIds.length} selected)
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDraftSubjectIds(subjects.map((s) => s.id))}
                          className="text-xs font-semibold text-[#642F43] hover:underline px-2 py-1"
                        >
                          Select All
                        </button>
                        <span aria-hidden="true" className="text-[#C58E9B]">|</span>
                        <button
                          type="button"
                          onClick={() => setDraftSubjectIds([])}
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
                        aria-label="Filter subjects for enrolment"
                        value={enrolmentSearch}
                        onChange={(e) => setEnrolmentSearch(e.target.value)}
                        placeholder="Filter subjects by code or name..."
                        className="input-editorial pl-10 w-full text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {filteredEnrolmentSubjects.map((subj) => {
                        const isChecked = draftSubjectIds.includes(subj.id);
                        const otherGroups = (subj.divisions || []).filter(
                          (gName) => gName !== selectedGroup?.name
                        );
                        const effectiveGroupCount =
                          otherGroups.length + (isChecked ? 1 : 0);
                        const isSharedAcrossGroups = effectiveGroupCount >= 2;

                        return (
                          <label
                            key={subj.id}
                            className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition-colors min-h-[56px] ${
                              isChecked
                                ? 'bg-[#FDF9FA] border-[#642F43] shadow-xs'
                                : 'bg-[#FAF0F3]/60 border-[#C58E9B]/40 hover:bg-[#FAF0F3]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleDraftSubject(subj.id)}
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

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="font-mono text-xs font-bold text-[#642F43]">
                                  {subj.code}
                                </span>
                                {isSharedAcrossGroups ? (
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#642F43]/10 text-[#642F43] border border-[#642F43]/25">
                                    Shared ({effectiveGroupCount} groups)
                                  </span>
                                ) : otherGroups.length > 0 ? (
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F4E4E9] text-[#6F4253]">
                                    Taken by {otherGroups.join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-medium text-[#7D5563]">
                                    {isChecked ? 'Exclusive to this group' : 'Unassigned'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-[#361522] leading-snug">
                                {subj.name}
                              </p>
                              {otherGroups.length > 0 && isChecked && (
                                <p className="text-[11px] text-[#6F4253]">
                                  Also taken by: {otherGroups.join(', ')}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
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

            {/* Clearly Show Subjects Shared Between Groups */}
            <section className="card-premium p-4 sm:p-6 space-y-3">
              <div className="flex items-start gap-2.5">
                <Share2 className="w-4 h-4 text-[#642F43] mt-1 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-[#642F43]">
                    Shared Subjects Between Student Groups ({sharedSubjects.length})
                  </h3>
                  <p className="text-xs text-[#6F4253]">
                    Subjects taken by multiple student groups cannot share an examination slot with any other subject taken by those same groups.
                  </p>
                </div>
              </div>

              {sharedSubjects.length === 0 ? (
                <p className="text-xs text-[#7D5563] p-3.5 rounded-xl bg-[#FAF0F3]/75 border border-[#C58E9B]/30">
                  No subjects are currently shared across two or more student groups.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {sharedSubjects.map((subj) => (
                    <div
                      key={subj.id}
                      className="p-3.5 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#642F43]">
                          {subj.code}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#642F43] text-[#FDF8FA]">
                          Shared · {subj.divisions.length} groups
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#361522] leading-snug">
                        {subj.name}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {subj.divisions.map((gName) => (
                          <span
                            key={gName}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white text-[#642F43] border border-[#C58E9B]/40"
                          >
                            {gName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}
        subtitle="Enter the subject code, name, and optionally select enrolled groups."
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          {subjectFormError && (
            <p
              role="alert"
              className="p-3 rounded-xl bg-[#FFF1F3] border border-[#642F43]/40 text-xs font-semibold text-[#4A1F30]"
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

          {divisions.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#642F43]">
                Enrolled Student Groups (Optional)
              </span>
              <div className="flex flex-wrap gap-2">
                {divisions.map((div) => {
                  const active = subjectGroupsInput.includes(div.name);
                  return (
                    <button
                      key={div.id}
                      type="button"
                      onClick={() =>
                        setSubjectGroupsInput((prev) =>
                          prev.includes(div.name)
                            ? prev.filter((name) => name !== div.name)
                            : [...prev, div.name]
                        )
                      }
                      aria-pressed={active}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        active
                          ? 'bg-[#642F43] text-[#FDF8FA] border-[#642F43]'
                          : 'bg-[#FAF0F3] text-[#642F43] border-[#C58E9B]/50 hover:bg-[#F3E2E7]'
                      }`}
                    >
                      {div.name}
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
        subtitle="Specify the group name and number of students."
      >
        <form onSubmit={handleSaveGroup} className="space-y-4">
          {groupFormError && (
            <p
              role="alert"
              className="p-3 rounded-xl bg-[#FFF1F3] border border-[#642F43]/40 text-xs font-semibold text-[#4A1F30]"
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
              max="2000"
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
              className="btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold"
            >
              {editingGroup ? 'Save Changes' : 'Add Student Group'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Reset Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.title || 'Confirm Action'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#361522] leading-relaxed">
            {confirmAction?.description}
          </p>
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

