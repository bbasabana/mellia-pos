"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/** Previous / next page buttons with "page / pages"; hidden when everything fits on one page. */
export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
    if (pages <= 1) return null;
    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={() => onPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                aria-label="Page précédente"
            >
                <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-medium text-gray-700 tabular-nums">
                {page} / {pages}
            </span>
            <button
                type="button"
                onClick={() => onPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="p-1.5 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                aria-label="Page suivante"
            >
                <ChevronRight size={14} />
            </button>
        </div>
    );
}
