"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DollarSign, TrendingUp, Package, PieChart, ArrowUpRight, BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
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
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <BarChart3 className="text-[#00d3fa]" />
                            Rapports & Projections
                        </h1>
                        <p className="text-sm text-gray-500">Valorisation du stock et projection de bénéfices</p>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="animate-spin text-[#00d3fa]" size={40} />
                        </div>
                    ) : (
                        <>
                            {/* KPI CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <KpiCard
                                    title="Investissement Stock"
                                    value={`$${stats?.totalCost.toFixed(2) || "0.00"}`}
                                    icon={<Package size={20} />}
                                    color="text-blue-500"
                                    subtitle="Valeur d'achat stock actuel"
                                />
                                <KpiCard
                                    title="Chiffre d'Affaire Potentiel"
                                    value={`$${stats?.totalPotentialRevenue.toFixed(2) || "0.00"}`}
                                    icon={<TrendingUp size={20} />}
                                    color="text-purple-500"
                                    subtitle="Si 100% du stock est vendu"
                                />
                                <KpiCard
                                    title="Bénéfice Net Attendu"
                                    value={`+$${stats?.totalPotentialProfit.toFixed(2) || "0.00"}`}
                                    icon={<DollarSign size={20} />}
                                    color="text-green-500"
                                    subtitle={`Marge globale: ${stats?.globalMarginPercent.toFixed(1)}%`}
                                />
                            </div>

                            {/* TABLE */}
                            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                        <PieChart size={16} className="text-gray-400" />
                                        Détail par Produit (Top 50 Potentiel)
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-3 border-b border-gray-100">Produit</th>
                                                <th className="px-6 py-3 border-b border-gray-100 text-center">Stock</th>
                                                <th className="px-6 py-3 border-b border-gray-100 text-right">Coût Unit.</th>
                                                <th className="px-6 py-3 border-b border-gray-100 text-right">Investissement</th>
                                                <th className="px-6 py-3 border-b border-gray-100 text-right">Vente Totale</th>
                                                <th className="px-6 py-3 border-b border-gray-100 text-right">Bénéfice</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {stats?.details.map((item: any, i: number) => (
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
                                            ))}
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

function KpiCard({ title, value, icon, color, subtitle }: any) {
    return (
        <div className="bg-white p-5 border border-gray-200 rounded-sm shadow-sm flex flex-col gap-4 relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{title}</p>
                    <h3 className="text-2xl font-black text-gray-800 mt-1 tracking-tight">{value}</h3>
                </div>
                <div className={cn("p-2 rounded-sm bg-gray-50 border border-gray-100", color)}>
                    {icon}
                </div>
            </div>
            {subtitle && (
                <div className="text-xs text-gray-500 font-medium z-10">
                    {subtitle}
                </div>
            )}
            <div className={cn("absolute -bottom-6 -right-6 opacity-5 transform scale-150 rotate-12 transition-transform group-hover:scale-175", color.replace("text-", "text-"))}>
                {icon}
            </div>
        </div>
    );
}
