"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    CalendarDays,
    Coins,
    Download,
    Loader2,
    Package,
    PiggyBank,
    Search,
    ShoppingBag,
    Sparkles,
    Trophy,
    TrendingUp,
    UtensilsCrossed,
    Wine,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Pager } from "@/components/ui/Pager";
import { fc, usd } from "@/components/caisse/MoneyCount";
import { cn } from "@/lib/utils";

type Top = { id: string; name: string; type: string; qty: number; revenueUsd: number; revenueCdf: number };
type Product = {
    id: string;
    name: string;
    type: string;
    unit: string;
    openingQty: number;
    purchasedQty: number;
    availableQty: number;
    investedCdf: number;
    soldQty: number;
    soldUsd: number;
    soldCdf: number;
    soldProfitCdf: number;
    remainingQty: number;
    remainingValueCostCdf: number;
    remainingTerraceCdf: number;
    remainingVipCdf: number;
};
type AmelieData = {
    rate: number;
    sessions: Array<{ id: string; date: string; label: string; sessionStart: string; sessionEnd: string; isActive: boolean }>;
    selected: {
        investmentId: string;
        label: string;
        sessionStart: string;
        sessionEnd: string;
        isActive: boolean;
        investedCdfTotal: number;
        investedCdfBeverage: number;
        investedCdfFood: number;
        expectedRevenueTerraceCdf: number;
        expectedProfitTerraceCdf: number;
        soldCdfTotal: number;
        soldCdfBeverage: number;
        soldCdfFood: number;
        soldUsdTotal: number;
        soldProfitCdf: number;
        soldQtyTotal: number;
        soldQtyBeverage: number;
        soldQtyFood: number;
        openingQtyTotal: number;
        purchasedQtyTotal: number;
        availableQtyTotal: number;
        remainingQtyTotal: number;
        remainingValueCostCdf: number;
        remainingTerraceCdf: number;
        remainingVipCdf: number;
        topByQty: Top[];
        topByRevenue: Top[];
    } | null;
    dailySales: Array<{ date: string; beverageCdf: number; foodCdf: number; totalCdf: number; total: number; tickets: number }>;
    products: Product[];
};

type Tab = "overview" | "products" | "days";
type Sort = "sold" | "revenue" | "remaining" | "name";
const PAGE_SIZE = 15;

const qty = (v: number) => (Number.isInteger(v) ? v.toLocaleString("fr-FR") : v.toLocaleString("fr-FR", { maximumFractionDigits: 2 }));
const day = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) =>
    new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("fr-FR", opts);
const UNIT: Record<string, string> = {
    BOTTLE: "bouteille",
    PLATE: "assiette",
    HALF_PLATE: "demi-assiette",
    MEASURE: "mesure",
    PIECE: "pièce",
    KG: "kg",
    LITER: "litre",
    BOX: "boîte",
    PACK: "pack",
};

export default function AmeliePage() {
    const [data, setData] = useState<AmelieData | null>(null);
    const [loading, setLoading] = useState(true);
    const [investmentId, setInvestmentId] = useState("");
    const [tab, setTab] = useState<Tab>("overview");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (investmentId) params.set("investmentId", investmentId);
            const res = await fetch(`/api/reports/amelie?${params}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                if (!investmentId && json.data.selected?.investmentId) setInvestmentId(json.data.selected.investmentId);
            } else setData(null);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [investmentId]);

    useEffect(() => {
        load();
    }, [load]);

    const sel = data?.selected;
    const recovered = sel && sel.investedCdfTotal > 0 ? (sel.soldCdfTotal / sel.investedCdfTotal) * 100 : 0;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                    <div className="max-w-2xl">
                        <h1 className="ui-page-title flex items-center gap-2.5">
                            <Sparkles className="text-[#ff4900]" />
                            Amélie — rentabilité des achats
                        </h1>
                        <p className="ui-page-subtitle mt-1">
                            Pour chaque achat : ce que la marchandise a déjà rapporté, le bénéfice, les produits qui marchent et ce qui
                            reste à vendre. Une session va du jour de l&apos;achat jusqu&apos;au prochain achat.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white pl-3">
                            <ShoppingBag size={15} className="text-gray-400" />
                            <select
                                value={investmentId}
                                onChange={(e) => setInvestmentId(e.target.value)}
                                className="max-w-[280px] bg-transparent py-2.5 pr-3 text-sm font-medium outline-none"
                                aria-label="Achat"
                            >
                                {(data?.sessions ?? []).map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {day(s.date, { day: "2-digit", month: "short" })} — {s.label}
                                        {s.isActive ? " (en cours)" : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {sel && (
                            <a href={`/api/reports/amelie/export?investmentId=${sel.investmentId}`} className="ui-btn-ghost">
                                <Download size={16} /> Excel
                            </a>
                        )}
                    </div>
                </div>

                {loading && !data ? (
                    <div className="py-24 flex justify-center">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : !sel || !data ? (
                    <div className="ui-card py-16 text-center text-sm text-gray-400">
                        <ShoppingBag size={32} strokeWidth={1.5} className="mx-auto mb-2" />
                        Aucun achat enregistré. Les sessions apparaissent après un achat (menu Achats).
                    </div>
                ) : (
                    <div className={cn("space-y-6 transition-opacity", loading && "opacity-60")}>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            Du {day(sel.sessionStart)} au {day(sel.sessionEnd)}
                            {sel.isActive && <span className="ui-chip bg-green-50 text-green-700 ml-1">Session en cours</span>}
                        </p>

                        {/* KPIs */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <Kpi
                                icon={<ShoppingBag size={18} />}
                                tone="bg-blue-50 text-blue-600"
                                label="Investi (achat)"
                                value={fc(sel.investedCdfTotal)}
                                sub={`Boissons ${fc(sel.investedCdfBeverage)} · Nourriture ${fc(sel.investedCdfFood)}`}
                            />
                            <Kpi
                                icon={<TrendingUp size={18} />}
                                tone="bg-green-50 text-green-600"
                                label="Vendu"
                                value={fc(sel.soldCdfTotal)}
                                sub={`${usd(sel.soldUsdTotal)} · ${qty(sel.soldQtyTotal)} unités`}
                            />
                            <Kpi
                                icon={<PiggyBank size={18} />}
                                tone="bg-purple-50 text-purple-600"
                                label="Bénéfice réalisé"
                                value={fc(sel.soldProfitCdf)}
                                sub={`Attendu sur tout l'achat : ${fc(sel.expectedProfitTerraceCdf)}`}
                            />
                            <Kpi
                                icon={<Package size={18} />}
                                tone="bg-orange-50 text-orange-600"
                                label="Reste à vendre"
                                value={fc(sel.remainingTerraceCdf)}
                                sub={`${qty(sel.remainingQtyTotal)} unités · coût ${fc(sel.remainingValueCostCdf)}`}
                            />
                        </div>

                        {/* Recovery */}
                        <div className="ui-card p-5">
                            <div className="flex flex-wrap items-end justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Investissement récupéré</p>
                                    <p className="text-xs text-gray-500">
                                        {fc(sel.soldCdfTotal)} vendus sur {fc(sel.investedCdfTotal)} investis
                                    </p>
                                </div>
                                <p className="text-2xl font-bold tabular-nums text-gray-900">{recovered.toFixed(0)} %</p>
                            </div>
                            <div className="mt-3 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full", recovered >= 100 ? "bg-[#71de00]" : "bg-[#00d3fa]")}
                                    style={{ width: `${Math.min(100, recovered)}%` }}
                                />
                            </div>
                            <p className="mt-2 text-[11px] text-gray-400">
                                Au-delà de 100 %, l&apos;achat est remboursé et les ventes suivantes sont du bénéfice.
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit max-w-full overflow-x-auto">
                            {(
                                [
                                    ["overview", "Vue d'ensemble", <BarChart3 key="o" size={15} />],
                                    ["products", `Produits (${data.products.length})`, <Package key="p" size={15} />],
                                    ["days", `Ventes par jour (${data.dailySales.length})`, <CalendarDays key="d" size={15} />],
                                ] as [Tab, string, React.ReactNode][]
                            ).map(([id, label, icon]) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setTab(id)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md whitespace-nowrap",
                                        tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                                    )}
                                >
                                    {icon}
                                    {label}
                                </button>
                            ))}
                        </div>

                        {tab === "overview" && <Overview sel={sel} />}
                        {tab === "products" && <ProductsTable products={data.products} />}
                        {tab === "days" && <DaysTable days={data.dailySales} />}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function Kpi({ icon, tone, label, value, sub }: { icon: React.ReactNode; tone: string; label: string; value: string; sub: string }) {
    return (
        <div className="ui-card p-4">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <span className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", tone)}>{icon}</span>
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-400 line-clamp-2">{sub}</p>
        </div>
    );
}

function Overview({ sel }: { sel: NonNullable<AmelieData["selected"]> }) {
    const split = sel.soldCdfTotal > 0 ? (sel.soldCdfBeverage / sel.soldCdfTotal) * 100 : 0;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <TopList title="Les plus vendus (quantité)" icon={<Trophy size={16} className="text-amber-500" />} items={sel.topByQty} by="qty" />
            <TopList title="Ceux qui rapportent le plus" icon={<Coins size={16} className="text-green-600" />} items={sel.topByRevenue} by="revenue" />
            <div className="space-y-4">
                <div className="ui-card p-5">
                    <p className="text-sm font-semibold text-gray-900">Boissons / nourriture</p>
                    <div className="mt-3 h-2.5 rounded-full bg-orange-100 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${split}%` }} />
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-3">
                            <span className="flex items-center gap-2 text-gray-600">
                                <Wine size={14} className="text-blue-500" /> Boissons ({qty(sel.soldQtyBeverage)})
                            </span>
                            <span className="font-semibold tabular-nums whitespace-nowrap">{fc(sel.soldCdfBeverage)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="flex items-center gap-2 text-gray-600">
                                <UtensilsCrossed size={14} className="text-orange-500" /> Nourriture ({qty(sel.soldQtyFood)})
                            </span>
                            <span className="font-semibold tabular-nums whitespace-nowrap">{fc(sel.soldCdfFood)}</span>
                        </div>
                    </div>
                </div>
                <div className="ui-card p-5">
                    <p className="text-sm font-semibold text-gray-900">Stock de la session</p>
                    <dl className="mt-3 space-y-2 text-sm">
                        {(
                            [
                                ["Stock avant l'achat", sel.openingQtyTotal],
                                ["Acheté", sel.purchasedQtyTotal],
                                ["Disponible", sel.availableQtyTotal],
                                ["Vendu", sel.soldQtyTotal],
                                ["Reste", sel.remainingQtyTotal],
                            ] as [string, number][]
                        ).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                                <dt className="text-gray-500">{k}</dt>
                                <dd className="font-semibold tabular-nums">{qty(v)}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-3 text-[11px] text-gray-400">
                        Potentiel du reste : {fc(sel.remainingTerraceCdf)} en terrasse · {fc(sel.remainingVipCdf)} en VIP
                    </p>
                </div>
            </div>
        </div>
    );
}

function TopList({ title, icon, items, by }: { title: string; icon: React.ReactNode; items: Top[]; by: "qty" | "revenue" }) {
    const max = Math.max(1, ...items.map((i) => (by === "qty" ? i.qty : i.revenueCdf)));
    return (
        <div className="ui-card p-5">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                {icon}
                {title}
            </p>
            {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Aucune vente sur cette session.</p>
            ) : (
                <ol className="mt-4 space-y-3.5">
                    {items.map((p, i) => {
                        const v = by === "qty" ? p.qty : p.revenueCdf;
                        return (
                            <li key={p.id}>
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <span className="flex items-center gap-2 min-w-0">
                                        <span
                                            className={cn(
                                                "h-5 w-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0",
                                                i === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                                            )}
                                        >
                                            {i + 1}
                                        </span>
                                        <span className="truncate font-medium text-gray-800">{p.name}</span>
                                    </span>
                                    <span className="font-semibold tabular-nums whitespace-nowrap">{by === "qty" ? qty(p.qty) : fc(p.revenueCdf)}</span>
                                </div>
                                <div className="mt-1 ml-7 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full", by === "qty" ? "bg-amber-400" : "bg-[#71de00]")}
                                        style={{ width: `${(v / max) * 100}%` }}
                                    />
                                </div>
                                <p className="ml-7 mt-0.5 text-[11px] text-gray-400">
                                    {by === "qty" ? fc(p.revenueCdf) : `${qty(p.qty)} vendus`}
                                </p>
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    );
}

function ProductsTable({ products }: { products: Product[] }) {
    const [query, setQuery] = useState("");
    const [type, setType] = useState<"ALL" | "BEVERAGE" | "FOOD">("ALL");
    const [activeOnly, setActiveOnly] = useState(true);
    const [sort, setSort] = useState<Sort>("sold");
    const [page, setPage] = useState(1);

    useEffect(() => setPage(1), [query, type, activeOnly, sort]);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = products.filter(
            (p) =>
                (type === "ALL" || p.type === type) &&
                (!activeOnly || p.availableQty > 0 || p.soldQty > 0) &&
                (!q || p.name.toLowerCase().includes(q))
        );
        const by: Record<Sort, (a: Product, b: Product) => number> = {
            sold: (a, b) => b.soldQty - a.soldQty || b.soldCdf - a.soldCdf,
            revenue: (a, b) => b.soldCdf - a.soldCdf,
            remaining: (a, b) => b.remainingQty - a.remainingQty,
            name: (a, b) => a.name.localeCompare(b.name),
        };
        return [...list].sort(by[sort]);
    }, [products, query, type, activeOnly, sort]);

    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="ui-card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher un produit…"
                        className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-gray-900"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="flex rounded-lg bg-gray-100 p-1">
                        {(
                            [
                                ["ALL", "Tous"],
                                ["BEVERAGE", "Boissons"],
                                ["FOOD", "Nourriture"],
                            ] as const
                        ).map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setType(id)}
                                className={cn(
                                    "px-3 py-1 text-xs font-semibold rounded-md",
                                    type === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as Sort)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none"
                        aria-label="Trier"
                    >
                        <option value="sold">Les plus vendus</option>
                        <option value="revenue">Chiffre (FC)</option>
                        <option value="remaining">Plus gros reste</option>
                        <option value="name">Nom (A → Z)</option>
                    </select>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 cursor-pointer select-none">
                        <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
                        En stock ou vendus
                    </label>
                </div>
            </div>

            {shown.length === 0 ? (
                <p className="py-16 text-center text-sm text-gray-400">Aucun produit pour ces filtres.</p>
            ) : (
                <>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-semibold">Produit</th>
                                    <th className="text-right px-3 py-2.5 font-semibold">Avant achat</th>
                                    <th className="text-right px-3 py-2.5 font-semibold">Acheté</th>
                                    <th className="text-right px-3 py-2.5 font-semibold">Vendu</th>
                                    <th className="text-right px-3 py-2.5 font-semibold">Reste</th>
                                    <th className="text-right px-3 py-2.5 font-semibold">Investi</th>
                                    <th className="text-right px-3 py-2.5 font-semibold">Chiffre</th>
                                    <th className="text-right px-4 py-2.5 font-semibold">Potentiel du reste</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {shown.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/60">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{p.name}</p>
                                            <p className="text-[11px] text-gray-400">
                                                {p.type === "BEVERAGE" ? "Boisson" : p.type === "FOOD" ? "Nourriture" : p.type} · {UNIT[p.unit] ?? p.unit}
                                            </p>
                                        </td>
                                        <td className="px-3 py-3 text-right tabular-nums text-gray-500">{qty(p.openingQty)}</td>
                                        <td className="px-3 py-3 text-right tabular-nums">{qty(p.purchasedQty)}</td>
                                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-green-700">{qty(p.soldQty)}</td>
                                        <td className="px-3 py-3 text-right tabular-nums">
                                            <span className={cn("font-semibold", p.remainingQty === 0 && p.availableQty > 0 ? "text-red-600" : "text-gray-900")}>
                                                {qty(p.remainingQty)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap text-gray-600">{p.investedCdf ? fc(p.investedCdf) : "—"}</td>
                                        <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap font-semibold">{p.soldCdf ? fc(p.soldCdf) : "—"}</td>
                                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                                            <span className="text-gray-900">{fc(p.remainingTerraceCdf)}</span>
                                            {p.remainingVipCdf !== p.remainingTerraceCdf && (
                                                <span className="block text-[11px] text-gray-400">VIP {fc(p.remainingVipCdf)}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <ul className="md:hidden divide-y divide-gray-100">
                        {shown.map((p) => (
                            <li key={p.id} className="px-4 py-3">
                                <div className="flex justify-between gap-3">
                                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                                    <p className="font-semibold tabular-nums text-sm">{p.soldCdf ? fc(p.soldCdf) : "—"}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                                    Acheté {qty(p.purchasedQty)} · Vendu {qty(p.soldQty)} · Reste {qty(p.remainingQty)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                    {rows.length} produit{rows.length > 1 ? "s" : ""}
                    {pages > 1 && ` · ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, rows.length)}`}
                </span>
                <Pager page={page} pages={pages} onPage={setPage} />
            </div>
        </div>
    );
}

function DaysTable({ days }: { days: AmelieData["dailySales"] }) {
    const total = days.reduce(
        (t, d) => ({
            bev: t.bev + d.beverageCdf,
            food: t.food + d.foodCdf,
            all: t.all + d.totalCdf,
            tickets: t.tickets + d.tickets,
        }),
        { bev: 0, food: 0, all: 0, tickets: 0 }
    );
    const best = days.reduce<AmelieData["dailySales"][number] | null>((b, d) => (!b || d.totalCdf > b.totalCdf ? d : b), null);

    if (days.length === 0) {
        return <div className="ui-card py-16 text-center text-sm text-gray-400">Aucune vente sur cette session.</div>;
    }
    return (
        <div className="ui-card overflow-hidden">
            {best && (
                <div className="px-4 py-3 border-b border-gray-100 text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
                    <span>
                        Meilleure journée : <strong className="text-gray-900 capitalize">{day(best.date, { weekday: "long", day: "numeric", month: "long" })}</strong>{" "}
                        ({fc(best.totalCdf)})
                    </span>
                    <span>Moyenne : {fc(total.all / days.length)} / jour</span>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                        <tr>
                            <th className="text-left px-4 py-2.5 font-semibold">Jour</th>
                            <th className="text-right px-3 py-2.5 font-semibold">Tickets</th>
                            <th className="text-right px-3 py-2.5 font-semibold">Boissons</th>
                            <th className="text-right px-3 py-2.5 font-semibold">Nourriture</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[...days].reverse().map((d) => (
                            <tr key={d.date}>
                                <td className="px-4 py-3 capitalize whitespace-nowrap">{day(d.date, { weekday: "short", day: "numeric", month: "short" })}</td>
                                <td className="px-3 py-3 text-right tabular-nums text-gray-500">{d.tickets}</td>
                                <td className="px-3 py-3 text-right tabular-nums text-blue-700">{fc(d.beverageCdf)}</td>
                                <td className="px-3 py-3 text-right tabular-nums text-orange-700">{fc(d.foodCdf)}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                                    {fc(d.totalCdf)}
                                    <span className="block text-[11px] font-normal text-gray-400">{usd(d.total)}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                            <td className="px-4 py-3">Total</td>
                            <td className="px-3 py-3 text-right tabular-nums">{total.tickets}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{fc(total.bev)}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{fc(total.food)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{fc(total.all)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
