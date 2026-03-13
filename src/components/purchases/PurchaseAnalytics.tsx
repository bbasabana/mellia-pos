"use client";

import { cn } from "@/lib/utils";
import { Package, TrendingUp } from "lucide-react";

interface TopItem {
    productId: string;
    name: string;
    unit: string;
    counts: {
        day: number;
        week: number;
        month: number;
        year: number;
    };
}

interface PurchaseAnalyticsProps {
    topItems: TopItem[];
    periodLabel: string;
}

export function PurchaseAnalytics({ topItems, periodLabel }: PurchaseAnalyticsProps) {
    if (!topItems || topItems.length === 0) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase">
                    <TrendingUp size={16} className="text-[#71de00]" />
                    Fréquence d&apos;Achat (Top 10)
                </h3>
                <span className="text-[10px] uppercase font-bold text-gray-400 italic">Basé sur: {periodLabel}</span>
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-[11px]">
                    <thead className="bg-gray-50/50 text-[9px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left">Produit / Unité</th>
                            <th className="px-3 py-3 text-center border-l border-gray-50">Auj.</th>
                            <th className="px-3 py-3 text-center border-l border-gray-50">Sem.</th>
                            <th className="px-3 py-3 text-center border-l border-gray-50">Mois</th>
                            <th className="px-3 py-3 text-center border-l border-gray-50">Année</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {topItems.map((item, idx) => (
                            <tr key={item.productId} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-700">{item.name}</div>
                                            <div className="text-[9px] text-gray-400 italic">{item.unit}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-3 text-center border-l border-gray-50">
                                    <CountBadge count={item.counts.day} color="blue" />
                                </td>
                                <td className="px-3 py-3 text-center border-l border-gray-50">
                                    <CountBadge count={item.counts.week} color="green" />
                                </td>
                                <td className="px-3 py-3 text-center border-l border-gray-50">
                                    <CountBadge count={item.counts.month} color="purple" />
                                </td>
                                <td className="px-3 py-3 text-center border-l border-gray-50 bg-gray-50/30">
                                    <CountBadge count={item.counts.year} color="emerald" highlight />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CountBadge({ count, color, highlight }: { count: number; color: string; highlight?: boolean }) {
    if (count === 0) return <span className="text-gray-300">-</span>;

    const colors: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-green-50 text-green-600 border-green-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
        emerald: "bg-[#71de00]/10 text-[#71de00] border-[#71de00]/20",
    };

    return (
        <span className={cn(
            "inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full font-bold border",
            colors[color] || colors.blue,
            highlight && "scale-110 shadow-sm"
        )}>
            {count}
        </span>
    );
}
