import React, { useState, useMemo } from 'react';
import { 
  Plus, Filter, Edit2, Trash2, BookOpen, 
  Users, RotateCcw, Check, AlertCircle, Layers, ArrowUpDown
} from 'lucide-react';
import Modal from '../components/Modal';

export default function SubjectsView({ 
  subjects, 
  divisions, 
  graph, 
  onAddSubject, 
  onEditSubject, 
  onDeleteSubject, 
  onResetBenchmark
}) {
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    divisions: [],
    studentCount: 60,
    category: 'Core Computer Science'
  });
  const [formError, setFormError] = useState('');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    subjects.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [subjects]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      const matchesDiv = 
        selectedDivisionFilter === 'ALL' || 
        s.divisions.includes(selectedDivisionFilter);

      const matchesCat = 
        selectedCategoryFilter === 'ALL' || 
        s.category === selectedCategoryFilter;

      return matchesDiv && matchesCat;
    });
  }, [subjects, selectedDivisionFilter, selectedCategoryFilter]);

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      code: '',
      name: '',
      divisions: divisions.length > 0 ? [divisions[0].name] : ['Division A'],
      studentCount: 60,
      category: 'Core Computer Science'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code,
      name: subject.name,
      divisions: [...subject.divisions],
      studentCount: subject.studentCount,
      category: subject.category || 'Core Computer Science'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDivisionToggle = (divName) => {
    setFormData(prev => {
      const exists = prev.divisions.includes(divName);
      if (exists) {
        if (prev.divisions.length === 1) {
          setFormError('Subject must be assigned to at least one division.');
          return prev;
        }
        return { ...prev, divisions: prev.divisions.filter(d => d !== divName) };
      } else {
        return { ...prev, divisions: [...prev.divisions, divName] };
      }
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError('Subject code is required (e.g. CS201).');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Subject name is required.');
      return;
    }
    if (formData.divisions.length === 0) {
      setFormError('Please select at least one student division.');
      return;
    }
    if (formData.studentCount <= 0) {
      setFormError('Number of students must be greater than zero.');
      return;
    }

    if (editingSubject) {
      onEditSubject({
        ...editingSubject,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        divisions: formData.divisions,
        studentCount: parseInt(formData.studentCount, 10),
        category: formData.category
      });
    } else {
      onAddSubject({
        id: `sub-${Date.now()}`,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        divisions: formData.divisions,
        studentCount: parseInt(formData.studentCount, 10),
        category: formData.category
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#642F43]">Curricular Subjects</h2>
          <p className="text-xs text-[#6F4253] mt-0.5">
            Configure subjects, student cohorts, and enrollment counts to dynamically build the conflict graph.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onResetBenchmark}
            className="btn-secondary text-xs min-h-[42px] py-2 px-4 w-full sm:w-auto justify-center whitespace-nowrap flex items-center gap-1.5"
            title="Reset to CS201, CS202, CS203, CS204, MA201 benchmark dataset"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset Benchmark Data</span>
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="btn-primary text-xs min-h-[42px] py-2 px-4 w-full sm:w-auto justify-center whitespace-nowrap flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add New Subject</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="card-premium p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#6F4253] w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#642F43]" />
            <span className="font-semibold uppercase text-[10px] tracking-wider">Filter:</span>
          </div>

          {/* Division Filter */}
          <select
            aria-label="Filter subjects by division"
            value={selectedDivisionFilter}
            onChange={(e) => setSelectedDivisionFilter(e.target.value)}
            className="w-full sm:w-auto min-h-[40px] clay-inset rounded-full px-3.5 py-2 text-xs font-medium text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
          >
            <option value="ALL">All Divisions</option>
            {divisions.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            aria-label="Filter subjects by category"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full sm:w-auto min-h-[40px] clay-inset rounded-full px-3.5 py-2 text-xs font-medium text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(selectedDivisionFilter !== 'ALL' || selectedCategoryFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSelectedDivisionFilter('ALL');
                setSelectedCategoryFilter('ALL');
              }}
              className="min-h-[36px] text-xs font-semibold text-[#642F43] hover:underline px-1"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="text-xs text-[#6F4253] self-start md:self-auto">
          Showing <strong className="text-[#361522]">{filteredSubjects.length}</strong> of {subjects.length} subjects
        </div>
      </div>

      {/* Subjects List & Table */}
      <div className="card-premium overflow-hidden">
        {filteredSubjects.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-[#6F4253]">
            <BookOpen className="w-10 h-10 mx-auto text-[#642F43] mb-3 stroke-[1.5]" />
            <p className="font-serif text-lg font-bold text-[#642F43]">No Subjects Found</p>
            <p className="text-xs mt-1">Try adjusting your filters or click "Add New Subject" above.</p>
          </div>
        ) : (
          <>
            {/* Mobile Stacked Cards (< 768px) */}
            <div className="md:hidden divide-y divide-[#C58E9B]/25 bg-[#FDF9FA]">
              {filteredSubjects.map(subject => {
                const degree = graph.degrees.get(subject.id) || 0;
                return (
                  <div key={subject.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="badge badge-lavender font-mono text-xs">{subject.code}</span>
                        <span className={`badge ${degree > 0 ? 'badge-peach' : 'badge-sage'} text-[11px]`}>
                          {degree} {degree === 1 ? 'edge' : 'edges'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(subject)}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl clay-inset hover:bg-[#EED8DF] text-[#6F4253] hover:text-[#642F43] transition-colors"
                          aria-label={`Edit ${subject.code}`}
                          title="Edit Subject"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSubject(subject.id)}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl clay-inset hover:bg-[#642F43] text-[#6F4253] hover:text-[#FDF8FA] transition-colors"
                          aria-label={`Delete ${subject.code}`}
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-[#361522] leading-snug">
                        {subject.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6F4253] mt-1">
                        <span>{subject.category || "General"}</span>
                        <span>&middot;</span>
                        <span><strong className="text-[#361522]">{subject.studentCount}</strong> enrolled</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-[#6F4253]">Divisions:</span>
                      {subject.divisions.map(div => (
                        <span key={div} className="badge badge-sage text-[10px]">
                          {div}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Accessible Table (md+) */}
            <div
              role="region"
              tabIndex={0}
              aria-label="Curricular subjects table"
              className="hidden md:block examia-table-region"
            >
              <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4E4E9] border-b border-[#C58E9B]/40 text-[#642F43] font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-5">Subject Code</th>
                  <th className="py-3.5 px-4">Subject Name</th>
                  <th className="py-3.5 px-4">Assigned Divisions</th>
                  <th className="py-3.5 px-4 text-center">Enrolled Students</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Graph Conflicts</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C58E9B]/22 bg-[#FDF9FA]">
                {filteredSubjects.map(subject => {
                  const degree = graph.degrees.get(subject.id) || 0;
                  return (
                    <tr 
                      key={subject.id} 
                      className="hover:bg-[#FAF0F3] transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-[#642F43]">
                        <span className="badge badge-lavender font-mono text-xs">
                          {subject.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#361522]">
                        {subject.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {subject.divisions.map(div => (
                            <span key={div} className="badge badge-sage text-[10px]">
                              {div}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#361522]">
                        {subject.studentCount}
                      </td>
                      <td className="py-3.5 px-4 text-[#6F4253] font-medium">
                        {subject.category || "General"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span 
                          className={`badge ${degree > 0 ? 'badge-peach' : 'badge-sage'} text-[11px]`}
                          title={`Conflicts with ${degree} other subjects`}
                        >
                          {degree} {degree === 1 ? 'edge' : 'edges'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(subject)}
                          className="p-1.5 rounded-xl clay-inset hover:bg-[#EED8DF] text-[#6F4253] hover:text-[#642F43] transition-colors"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSubject(subject.id)}
                          className="p-1.5 rounded-xl clay-inset hover:bg-[#642F43] text-[#6F4253] hover:text-[#FDF8FA] transition-colors"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? "Edit Subject Information" : "Add New Subject"}
        subtitle="Manage subject parameters, cohort divisions, and capacity requirements."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#F4E4E9] border border-[#642F43]/40 text-xs text-[#642F43] flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#642F43] mb-1">
                Subject Code *
              </label>
                <input
                  type="text"
                  placeholder="e.g. CS201"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] placeholder:text-[#6F4253]/75 focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#642F43] mb-1">
                  Student Count *
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={formData.studentCount}
                  onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                  className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#642F43] mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Java Programming"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] placeholder:text-[#6F4253]/75 focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#642F43] mb-1">
                Category / Stream
              </label>
              <input
                type="text"
                placeholder="e.g. Core Computer Science"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] placeholder:text-[#6F4253]/75 focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#642F43] mb-2">
                Assigned Student Divisions * (Select all that take this subject)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {divisions.map(div => {
                  const isSelected = formData.divisions.includes(div.name);
                  return (
                    <button
                      type="button"
                      key={div.id}
                      onClick={() => handleDivisionToggle(div.name)}
                      className={`min-h-[44px] p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-[#642F43] border-[#4A1F30] text-[#FDF8FA] shadow-sm'
                          : 'clay-inset text-[#6F4253] hover:text-[#642F43]'
                      }`}
                    >
                      <span>{div.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#FDF8FA]" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#6F4253] mt-1.5">
                Note: If any other subject shares one of these divisions, a conflict edge is automatically forged in the conflict graph.
              </p>
            </div>

            <div className="pt-3 border-t border-[#C58E9B]/32 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary text-xs min-h-[42px] py-2 px-4 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs min-h-[42px] py-2 px-5 w-full sm:w-auto"
              >
                {editingSubject ? "Save Changes" : "Create Subject"}
              </button>
            </div>
        </form>
      </Modal>
    </div>
  );
}

