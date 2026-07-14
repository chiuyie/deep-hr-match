"use client";

import { useEffect, useId, useState } from "react";
import { AdminEmptyState, AdminTableToolbar } from "@/components/admin/admin-ui";
import {  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminSearchableTableProps {
  recordCount: number;
  searchPlaceholder?: string;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  columns: string[];
  children: React.ReactNode;
}

export function AdminSearchableTable({
  recordCount,
  searchPlaceholder,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  columns,
  children,
}: AdminSearchableTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(recordCount);
  const tbodyId = useId();

  useEffect(() => {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    let visible = 0;
    tbody.querySelectorAll("tr[data-search]").forEach((row) => {
      const text = (row.getAttribute("data-search") ?? "").toLowerCase();
      const matches =
        searchQuery.length === 0 || text.includes(searchQuery.toLowerCase().trim());
      row.classList.toggle("hidden", !matches);
      if (matches) visible += 1;
    });
    setVisibleCount(visible);
  }, [searchQuery, recordCount, tbodyId, children]);

  if (recordCount === 0) {
    return (
      <AdminEmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div>
      <AdminTableToolbar
        recordCount={searchQuery ? visibleCount : recordCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={searchPlaceholder}
      />
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              {columns.map((column) => (
                <TableHead key={column} className="font-semibold text-slate-600">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody id={tbodyId}>{children}</TableBody>
        </Table>
      </div>
      {searchQuery && visibleCount === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          No records match &quot;{searchQuery}&quot;
        </p>
      )}
    </div>
  );
}
