"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, Printer, Calendar, Loader2, ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useReactToPrint } from "react-to-print";
import { ReceiptTemplate } from "@/components/pos/ReceiptTemplate";
import { showToast } from "@/components/ui/Toast";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // Printing
    const [printSale, setPrintSale] = useState<any | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        onAfterPrint: () => setPrintSale(null),
    });

    useEffect(() => {
        if (printSale && printRef.current) {
            handlePrint();
        }
    }, [printSale, handlePrint]);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                query: search,
            });
            if (dateRange.start) params.append("startDate", dateRange.start);
            if (dateRange.end) params.append("endDate", dateRange.end);

            const res = await fetch(`/api/transactions?${params}`);
            const data = await res.json();

            if (data.success) {
                setTransactions(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    }, [page, search, dateRange]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchTransactions]);

    const triggerPrint = (sale: any) => {
        setPrintSale(sale);
        // The useEffect will trigger handlePrint once state is set and ref is ready
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="text-[#00d3fa]" />
                            Historique des Ventes
                        </h1>
                        <p className="text-sm text-gray-500">Consultez et réimprimez les tickets de caisse</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                placeholder="Recherche ticket, client..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-sm text-sm outline-none focus:border-[#00d3fa] w-full md:w-64"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-sm p-1">
                            <Calendar size={16} className="text-gray-400 ml-2" />
                            <input
                                type="date"
                                className="text-xs outline-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                            <span className="text-gray-300">-</span>
                            <input
                                type="date"
                                className="text-xs outline-none"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Ticket</th>
                                    <th className="px-6 py-3">Client</th>
                                    <th className="px-6 py-3 text-center">Type</th>
                                    <th className="px-6 py-3 text-right">Montant</th>
                                    <th className="px-6 py-3 text-center">Caissier</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-400">
                                            <Loader2 className="animate-spin inline-block mr-2" size={16} /> Chargement...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-400 italic">
                                            Aucune vente trouvée.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-600">
                                                {format(new Date(tx.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-800">
                                                {tx.ticketNum}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {tx.client ? tx.client.name : <span className="text-gray-400 italic">Passager</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-sm text-[10px] uppercase font-bold ${tx.orderType === 'DELIVERY' ? 'bg-orange-50 text-orange-600' :
                                                        tx.orderType === 'TAKEAWAY' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-green-50 text-green-600'
                                                    }`}>
                                                    {tx.orderType === 'DINE_IN' ? 'Sur Place' : tx.orderType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-gray-900">
                                                {Number(tx.totalNet).toLocaleString()} FC
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs text-gray-500">
                                                {tx.user?.name}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => triggerPrint(tx)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-sm hover:bg-gray-800 transition-all shadow-sm"
                                                >
                                                    <Printer size={14} /> Imprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 border border-gray-200 rounded-full hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <span className="text-sm font-bold text-gray-600">Page {page} / {totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 border border-gray-200 rounded-full hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Hidden Print Area */}
                <div style={{ display: "none" }}>
                    <div ref={printRef}>
                        {printSale && <ReceiptTemplate sale={printSale} />}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
