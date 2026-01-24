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
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [rate, setRate] = useState(2800);

    // Fetch rate
    useEffect(() => {
        fetch("/api/exchange-rate").then(res => res.json()).then(data => {
            if (data.success) setRate(Number(data.data.rateUsdToCdf));
        });
    }, []);

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
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment annuler cette vente ? Cette action restaurera le stock.")) return;
        setDeleteLoading(id);
        try {
            const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                showToast("Vente annulée avec succès", "success");
                fetchTransactions();
            } else {
                showToast(json.error || "Erreur lors de l'annulation", "error");
            }
        } catch (e) {
            showToast("Erreur serveur", "error");
        } finally {
            setDeleteLoading(null);
        }
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
                                    <th className="px-6 py-3">Ticket / Client</th>
                                    <th className="px-6 py-3">Détails Produits</th>
                                    <th className="px-6 py-3 text-right">Montant</th>
                                    <th className="px-6 py-3 text-center">Caissier</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400">
                                            <Loader2 className="animate-spin inline-block mr-2" size={16} /> Chargement...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400 italic">
                                            Aucune vente trouvée.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-gray-600 align-top w-32">
                                                {format(new Date(tx.createdAt), "dd MMM HH:mm", { locale: fr })}
                                                <div className={`mt-1 inline-flex text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${tx.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                                    }`}>
                                                    {tx.status === "CANCELLED" ? "Annulée" : "Validée"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top w-48">
                                                <div className="font-bold text-gray-800">{tx.ticketNum}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {tx.client ? tx.client.name : "Passager"}
                                                </div>
                                                <div className="mt-1">
                                                    <span className={`px-1.5 py-0.5 rounded-sm text-[9px] uppercase font-bold border ${tx.orderType === 'DELIVERY' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        tx.orderType === 'TAKEAWAY' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-100'
                                                        }`}>
                                                        {tx.orderType === 'DINE_IN' ? 'Sur Place' : tx.orderType}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="text-xs text-gray-600 space-y-1 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                                                    {tx.items?.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between border-b border-dashed border-gray-100 pb-1 last:border-0 last:pb-0">
                                                            <span className="font-medium">{Number(item.quantity)}x {item.product?.name}</span>
                                                            <span className="text-gray-400">{(item.unitPrice * rate).toLocaleString()} FC</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right align-top w-40">
                                                <div className="font-black text-gray-900 text-base">
                                                    {Math.round(Number(tx.totalNet) * rate).toLocaleString()} FC
                                                </div>
                                                <div className="text-xs text-gray-400 font-medium">
                                                    ${Number(tx.totalNet).toFixed(2)} USD
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs text-gray-500 align-top w-32">
                                                <div className="font-bold">{tx.user?.name.split(" ")[0]}</div>
                                                <div className="text-[10px] uppercase text-gray-400">Caissier</div>
                                            </td>
                                            <td className="px-6 py-4 text-right align-top w-40">
                                                <div className="flex flex-col gap-2 items-end">
                                                    <button
                                                        onClick={() => triggerPrint(tx)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-sm hover:bg-gray-200 transition-all w-full justify-center"
                                                    >
                                                        <Printer size={14} /> Imprimer
                                                    </button>
                                                    {tx.status !== "CANCELLED" && (
                                                        <button
                                                            onClick={() => handleDelete(tx.id)}
                                                            disabled={deleteLoading === tx.id}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 text-xs font-bold rounded-sm hover:bg-red-50 transition-all w-full justify-center border border-transparent hover:border-red-100"
                                                        >
                                                            {deleteLoading === tx.id ? (
                                                                <Loader2 className="animate-spin" size={14} />
                                                            ) : (
                                                                <>Supprimer</>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
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
