"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Briefcase,
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

const sectionIcons: Record<string, React.ReactNode> = {
  "job-identification": <Briefcase className="h-4 w-4" />,
  "job-description": <FileText className="h-4 w-4" />,
  "job-details": <UserCircle className="h-4 w-4" />,
  "benefits-package": <Gift className="h-4 w-4" />,
  "basic-information": <ClipboardList className="h-4 w-4" />,
  "background-information-questions": <HelpCircle className="h-4 w-4" />,
  "preferred-selection-by-the-employer": <Sparkles className="h-4 w-4" />,
};

const sectionGradients: Record<string, string> = {
  "job-identification": "from-cyan-500 to-cyan-600",
  "job-description": "from-blue-500 to-blue-600",
  "job-details": "from-indigo-500 to-indigo-600",
  "benefits-package": "from-emerald-500 to-emerald-600",
  "basic-information": "from-purple-500 to-purple-600",
  "background-information-questions": "from-green-500 to-green-600",
  "preferred-selection-by-the-employer": "from-amber-500 to-amber-600",
};

export function JobCreationSectionNav() {
  const sections = JOB_FORM_SECTIONS.map((section) => section.id);
  const [activeSection, setActiveSection] = useState<string | null>(sections[0] ?? null);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      const positions = sections
        .map((id) => {
          const element = document.getElementById(id);
          if (!element) return null;
          const top = element.getBoundingClientRect().top + window.scrollY;
          return { id, top, bottom: top + element.offsetHeight };
        })
        .filter(Boolean) as { id: string; top: number; bottom: number }[];

      for (let index = positions.length - 1; index >= 0; index -= 1) {
        const section = positions[index];
        if (scrollPosition >= section.top - 100) {
          setActiveSection(section.id);
          return;
        }
      }

      setActiveSection(positions[0]?.id ?? null);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <nav
        className={cn(
          "overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg transition-all duration-300",
          collapsed ? "w-12" : "w-72"
        )}
      >
        {!collapsed && (
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
            <h3 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-lg font-bold text-transparent">
              Navigation
            </h3>
          </div>
        )}
        <div className="py-3">
          {sections.map((id) => {
            const active = activeSection === id;
            const hovered = hoveredSection === id;
            const title = JOB_FORM_SECTIONS.find((section) => section.id === id)?.title ?? id;

            return (
              <div key={id} className="relative">
                {active && !collapsed && (
                  <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                )}
                <button
                  type="button"
                  onClick={() => scrollToSection(id)}
                  onMouseEnter={() => setHoveredSection(id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200",
                    active && "bg-blue-50",
                    hovered && !active && "bg-slate-50"
                  )}
                  title={title}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                      sectionGradients[id]
                    )}
                  >
                    {sectionIcons[id] ?? <Award className="h-4 w-4" />}
                  </div>
                  {!collapsed && (
                    <span
                      className={cn(
                        "text-sm capitalize text-slate-600",
                        active && "font-semibold text-blue-700"
                      )}
                    >
                      {title}
                    </span>
                  )}
                </button>
              </div>
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
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
