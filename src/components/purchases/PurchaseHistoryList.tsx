"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { User, Calendar, DollarSign, Wallet } from "lucide-react";

export function PurchaseHistoryList() {
    const [loading, setLoading] = useState(true);
    const [investments, setInvestments] = useState<any[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/investments");
            const data = await res.json();
            if (data.success && data.data.history) {
                setInvestments(data.data.history);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

    if (investments.length === 0) {
        return <div className="p-8 text-center text-gray-400">Aucun achat enregistré.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3 text-right">Montant Investi</th>
                        <th className="px-4 py-3 text-right text-green-600">ROI Attendu</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {investments.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    {formatDate(new Date(inv.date))}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="font-medium text-gray-800">{inv.description || "Sans description"}</div>
                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <User size={10} />
                                    {inv.user?.name || "Inconnu"}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase ${inv.source === 'OWNER_CAPITAL'
                                        ? 'bg-purple-50 text-purple-600'
                                        : 'bg-orange-50 text-orange-600'
                                    }`}>
                                    {inv.source === 'OWNER_CAPITAL' ? <Wallet size={10} /> : <DollarSign size={10} />}
                                    {inv.source === 'OWNER_CAPITAL' ? 'Patron' : 'Caisse'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-700">
                                {formatCurrency(Number(inv.totalAmount))}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-[#71de00]">
                                {inv.expectedProfit > 0 ? `+${formatCurrency(Number(inv.expectedProfit))}` : "-"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
