"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DollarSign, TrendingUp, Package, PieChart, ArrowUpRight, BarChart3, Loader2, Calendar, ShoppingCart, Calculator, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type ReportMode = 'PERFORMANCE' | 'PROJECTION';
type Period = 'today' | 'week' | 'month' | 'year' | 'all';

export default function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<ReportMode>('PERFORMANCE');
    const [period, setPeriod] = useState<Period>('week');

    const fetchPerformance = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/performance?period=${period}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [period]);

    const fetchProjection = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/reports/profit-projection");
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (mode === 'PERFORMANCE') {
            fetchPerformance();
        } else {
            fetchProjection();
        }
    }, [mode, period, fetchPerformance, fetchProjection]);

    const periodLabels: Record<Period, string> = {
        'today': "Aujourd'hui",
        'week': "Cette Semaine",
        'month': "Ce Mois",
        'year': "Cette Année",
        'all': "Global (Tout)"
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <BarChart3 className="text-[#00d3fa]" />
                            Tableau de Bord & Rapports
                        </h1>
                        <p className="text-sm text-gray-500">
                            {mode === 'PERFORMANCE'
                                ? `Performance réelle - ${periodLabels[period]}`
                                : "Estimation des profits sur le stock restant"}
                        </p>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-sm gap-1 self-start">
                        <button
                            onClick={() => setMode('PERFORMANCE')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-sm transition-all flex items-center gap-2",
                                mode === 'PERFORMANCE' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <TrendingUp size={14} /> Performance
                        </button>
                        <button
                            onClick={() => setMode('PROJECTION')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-sm transition-all flex items-center gap-2",
                                mode === 'PROJECTION' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <ArrowRightLeft size={14} /> Projections Stock
                        </button>
                    </div>
                </div>

                {/* FILTERS FOR PERFORMANCE */}
                {mode === 'PERFORMANCE' && (
                    <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-2 overflow-x-auto shrink-0">
                        <Calendar size={14} className="text-gray-400 mr-2" />
                        {(Object.keys(periodLabels) as Period[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                    period === p
                                        ? "bg-gray-800 text-white border-gray-800"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                )}
                            >
                                {periodLabels[p]}
                            </button>
                        ))}
                    </div>
                )}

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="animate-spin text-[#00d3fa]" size={40} />
                        </div>
                    ) : (
                        <>
                            {/* KPI CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {mode === 'PERFORMANCE' ? (
                                    <>
                                        <KpiCard
                                            title="Ventes Réalisées"
                                            value={`$${stats?.summary.totalSales.toFixed(2) || "0.00"}`}
                                            icon={<ShoppingCart size={20} />}
                                            color="text-blue-500"
                                            subtitle="Chiffre d'affaires encaissé"
                                            cdfValue={stats?.summary.totalSales * 2850}
                                        />
                                        <KpiCard
                                            title="Investissement Stock"
                                            value={`$${stats?.summary.totalInvestment.toFixed(2) || "0.00"}`}
                                            icon={<Package size={20} />}
                                            color="text-orange-500"
                                            subtitle="Achats de stock effectués"
                                            cdfValue={stats?.summary.totalInvestment * 2850}
                                        />
                                        <KpiCard
                                            title="Charges (Dépenses)"
                                            value={`$${stats?.summary.totalExpenses.toFixed(2) || "0.00"}`}
                                            icon={<Calculator size={20} />}
                                            color="text-red-500"
                                            subtitle="Frais de fonctionnement"
                                            cdfValue={stats?.summary.totalExpenses * 2850}
                                        />
                                        <KpiCard
                                            title="Bénéfice Net"
                                            value={`$${stats?.summary.netProfit.toFixed(2) || "0.00"}`}
                                            icon={<DollarSign size={20} />}
                                            color="text-green-500"
                                            subtitle={`Marge: ${stats?.summary.marginPercent.toFixed(1)}%`}
                                            cdfValue={stats?.summary.netProfit * 2850}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <KpiCard
                                            title="Valeur de rachat Stock"
                                            value={`$${stats?.totalCost.toFixed(2) || "0.00"}`}
                                            icon={<Package size={20} />}
                                            color="text-blue-500"
                                            subtitle="Prix payé pour le stock actuel"
                                            cdfValue={stats?.totalCost * 2850}
                                        />
                                        <KpiCard
                                            title="Revenu Potentiel"
                                            value={`$${stats?.totalPotentialRevenue.toFixed(2) || "0.00"}`}
                                            icon={<TrendingUp size={20} />}
                                            color="text-purple-500"
                                            subtitle="Si tout est vendu"
                                            cdfValue={stats?.totalPotentialRevenue * 2850}
                                        />
                                        <KpiCard
                                            title="Profit Attendu"
                                            value={`$${stats?.totalPotentialProfit.toFixed(2) || "0.00"}`}
                                            icon={<DollarSign size={20} />}
                                            color="text-green-500"
                                            subtitle={`Marge possible: ${stats?.globalMarginPercent.toFixed(1)}%`}
                                            cdfValue={stats?.totalPotentialProfit * 2850}
                                        />
                                        <div className="hidden lg:block"></div> {/* Spacer */}
                                    </>
                                )}
                            </div>

                            {/* TABLE */}
                            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                        <PieChart size={16} className="text-gray-400" />
                                        {mode === 'PERFORMANCE' ? "Détail des ventes sur la période" : "Valorisation détaillée par produit"}
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                            {mode === 'PERFORMANCE' ? (
                                                <tr>
                                                    <th className="px-6 py-3 border-b border-gray-100">Produit</th>
                                                    <th className="px-6 py-3 border-b border-gray-100 text-center">Quantité</th>
                                                    <th className="px-6 py-3 border-b border-gray-100 text-right">C.A</th>
                                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Coût</th>
                                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Profit</th>
                                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Marge</th>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <th className="px-6 py-3 border-b border-gray-100">Produit</th>
                                                    <th className="px-6 py-3 border-b border-gray-100 text-center">Stock</th>
                                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Coût Unit.</th>
                                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Investissement</th>
                                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Vente Totale</th>
                                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Bénéfice</th>
                                                </tr>
                                            )}
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {mode === 'PERFORMANCE' ? (
                                                stats?.details.map((item: any, i: number) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                                                            {item.qty}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm text-gray-800">
                                                            ${item.revenue.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                                                            ${item.cost.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                                                            ${item.profit.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-sm">
                                                                {item.margin.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                stats?.details.map((item: any, i: number) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                                                                <span className="text-[10px] text-gray-400">{item.category}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                                                            ${item.unitCost.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-800">
                                                            ${item.totalCost.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-bold text-purple-600">
                                                            ${item.potentialRevenue.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="inline-flex items-center gap-1 text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-sm">
                                                                <ArrowUpRight size={12} />
                                                                ${item.potentialProfit.toFixed(2)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function KpiCard({ title, value, icon, color, subtitle, cdfValue }: any) {
    return (
        <div className="bg-white p-5 border border-gray-200 rounded-sm shadow-sm flex flex-col gap-4 relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{title}</p>
                    <h3 className="text-2xl font-black text-gray-800 mt-1 tracking-tight">{value}</h3>
                    {cdfValue !== undefined && (
                        <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                            ~ {Math.round(cdfValue).toLocaleString()} FC
                        </p>
                    )}
                </div>
                <div className={cn("p-2 rounded-sm bg-gray-50 border border-gray-100", color)}>
                    {icon}
                </div>
            </div>
            {subtitle && (
                <div className="text-xs text-gray-500 font-medium z-10 mt-auto">
                    {subtitle}
                </div>
            )}
            <div className={cn("absolute -bottom-6 -right-6 opacity-5 transform scale-150 rotate-12 transition-transform group-hover:scale-175", color)}>
                {icon}
            </div>
        </div>
    );
}
