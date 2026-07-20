/**
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardLayoutProvider } from "@/components/layout/dashboard-layout-context";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/employer",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt} />
  ),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/lib/auth/actions", () => ({
  signOut: vi.fn(),
}));

function renderHeader() {
  return render(
    <DashboardLayoutProvider>
      <DashboardHeader role="employer" userName="Taylor" title="Employer Dashboard" />
    </DashboardLayoutProvider>
  );
}

describe("DashboardHeader", () => {
  it("opens the mobile navigation sheet", async () => {
    const user = userEvent.setup();
    renderHeader();

    const mobileTrigger = screen.getByRole("button", { name: "Open navigation menu" });
    await user.click(mobileTrigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Dashboard sections" })).toBeInTheDocument();
  });

  it("toggles sidebar collapse from the desktop control", async () => {
    const user = userEvent.setup();
    renderHeader();

    const collapseButton = screen.getByRole("button", { name: "Collapse sidebar" });
    await user.click(collapseButton);

    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });
});
