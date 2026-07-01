import { EmptyState } from "@/components/ui";
import type { LucideIcon } from "lucide-react";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyIcon,
  emptyTitle = "No records found",
  emptyDescription,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!rows.length) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-500">
            {columns.map((c, i) => (
              <th key={i} className={`px-4 py-3 ${c.className ?? ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-ink-50/60 transition">
              {columns.map((c, i) => (
                <td key={i} className={`px-4 py-3 ${c.className ?? ""}`}>{c.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
