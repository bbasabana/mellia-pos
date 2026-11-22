"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useReactToPrint } from "react-to-print";
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Lock,
    Minus,
    Printer,
    RotateCcw,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { showToast } from "@/components/ui/Toast";

type Expectation = {
    salesCashCdf: number;
    salesOtherCdf: number;
    expensesCdf: number;
    purchasesCdf: number;
    salesCount: number;
    otherCount: number;
};

type OpenDay = {
    ready: boolean;
    startDate: string | null;
    periodStart: string;
    periodEnd: string;
    openingFloatCdf: number;
    floatSource: string;
    expectation: Expectation;
    expectedCdf: number;
};

type Status = "BALANCED" | "TO_VERIFY" | "LOSS" | "JUSTIFIED";

export type DayClosure = {
    id: string;
    periodStart: string;
    periodEnd: string;
    salesCashCdf: number;
    salesOtherCdf: number;
    expensesCdf: number;
    purchasesCdf: number;
    openingFloatCdf: number;
    expectedCdf: number;
    countedCdf: number;
    differenceCdf: number;
    withdrawalCdf: number;
    status: Status;
    notes: string | null;
    resolutionNote: string | null;
    resolvedByName: string | null;
    settlementCategory: string | null;
    userName: string;
    createdAt: string;
};

export const CLOSURE_STATUS: Record<Status, { label: string; className: string }> = {
    BALANCED: { label: "Correct", className: "bg-green-50 text-green-700 border-green-200" },
    TO_VERIFY: { label: "À vérifier", className: "bg-amber-50 text-amber-700 border-amber-200" },
    LOSS: { label: "Perte", className: "bg-red-50 text-red-700 border-red-200" },
    JUSTIFIED: { label: "Justifié", className: "bg-sky-50 text-sky-700 border-sky-200" },
};

export const fc = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} FC`;
const digits = (s: string) => s.replace(/[^0-9]/g, "");
const grouped = (s: string) => (digits(s) ? Number(digits(s)).toLocaleString("fr-FR") : "");
const when = (d: string) => format(new Date(d), "EEE d MMM HH:mm", { locale: fr });

/**
 * Clôture de la journée (Z). The till must hold: cash carried from the previous closure +
 * cash sales − till expenses − till purchases since then. The cashier types the money
 * counted; the gap shows at once. Closing locks those sales; a manager then settles the gap
 * (loss, justified with its category, or surplus), which books the matching expense.
 */
export default function CashCountPanel({
    role,
    onClosed,
}: {
    role: string | undefined;
    onClosed?: () => void;
}) {
    const canSettle = role === "ADMIN" || role === "MANAGER";
    const isAdmin = role === "ADMIN";

    const [open, setOpen] = useState<OpenDay | null>(null);
    const [counts, setCounts] = useState<DayClosure[]>([]);
    const [pending, setPending] = useState({ count: 0, totalCdf: 0 });
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const [counted, setCounted] = useState("");
    const [withdrawal, setWithdrawal] = useState("");
    const [notes, setNotes] = useState("");
    const [lastClosed, setLastClosed] = useState<DayClosure | null>(null);

    const zRef = useRef<HTMLDivElement>(null);
    const printZ = useReactToPrint({ contentRef: zRef, documentTitle: "Ticket Z" });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/cash-counts");
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            setOpen(json.data.open);
            setCounts(json.data.counts);
            setPending(json.data.pending);
            setCategories(json.data.categories);
        } catch {
            showToast("Impossible de charger la caisse", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const countedCdf = digits(counted) ? Number(digits(counted)) : null;
    const withdrawalCdf = Number(digits(withdrawal) || 0);
    const expected = open?.expectedCdf ?? 0;
    const diff = countedCdf === null ? null : countedCdf - expected;
    const withdrawalTooHigh = countedCdf !== null && withdrawalCdf > countedCdf;

    const close = async () => {
        if (countedCdf === null || withdrawalTooHigh) return;
        setSaving(true);
        try {
            const res = await fetch("/api/cash-counts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ countedCdf, withdrawalCdf, notes }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || "Clôture impossible");
            const row = json.data as DayClosure;
            setLastClosed(row);
            showToast(
                row.differenceCdf === 0
                    ? "Journée clôturée : caisse correcte"
                    : `Journée clôturée avec un écart de ${fc(row.differenceCdf)} (à vérifier)`,
                row.differenceCdf === 0 ? "success" : "info"
            );
            setCounted("");
            setWithdrawal("");
            setNotes("");
            setConfirming(false);
            load();
            onClosed?.();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Clôture impossible", "error");
        } finally {
            setSaving(false);
        }
    };

    const [settling, setSettling] = useState<Record<string, { status: Status; note: string; categoryId: string }>>({});

    const settle = async (c: DayClosure) => {
        const draft = settling[c.id];
        if (!draft) return;
        try {
            const res = await fetch(`/api/cash-counts?id=${c.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: draft.status, resolutionNote: draft.note, categoryId: draft.categoryId }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            showToast(`Écart réglé : ${CLOSURE_STATUS[draft.status].label}`, "success");
            setSettling((s) => {
                const next = { ...s };
                delete next[c.id];
                return next;
            });
            load();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Action impossible", "error");
        }
    };

    const [reopening, setReopening] = useState<string | null>(null);
    const reopen = async (id: string) => {
        try {
            const res = await fetch(`/api/cash-counts?id=${id}`, { method: "DELETE" });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            showToast("Journée rouverte", "success");
            setReopening(null);
            load();
            onClosed?.();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Action impossible", "error");
        }
    };

    const result = useMemo(() => {
        if (diff === null) return null;
        if (diff === 0) return { tone: "ok" as const, title: "Caisse correcte", text: "L'argent compté correspond aux ventes." };
        if (diff < 0) return { tone: "short" as const, title: `Manquant : ${fc(-diff)}`, text: `Il fallait ${fc(expected)}, compté ${fc(countedCdf!)}.` };
        return { tone: "over" as const, title: `Surplus : ${fc(diff)}`, text: `Il fallait ${fc(expected)}, compté ${fc(countedCdf!)}.` };
    }, [diff, expected, countedCdf]);

    // Only the latest closure can be reopened, and not once a month closure came after it
    // (the open day then starts from that month closure, not from this closure).
    const latestId =
        counts[0] && open && new Date(counts[0].periodEnd).getTime() === new Date(open.periodStart).getTime()
            ? counts[0].id
            : undefined;

    return (
        <div className="bg-white border border-gray-200 rounded-lg md:rounded-sm shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-3 justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
                    <Lock size={14} className="text-[#71de00]" />
                    Clôture de la journée
                </h3>
                {pending.count > 0 && (
                    <span className="text-[11px] font-bold px-2 py-1 rounded border bg-amber-50 text-amber-700 border-amber-200">
                        {pending.count} écart{pending.count > 1 ? "s" : ""} à vérifier · {fc(pending.totalCdf)}
                    </span>
                )}
            </div>

            {open && !open.ready && (
                <div className="mx-4 mt-4 p-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                    <strong>La clôture de démarrage n&apos;est pas encore faite.</strong> L&apos;administrateur la fait dans
                    Dépenses › « Clôture de démarrage » en comptant l&apos;argent réel. Les journées pourront ensuite être clôturées.
                </div>
            )}

            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* What the till should hold */}
                <div className="space-y-2">
                    <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Ce qui doit être en caisse</p>
                    {loading || !open ? (
                        <div className="h-40 flex items-center justify-center text-gray-400">
                            <Loader2 className="animate-spin" size={18} />
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-gray-500">
                                Depuis {when(open.periodStart)} · {open.floatSource}
                            </p>
                            <Line icon={<Wallet size={12} />} label="Fond de caisse (repris)" tone="text-gray-700">
                                {fc(open.openingFloatCdf)}
                            </Line>
                            <Line
                                icon={<TrendingUp size={12} />}
                                label={`Ventes en espèces (${open.expectation.salesCount} ticket${open.expectation.salesCount > 1 ? "s" : ""})`}
                                tone="text-green-700"
                            >
                                + {fc(open.expectation.salesCashCdf)}
                            </Line>
                            <Line icon={<Minus size={12} />} label="Dépenses payées par la caisse" tone="text-red-700">
                                − {fc(open.expectation.expensesCdf)}
                            </Line>
                            <Line icon={<TrendingDown size={12} />} label="Achats payés par la caisse" tone="text-orange-700">
                                − {fc(open.expectation.purchasesCdf)}
                            </Line>
                            <div className="flex items-center justify-between rounded-lg md:rounded-sm border-2 border-[#00d3fa] bg-[#00d3fa]/10 px-3 py-3">
                                <span className="text-xs font-black uppercase tracking-wider text-[#0891b2]">Doit être en caisse</span>
                                <span className="text-xl font-black text-[#0891b2]">{fc(expected)}</span>
                            </div>
                            {open.expectation.salesOtherCdf > 0 && (
                                <p className="text-[11px] text-gray-500">
                                    Carte / Mobile Money : {fc(open.expectation.salesOtherCdf)} ({open.expectation.otherCount} tickets) — hors caisse.
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* What was counted */}
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Argent compté</span>
                        <div className="mt-1 flex items-center border-2 border-gray-200 focus-within:border-[#00d3fa] rounded-lg md:rounded-sm px-3">
                            <input
                                id="closure-counted"
                                inputMode="numeric"
                                placeholder={expected > 0 ? expected.toLocaleString("fr-FR") : "0"}
                                value={counted}
                                onChange={(e) => {
                                    setCounted(grouped(e.target.value));
                                    setConfirming(false);
                                }}
                                disabled={!open?.ready}
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

                    {countedCdf !== null && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="block">
                                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Versement au patron</span>
                                <input
                                    id="closure-withdrawal"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={withdrawal}
                                    onChange={(e) => {
                                        setWithdrawal(grouped(e.target.value));
                                        setConfirming(false);
                                    }}
                                    className={`mt-1 w-full text-right font-bold border rounded px-3 py-2 ${withdrawalTooHigh ? "border-red-400" : "border-gray-200"}`}
                                />
                            </label>
                            <div className="rounded border border-gray-200 px-3 py-2 flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Reste en caisse pour demain</span>
                                <span className={`font-black ${withdrawalTooHigh ? "text-red-600" : "text-gray-800"}`}>
                                    {withdrawalTooHigh ? "Versement trop élevé" : fc(countedCdf - withdrawalCdf)}
                                </span>
                            </div>
                        </div>
                    )}

                    {diff !== null && diff !== 0 && (
                        <input
                            id="closure-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Explication de l'écart (ex : transport payé, erreur de monnaie…)"
                            className="w-full text-sm border border-gray-200 rounded px-3 py-2"
                        />
                    )}

                    {!confirming ? (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            disabled={countedCdf === null || withdrawalTooHigh || loading || !open?.ready}
                            className="w-full py-3 rounded-lg md:rounded-sm bg-gray-900 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            <Lock size={16} /> Clôturer la journée
                        </button>
                    ) : (
                        <div className="rounded-lg md:rounded-sm border-2 border-gray-900 p-3 space-y-2">
                            <p className="text-sm text-gray-700">
                                Les ventes depuis {open ? when(open.periodStart) : ""} seront <strong>verrouillées</strong>.
                                {diff !== 0 && " L'écart sera noté « à vérifier » pour le gérant."}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirming(false)}
                                    className="py-2 rounded border border-gray-300 font-bold text-gray-600"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={close}
                                    disabled={saving}
                                    className="py-2 rounded bg-gray-900 text-white font-bold flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    )}

                    {lastClosed && (
                        <button
                            type="button"
                            onClick={() => printZ()}
                            className="w-full py-2 rounded border border-gray-300 font-bold text-gray-700 flex items-center justify-center gap-2"
                        >
                            <Printer size={16} /> Imprimer le ticket Z
                        </button>
                    )}
                </div>
            </div>

            {counts.length > 0 && (
                <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="text-left px-4 py-2">Clôture</th>
                                <th className="text-right px-4 py-2">Attendu</th>
                                <th className="text-right px-4 py-2">Compté</th>
                                <th className="text-right px-4 py-2">Écart</th>
                                <th className="text-right px-4 py-2">Versé</th>
                                <th className="text-left px-4 py-2">Statut</th>
                                <th className="text-left px-4 py-2">Par / note</th>
                                {canSettle && <th className="px-4 py-2" />}
                            </tr>
                        </thead>
                        <tbody>
                            {counts.map((c) => {
                                const draft = settling[c.id];
                                const shortfall = c.differenceCdf < 0;
                                return (
                                    <tr key={c.id} className="border-t border-gray-100 align-top">
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="font-semibold">{format(new Date(c.periodEnd), "EEE d MMM", { locale: fr })}</div>
                                            <div className="text-[11px] text-gray-400">
                                                {format(new Date(c.periodStart), "d/MM HH:mm")} → {format(new Date(c.periodEnd), "HH:mm")}
                                            </div>
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
                                        <td className="px-4 py-2 text-right whitespace-nowrap text-gray-600">
                                            {c.withdrawalCdf > 0 ? fc(c.withdrawalCdf) : "—"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${CLOSURE_STATUS[c.status].className}`}>
                                                {CLOSURE_STATUS[c.status].label}
                                            </span>
                                            {c.settlementCategory && (
                                                <div className="text-[11px] text-gray-500 mt-1">→ {c.settlementCategory}</div>
                                            )}
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
                                                <div className="flex flex-col items-end gap-1">
                                                    {c.status !== "BALANCED" && (
                                                        <select
                                                            value={draft?.status ?? c.status}
                                                            onChange={(e) =>
                                                                setSettling((s) => ({
                                                                    ...s,
                                                                    [c.id]: {
                                                                        status: e.target.value as Status,
                                                                        note: s[c.id]?.note ?? c.resolutionNote ?? "",
                                                                        categoryId: s[c.id]?.categoryId ?? "",
                                                                    },
                                                                }))
                                                            }
                                                            className="text-xs border border-gray-200 rounded px-1 py-1"
                                                            aria-label="Régler l'écart"
                                                        >
                                                            <option value="TO_VERIFY">À vérifier</option>
                                                            {shortfall && <option value="LOSS">Perte</option>}
                                                            <option value="JUSTIFIED">{shortfall ? "Justifié (dépense)" : "Surplus confirmé"}</option>
                                                        </select>
                                                    )}
                                                    {draft && (
                                                        <div className="flex flex-col items-end gap-1">
                                                            {draft.status === "JUSTIFIED" && shortfall && (
                                                                <select
                                                                    value={draft.categoryId}
                                                                    onChange={(e) =>
                                                                        setSettling((s) => ({ ...s, [c.id]: { ...s[c.id], categoryId: e.target.value } }))
                                                                    }
                                                                    className="text-xs border border-gray-200 rounded px-1 py-1 w-48"
                                                                    aria-label="Catégorie de la dépense"
                                                                >
                                                                    <option value="">Catégorie de la dépense…</option>
                                                                    {categories.map((cat) => (
                                                                        <option key={cat.id} value={cat.id}>
                                                                            {cat.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                            <div className="flex gap-1">
                                                                <input
                                                                    value={draft.note}
                                                                    onChange={(e) =>
                                                                        setSettling((s) => ({ ...s, [c.id]: { ...s[c.id], note: e.target.value } }))
                                                                    }
                                                                    placeholder="Motif (ex : transport payé)"
                                                                    className="text-xs border border-gray-200 rounded px-2 py-1 w-40"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => settle(c)}
                                                                    className="text-xs font-bold px-2 py-1 rounded bg-gray-900 text-white"
                                                                >
                                                                    OK
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {isAdmin && c.id === latestId && (
                                                        reopening === c.id ? (
                                                            <div className="flex gap-1 items-center text-xs">
                                                                <span className="text-gray-600">Rouvrir ?</span>
                                                                <button type="button" onClick={() => reopen(c.id)} className="font-bold px-2 py-1 rounded bg-red-600 text-white">
                                                                    Oui
                                                                </button>
                                                                <button type="button" onClick={() => setReopening(null)} className="font-bold px-2 py-1 rounded border border-gray-300">
                                                                    Non
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setReopening(c.id)}
                                                                className="text-[11px] text-gray-500 hover:text-red-600 flex items-center gap-1"
                                                            >
                                                                <RotateCcw size={11} /> Rouvrir la journée
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Ticket Z, printed from the browser after closing */}
            <div style={{ display: "none" }}>
                <div ref={zRef}>{lastClosed && <ZTicket c={lastClosed} />}</div>
            </div>
        </div>
    );
}

function ZTicket({ c }: { c: DayClosure }) {
    const row = (label: string, value: string, bold = false) => (
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: bold ? 700 : 400 }}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
    const rule = <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />;
    return (
        <div style={{ width: "72mm", fontFamily: "monospace", fontSize: 12, padding: "4mm", color: "#000" }}>
            <div style={{ textAlign: "center", fontWeight: 700 }}>CLÔTURE DE LA JOURNÉE (Z)</div>
            <div style={{ textAlign: "center" }}>{format(new Date(c.periodEnd), "EEEE d MMMM yyyy HH:mm", { locale: fr })}</div>
            <div style={{ textAlign: "center", fontSize: 11 }}>Depuis {format(new Date(c.periodStart), "d/MM HH:mm")}</div>
            {rule}
            {row("Fond de caisse", fc(c.openingFloatCdf))}
            {row("Ventes espèces", `+ ${fc(c.salesCashCdf)}`)}
            {row("Dépenses caisse", `- ${fc(c.expensesCdf)}`)}
            {row("Achats caisse", `- ${fc(c.purchasesCdf)}`)}
            {rule}
            {row("Doit être en caisse", fc(c.expectedCdf), true)}
            {row("Argent compté", fc(c.countedCdf), true)}
            {row(c.differenceCdf < 0 ? "Manquant" : c.differenceCdf > 0 ? "Surplus" : "Écart", fc(c.differenceCdf), true)}
            {row("Statut", CLOSURE_STATUS[c.status].label)}
            {c.withdrawalCdf > 0 && row("Versement au patron", fc(c.withdrawalCdf))}
            {row("Reste en caisse", fc(c.countedCdf - c.withdrawalCdf))}
            {c.salesOtherCdf > 0 && (
                <>
                    {rule}
                    {row("Mobile Money / carte", fc(c.salesOtherCdf))}
                </>
            )}
            {c.notes && <div style={{ marginTop: 4 }}>Note : {c.notes}</div>}
            {rule}
            <div>Caissier : {c.userName}</div>
            <div style={{ marginTop: 16 }}>Signature : ____________</div>
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
