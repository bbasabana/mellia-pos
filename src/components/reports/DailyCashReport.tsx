"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, CalendarDays, HandCoins, Loader2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLOSURE_STATUS, dayLabel, fc, type DayClosure } from "@/components/transactions/CashCountPanel";

type DayStatus = {
    day: string;
    closedReason: string | null;
    salesCount: number;
    salesCashCdf: number;
    status: "CLOSED_OK" | "CLOSED_DAY" | "CLOSED_DAY_SALES" | "TO_CLOSE" | "NO_SALES" | "TODAY";
};

const DAY_STYLE: Record<DayStatus["status"], { label: string; className: string }> = {
    CLOSED_OK: { label: "Clôturée", className: "bg-green-50 border-green-200 text-green-800" },
    CLOSED_DAY: { label: "Fermé", className: "bg-gray-100 border-gray-200 text-gray-500" },
    CLOSED_DAY_SALES: { label: "Fermé, mais ventes", className: "bg-amber-50 border-amber-300 text-amber-800" },
    TO_CLOSE: { label: "À clôturer", className: "bg-amber-50 border-amber-300 text-amber-800" },
    NO_SALES: { label: "Aucune vente", className: "bg-white border-gray-200 text-gray-500" },
    TODAY: { label: "Aujourd'hui", className: "bg-sky-50 border-sky-200 text-sky-800" },
};

/** Current month in Kinshasa time (UTC+1), as YYYY-MM. */
function currentMonth(): string {
    const d = new Date(Date.now() + 3600_000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Rapport « Caisse journalière »: one line per day closure of the chosen month, and what the
 * gaps add up to (losses, justified, still to verify, surpluses) plus the cash handed over.
 */
export default function DailyCashReport() {
    const [month, setMonth] = useState(currentMonth);
    const [rows, setRows] = useState<DayClosure[] | null>(null);
    const [days, setDays] = useState<DayStatus[]>([]);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setRows(null);
        setError(null);
        try {
            const res = await fetch(`/api/cash-counts?month=${month}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Erreur de chargement");
            // Oldest first: the report reads like a ledger.
            setRows([...(data.data.counts as DayClosure[])].reverse());
            setDays(data.data.days ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur réseau");
            setRows([]);
        }
    }, [month]);

    useEffect(() => {
        load();
    }, [load]);

    const totals = useMemo(() => {
        const t = {
            days: 0, salesCash: 0, salesOther: 0, outflows: 0, expected: 0, counted: 0,
            loss: 0, justified: 0, toVerify: 0, surplus: 0, withdrawals: 0,
        };
        for (const r of rows ?? []) {
            t.days += 1;
            t.salesCash += r.salesCashCdf;
            t.salesOther += r.salesOtherCdf;
            t.outflows += r.expensesCdf + r.purchasesCdf;
            t.expected += r.expectedCdf;
            t.counted += r.countedCdf;
            t.withdrawals += r.withdrawalCdf;
            const d = r.differenceCdf;
            if (d > 0) t.surplus += d;
            else if (d < 0) {
                if (r.status === "LOSS") t.loss += -d;
                else if (r.status === "JUSTIFIED") t.justified += -d;
                else if (r.status === "TO_VERIFY") t.toVerify += -d;
            }
        }
        return t;
    }, [rows]);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 bg-white border border-gray-200 rounded-sm px-3 py-1.5 shadow-sm">
                    <CalendarDays size={14} className="text-gray-400" />
                    <span className="text-[10px] uppercase font-bold text-gray-400">Mois</span>
                    <input
                        type="month"
                        value={month}
                        max={currentMonth()}
                        onChange={(e) => e.target.value && setMonth(e.target.value)}
                        className="text-xs font-bold text-gray-800 outline-none bg-transparent"
                    />
                </label>
                <p className="text-xs text-gray-500">
                    Chaque ligne est une clôture de la journée (Historique des ventes › Clôturer la journée).
                </p>
            </div>

            {rows === null ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-[#00d3fa]" size={36} />
                </div>
            ) : (
                <>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm p-3">{error}</div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Tile icon={<TrendingUp size={16} />} label="Ventes cash" value={fc(totals.salesCash)}
                            hint={`${totals.days} journée(s) clôturée(s)`} tone="text-green-700" />
                        <Tile icon={<Wallet size={16} />} label="Compté / attendu" value={fc(totals.counted)}
                            hint={`Attendu : ${fc(totals.expected)}`} tone="text-gray-900" />
                        <Tile icon={<TrendingDown size={16} />} label="Pertes" value={fc(totals.loss)}
                            hint={`Justifié : ${fc(totals.justified)} · Surplus : ${fc(totals.surplus)}`} tone="text-red-700" />
                        <Tile icon={<HandCoins size={16} />} label="Versé au patron" value={fc(totals.withdrawals)}
                            hint={`Dépenses + achats caisse : ${fc(totals.outflows)}`} tone="text-purple-700" />
                    </div>

                    {days.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[10px] uppercase font-black tracking-wider text-gray-500">Jour par jour</p>
                                <p className="text-[11px] text-gray-500">
                                    {days.filter((d) => !d.closedReason).length} jour(s) ouvert(s) ·{" "}
                                    {days.filter((d) => d.status === "CLOSED_OK").length} clôturé(s) ·{" "}
                                    {days.filter((d) => d.closedReason).length} fermé(s)
                                    {days.some((d) => d.status === "TO_CLOSE" || d.status === "CLOSED_DAY_SALES") && (
                                        <span className="text-amber-700 font-bold">
                                            {" "}· {days.filter((d) => d.status === "TO_CLOSE" || d.status === "CLOSED_DAY_SALES").length} à vérifier
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-1.5">
                                {days.map((d) => {
                                    const st = DAY_STYLE[d.status];
                                    return (
                                        <div key={d.day} className={cn("border rounded-sm px-2 py-1.5", st.className)} title={d.closedReason ?? st.label}>
                                            <p className="text-[11px] font-bold capitalize">{dayLabel(d.day, "EEE d")}</p>
                                            <p className="text-[10px] truncate">{d.closedReason && d.status === "CLOSED_DAY" ? d.closedReason : st.label}</p>
                                            {d.salesCount > 0 && <p className="text-[10px] opacity-80">{d.salesCount} vente(s)</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {totals.toVerify > 0 && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-sm p-3 flex items-start gap-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>
                                <strong>{fc(totals.toVerify)}</strong> de manquant encore « à vérifier ». Réglez-les dans{" "}
                                <Link href="/dashboard/transactions" className="underline font-bold">Historique des ventes</Link>{" "}
                                avant la clôture du mois.
                            </span>
                        </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-x-auto">
                        <table className="w-full text-xs min-w-[860px]">
                            <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="text-left px-3 py-2">Journée</th>
                                    <th className="text-right px-3 py-2">Fond</th>
                                    <th className="text-right px-3 py-2">Ventes cash</th>
                                    <th className="text-right px-3 py-2">Sorties</th>
                                    <th className="text-right px-3 py-2">Attendu</th>
                                    <th className="text-right px-3 py-2">Compté</th>
                                    <th className="text-right px-3 py-2">Écart</th>
                                    <th className="text-right px-3 py-2">Versé</th>
                                    <th className="text-left px-3 py-2">Statut</th>
                                    <th className="text-left px-3 py-2">Par</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="text-center text-gray-400 py-10">
                                            Aucune journée clôturée ce mois-ci.
                                        </td>
                                    </tr>
                                )}
                                {rows.map((r) => {
                                    const st = CLOSURE_STATUS[r.status];
                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <p className="font-bold text-gray-800 capitalize">{dayLabel(r.businessDay)}</p>
                                                <p className="text-[10px] text-gray-400">
                                                    Clôturée le {format(new Date(r.periodEnd), "d MMM HH:mm", { locale: fr })}
                                                </p>
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-500">{fc(r.openingFloatCdf)}</td>
                                            <td className="px-3 py-2 text-right font-bold text-green-700">{fc(r.salesCashCdf)}</td>
                                            <td className="px-3 py-2 text-right text-red-600">{fc(r.expensesCdf + r.purchasesCdf)}</td>
                                            <td className="px-3 py-2 text-right">{fc(r.expectedCdf)}</td>
                                            <td className="px-3 py-2 text-right font-bold">{fc(r.countedCdf)}</td>
                                            <td className={cn(
                                                "px-3 py-2 text-right font-black",
                                                r.differenceCdf < 0 ? "text-red-600" : r.differenceCdf > 0 ? "text-sky-600" : "text-gray-400"
                                            )}>
                                                {r.differenceCdf > 0 ? "+" : ""}{fc(r.differenceCdf)}
                                            </td>
                                            <td className="px-3 py-2 text-right text-purple-700">{r.withdrawalCdf ? fc(r.withdrawalCdf) : "—"}</td>
                                            <td className="px-3 py-2">
                                                <span className={cn("inline-block border rounded-sm px-1.5 py-0.5 text-[10px] font-bold", st.className)}>
                                                    {st.label}
                                                </span>
                                                {r.settlementCategory && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{r.settlementCategory}</p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-gray-500">
                                                {r.userName}
                                                {(r.resolutionNote || r.notes) && (
                                                    <p className="text-[10px] text-gray-400 max-w-[180px] truncate" title={r.resolutionNote || r.notes || ""}>
                                                        {r.resolutionNote || r.notes}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {rows.length > 0 && (
                                <tfoot className="bg-gray-50 font-black text-gray-800">
                                    <tr>
                                        <td className="px-3 py-2">Total</td>
                                        <td />
                                        <td className="px-3 py-2 text-right text-green-700">{fc(totals.salesCash)}</td>
                                        <td className="px-3 py-2 text-right text-red-600">{fc(totals.outflows)}</td>
                                        <td className="px-3 py-2 text-right">{fc(totals.expected)}</td>
                                        <td className="px-3 py-2 text-right">{fc(totals.counted)}</td>
                                        <td className={cn("px-3 py-2 text-right", totals.counted - totals.expected < 0 ? "text-red-600" : "text-gray-700")}>
                                            {fc(totals.counted - totals.expected)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-purple-700">{fc(totals.withdrawals)}</td>
                                        <td colSpan={2} />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                    {totals.salesOther > 0 && (
                        <p className="text-[11px] text-gray-500">
                            Ventes hors cash (carte, mobile money) sur ces journées : {fc(totals.salesOther)} — elles ne passent pas par le tiroir.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

function Tile({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint: string; tone: string }) {
    return (
        <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1.5">
                {icon} {label}
            </p>
            <p className={cn("text-lg font-black mt-1", tone)}>{value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p>
        </div>
    );
}
