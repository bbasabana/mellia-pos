"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCheck,
    Loader2,
    Minus,
    Plus,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { showToast } from "@/components/ui/Toast";

type Expectation = {
    salesCashCdf: number;
    salesOtherCdf: number;
    expensesCdf: number;
    purchasesCdf: number;
    salesCount: number;
};

type Status = "BALANCED" | "TO_VERIFY" | "LOSS" | "JUSTIFIED";

type CashCount = {
    id: string;
    periodStart: string;
    expectedCdf: number;
    countedCdf: number;
    differenceCdf: number;
    status: Status;
    notes: string | null;
    resolutionNote: string | null;
    resolvedByName: string | null;
    userName: string;
    createdAt: string;
};

const STATUS: Record<Status, { label: string; className: string }> = {
    BALANCED: { label: "Correct", className: "bg-green-50 text-green-700 border-green-200" },
    TO_VERIFY: { label: "À vérifier", className: "bg-amber-50 text-amber-700 border-amber-200" },
    LOSS: { label: "Perte", className: "bg-red-50 text-red-700 border-red-200" },
    JUSTIFIED: { label: "Justifié", className: "bg-sky-50 text-sky-700 border-sky-200" },
};

const fc = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} FC`;
const digits = (s: string) => s.replace(/[^0-9]/g, "");
const grouped = (s: string) => (digits(s) ? Number(digits(s)).toLocaleString("fr-FR") : "");

function dayBounds(day: string) {
    const [y, m, d] = day.split("-").map(Number);
    return {
        from: new Date(y, m - 1, d, 0, 0, 0, 0).toISOString(),
        to: new Date(y, m - 1, d, 23, 59, 59, 999).toISOString(),
    };
}

/**
 * Cash count: the till should hold cash sales − till expenses − till purchases (+ starting
 * float). The cashier types the money actually counted; the gap is computed at once and kept
 * as "à vérifier" or "perte" for the manager to settle.
 */
export default function CashCountPanel({ canSettle }: { canSettle: boolean }) {
    const [day, setDay] = useState(() => format(new Date(), "yyyy-MM-dd"));
    const [expectation, setExpectation] = useState<Expectation | null>(null);
    const [counts, setCounts] = useState<CashCount[]>([]);
    const [pending, setPending] = useState({ count: 0, totalCdf: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [counted, setCounted] = useState("");
    const [openingFloat, setOpeningFloat] = useState("");
    const [classAs, setClassAs] = useState<"TO_VERIFY" | "LOSS">("TO_VERIFY");
    const [notes, setNotes] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { from, to } = dayBounds(day);
            const res = await fetch(`/api/cash-counts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
            const json = await res.json();
            if (json.success) {
                setExpectation(json.data.expectation);
                setCounts(json.data.counts);
                setPending(json.data.pending);
            } else {
                showToast(json.error || "Impossible de charger la caisse", "error");
            }
        } catch {
            showToast("Impossible de charger la caisse", "error");
        } finally {
            setLoading(false);
        }
    }, [day]);

    useEffect(() => {
        load();
    }, [load]);

    const floatCdf = Number(digits(openingFloat) || 0);
    const expected = expectation
        ? floatCdf + expectation.salesCashCdf - expectation.expensesCdf - expectation.purchasesCdf
        : 0;
    const countedCdf = digits(counted) ? Number(digits(counted)) : null;
    const diff = countedCdf === null ? null : countedCdf - expected;

    const save = async () => {
        if (countedCdf === null) {
            showToast("Saisissez l'argent compté", "error");
            return;
        }
        setSaving(true);
        try {
            const { from, to } = dayBounds(day);
            const res = await fetch("/api/cash-counts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ from, to, countedCdf, openingFloatCdf: floatCdf, status: classAs, notes }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || "Enregistrement impossible");
            const d = json.data.differenceCdf as number;
            showToast(
                d === 0 ? "Caisse correcte, contrôle enregistré" : `Écart de ${fc(d)} enregistré (${STATUS[json.data.status as Status].label})`,
                d === 0 ? "success" : "info"
            );
            setCounted("");
            setNotes("");
            setClassAs("TO_VERIFY");
            load();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Enregistrement impossible", "error");
        } finally {
            setSaving(false);
        }
    };

    // Manager's pending classification per count, before it is saved.
    const [settling, setSettling] = useState<Record<string, { status: Status; note: string }>>({});

    const settle = async (id: string) => {
        const draft = settling[id];
        if (!draft) return;
        const { status, note: resolutionNote } = draft;
        try {
            const res = await fetch(`/api/cash-counts?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, resolutionNote }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            showToast(`Écart classé : ${STATUS[status].label}`, "success");
            setSettling((s) => {
                const next = { ...s };
                delete next[id];
                return next;
            });
            load();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Action impossible", "error");
        }
    };

    const result = useMemo(() => {
        if (diff === null) return null;
        if (diff === 0) return { tone: "ok" as const, title: "Caisse correcte", text: "L'argent compté correspond à la facture." };
        if (diff < 0) return { tone: "short" as const, title: `Manquant : ${fc(-diff)}`, text: `Il fallait ${fc(expected)}, compté ${fc(countedCdf!)}.` };
        return { tone: "over" as const, title: `Surplus : ${fc(diff)}`, text: `Il fallait ${fc(expected)}, compté ${fc(countedCdf!)}.` };
    }, [diff, expected, countedCdf]);

    return (
        <div className="bg-white border border-gray-200 rounded-lg md:rounded-sm shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-3 justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
                    <ClipboardCheck size={14} className="text-[#71de00]" />
                    Contrôle de caisse — argent compté
                </h3>
                <div className="flex items-center gap-3">
                    {pending.count > 0 && (
                        <span className="text-[11px] font-bold px-2 py-1 rounded border bg-amber-50 text-amber-700 border-amber-200">
                            {pending.count} écart{pending.count > 1 ? "s" : ""} à vérifier · {fc(pending.totalCdf)}
                        </span>
                    )}
                    <input
                        type="date"
                        value={day}
                        max={format(new Date(), "yyyy-MM-dd")}
                        onChange={(e) => e.target.value && setDay(e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                    />
                </div>
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* What the till should hold */}
                <div className="space-y-2">
                    <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                        Ce qui doit rester · {format(new Date(day + "T12:00:00"), "EEEE d MMMM", { locale: fr })}
                    </p>
                    {loading || !expectation ? (
                        <div className="h-40 flex items-center justify-center text-gray-400">
                            <Loader2 className="animate-spin" size={18} />
                        </div>
                    ) : (
                        <>
                            <Line icon={<Plus size={12} />} label="Fond de caisse de départ" tone="text-gray-700">
                                <input
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={openingFloat}
                                    onChange={(e) => setOpeningFloat(grouped(e.target.value))}
                                    className="w-32 text-right font-bold border border-gray-200 rounded px-2 py-1"
                                />
                            </Line>
                            <Line icon={<TrendingUp size={12} />} label={`Ventes en espèces (${expectation.salesCount} ticket${expectation.salesCount > 1 ? "s" : ""})`} tone="text-green-700">
                                + {fc(expectation.salesCashCdf)}
                            </Line>
                            <Line icon={<Minus size={12} />} label="Dépenses payées par la caisse" tone="text-red-700">
                                − {fc(expectation.expensesCdf)}
                            </Line>
                            <Line icon={<TrendingDown size={12} />} label="Achats payés par la caisse" tone="text-orange-700">
                                − {fc(expectation.purchasesCdf)}
                            </Line>
                            <div className="flex items-center justify-between rounded-lg md:rounded-sm border-2 border-[#00d3fa] bg-[#00d3fa]/10 px-3 py-3">
                                <span className="text-xs font-black uppercase tracking-wider text-[#0891b2]">Doit rester en caisse</span>
                                <span className="text-xl font-black text-[#0891b2]">{fc(expected)}</span>
                            </div>
                            {expectation.salesOtherCdf > 0 && (
                                <p className="text-[11px] text-gray-500">
                                    Carte / Mobile Money : {fc(expectation.salesOtherCdf)} — hors caisse, non compté.
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* What was counted */}
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Argent compté (reçu)</span>
                        <div className="mt-1 flex items-center border-2 border-gray-200 focus-within:border-[#00d3fa] rounded-lg md:rounded-sm px-3">
                            <input
                                inputMode="numeric"
                                placeholder={expected > 0 ? expected.toLocaleString("fr-FR") : "0"}
                                value={counted}
                                onChange={(e) => setCounted(grouped(e.target.value))}
                                className="flex-1 py-3 text-2xl font-black outline-none bg-transparent"
                            />
                            <span className="text-gray-400 font-bold">FC</span>
                        </div>
                    </label>

                    {result && (
                        <div
                            className={`rounded-lg md:rounded-sm border p-3 flex gap-3 ${
                                result.tone === "ok"
                                    ? "bg-green-50 border-green-200 text-green-800"
                                    : result.tone === "short"
                                    ? "bg-red-50 border-red-200 text-red-800"
                                    : "bg-amber-50 border-amber-200 text-amber-800"
                            }`}
                        >
                            {result.tone === "ok" ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                            <div>
                                <p className="font-black text-lg leading-tight">{result.title}</p>
                                <p className="text-xs opacity-80">{result.text}</p>
                            </div>
                        </div>
                    )}

                    {diff !== null && diff !== 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Classer l&apos;écart</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(["TO_VERIFY", "LOSS"] as const).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setClassAs(s)}
                                        className={`py-2 rounded border-2 text-sm font-bold transition ${
                                            classAs === s
                                                ? s === "LOSS"
                                                    ? "border-red-500 bg-red-50 text-red-700"
                                                    : "border-amber-500 bg-amber-50 text-amber-700"
                                                : "border-gray-200 text-gray-500 hover:border-gray-300"
                                        }`}
                                    >
                                        {STATUS[s].label}
                                    </button>
                                ))}
                            </div>
                            <input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Explication (ex : transport payé, erreur de monnaie…)"
                                className="w-full text-sm border border-gray-200 rounded px-3 py-2"
                            />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={save}
                        disabled={saving || countedCdf === null || loading}
                        className="w-full py-3 rounded-lg md:rounded-sm bg-gray-900 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        Enregistrer le contrôle
                    </button>
                </div>
            </div>

            {counts.length > 0 && (
                <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="text-left px-4 py-2">Jour</th>
                                <th className="text-right px-4 py-2">Attendu</th>
                                <th className="text-right px-4 py-2">Compté</th>
                                <th className="text-right px-4 py-2">Écart</th>
                                <th className="text-left px-4 py-2">Statut</th>
                                <th className="text-left px-4 py-2">Par / note</th>
                                {canSettle && <th className="px-4 py-2" />}
                            </tr>
                        </thead>
                        <tbody>
                            {counts.map((c) => (
                                <tr key={c.id} className="border-t border-gray-100 align-top">
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        {format(new Date(c.periodStart), "dd/MM/yyyy")}
                                        <div className="text-[11px] text-gray-400">compté à {format(new Date(c.createdAt), "HH:mm")}</div>
                                    </td>
                                    <td className="px-4 py-2 text-right whitespace-nowrap">{fc(c.expectedCdf)}</td>
                                    <td className="px-4 py-2 text-right whitespace-nowrap">{fc(c.countedCdf)}</td>
                                    <td
                                        className={`px-4 py-2 text-right font-bold whitespace-nowrap ${
                                            c.differenceCdf < 0 ? "text-red-600" : c.differenceCdf > 0 ? "text-amber-600" : "text-green-600"
                                        }`}
                                    >
                                        {c.differenceCdf > 0 ? "+" : ""}
                                        {fc(c.differenceCdf)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${STATUS[c.status].className}`}>
                                            {STATUS[c.status].label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs text-gray-600 max-w-xs">
                                        <div className="font-semibold">{c.userName}</div>
                                        {c.notes && <div>{c.notes}</div>}
                                        {c.resolutionNote && (
                                            <div className="text-gray-500">
                                                → {c.resolutionNote}
                                                {c.resolvedByName ? ` (${c.resolvedByName})` : ""}
                                            </div>
                                        )}
                                    </td>
                                    {canSettle && (
                                        <td className="px-4 py-2 whitespace-nowrap text-right">
                                            {c.status !== "BALANCED" && (
                                                <div className="flex flex-col items-end gap-1">
                                                    <select
                                                        value={settling[c.id]?.status ?? c.status}
                                                        onChange={(e) =>
                                                            setSettling((s) => ({
                                                                ...s,
                                                                [c.id]: {
                                                                    status: e.target.value as Status,
                                                                    note: s[c.id]?.note ?? c.resolutionNote ?? "",
                                                                },
                                                            }))
                                                        }
                                                        className="text-xs border border-gray-200 rounded px-1 py-1"
                                                        aria-label="Classer l'écart"
                                                    >
                                                        <option value="TO_VERIFY">À vérifier</option>
                                                        <option value="LOSS">Perte</option>
                                                        <option value="JUSTIFIED">Justifié</option>
                                                    </select>
                                                    {settling[c.id] && (
                                                        <div className="flex gap-1">
                                                            <input
                                                                value={settling[c.id].note}
                                                                onChange={(e) =>
                                                                    setSettling((s) => ({
                                                                        ...s,
                                                                        [c.id]: { ...s[c.id], note: e.target.value },
                                                                    }))
                                                                }
                                                                placeholder="Motif (ex : transport payé)"
                                                                className="text-xs border border-gray-200 rounded px-2 py-1 w-44"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => settle(c.id)}
                                                                className="text-xs font-bold px-2 py-1 rounded bg-gray-900 text-white"
                                                            >
                                                                OK
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function Line({
    icon,
    label,
    tone,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    tone: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-dashed border-gray-100 pb-2">
            <span className="text-sm text-gray-600 flex items-center gap-2">
                <span className={tone}>{icon}</span>
                {label}
            </span>
            <span className={`font-bold whitespace-nowrap ${tone}`}>{children}</span>
        </div>
    );
}
