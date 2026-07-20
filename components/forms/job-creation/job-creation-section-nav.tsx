"use client";

import { useState } from "react";
import {
  Award,
  Briefcase,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Gift,
  HelpCircle,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JOB_FORM_SECTIONS } from "@/lib/constants/job-form";
import {
  getSectionFillStats,
  isSectionMarkedComplete,
  type JobFormSectionId,
} from "@/lib/utils/job-form-progress";
import type { JobFormState } from "@/lib/utils/job-form";

const sectionIcons: Record<string, React.ReactNode> = {
  "job-identification": <Briefcase className="h-4 w-4" />,
  "job-details": <UserCircle className="h-4 w-4" />,
  compensation: <Gift className="h-4 w-4" />,
  "basic-information": <ClipboardList className="h-4 w-4" />,
  "background-information-questions": <HelpCircle className="h-4 w-4" />,
  "preferred-selection-by-the-employer": <Sparkles className="h-4 w-4" />,
};

const sectionGradients: Record<string, string> = {
  "job-identification": "from-cyan-500 to-cyan-600",
  "job-details": "from-indigo-500 to-indigo-600",
  compensation: "from-emerald-500 to-emerald-600",
  "basic-information": "from-purple-500 to-purple-600",
  "background-information-questions": "from-green-500 to-green-600",
  "preferred-selection-by-the-employer": "from-amber-500 to-amber-600",
};

interface JobCreationSectionNavProps {
  currentSectionIndex: number;
  visitedThroughIndex: number;
  values: JobFormState;
  onSectionSelect: (index: number) => void;
}

function SectionNavButton({
  id,
  index,
  title,
  active,
  complete,
  fillPercent,
  collapsed,
  onSelect,
  onHover,
  hovered,
}: {
  id: JobFormSectionId;
  index: number;
  title: string;
  active: boolean;
  complete: boolean;
  fillPercent: number;
  collapsed: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  hovered: boolean;
}) {
  return (
    <div className="relative">
      {active && !collapsed && (
        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-primary/80" />
      )}
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() => onHover(id)}
        onMouseLeave={() => onHover(null)}
        aria-current={active ? "step" : undefined}
        className={cn(
          "flex w-full items-center text-left transition-all duration-200",
          collapsed ? "justify-center px-0 py-2" : "gap-3 px-4 py-3",
          !collapsed && active && "bg-primary/10",
          !collapsed && hovered && !active && "bg-slate-50",
          collapsed && active && "rounded-xl bg-primary/10",
          collapsed && hovered && !active && "rounded-xl bg-slate-50"
        )}
        title={title}
      >
        <div
          className={cn(
            "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
            sectionGradients[id],
            collapsed && active && "ring-2 ring-primary/30 ring-offset-1",
            complete && "ring-2 ring-emerald-400/50"
          )}
        >
          {complete ? <Check className="h-4 w-4" strokeWidth={3} /> : sectionIcons[id] ?? <Award className="h-4 w-4" />}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                "block text-sm text-slate-600",
                active && "font-semibold text-primary",
                complete && !active && "text-emerald-700"
              )}
            >
              {index + 1}. {title}
            </span>
            {!complete && fillPercent > 0 && (
              <span className="text-xs text-slate-400">In progress</span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

export function JobCreationSectionNav({
  currentSectionIndex,
  visitedThroughIndex,
  values,
  onSectionSelect,
}: JobCreationSectionNavProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const activeSection = JOB_FORM_SECTIONS[currentSectionIndex];
  const activeTitle = activeSection?.title ?? "Sections";

  const handleSelect = (index: number) => {
    onSectionSelect(index);
    setMobileOpen(false);
  };

  return (
    <div className="relative">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
          aria-expanded={mobileOpen}
          aria-controls="job-creation-mobile-nav"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Step {currentSectionIndex + 1} of {JOB_FORM_SECTIONS.length}
            </p>
            <p className="truncate text-sm font-semibold text-slate-800">{activeTitle}</p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
              mobileOpen && "rotate-180"
            )}
          />
        </button>

        {mobileOpen && (
          <nav
            id="job-creation-mobile-nav"
            className="mt-3 max-h-[min(24rem,60vh)] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-3 shadow-lg"
            aria-label="Job form sections"
          >
            <div className="space-y-1">
              {JOB_FORM_SECTIONS.map((section, index) => {
                const stats = getSectionFillStats(values, section.id);
                const complete = isSectionMarkedComplete(
                  values,
                  section.id,
                  visitedThroughIndex,
                  index
                );
                return (
                  <SectionNavButton
                    key={section.id}
                    id={section.id}
                    index={index}
                    title={section.title}
                    active={currentSectionIndex === index}
                    complete={complete}
                    fillPercent={stats.percent}
                    collapsed={false}
                    onSelect={() => handleSelect(index)}
                    onHover={setHoveredSection}
                    hovered={hoveredSection === section.id}
                  />
                );
              })}
            </div>
          </nav>
        )}
      </div>

      <div className="relative hidden lg:block">
        <nav
          className={cn(
            "rounded-2xl border border-slate-100 bg-white shadow-lg transition-all duration-300",
            collapsed ? "w-16 overflow-visible" : "w-72 overflow-hidden"
          )}
          aria-label="Job form sections"
        >
          {!collapsed && (
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
              <h3 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-lg font-bold text-transparent">
                Form sections
              </h3>
              <p className="mt-1 text-xs text-slate-500">Jump to any step — your answers are kept.</p>
            </div>
          )}
          <div className={cn("py-3", collapsed && "px-1.5")}>
            {JOB_FORM_SECTIONS.map((section, index) => {
              const stats = getSectionFillStats(values, section.id);
              const complete = isSectionMarkedComplete(
                values,
                section.id,
                visitedThroughIndex,
                index
              );
              return (
                <SectionNavButton
                  key={section.id}
                  id={section.id}
                  index={index}
                  title={section.title}
                  active={currentSectionIndex === index}
                  complete={complete}
                  fillPercent={stats.percent}
                  collapsed={collapsed}
                  onSelect={() => handleSelect(index)}
                  onHover={setHoveredSection}
                  hovered={hoveredSection === section.id}
                />
              );
            })}
          </div>
        </nav>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
