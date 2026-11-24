"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    AlertCircle,
    ArrowRight,
    Calculator,
    CheckCircle2,
    FileDown,
    Flag,
    History,
    Info,
    Loader2,
    Lock,
    Minus,
    Pencil,
    Plus,
    Receipt,
    RefreshCw,
    ShoppingBag,
    Smartphone,
    TrendingDown,
    TrendingUp,
    UserRound,
    Wallet,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { MoneyCount, emptyMoney, fc, moneyAmounts, moneyDetail, usd, type MoneyValue } from "@/components/caisse/MoneyCount";
import ClosedDaysCard from "@/components/caisse/ClosedDaysCard";

type CaisseData = {
    rate: number;
    startDate: string | null;
    canRedoStart: boolean;
    base: { kind: "OPENING" | "MONTH"; label: string; at: string; amountCdf: number; notes: string | null } | null;
    breakdown: {
        openingCdf: number;
        salesCashCdf: number;
        salesCashCount: number;
        expensesCdf: number;
        purchasesCdf: number;
        adjustmentsCdf: number;
        handedToOwnerCdf: number;
        salesOtherCdf: number;
        salesOtherCount: number;
        ownerExpensesCdf: number;
        ownerPurchasesCdf: number;
    };
    balanceCdf: number;
    openDay: { ready: boolean; since: string; salesCount: number; salesCashCdf: number };
    counts: Array<{
        id: string;
        at: string;
        userName: string;
        usd: number;
        cdf: number;
        rate: number;
        totalCdf: number;
        theoreticalCdf: number;
        differenceCdf: number;
        notes: string | null;
        /** Only the latest count can be corrected. */
        editable: boolean;
        edited: number;
    }>;
    closures: Array<{
        id: string;
        kind: "OPENING" | "MONTH";
        label: string;
        closedAt: string;
        closingBalanceCdf: number;
        totalSalesCdf: number;
        adjustmentCdf: number;
        notes: string | null;
        userName: string;
    }>;
};

type MonthPreview = {
    checks: { unclosedSales: number; unclosedSince: string; pendingGaps: number };
};

const when = (d: string, pattern = "d MMM yyyy 'à' HH:mm") => format(new Date(d), pattern, { locale: fr });
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${fc(Math.abs(v))}`;

export default function CaissePage() {
    const { data: session } = useSession();
    const role = (session?.user as { role?: string } | undefined)?.role ?? "";
    const isAdmin = role === "ADMIN";
    const isManager = role === "ADMIN" || role === "MANAGER";

    const [data, setData] = useState<CaisseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<null | "COUNT" | "OPENING" | "MONTH">(null);
    const [editing, setEditing] = useState<CaisseData["counts"][number] | null>(null);
    const [exporting, setExporting] = useState(false);

    const exportPdf = async () => {
        setExporting(true);
        try {
            const res = await fetch("/api/caisse/report");
            const json = await res.json();
            if (!json.success) throw new Error(json.error || "Export impossible");
            const { buildCaissePdf, caisseFileName } = await import("@/lib/caisse-pdf");
            const { shareOrDownload } = await import("@/lib/sales-pdf");
            const blob = await buildCaissePdf(json.data);
            const how = await shareOrDownload(blob, caisseFileName(json.data), "Caisse Mellia");
            showToast(how === "shared" ? "PDF prêt à partager" : "Rapport de caisse téléchargé", "success");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Export impossible", "error");
        } finally {
            setExporting(false);
        }
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/caisse");
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            setData(json.data);
        } catch {
            showToast("Impossible de charger la caisse", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const rate = data?.rate ?? 2850;
    const b = data?.breakdown;
    const canStart = isAdmin && data && (!data.startDate || data.canRedoStart);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                    <div>
                        <h1 className="ui-page-title flex items-center gap-2.5">
                            <Wallet className="text-[#00d3fa]" />
                            Caisse
                        </h1>
                        <p className="ui-page-subtitle mt-1">
                            Tout l&apos;argent du restaurant : le tiroir et l&apos;argent en main. Devise de référence : franc congolais.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 xl:justify-end xl:shrink-0">
                        <button type="button" onClick={load} className="ui-btn-ghost" aria-label="Actualiser">
                            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
                        </button>
                        {isManager && data?.startDate && (
                            <button type="button" onClick={exportPdf} disabled={exporting} className="ui-btn-ghost">
                                {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                                Exporter en PDF
                            </button>
                        )}
                        {canStart && (
                            <button type="button" onClick={() => setModal("OPENING")} className="ui-btn-ghost">
                                <Flag size={16} />
                                {data?.startDate ? "Refaire le démarrage" : "Démarrage"}
                            </button>
                        )}
                        {isManager && data?.startDate && (
                            <button type="button" onClick={() => setModal("MONTH")} className="ui-btn-ghost">
                                <Lock size={16} />
                                Clôturer le mois
                            </button>
                        )}
                        {isManager && data?.startDate && (
                            <button type="button" onClick={() => setModal("COUNT")} className="ui-btn-primary">
                                <Calculator size={16} />
                                Compter la caisse
                            </button>
                        )}
                    </div>
                </div>

                {loading && !data ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : !data || !b ? null : (
                    <>
                        {!data.startDate && (
                            <div className="ui-card border-amber-200 bg-amber-50 p-4 flex gap-3">
                                <Flag size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-900">
                                    <p className="font-semibold">La caisse n&apos;a pas encore démarré.</p>
                                    <p className="text-xs mt-1 text-amber-800">
                                        {isAdmin ? "Cliquez sur « Démarrage »" : "L'administrateur fait le démarrage"} en comptant
                                        l&apos;argent de départ (dollars et francs). Tout ce qui précède passe en archives.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Balance + open day */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 rounded-xl bg-[#0f172a] text-white p-6 relative overflow-hidden flex flex-col">
                                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#00d3fa]/10" />
                                <div className="absolute right-16 bottom-[-60px] h-32 w-32 rounded-full bg-[#71de00]/10" />
                                <p className="text-xs font-medium text-white/60">Solde de caisse (attendu)</p>
                                <p className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">{fc(data.balanceCdf)}</p>
                                <p className="mt-1 text-lg font-semibold text-[#71de00] tabular-nums">≈ {usd(data.balanceCdf / rate)}</p>
                                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/60">
                                    {data.base && (
                                        <span>
                                            {data.base.kind === "OPENING" ? "Depuis le démarrage du " : "Depuis la clôture du "}
                                            {when(data.base.at)}
                                        </span>
                                    )}
                                    <span>1 $ = {rate.toLocaleString("fr-FR")} FC</span>
                                    {data.counts[0] && <span>Dernier comptage : {when(data.counts[0].at, "d MMM HH:mm")}</span>}
                                </div>
                                <div className="relative mt-auto pt-6 grid grid-cols-3 gap-3">
                                    <HeroStat label="Départ" value={fc(b.openingCdf)} />
                                    {/* A surplus found when counting is money in, a shortfall money out. */}
                                    <HeroStat label="Entrées" value={`+ ${fc(b.salesCashCdf + Math.max(0, -b.adjustmentsCdf))}`} tone="text-[#71de00]" />
                                    <HeroStat
                                        label="Sorties"
                                        value={`− ${fc(b.expensesCdf + b.purchasesCdf + Math.max(0, b.adjustmentsCdf))}`}
                                        tone="text-[#ff8a5c]"
                                    />
                                </div>
                            </div>

                            <div className="ui-card p-5 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <Receipt size={16} className="text-[#71de00]" />
                                        Journée en cours
                                    </p>
                                    <span className="ui-chip bg-gray-100 text-gray-600">
                                        {data.openDay.salesCount} ticket{data.openDay.salesCount > 1 ? "s" : ""}
                                    </span>
                                </div>
                                <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">{fc(data.openDay.salesCashCdf)}</p>
                                <p className="text-xs text-gray-500">
                                    Ventes en espèces depuis le {when(data.openDay.since, "d MMM 'à' HH:mm")}
                                </p>
                                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                                    La journée se clôture avec ce qui a été vendu. Les achats n&apos;y entrent pas : ils sont payés avec
                                    l&apos;argent de la caisse.
                                </p>
                                <div className="mt-auto pt-4">
                                    <Link href="/dashboard/transactions" className="ui-btn-ghost w-full">
                                        Clôturer la journée <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* How the balance is made */}
                            <div className="lg:col-span-2 ui-card overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900">Comment le solde est calculé</p>
                                    <p className="text-xs text-gray-500">Ce qui entre et sort de la caisse depuis le dernier point de départ</p>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    <Ledger
                                        icon={<Flag size={15} />}
                                        tone="text-indigo-600 bg-indigo-50"
                                        label={data.base?.kind === "MONTH" ? "Report de la clôture du mois" : "Argent de départ"}
                                        hint={data.base?.notes ?? undefined}
                                        value={fc(b.openingCdf)}
                                    />
                                    <Ledger
                                        icon={<TrendingUp size={15} />}
                                        tone="text-green-600 bg-green-50"
                                        label="Ventes encaissées en espèces"
                                        hint={`${b.salesCashCount} ticket${b.salesCashCount > 1 ? "s" : ""}`}
                                        value={`+ ${fc(b.salesCashCdf)}`}
                                        valueClass="text-green-700"
                                    />
                                    <Ledger
                                        icon={<TrendingDown size={15} />}
                                        tone="text-red-600 bg-red-50"
                                        label="Dépenses payées par la caisse"
                                        hint="Menu Dépenses, source « Caisse »"
                                        value={`− ${fc(b.expensesCdf)}`}
                                        valueClass="text-red-700"
                                    />
                                    <Ledger
                                        icon={<ShoppingBag size={15} />}
                                        tone="text-orange-600 bg-orange-50"
                                        label="Achats payés par la caisse"
                                        hint="Menu Achats"
                                        value={`− ${fc(b.purchasesCdf)}`}
                                        valueClass="text-orange-700"
                                    />
                                    {b.adjustmentsCdf !== 0 && (
                                        <Ledger
                                            icon={<Calculator size={15} />}
                                            tone="text-gray-600 bg-gray-100"
                                            label="Corrections de comptage"
                                            hint={b.adjustmentsCdf < 0 ? "Surplus trouvés" : "Manquants constatés"}
                                            value={signed(-b.adjustmentsCdf)}
                                        />
                                    )}
                                    <div className="flex items-center justify-between gap-4 px-5 py-4 bg-gray-50">
                                        <span className="text-sm font-semibold text-gray-900">Solde de caisse</span>
                                        <span className="text-right">
                                            <span className="block text-xl font-bold tabular-nums text-gray-900">{fc(data.balanceCdf)}</span>
                                            <span className="block text-xs text-gray-500 tabular-nums">{usd(data.balanceCdf / rate)}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="px-5 py-4 border-t border-gray-100">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Pour information (hors calcul)</p>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                        <InfoLine icon={<UserRound size={14} />} label="Dépenses payées par le patron" value={fc(b.ownerExpensesCdf)} />
                                        <InfoLine icon={<UserRound size={14} />} label="Achats payés par le patron" value={fc(b.ownerPurchasesCdf)} />
                                        <InfoLine
                                            icon={<Smartphone size={14} />}
                                            label={`Mobile Money / carte (${b.salesOtherCount})`}
                                            value={fc(b.salesOtherCdf)}
                                        />
                                        <InfoLine icon={<Wallet size={14} />} label="Remis au patron (reste dans la caisse)" value={fc(b.handedToOwnerCdf)} />
                                    </div>
                                </div>
                            </div>

                            {/* Counts and closed days */}
                            <div className="flex flex-col gap-4">
                            <div className="ui-card overflow-hidden flex flex-col">
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <History size={16} className="text-gray-400" />
                                        Comptages
                                    </p>
                                    {isManager && data.startDate && (
                                        <button type="button" onClick={() => setModal("COUNT")} className="text-xs font-semibold text-blue-600 hover:underline">
                                            Nouveau
                                        </button>
                                    )}
                                </div>
                                {data.counts.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-gray-400 flex-1 flex flex-col items-center justify-center gap-2">
                                        <Calculator size={28} strokeWidth={1.5} />
                                        Aucun comptage pour l&apos;instant.
                                        <span className="text-xs">Comptez les dollars et les francs en main : l&apos;app convertit et compare.</span>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-100 max-h-[420px] overflow-auto">
                                        {data.counts.map((c) => (
                                            <li key={c.id} className="px-5 py-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">{when(c.at, "EEE d MMM HH:mm")}</span>
                                                    <span
                                                        className={cn(
                                                            "ui-chip",
                                                            c.differenceCdf === 0
                                                                ? "bg-green-50 text-green-700"
                                                                : c.differenceCdf > 0
                                                                ? "bg-amber-50 text-amber-700"
                                                                : "bg-red-50 text-red-700"
                                                        )}
                                                    >
                                                        {c.differenceCdf === 0 ? "Correct" : signed(c.differenceCdf)}
                                                    </span>
                                                </div>
                                                <p className="mt-1 font-bold tabular-nums text-gray-900">{fc(c.totalCdf)}</p>
                                                <p className="text-xs text-gray-500 tabular-nums">
                                                    {usd(c.usd)} + {fc(c.cdf)} · {c.userName}
                                                </p>
                                                {c.notes && <p className="text-xs text-gray-400 mt-0.5">{c.notes}</p>}
                                                {(c.edited > 0 || (c.editable && isManager)) && (
                                                    <div className="mt-1 flex items-center justify-between gap-2">
                                                        <span className="text-[11px] text-gray-400">
                                                            {c.edited > 0 ? `Corrigé ${c.edited} fois` : ""}
                                                        </span>
                                                        {c.editable && isManager && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditing(c)}
                                                                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                                                            >
                                                                <Pencil size={12} /> Modifier
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <ClosedDaysCard canEdit={isAdmin} />
                            </div>
                        </div>

                        {/* Closures */}
                        {data.closures.length > 0 && (
                            <div className="ui-card overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900">Démarrage et clôtures du mois</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                                            <tr>
                                                <th className="text-left px-5 py-2.5 font-semibold">Clôture</th>
                                                <th className="text-left px-5 py-2.5 font-semibold">Date</th>
                                                <th className="text-right px-5 py-2.5 font-semibold">Ventes</th>
                                                <th className="text-right px-5 py-2.5 font-semibold">Argent compté</th>
                                                <th className="text-left px-5 py-2.5 font-semibold">Par</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.closures.map((c) => (
                                                <tr key={c.id}>
                                                    <td className="px-5 py-3">
                                                        <span
                                                            className={cn(
                                                                "ui-chip",
                                                                c.kind === "OPENING" ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-700"
                                                            )}
                                                        >
                                                            {c.kind === "OPENING" ? "Démarrage" : "Mois"}
                                                        </span>
                                                        {c.notes && <div className="text-xs text-gray-400 mt-1">{c.notes}</div>}
                                                    </td>
                                                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">{when(c.closedAt, "d MMM yyyy HH:mm")}</td>
                                                    <td className="px-5 py-3 text-right tabular-nums">{c.kind === "OPENING" ? "—" : fc(c.totalSalesCdf)}</td>
                                                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{fc(c.closingBalanceCdf)}</td>
                                                    <td className="px-5 py-3 text-gray-600">{c.userName}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 text-xs text-gray-500 px-1">
                            <Info size={14} className="shrink-0 mt-0.5" />
                            <p>
                                Solde = argent de départ + ventes en espèces − dépenses et achats payés par la caisse. Ce que le patron
                                paie avec son propre argent n&apos;est pas retiré. L&apos;argent remis au patron à la clôture de la journée
                                reste compté dans la caisse.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {data && modal === "COUNT" && (
                <CountModal data={data} onClose={() => setModal(null)} onDone={load} />
            )}
            {data && editing && (
                <CountModal data={data} count={editing} onClose={() => setEditing(null)} onDone={load} />
            )}
            {data && (modal === "OPENING" || modal === "MONTH") && (
                <ClosureModal kind={modal} data={data} onClose={() => setModal(null)} onDone={load} />
            )}
        </DashboardLayout>
    );
}

function HeroStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
    return (
        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 min-w-0">
            <p className="text-[11px] text-white/50">{label}</p>
            <p className={cn("text-sm sm:text-base font-semibold tabular-nums truncate", tone ?? "text-white")}>{value}</p>
        </div>
    );
}

function Ledger({
    icon,
    tone,
    label,
    hint,
    value,
    valueClass,
}: {
    icon: React.ReactNode;
    tone: string;
    label: string;
    hint?: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
                <span className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", tone)}>{icon}</span>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    {hint && <p className="text-xs text-gray-400 truncate">{hint}</p>}
                </div>
            </div>
            <span className={cn("font-semibold tabular-nums whitespace-nowrap", valueClass ?? "text-gray-900")}>{value}</span>
        </div>
    );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-gray-500 min-w-0">
                <span className="text-gray-400 shrink-0">{icon}</span>
                <span className="truncate">{label}</span>
            </span>
            <span className="font-medium tabular-nums text-gray-700 whitespace-nowrap">{value}</span>
        </div>
    );
}

function Gap({ diff }: { diff: number }) {
    if (diff === 0) {
        return (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex gap-2 text-green-800">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-semibold">La caisse est correcte.</p>
            </div>
        );
    }
    return (
        <div
            className={cn(
                "rounded-lg border p-3 flex gap-2",
                diff > 0 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-red-200 bg-red-50 text-red-800"
            )}
        >
            {diff > 0 ? <Plus size={18} className="shrink-0 mt-0.5" /> : <Minus size={18} className="shrink-0 mt-0.5" />}
            <div>
                <p className="text-sm font-semibold">
                    {diff > 0 ? "Surplus" : "Manquant"} : {fc(Math.abs(diff))}
                </p>
                <p className="text-xs opacity-80">Le solde sera corrigé à l&apos;argent compté (correction enregistrée).</p>
            </div>
        </div>
    );
}

/** A new count, or — with `count` — the correction of the latest one (dollars, francs, rate). */
function CountModal({
    data,
    count,
    onClose,
    onDone,
}: {
    data: CaisseData;
    count?: CaisseData["counts"][number];
    onClose: () => void;
    onDone: () => void;
}) {
    const [money, setMoney] = useState<MoneyValue>(
        count ? { usd: count.usd ? String(count.usd) : "", cdf: count.cdf ? count.cdf.toLocaleString("fr-FR") : "" } : emptyMoney
    );
    const [notes, setNotes] = useState(count?.notes ?? "");
    const [rateText, setRateText] = useState(String(count?.rate || data.rate));
    const [saving, setSaving] = useState(false);
    const rate = count ? Number(rateText.replace(/[^0-9.]/g, "")) || 0 : data.rate;
    const a = moneyAmounts(money, rate);
    // A correction is compared with what was expected when the money was counted.
    const expected = count ? count.theoreticalCdf : data.balanceCdf;
    const diff = a.totalCdf - expected;

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/caisse", {
                method: count ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(count ? { id: count.id, usd: a.usd, cdf: a.cdf, rate, notes } : { usd: a.usd, cdf: a.cdf, notes }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            showToast(
                count
                    ? "Comptage corrigé"
                    : json.data.differenceCdf === 0
                    ? "Comptage enregistré : caisse correcte"
                    : `Comptage enregistré (${signed(json.data.differenceCdf)})`,
                "success"
            );
            onClose();
            onDone();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Enregistrement impossible", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={count ? "Modifier le comptage" : "Compter la caisse"} size="md">
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    {count
                        ? `Comptage du ${when(count.at, "d MMM 'à' HH:mm")} : corrigez les dollars, les francs ou le taux. L'ancien montant reste dans l'historique.`
                        : "Comptez l'argent en main, dollars et francs séparément. L'app convertit tout en francs au taux du jour."}
                </p>
                <MoneyCount value={money} onChange={setMoney} rate={rate || data.rate} autoFocus />
                {count && (
                    <label className="flex items-center justify-between gap-3 text-sm px-1">
                        <span className="text-gray-500">Taux utilisé (1 $ en FC)</span>
                        <input
                            inputMode="numeric"
                            value={rateText}
                            onChange={(e) => setRateText(e.target.value.replace(/[^0-9.]/g, ""))}
                            className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-right font-semibold tabular-nums"
                        />
                    </label>
                )}
                <div className="flex items-center justify-between text-sm px-1">
                    <span className="text-gray-500">{count ? "Solde attendu au moment du comptage" : "Solde attendu"}</span>
                    <span className="font-semibold tabular-nums">{fc(expected)}</span>
                </div>
                {a.filled && <Gap diff={diff} />}
                <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Note (optionnel) — ex : argent des ventes du 24"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
                <button type="button" onClick={save} disabled={!a.filled || saving || (!!count && rate <= 0)} className="ui-btn-primary w-full py-3">
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {count ? "Enregistrer la correction" : "Enregistrer"} {a.filled ? fc(a.totalCdf) : count ? "" : "le comptage"}
                </button>
            </div>
        </Modal>
    );
}

function ClosureModal({
    kind,
    data,
    onClose,
    onDone,
}: {
    kind: "OPENING" | "MONTH";
    data: CaisseData;
    onClose: () => void;
    onDone: () => void;
}) {
    const { data: session } = useSession();
    const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
    const [money, setMoney] = useState<MoneyValue>(emptyMoney);
    const [notes, setNotes] = useState("");
    const [force, setForce] = useState(false);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState<MonthPreview | null>(null);
    const a = moneyAmounts(money, data.rate);

    useEffect(() => {
        if (kind !== "MONTH") return;
        fetch("/api/expenses/month-closure")
            .then((r) => r.json())
            .then((j) => j.success && setPreview(j.data))
            .catch(() => undefined);
    }, [kind]);

    const blockers: string[] = [];
    if (kind === "MONTH" && preview) {
        if (preview.checks.unclosedSales > 0) {
            blockers.push(
                `${preview.checks.unclosedSales} vente(s) depuis le ${when(preview.checks.unclosedSince, "d MMM HH:mm")} ne sont pas encore dans une clôture de journée.`
            );
        }
        if (preview.checks.pendingGaps > 0) blockers.push(`${preview.checks.pendingGaps} écart(s) de journée sont encore « à vérifier ».`);
    }
    const blocked = blockers.length > 0 && !force;

    const submit = async () => {
        if (force && !notes.trim()) {
            showToast("Le motif est obligatoire pour forcer la clôture", "error");
            return;
        }
        setSaving(true);
        try {
            const detail = moneyDetail(money, data.rate);
            const res = await fetch("/api/expenses/month-closure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kind,
                    closingBalanceCdf: a.totalCdf,
                    notes: notes.trim() ? `${notes.trim()} — ${detail}` : detail,
                    force,
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            showToast(kind === "OPENING" ? `Démarrage enregistré : ${fc(a.totalCdf)}` : `Mois clôturé : ${fc(a.totalCdf)} reportés`, "success");
            onClose();
            onDone();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Clôture impossible", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={kind === "OPENING" ? "Démarrage de la caisse" : "Clôturer le mois"} size="md">
            <div className="space-y-4">
                {kind === "OPENING" ? (
                    <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900 space-y-1.5 leading-relaxed">
                        <p>
                            L&apos;argent compté devient l&apos;<strong>argent de départ</strong> de la caisse. Ventes, dépenses et achats
                            d&apos;avant passent en archives (consultables, hors totaux).
                        </p>
                        <p>Possible à refaire tant qu&apos;aucune journée n&apos;est clôturée.</p>
                    </div>
                ) : (
                    <>
                        {blockers.length > 0 && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 space-y-2">
                                <div className="flex gap-2">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <div className="text-xs font-semibold space-y-1">
                                        {blockers.map((x) => (
                                            <p key={x}>{x}</p>
                                        ))}
                                        <p className="font-normal">Clôturez la journée (Historique des ventes) et réglez les écarts d&apos;abord.</p>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <label className="flex items-center gap-2 text-xs font-semibold pl-6 cursor-pointer">
                                        <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
                                        Forcer quand même (motif obligatoire)
                                    </label>
                                )}
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm px-1">
                            <span className="text-gray-500">Solde attendu</span>
                            <span className="font-semibold tabular-nums">{fc(data.balanceCdf)}</span>
                        </div>
                    </>
                )}
                <MoneyCount value={money} onChange={setMoney} rate={data.rate} autoFocus />
                {kind === "MONTH" && a.filled && <Gap diff={a.totalCdf - data.balanceCdf} />}
                <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={force ? "Motif (obligatoire)" : "Note (optionnel)"}
                    className={cn(
                        "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-900",
                        force && !notes.trim() ? "border-red-300" : "border-gray-200"
                    )}
                />
                <button
                    type="button"
                    onClick={submit}
                    disabled={!a.filled || saving || blocked || (kind === "MONTH" && !preview)}
                    className="ui-btn-primary w-full py-3"
                >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {kind === "OPENING" ? `Démarrer avec ${fc(a.totalCdf)}` : force ? "Forcer la clôture du mois" : `Clôturer avec ${fc(a.totalCdf)}`}
                </button>
            </div>
        </Modal>
    );
}
