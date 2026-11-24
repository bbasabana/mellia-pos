"use client";

import { useState } from "react";
import { CalendarRange, FileDown, Loader2, Sun } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type Filter = { period: string; startDate: string; endDate: string; query: string; archives: boolean };

const PERIOD_LABEL: Record<string, string> = {
    day: "Aujourd'hui",
    "3days": "3 derniers jours",
    week: "Cette semaine",
    month: "Ce mois",
    year: "Cette année",
    all: "Toutes les ventes",
};

/**
 * Exports the sales as a PDF, ticket by ticket with their articles and the Terrasse / VIP
 * price, to send on WhatsApp so the staff can compare with their paper notes.
 */
export default function SalesExportModal({ isOpen, onClose, filter }: { isOpen: boolean; onClose: () => void; filter: Filter }) {
    const [scope, setScope] = useState<"open" | "filter">("open");
    const [busy, setBusy] = useState(false);

    const filterLabel =
        filter.period && PERIOD_LABEL[filter.period]
            ? PERIOD_LABEL[filter.period]
            : filter.startDate
            ? `Du ${filter.startDate}${filter.endDate ? ` au ${filter.endDate}` : ""}`
            : "Toutes les ventes";

    const run = async () => {
        setBusy(true);
        try {
            const params = new URLSearchParams();
            if (scope === "open") params.set("scope", "open");
            else {
                if (filter.period) params.set("period", filter.period);
                if (filter.startDate) params.set("startDate", filter.startDate);
                if (filter.endDate) params.set("endDate", filter.endDate);
                if (filter.query) params.set("query", filter.query);
                if (filter.archives) params.set("archives", "1");
            }
            const res = await fetch(`/api/sales/report?${params}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error || "Export impossible");
            if (json.data.tickets.length === 0) {
                showToast("Aucune vente sur cette période", "info");
                return;
            }
            const { buildSalesPdf, reportFileName, shareOrDownload } = await import("@/lib/sales-pdf");
            const blob = await buildSalesPdf(json.data);
            const how = await shareOrDownload(blob, reportFileName(json.data));
            showToast(how === "shared" ? "PDF prêt à partager" : "PDF téléchargé : envoyez-le sur WhatsApp", "success");
            onClose();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Export impossible", "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Exporter les ventes en PDF" size="md">
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    Chaque facture dans l&apos;ordre (1, 2, 3…) avec ses articles, la quantité, le prix Terrasse ou VIP et le total.
                    À envoyer sur WhatsApp pour comparer avec le cahier.
                </p>
                <div className="space-y-2">
                    <Choice
                        active={scope === "open"}
                        onClick={() => setScope("open")}
                        icon={<Sun size={18} />}
                        title="Journée en cours"
                        text="Depuis la dernière clôture de la journée : ce que la clôture va compter."
                    />
                    <Choice
                        active={scope === "filter"}
                        onClick={() => setScope("filter")}
                        icon={<CalendarRange size={18} />}
                        title="Ventes affichées"
                        text={`Le filtre de la page : ${filterLabel}${filter.query ? ` · « ${filter.query} »` : ""}${
                            filter.archives ? " · archives" : ""
                        }`}
                    />
                </div>
                <button type="button" onClick={run} disabled={busy} className="ui-btn-primary w-full py-3">
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                    {busy ? "Préparation du PDF…" : "Créer le PDF"}
                </button>
            </div>
        </Modal>
    );
}

function Choice({
    active,
    onClick,
    icon,
    title,
    text,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full text-left rounded-xl border p-3.5 flex gap-3 transition-colors",
                active ? "border-gray-900 ring-2 ring-gray-900/10 bg-gray-50" : "border-gray-200 hover:border-gray-300"
            )}
        >
            <span className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500")}>
                {icon}
            </span>
            <span>
                <span className="block text-sm font-semibold text-gray-900">{title}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{text}</span>
            </span>
        </button>
    );
}
