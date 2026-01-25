"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp,
    Search,
    RefreshCw,
    Clock,
    User,
    Smartphone,
    Banknote,
    Filter,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function FinancialTransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Filters
    const [method, setMethod] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            let url = `/api/financial-transactions?page=${page}&limit=20`;
            if (method) url += `&method=${method}`;
            if (startDate) url += `&startDate=${startDate}`;
            if (endDate) url += `&endDate=${endDate}`;

            const res = await fetch(url);
            const json = await res.json();
            if (json.success) {
                setTransactions(json.data);
                setTotalPages(json.pagination.totalPages);
                setTotalItems(json.pagination.total);
            }
        } catch (error) {
            showToast("Erreur lors du chargement des transactions", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, method, startDate, endDate]);

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'CASH': return <Banknote size={16} className="text-blue-600" />;
            case 'MOBILE_MONEY': return <Smartphone size={16} className="text-orange-600" />;
            default: return <TrendingUp size={16} className="text-gray-400" />;
        }
    };

    const getMethodLabel = (method: string) => {
        switch (method) {
            case 'CASH': return "Espèces";
            case 'MOBILE_MONEY': return "Mobile Money";
            case 'CARD': return "Carte";
            default: return method;
        }
    };

    const totalVolumeCdf = transactions.reduce((acc, t) => acc + Number(t.amountCdf || 0), 0);

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <TrendingUp className="text-blue-600" size={28} />
                            Transactions Financières
                        </h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                            La vérité financière : tous les paiements encaissés
                        </p>
                    </div>
                    <button
                        onClick={fetchTransactions}
                        className="p-2.5 bg-white border border-gray-200 rounded-sm hover:bg-gray-50 transition-all text-gray-600 shadow-sm"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={method}
                            onChange={(e) => { setMethod(e.target.value); setPage(1); }}
                            className="text-sm font-bold bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Tous les paiements</option>
                            <option value="CASH">Espèces uniquement</option>
                            <option value="MOBILE_MONEY">Mobile Money uniquement</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="text-sm font-bold bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-gray-400">à</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="text-sm font-bold bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex-1 flex flex-col min-h-0">
                    <div className="overflow-x-auto flex-1 h-full scrollbar-thin scrollbar-thumb-gray-200">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 sticky top-0 z-10 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Date & Heure</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Vente</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Agent</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Méthode</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Référence</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading && transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-gray-400 italic font-medium">
                                            Chargement des données financières...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-gray-400 italic font-medium">
                                            Aucune transaction trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-xs text-gray-600 font-bold">
                                                    <Clock size={14} className="text-gray-400" />
                                                    {new Date(t.createdAt).toLocaleString('fr-FR', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-800">{t.sale.ticketNum}</span>
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        Client: {t.sale.client?.name || "Anonyme"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black text-gray-500 uppercase">
                                                        {t.user.name.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-700">{t.user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider",
                                                    t.paymentMethod === 'MOBILE_MONEY' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                                )}>
                                                    {getMethodIcon(t.paymentMethod)}
                                                    {getMethodLabel(t.paymentMethod)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-gray-500 font-mono">
                                                    {t.reference || "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-blue-700">
                                                        {Number(t.amountCdf).toLocaleString()} FC
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold">
                                                        ${Number(t.amount).toFixed(2)}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-bold">
                                Affichage de {transactions.length} sur {totalItems} transactions
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="p-2 border border-gray-200 rounded-sm hover:bg-white disabled:opacity-50 transition-all shadow-sm"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex items-center px-4 bg-white border border-gray-200 rounded-sm text-sm font-bold text-gray-700 shadow-sm">
                                    {page} / {totalPages}
                                </div>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-2 border border-gray-200 rounded-sm hover:bg-white disabled:opacity-50 transition-all shadow-sm"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
