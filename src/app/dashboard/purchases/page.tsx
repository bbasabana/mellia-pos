"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCallback, useEffect, useState } from "react";
import { Coins, Loader2, Package, Plus, ShoppingBag, Truck, Users, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PurchaseHistoryList } from "@/components/purchases/PurchaseHistoryList";
import { PurchaseAnalytics, type TopItem } from "@/components/purchases/PurchaseAnalytics";
import { InvestmentForm } from "@/components/stock/InvestmentForm";
import { Modal } from "@/components/ui/Modal";
import { SOURCE_LABELS, fc } from "@/components/purchases/purchase-format";

const PERIODS = [
    { id: "day", label: "Jour", long: "Aujourd'hui" },
    { id: "week", label: "Semaine", long: "Cette semaine" },
    { id: "month", label: "Mois", long: "Ce mois" },
    { id: "year", label: "Année", long: "Cette année" },
    { id: "all", label: "Tout", long: "Depuis le démarrage" },
];

type PurchasesData = {
    history: any[];
    stats: { count: number; totalCdf: number; totalUsd: number; vendableCdf: number; nonVendableCdf: number; transportCdf: number; expectedProfitCdf: number };
    bySource: Record<string, { totalCdf: number; count: number }>;
    buyers: { name: string; totalCdf: number; count: number }[];
    analytics: { topItems: TopItem[] };
};

export default function PurchasesPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editId, setEditId] = useState<string | undefined>(undefined);
    const [period, setPeriod] = useState("month");
    const [source, setSource] = useState("");
    const [buyer, setBuyer] = useState("");
    const [data, setData] = useState<PurchasesData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams({ period });
            if (source) qs.set("source", source);
            if (buyer) qs.set("buyer", buyer);
            const res = await fetch(`/api/investments?${qs}`);
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (error) {
            console.error("Error fetching purchases:", error);
        } finally {
            setLoading(false);
        }
    }, [period, source, buyer]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const closeForm = () => {
        setIsFormOpen(false);
        setEditId(undefined);
    };

    const stats = data?.stats;
    const periodLong = PERIODS.find((p) => p.id === period)?.long ?? "";
    const filterLabel = [periodLong, source && SOURCE_LABELS[source], buyer && `acheté par ${buyer}`].filter(Boolean).join(" · ");

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full">
                <div className="px-1 pb-5 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="ui-page-title flex items-center gap-2.5">
                            <Coins className="text-[#00d3fa]" />
                            Achats
                        </h1>
                        <p className="text-sm text-gray-500">
                            Chaque achat entre en stock, fixe le prix de revient des produits et dit d&apos;où vient l&apos;argent.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-black text-white px-5 py-2.5 rounded-sm shadow-sm hover:bg-gray-800 transition-all flex items-center gap-2 font-bold text-sm"
                    >
                        <Plus size={18} /> Nouvel achat
                    </button>
                </div>

                <div className="flex-1 overflow-auto px-1 pb-2 space-y-5">
                    {/* FILTERS */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-gray-100 p-1 rounded-md">
                            {PERIODS.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPeriod(p.id)}
                                    className={cn(
                                        "px-3.5 py-1.5 text-xs font-bold rounded-md transition-all",
                                        period === p.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <select
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="text-xs font-bold border border-gray-200 rounded-sm px-2.5 py-2 bg-white"
                            aria-label="Source des fonds"
                        >
                            <option value="">Toutes les sources</option>
                            <option value="OWNER_CAPITAL">Poche du patron</option>
                            <option value="CASH_REGISTER">Caisse du restaurant</option>
                        </select>
                        <select
                            value={buyer}
                            onChange={(e) => setBuyer(e.target.value)}
                            className="text-xs font-bold border border-gray-200 rounded-sm px-2.5 py-2 bg-white"
                            aria-label="Acheteur"
                        >
                            <option value="">Tous les acheteurs</option>
                            {buyer && !data?.buyers.some((b) => b.name.toLowerCase() === buyer.toLowerCase()) && <option value={buyer}>{buyer}</option>}
                            {data?.buyers.map((b) => (
                                <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                        </select>
                        {(source || buyer) && (
                            <button
                                onClick={() => { setSource(""); setBuyer(""); }}
                                className="text-xs font-bold text-gray-500 hover:text-red-500 flex items-center gap-1"
                            >
                                <X size={14} /> Effacer les filtres
                            </button>
                        )}
                        {loading && <Loader2 size={16} className="animate-spin text-gray-400" />}
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <KpiCard
                            title="Argent sorti"
                            value={fc(stats?.totalCdf || 0)}
                            hint={`${stats?.count || 0} achat(s) · ≈ ${(stats?.totalUsd || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} $`}
                            icon={<Wallet size={18} />}
                            color="text-blue-600 bg-blue-50"
                        />
                        <KpiCard
                            title="Stock revendable"
                            value={fc(stats?.vendableCdf || 0)}
                            hint={`Marge attendue : ${fc(stats?.expectedProfitCdf || 0)}`}
                            icon={<Package size={18} />}
                            color="text-green-600 bg-green-50"
                        />
                        <KpiCard
                            title="Charges (consommables)"
                            value={fc(stats?.nonVendableCdf || 0)}
                            hint="Huile, épices, savon… non revendus"
                            icon={<ShoppingBag size={18} />}
                            color="text-orange-600 bg-orange-50"
                        />
                        <KpiCard
                            title="Transport"
                            value={fc(stats?.transportCdf || 0)}
                            hint="Compris dans l'argent sorti"
                            icon={<Truck size={18} />}
                            color="text-purple-600 bg-purple-50"
                        />
                    </div>

                    {/* WHERE THE MONEY CAME FROM / WHO BOUGHT */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="bg-white border border-gray-200 rounded-sm p-4">
                            <h3 className="text-[11px] font-bold uppercase text-gray-500 flex items-center gap-1.5 mb-3">
                                <Wallet size={14} /> D&apos;où vient l&apos;argent
                            </h3>
                            <div className="space-y-2">
                                {Object.entries(SOURCE_LABELS).map(([key, label]) => {
                                    const s = data?.bySource?.[key] ?? { totalCdf: 0, count: 0 };
                                    const active = source === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSource(active ? "" : key)}
                                            className={cn(
                                                "w-full flex items-center justify-between rounded-sm border px-3 py-2 text-left transition-colors",
                                                active ? "border-blue-400 bg-blue-50" : "border-gray-100 hover:bg-gray-50"
                                            )}
                                        >
                                            <span className="text-sm font-bold text-gray-700">
                                                {label}
                                                <span className="ml-2 text-[11px] font-medium text-gray-400">{s.count} achat(s)</span>
                                            </span>
                                            <span className={cn("font-black", key === "CASH_REGISTER" ? "text-orange-600" : "text-purple-600")}>{fc(s.totalCdf)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2">
                                Les achats payés par la caisse sont déduits de l&apos;argent attendu à la clôture de la journée.
                            </p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-sm p-4">
                            <h3 className="text-[11px] font-bold uppercase text-gray-500 flex items-center gap-1.5 mb-3">
                                <Users size={14} /> Par acheteur
                            </h3>
                            {data?.buyers.length ? (
                                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                                    {data.buyers.map((b) => {
                                        const active = buyer.toLowerCase() === b.name.toLowerCase();
                                        return (
                                            <button
                                                key={b.name}
                                                onClick={() => setBuyer(active ? "" : b.name)}
                                                className={cn(
                                                    "w-full flex items-center justify-between rounded-sm px-3 py-1.5 text-left transition-colors",
                                                    active ? "bg-blue-50 ring-1 ring-blue-300" : "hover:bg-gray-50"
                                                )}
                                            >
                                                <span className="text-sm font-bold text-gray-700">
                                                    {b.name}
                                                    <span className="ml-2 text-[11px] font-medium text-gray-400">{b.count} achat(s)</span>
                                                </span>
                                                <span className="font-black text-gray-800">{fc(b.totalCdf)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">Aucun achat sur cette période.</p>
                            )}
                        </div>
                    </div>

                    {data?.analytics?.topItems?.length ? (
                        <PurchaseAnalytics topItems={data.analytics.topItems} periodLabel={filterLabel} />
                    ) : null}

                    <div className="bg-white border border-gray-200 rounded-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Journal des achats</h3>
                            <span className="text-[11px] text-gray-400">{filterLabel}</span>
                        </div>
                        <PurchaseHistoryList
                            investments={data?.history ?? []}
                            loading={loading && !data}
                            onChanged={fetchData}
                            onEdit={(id) => {
                                setEditId(id);
                                setIsFormOpen(true);
                            }}
                        />
                    </div>
                </div>

                <Modal isOpen={isFormOpen} onClose={closeForm} title={editId ? "Modifier l'achat" : "Nouvel achat"} size="2xl">
                    <InvestmentForm
                        editId={editId}
                        onSuccess={() => {
                            closeForm();
                            fetchData();
                        }}
                        onCancel={closeForm}
                    />
                </Modal>
            </div>
        </DashboardLayout>
    );
}

function KpiCard({ title, value, hint, icon, color }: { title: string; value: string; hint: string; icon: React.ReactNode; color: string }) {
    return (
        <div className="bg-white p-4 border border-gray-200 rounded-sm flex items-start justify-between gap-2">
            <div className="min-w-0">
                <p className="text-[10px] text-gray-500 uppercase font-bold">{title}</p>
                <p className="text-lg font-black text-gray-800 mt-1">{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>
            </div>
            <div className={cn("p-2.5 rounded-full shrink-0", color)}>{icon}</div>
        </div>
    );
}
