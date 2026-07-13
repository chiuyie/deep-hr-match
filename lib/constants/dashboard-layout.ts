export const DASHBOARD_SIDEBAR_WIDTH_CLASS = "w-64";
export const DASHBOARD_SIDEBAR_COLLAPSED_WIDTH_CLASS = "w-[4.5rem]";

export function getDashboardSidebarWidthClass(collapsed: boolean) {
  return collapsed ? DASHBOARD_SIDEBAR_COLLAPSED_WIDTH_CLASS : DASHBOARD_SIDEBAR_WIDTH_CLASS;
}
