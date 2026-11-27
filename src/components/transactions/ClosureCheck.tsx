"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Ban, Copy, Loader2, Receipt, Search, Smartphone, Tag, Wallet } from "lucide-react";

type Ticket = {
    id: string;
    ticketNum: string;
    createdAt: string;
    totalCdf: number;
    payment: string;
    isCash: boolean;
    cashier: string;
    items: string;
};

type Check = {
    expectedCdf: number;
    gapCdf: number | null;
    summary: {
        count: number;
        cashCount: number;
        cashCdf: number;
        otherCount: number;
        otherCdf: number;
        expensesCdf: number;
        openingFloatCdf: number;
    };
    byCashier: Array<{ cashier: string; count: number; cashCdf: number; otherCdf: number }>;
    duplicates: Array<{ first: Ticket; second: Ticket; minutes: number }>;
    matching: { singles: Ticket[]; pairs: Array<[Ticket, Ticket]> };
    otherPayments: Ticket[];
    editedPrices: Array<{ ticket: Ticket; name: string; qty: number; unitCdf: number; usualCdf: number[] }>;
    cancelled: Ticket[];
    expenses: Array<{ id: string; description: string; category: string; amountCdf: number; date: string }>;
};

const fc = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} FC`;
const hm = (d: string) => format(new Date(d), "HH:mm", { locale: fr });
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/**
 * "Vérifier avant d'enregistrer": when the money counted does not match, looks through the
 * open day for the usual causes before the gap is recorded — a sale rung up twice, tickets
 * worth exactly the gap (missing from the paper notes?), mobile money, prices typed by hand,
 * cancelled tickets, expenses paid from the drawer.
 */
export default function ClosureCheck({
    countedCdf,
    onFindTicket,
}: {
    countedCdf: number;
    onFindTicket?: (ticketNum: string) => void;
}) {
    const [data, setData] = useState<Check | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/cash-counts/check?counted=${countedCdf}`);
                const json = await res.json();
                if (!json.success) throw new Error();
                if (alive) {
                    setData(json.data);
                    setFailed(false);
                }
            } catch {
                if (alive) setFailed(true);
            } finally {
                if (alive) setLoading(false);
            }
        }, 450);
        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [countedCdf]);

    if (failed && !data) {
        return <p className="text-xs text-red-600">Vérification impossible pour le moment.</p>;
    }
    if (!data) {
        return (
            <div className="rounded-lg border border-gray-200 p-4 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Recherche des causes possibles…
            </div>
        );
    }

    const gap = data.gapCdf ?? 0;
    const shortfall = gap < 0;
    const amount = Math.abs(gap);
    const cancelledMatching = !shortfall ? data.cancelled.filter((t) => t.totalCdf === amount) : [];
    const otherMatching = !shortfall ? data.otherPayments.filter((t) => t.totalCdf === amount) : [];
    const hasMatches = data.matching.singles.length > 0 || data.matching.pairs.length > 0;
    const findings =
        data.duplicates.length +
        (hasMatches ? 1 : 0) +
        data.editedPrices.length +
        data.cancelled.length +
        data.otherPayments.length +
        data.expenses.length;

    const chip = (t: Ticket, highlight = false) => (
        <button
            key={t.id}
            type="button"
            onClick={() => onFindTicket?.(t.ticketNum)}
            title={t.items}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                highlight ? "border-red-300 bg-white text-red-700 hover:bg-red-50" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
            }`}
        >
            <Search size={10} className="opacity-50" />
            {t.ticketNum} · {hm(t.createdAt)} · {fc(t.totalCdf)}
        </button>
    );

    return (
        <div className={`rounded-lg border border-gray-200 bg-white overflow-hidden ${loading ? "opacity-60" : ""}`}>
            <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-700">Vérifier avant d&apos;enregistrer</p>
                {loading && <Loader2 size={12} className="animate-spin text-gray-400" />}
            </div>

            <div className="p-3 space-y-3 text-sm">
                {/* What the app recorded: compare with the paper notes */}
                <div className="rounded-md bg-sky-50 border border-sky-100 p-2.5 text-xs text-sky-900 space-y-1">
                    <p>
                        <strong>Cahier :</strong> l&apos;application a {plural(data.summary.count, "facture")} —{" "}
                        {data.summary.cashCount} en espèces ({fc(data.summary.cashCdf)})
                        {data.summary.otherCount > 0 && `, ${data.summary.otherCount} autrement (${fc(data.summary.otherCdf)})`}.
                    </p>
                    {data.byCashier.length > 1 &&
                        data.byCashier.map((c) => (
                            <p key={c.cashier} className="text-sky-800">
                                {c.cashier || "Sans nom"} : {plural(c.count, "facture")} · espèces {fc(c.cashCdf)}
                            </p>
                        ))}
                </div>

                {data.duplicates.length > 0 && (
                    <Finding
                        icon={<Copy size={14} />}
                        tone="red"
                        title={`${plural(data.duplicates.length, "doublon")} possible${data.duplicates.length > 1 ? "s" : ""}`}
                        text="Même vente à quelques minutes d'écart : annulez la deuxième si c'est un doublon."
                    >
                        {data.duplicates.map((d) => (
                            <div key={d.second.id} className="flex flex-wrap items-center gap-1.5">
                                {chip(d.first)}
                                <span className="text-[11px] text-gray-400">puis {d.minutes} min après</span>
                                {chip(d.second, true)}
                            </div>
                        ))}
                    </Finding>
                )}

                {shortfall && hasMatches && (
                    <Finding
                        icon={<Receipt size={14} />}
                        tone="red"
                        title={`Factures qui font exactement ${fc(amount)}`}
                        text="Vérifiez qu'elles ont bien été encaissées."
                    >
                        {data.matching.singles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">{data.matching.singles.map((t) => chip(t, true))}</div>
                        )}
                        {data.matching.pairs.map(([a, b]) => (
                            <div key={`${a.id}-${b.id}`} className="flex flex-wrap items-center gap-1.5">
                                {chip(a, true)}
                                <span className="text-[11px] text-gray-400">+</span>
                                {chip(b, true)}
                            </div>
                        ))}
                    </Finding>
                )}

                {!shortfall && (cancelledMatching.length > 0 || otherMatching.length > 0) && (
                    <Finding
                        icon={<Receipt size={14} />}
                        tone="amber"
                        title={`Factures qui font exactement ${fc(amount)}`}
                        text="Facture annulée ou Mobile Money payée en espèces ?"
                    >
                        <div className="flex flex-wrap gap-1.5">{[...cancelledMatching, ...otherMatching].map((t) => chip(t, true))}</div>
                    </Finding>
                )}

                {data.editedPrices.length > 0 && (
                    <Finding
                        icon={<Tag size={14} />}
                        tone="amber"
                        title={`${data.editedPrices.length} prix différent${data.editedPrices.length > 1 ? "s" : ""} de la carte`}
                        text="Prix changé à la main."
                    >
                        {data.editedPrices.map((l, i) => (
                            <div key={`${l.ticket.id}-${i}`} className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                                {chip(l.ticket)}
                                <span>
                                    {l.qty}× {l.name} à {fc(l.unitCdf)}
                                    {l.usualCdf.length > 0 && ` (carte : ${l.usualCdf.map(fc).join(" / ")})`}
                                </span>
                            </div>
                        ))}
                    </Finding>
                )}

                {data.otherPayments.length > 0 && (
                    <Finding
                        icon={<Smartphone size={14} />}
                        tone="gray"
                        title={`${plural(data.otherPayments.length, "facture")} hors espèces · ${fc(data.summary.otherCdf)}`}
                        text="Pas attendues dans le tiroir."
                    >
                        <div className="flex flex-wrap gap-1.5">{data.otherPayments.map((t) => chip(t))}</div>
                    </Finding>
                )}

                {data.cancelled.length > 0 && (
                    <Finding
                        icon={<Ban size={14} />}
                        tone="gray"
                        title={data.cancelled.length > 1 ? `${data.cancelled.length} factures annulées` : "1 facture annulée"}
                        text="Ne comptent pas dans la recette."
                    >
                        <div className="flex flex-wrap gap-1.5">{data.cancelled.map((t) => chip(t))}</div>
                    </Finding>
                )}

                {data.expenses.length > 0 && (
                    <Finding
                        icon={<Wallet size={14} />}
                        tone="gray"
                        title={`Dépenses payées par la caisse · ${fc(data.summary.expensesCdf)}`}
                        text="Déjà retirées de la recette."
                    >
                        <ul className="text-xs text-gray-600 space-y-0.5">
                            {data.expenses.map((e) => (
                                <li key={e.id} className="flex justify-between gap-2">
                                    <span className="truncate">
                                        {hm(e.date)} · {e.description || e.category}
                                    </span>
                                    <span className="font-semibold tabular-nums whitespace-nowrap">{fc(e.amountCdf)}</span>
                                </li>
                            ))}
                        </ul>
                    </Finding>
                )}

                {findings === 0 && (
                    <p className="text-xs text-gray-500">
                        Aucune cause trouvée : recomptez l&apos;argent.
                    </p>
                )}
            </div>
        </div>
    );
}

function Finding({
    icon,
    tone,
    title,
    text,
    children,
}: {
    icon: React.ReactNode;
    tone: "red" | "amber" | "gray";
    title: string;
    text: string;
    children: React.ReactNode;
}) {
    const styles = {
        red: "border-red-200 bg-red-50/60 text-red-800",
        amber: "border-amber-200 bg-amber-50/60 text-amber-800",
        gray: "border-gray-200 bg-gray-50/60 text-gray-800",
    }[tone];
    return (
        <div className={`rounded-md border p-2.5 space-y-2 ${styles}`}>
            <div className="flex gap-2">
                <span className="mt-0.5 shrink-0">{icon}</span>
                <div>
                    <p className="text-xs font-bold">{title}</p>
                    <p className="text-[11px] opacity-80">{text}</p>
                </div>
            </div>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}
