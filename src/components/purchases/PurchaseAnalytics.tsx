"use client";

import { TrendingUp } from "lucide-react";

export interface TopItem {
    productId: string;
    name: string;
    unit: string;
    times: number; // purchases containing the product
    quantity: number; // stock units bought
    costCdf: number;
}

const UNIT_LABELS: Record<string, string> = {
    BOTTLE: "bout.", PLATE: "plats", HALF_PLATE: "demi-plats", MEASURE: "mesures", PIECE: "pièces",
    KG: "kg", LITER: "L", BOX: "boîtes", PACK: "paquets",
};

export function unitLabel(unit: string): string {
    return UNIT_LABELS[unit] || unit.toLowerCase();
}

/** Most bought products among the purchases shown (same period and filters). */
export function PurchaseAnalytics({ topItems, periodLabel }: { topItems: TopItem[]; periodLabel: string }) {
    if (!topItems || topItems.length === 0) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase">
                    <TrendingUp size={16} className="text-[#71de00]" />
                    Produits les plus achetés
                </h3>
                <span className="text-[10px] uppercase font-bold text-gray-400 italic">{periodLabel}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                    <thead className="bg-gray-50/50 text-[9px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left">Produit</th>
                            <th className="px-3 py-3 text-center">Achats</th>
                            <th className="px-3 py-3 text-right">Quantité entrée</th>
                            <th className="px-4 py-3 text-right">Coût total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {topItems.map((item, idx) => (
                            <tr key={item.productId} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                            {idx + 1}
                                        </div>
                                        <span className="font-bold text-gray-700">{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-blue-600">{item.times}×</td>
                                <td className="px-3 py-2.5 text-right text-gray-600">
                                    {item.quantity.toLocaleString("fr-FR")} {unitLabel(item.unit)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-gray-700">
                                    {Math.round(item.costCdf).toLocaleString("fr-FR")} FC
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
