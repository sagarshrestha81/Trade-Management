import React from "react";

export function Table({ children, className = "", ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)]">
      <table className={`w-full text-left text-sm border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`border-b border-[var(--card-border)] bg-[#0d1324]/50 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] ${className}`} {...props}>{children}</thead>;
}

export function TableBody({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-[var(--card-border)] ${className}`} {...props}>{children}</tbody>;
}

export function TableRow({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-[#151c2f]/40 transition-colors ${className}`} {...props}>{children}</tr>;
}

export function TableHead({ children, className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-4 py-3 text-left font-semibold text-slate-300 ${className}`} {...props}>{children}</th>;
}

export function TableCell({ children, className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 text-slate-300 align-middle ${className}`} {...props}>{children}</td>;
}
