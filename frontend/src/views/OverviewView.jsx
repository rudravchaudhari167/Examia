import React from 'react';
import { 
  BookOpen, Users, Share2, CalendarCheck, Sparkles
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function OverviewView({ 
  subjects, 
  divisions, 
  graph, 
  timetableResult, 
  setActiveTab,
  onOpenAddSubject
}) {
  const totalStudents = subjects.reduce((sum, s) => sum + (s.studentCount || 0), 0);
  const slotsRequired = timetableResult ? timetableResult.numSlots : (graph.subjects.length > 0 ? "Pending" : 0);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Banner */}
      <div className="clay-dark-hero p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/12 border border-[#E8CBD3]/35 text-[#F6E6EB] mb-3">Academic Excellence &middot; DAA Engine</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#FDF8FA] tracking-tight leading-tight">
            Good morning, Administrator
          </h1>
          <p className="text-sm text-[#F0D9E0] mt-2 font-sans leading-relaxed">
            Here's an overview of your examination scheduling workspace. Graph coloring heuristics and recursive backtracking are active to guarantee 100% conflict-free sessions.
          </p>

          <div className="flex items-center gap-4 mt-6 flex-wrap">
            <button 
              onClick={() => setActiveTab('generate')}
              className="bg-[#FDF8FA] text-[#642F43] hover:bg-[#F5E4EA] border border-[#E8CBD3] rounded-full font-semibold text-xs py-2.5 px-5 inline-flex items-center gap-2 shadow-[0_6px_16px_-4px_rgba(38,13,23,0.35)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#642F43]" />
              <span>Generate Timetable</span>
            </button>
            <button 
              onClick={() => setActiveTab('graph')}
              className="bg-[#C58E9B]/22 text-[#FDF8FA] hover:bg-[#C58E9B]/34 border border-[#E8CBD3]/45 rounded-full font-semibold text-xs py-2.5 px-5 inline-flex items-center gap-2 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#EED7DF]" />
              <span>Explore Conflict Graph</span>
            </button>
          </div>
        </div>

        {/* Decorative subtle background art */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block opacity-75 pointer-events-none">
          <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" stroke="#C58E9B" strokeWidth="1.5" strokeDasharray="6 6" />
            <circle cx="60" cy="70" r="14" fill="#C58E9B" stroke="#FDF8FA" strokeWidth="2" />
            <circle cx="140" cy="60" r="16" fill="#E8CBD3" stroke="#FDF8FA" strokeWidth="2" />
            <circle cx="150" cy="140" r="15" fill="#FDF8FA" stroke="#C58E9B" strokeWidth="2" />
            <circle cx="65" cy="145" r="13" fill="#8F4B63" stroke="#E8CBD3" strokeWidth="2" />
            <circle cx="100" cy="105" r="18" fill="#4A1F30" stroke="#E8CBD3" strokeWidth="2" />
            <line x1="60" y1="70" x2="140" y2="60" stroke="#E8CBD3" strokeWidth="1.5" />
            <line x1="140" y1="60" x2="150" y2="140" stroke="#E8CBD3" strokeWidth="1.5" />
            <line x1="150" y1="140" x2="100" y2="105" stroke="#E8CBD3" strokeWidth="1.5" />
            <line x1="100" y1="105" x2="65" y2="145" stroke="#E8CBD3" strokeWidth="1.5" />
            <line x1="65" y1="145" x2="60" y2="70" stroke="#E8CBD3" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Subjects"
          value={subjects.length}
          subtitle={`${totalStudents} cumulative examinees`}
          icon={BookOpen}
          accentColor="lavender"
          badgeText="Active"
        />
        <StatCard
          title="Student Divisions"
          value={divisions.length}
          subtitle="Enrolled student cohorts"
          icon={Users}
          accentColor="sage"
          badgeText="Cohorts"
        />
        <StatCard
          title="Detected Conflicts"
          value={graph.edgeCount}
          subtitle={`Graph density: ${(graph.density * 100).toFixed(1)}%`}
          icon={Share2}
          accentColor="peach"
          badgeText={graph.edgeCount > 0 ? "Shared" : "None"}
        />
        <StatCard
          title="Required Time Slots"
          value={slotsRequired}
          subtitle={timetableResult ? `Verified by ${timetableResult.algorithmName.split(' ')[0]}` : "Run solver to evaluate"}
          icon={CalendarCheck}
          accentColor="rose"
          badgeText={timetableResult ? "Optimal" : "Awaiting"}
        />
      </div>

      {/* Quick Workspace Actions & Core DAA Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Quick Workspace Actions */}
        <div className="lg:col-span-7">
          <div className="card-premium p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#642F43] mb-1">
                Quick Workspace Actions
              </h3>
              <p className="text-xs text-[#6F4253] mb-4">
                Rapid administrative controls for curriculum changes and timetable generation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={onOpenAddSubject}
                className="p-4 rounded-2xl clay-inset hover:bg-[#EFE0E6] hover:-translate-y-0.5 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#642F43] text-[#FDF8FA] border border-[#4A1F30] shadow-xs flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <p className="font-bold text-xs text-[#361522]">Add New Subject</p>
                <p className="text-[11px] text-[#6F4253] mt-0.5">Register course &amp; divisions</p>
              </button>

              <button
                onClick={() => setActiveTab('graph')}
                className="p-4 rounded-2xl clay-inset hover:bg-[#EFE0E6] hover:-translate-y-0.5 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#EED8DF] text-[#642F43] border border-[#C58E9B]/55 shadow-xs flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Share2 className="w-4 h-4" />
                </div>
                <p className="font-bold text-xs text-[#361522]">Build Conflict Graph</p>
                <p className="text-[11px] text-[#6F4253] mt-0.5">Visualize G=(V,E) topology</p>
              </button>

              <button
                onClick={() => setActiveTab('generate')}
                className="p-4 rounded-2xl clay-inset hover:bg-[#EFE0E6] hover:-translate-y-0.5 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#C58E9B] text-[#361522] border border-[#642F43]/25 shadow-xs flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="font-bold text-xs text-[#361522]">Generate Timetable</p>
                <p className="text-[11px] text-[#6F4253] mt-0.5">Run Greedy or Backtrack</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Core DAA Mission */}
        <div className="lg:col-span-5">
          <div className="clay-dark-hero p-6 text-[#FDF8FA] h-full flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E8CBD3]">
                Core DAA Mission
              </span>
              <h3 className="font-serif text-2xl font-bold mt-2 leading-tight text-[#FDF8FA]">
                "Every examination. Perfectly placed."
              </h3>
              <p className="text-xs text-[#F0D9E0] mt-2.5 leading-relaxed">
                Transforming complex graph chromatic constraints into smooth, human-friendly academic calendars. Zero simultaneous exams for any student.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#C58E9B]/30 flex items-center justify-between text-[11px] text-[#E8CBD3]">
              <span>NP-Hard Problem</span>
              <span className="font-mono">Welsh-Powell &amp; DFS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

