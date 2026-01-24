"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, Package, AlertCircle } from "lucide-react";

export default function ValuationPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/stock/valuation");
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Calcul de la valorisation en cours...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Erreur de chargement.</div>;

    const { items, totals } = data;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Valorisation du Stock & Profits</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Valeur d&apos;Achat (Stock)</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalStockValue)}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Revenu Potentiel</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalPotentialRevenue)}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Profit Potentiel (Marge)</p>
                        <h3 className="text-2xl font-bold text-purple-700">+{formatCurrency(totals.totalPotentialProfit)}</h3>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Produit</th>
                                <th className="px-6 py-4 text-center font-semibold">Stock</th>
                                <th className="px-6 py-4 text-right font-semibold">Coût Unitaire</th>
                                <th className="px-6 py-4 text-right font-semibold">Prix Vente Moy.</th>
                                <th className="px-6 py-4 text-right font-semibold">Valeur Stock</th>
                                <th className="px-6 py-4 text-right font-semibold text-green-600">Profit Est.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item: any) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {item.name}
                                        <div className="text-xs text-gray-400 font-normal">{item.type}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-600">
                                        <span className={item.stock <= 5 ? "text-red-500 font-bold" : ""}>
                                            {item.stock}
                                        </span>
                                        <span className="text-xs ml-1 text-gray-400">{item.saleUnit}s</span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.unitCost)}</td>
                                    <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.avgPrice)}</td>
                                    <td className="px-6 py-4 text-right font-medium text-blue-900 bg-blue-50/30">
                                        {formatCurrency(item.totalCostValue)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-green-600 bg-green-50/30">
                                        +{formatCurrency(item.potentialProfit)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {items.length === 0 && (
                    <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                        <AlertCircle size={48} className="mb-2 opacity-20" />
                        <p>Aucun produit en stock.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
