import React, { useState } from 'react';
import { 
  Plus, Users, Edit2, Trash2, BookOpen, AlertCircle, 
  Layers, CheckCircle2, ShieldAlert
} from 'lucide-react';
import Modal from '../components/Modal';

export default function DivisionsView({ 
  divisions, 
  subjects, 
  graph, 
  onAddDivision, 
  onEditDivision, 
  onDeleteDivision 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    studentCount: 45,
    department: 'Computer Engineering',
    semester: 'Semester IV'
  });
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingDivision(null);
    setFormData({
      name: `Division ${String.fromCharCode(65 + divisions.length)}`,
      studentCount: 45,
      department: 'Computer Engineering',
      semester: 'Semester IV'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (division) => {
    setEditingDivision(division);
    setFormData({
      name: division.name,
      studentCount: division.studentCount,
      department: division.department || 'Computer Engineering',
      semester: division.semester || 'Semester IV'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Division name is required.');
      return;
    }
    if (formData.studentCount <= 0) {
      setFormError('Student count must be greater than zero.');
      return;
    }

    if (editingDivision) {
      onEditDivision({
        ...editingDivision,
        name: formData.name.trim(),
        studentCount: parseInt(formData.studentCount, 10),
        department: formData.department.trim(),
        semester: formData.semester.trim()
      });
    } else {
      onAddDivision({
        id: `div-${Date.now()}`,
        name: formData.name.trim(),
        studentCount: parseInt(formData.studentCount, 10),
        department: formData.department.trim(),
        semester: formData.semester.trim()
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#642F43]">Student Cohorts &amp; Divisions</h2>
          <p className="text-xs text-[#6F4253] mt-0.5">
            Student groups taking course exams. Conflicts arise whenever two examinations enroll the same division.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary text-xs min-h-[42px] py-2 px-4 flex items-center justify-center gap-1.5 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Division</span>
        </button>
      </div>

      {/* Division Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {divisions.map(division => {
          // Subjects assigned to this division
          const assignedSubjects = subjects.filter(s => s.divisions.includes(division.name));
          
          // Number of conflicts generated inside this division:
          // A division taking K subjects produces K*(K-1)/2 conflict pairs!
          const k = assignedSubjects.length;
          const divisionConflictsCount = (k * (k - 1)) / 2;

          return (
            <div key={division.id} className="card-premium p-4 sm:p-6 flex flex-col justify-between min-w-0">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#C58E9B]/32">
                  <div className="min-w-0">
                    <span className="badge badge-sage mb-1.5 text-xs font-bold">
                      {division.name}
                    </span>
                    <h4 className="font-serif font-bold text-base text-[#642F43] break-words">
                      {division.department}
                    </h4>
                    <p className="text-xs text-[#6F4253]">{division.semester}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(division)}
                      className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl clay-inset hover:bg-[#EED8DF] text-[#6F4253] hover:text-[#642F43] transition-colors"
                      aria-label={`Edit ${division.name}`}
                      title="Edit Division"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDivision(division.id)}
                      className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl clay-inset hover:bg-[#642F43] text-[#6F4253] hover:text-[#FDF8FA] transition-colors"
                      aria-label={`Delete ${division.name}`}
                      title="Delete Division"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 my-4">
                  <div className="p-2.5 rounded-2xl clay-inset min-w-0">
                    <p className="text-[10px] uppercase font-semibold text-[#6F4253]">Cohort Size</p>
                    <p className="text-sm font-bold text-[#361522] mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#642F43] shrink-0" />
                      <span>{division.studentCount} Students</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-2xl clay-inset min-w-0">
                    <p className="text-[10px] uppercase font-semibold text-[#6F4253]">Induced Conflicts</p>
                    <p className="text-sm font-bold text-[#642F43] mt-0.5">
                      {divisionConflictsCount} Edge pairs
                    </p>
                  </div>
                </div>

                {/* Assigned Subjects */}
                <div>
                  <p className="text-[11px] font-semibold uppercase text-[#6F4253] mb-2 flex items-center justify-between">
                    <span>Enrolled Subjects ({assignedSubjects.length})</span>
                  </p>

                  {assignedSubjects.length === 0 ? (
                    <p className="text-xs text-[#6F4253] italic py-2">No subjects currently assigned.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {assignedSubjects.map(sub => (
                        <div 
                          key={sub.id}
                          className="p-2.5 rounded-xl clay-inset text-xs flex items-center justify-between gap-2 min-w-0"
                        >
                          <span className="font-mono font-bold text-[#642F43] shrink-0">{sub.code}</span>
                          <span className="text-[#361522] truncate min-w-0 flex-1 text-right font-medium">{sub.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Conflict notice footer */}
              <div className="mt-4 pt-3 border-t border-[#C58E9B]/32 text-[11px] font-medium text-[#6F4253] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#642F43]" />
                <span>Requires minimum {assignedSubjects.length} independent slots</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DAA Real-World Explanation Banner (Requirement 8 & 9) */}
      <div className="card-premium p-4 sm:p-6">
        <h4 className="font-serif font-bold text-base text-[#642F43] mb-1">
          How Division Overlap Governs Conflict Detection
        </h4>
        <p className="text-xs text-[#361522] leading-relaxed max-w-3xl">
          If <strong>Division A</strong> is enrolled in both <em>Java Programming</em> and <em>Data Structures</em>, students in Division A cannot be in two examination halls simultaneously. Therefore, the algorithm treats this as a hard conflict edge $(u, v) \in E$, mathematically enforcing that their graph coloring values must satisfy $Color(u) \neq Color(v)$.
        </p>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDivision ? "Edit Student Division" : "Add Student Division"}
        subtitle="Specify division name, student capacity, and academic department."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#F4E4E9] border border-[#642F43]/40 text-xs text-[#642F43] flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#642F43] mb-1">
              Division Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Division A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] placeholder:text-[#6F4253]/75 focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#642F43] mb-1">
              Cohort Student Count *
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

          <div>
            <label className="block text-xs font-bold text-[#642F43] mb-1">
              Department
            </label>
            <input
              type="text"
              placeholder="e.g. Computer Engineering"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] placeholder:text-[#6F4253]/75 focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#642F43] mb-1">
              Semester
            </label>
            <input
              type="text"
              placeholder="e.g. Semester IV"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] placeholder:text-[#6F4253]/75 focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
            />
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
              {editingDivision ? "Save Changes" : "Create Division"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

