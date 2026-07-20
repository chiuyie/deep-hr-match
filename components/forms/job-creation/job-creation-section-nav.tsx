"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Briefcase,
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

const SECTION_SCROLL_OFFSET = 100;
const SECTION_ACTIVATION_OFFSET = 180;

function getOffsetWithinContainer(element: HTMLElement, container: HTMLElement) {
  const containerTop = container.getBoundingClientRect().top;
  return container.scrollTop + (element.getBoundingClientRect().top - containerTop);
}

export function JobCreationSectionNav() {
  const sections = useMemo(() => JOB_FORM_SECTIONS.map((section) => section.id), []);
  const [activeSection, setActiveSection] = useState<string | null>(sections[0] ?? null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  useEffect(() => {
    const scrollContainer = document.getElementById("dashboard-main");

    const updateActiveSection = () => {
      if (scrollContainer) {
        const containerTop = scrollContainer.getBoundingClientRect().top;
        const activationLine = containerTop + SECTION_ACTIVATION_OFFSET;
        let nextActive = sections[0] ?? null;

        for (const id of sections) {
          const element = document.getElementById(id);
          if (!element) continue;
          if (element.getBoundingClientRect().top <= activationLine) {
            nextActive = id;
            continue;
          }
          break;
        }

        setActiveSection((current) => (current === nextActive ? current : nextActive));
        return;
      }

      const scrollPosition = window.scrollY + SECTION_ACTIVATION_OFFSET;
      let nextActive = sections[0] ?? null;

      for (const id of sections) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top + window.scrollY <= scrollPosition) {
          nextActive = id;
          continue;
        }
        break;
      }

      setActiveSection((current) => (current === nextActive ? current : nextActive));
    };

    let frameId = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    const target = scrollContainer ?? window;
    target.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      cancelAnimationFrame(frameId);
      target.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const scrollContainer = document.getElementById("dashboard-main");

    if (scrollContainer) {
      const top = getOffsetWithinContainer(element, scrollContainer) - SECTION_SCROLL_OFFSET;
      scrollContainer.scrollTo({ top, behavior: "smooth" });
    } else {
      const top = element.getBoundingClientRect().top + window.pageYOffset - SECTION_SCROLL_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  const activeTitle =
    JOB_FORM_SECTIONS.find((section) => section.id === activeSection)?.title ?? "Jump to section";

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
              Job form navigation
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
            className="mt-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-lg"
          >
            <div className="space-y-1">
              {sections.map((id) => {
                const active = activeSection === id;
                const title = JOB_FORM_SECTIONS.find((section) => section.id === id)?.title ?? id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                        sectionGradients[id]
                      )}
                    >
                      {sectionIcons[id] ?? <Award className="h-4 w-4" />}
                    </div>
                    <span className="min-w-0 flex-1 break-words text-sm font-medium">{title}</span>
                  </button>
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
        >
          {!collapsed && (
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
              <h3 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-lg font-bold text-transparent">
                Navigation
              </h3>
            </div>
          )}
          <div className={cn("py-3", collapsed && "px-1.5")}>
            {sections.map((id) => {
              const active = activeSection === id;
              const hovered = hoveredSection === id;
              const title = JOB_FORM_SECTIONS.find((section) => section.id === id)?.title ?? id;

              return (
                <div key={id} className="relative">
                  {active && !collapsed && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-primary/80" />
                  )}
                  <button
                    type="button"
                    onClick={() => scrollToSection(id)}
                    onMouseEnter={() => setHoveredSection(id)}
                    onMouseLeave={() => setHoveredSection(null)}
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
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                        sectionGradients[id],
                        collapsed && active && "ring-2 ring-primary/30 ring-offset-1"
                      )}
                    >
                      {sectionIcons[id] ?? <Award className="h-4 w-4" />}
                    </div>
                    {!collapsed && (
                      <span
                        className={cn(
                          "text-sm capitalize text-slate-600",
                          active && "font-semibold text-primary"
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
