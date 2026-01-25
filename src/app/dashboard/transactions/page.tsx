"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, Printer, Calendar, Loader2, ArrowLeft, ArrowRight, FileText, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useReactToPrint } from "react-to-print";
import { ReceiptTemplate } from "@/components/pos/ReceiptTemplate";
import { showToast } from "@/components/ui/Toast";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // Modals State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
    const [editModal, setEditModal] = useState<{ isOpen: boolean, tx: any | null }>({ isOpen: false, tx: null });

    // Printing
    const [deleteLoading, setDeleteLoading] = useState(false);
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

    // Auto-refresh polling (every 10 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchTransactions();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchTransactions]);

    // Debounce search/filter
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchTransactions]); // Note: fetchTransactions needs to be stable or this might loop too fast if it changes often.
    // Actually fetchTransactions depends on [page, search, dateRange]. 
    // If these don't change, fetchTransactions is stable-ish. 
    // However, if fetchTransactions sets state (setTransactions), it doesn't trigger re-creation of itself.

    const handleDelete = async () => {
        if (!deleteModal.id) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/transactions?id=${deleteModal.id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showToast("Vente annulée avec succès", "success");
                fetchTransactions();
                setDeleteModal({ isOpen: false, id: null });
            } else {
                showToast(data.error || "Erreur lors de l'annulation", "error");
            }
        } catch (error) {
            showToast("Une erreur est survenue", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    const confirmDelete = (id: string) => {
        setDeleteModal({ isOpen: true, id });
    };

    const openEditModal = (tx: any) => {
        setEditModal({ isOpen: true, tx });
    };

    const triggerPrint = (tx: any) => {
        setPrintSale(tx);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50/50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="text-[#00d3fa]" />
                            Historique des Transactions (Ventes)
                        </h1>
                        <p className="text-sm text-gray-500">Consultez, modifiez ou annulez vos tickets de vente</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00d3fa] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Numéro ticket, client..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm outline-none focus:border-[#00d3fa] focus:ring-1 focus:ring-[#00d3fa]/20 transition-all w-64"
                            />
                        </div>

                        {/* Date Filters */}
                        <div className="flex items-center gap-2 bg-white p-1 rounded-sm border border-gray-200 shadow-sm">
                            <Calendar size={14} className="ml-2 text-gray-400" />
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="bg-transparent border-none text-xs font-bold text-gray-800 outline-none p-1 cursor-pointer"
                            />
                            <span className="text-gray-300">/</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="bg-transparent border-none text-xs font-bold text-gray-800 outline-none p-1 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 border-b border-gray-100">Ticket & Date</th>
                                    <th className="px-6 py-3 border-b border-gray-100">Client</th>
                                    <th className="px-6 py-3 border-b border-gray-100">Détails Items</th>
                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Total</th>
                                    <th className="px-6 py-3 border-b border-gray-100 text-center">Caissier</th>
                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin text-[#00d3fa]" size={32} />
                                                <span className="text-sm font-medium text-gray-500">Chargement des transactions...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <Search size={40} strokeWidth={1.5} />
                                                <p className="text-sm italic">Aucune transaction trouvée</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 align-top w-48">
                                                <div className="font-black text-gray-900 text-sm">#{tx.ticketNum}</div>
                                                <div className="text-[10px] text-gray-400 font-medium uppercase mt-1">
                                                    {format(new Date(tx.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                                                </div>
                                                <div className={`mt-2 inline-block px-1.5 py-0.5 rounded-[2px] text-[8px] font-black uppercase tracking-widest ${tx.status === "COMPLETED" ? "bg-green-50 text-green-600 border border-green-100" :
                                                        tx.status === "CANCELLED" ? "bg-red-50 text-red-600 border border-red-100" :
                                                            "bg-orange-50 text-orange-600 border border-orange-100"
                                                    }`}>
                                                    {tx.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top w-48">
                                                <div className="font-bold text-gray-800 text-sm">{tx.client?.name || "Client de passage"}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">{tx.client?.phone || "--"}</div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex flex-col gap-1">
                                                    {tx.items?.map((item: any, idx: number) => (
                                                        <div key={idx} className="text-[11px] text-gray-600 flex justify-between gap-4">
                                                            <span className="bg-gray-100 px-1 rounded font-bold mr-1">x{item.quantity}</span>
                                                            <span className="flex-1 truncate">{JSON.parse(JSON.stringify(item.product?.name || "Produit"))}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right align-top w-40">
                                                <div className="font-black text-gray-900 text-base">
                                                    {Number(tx.totalCdf) > 0
                                                        ? Number(tx.totalCdf).toLocaleString()
                                                        : Math.round(Number(tx.totalNet) * rate).toLocaleString()
                                                    } FC
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
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(tx)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 text-xs font-bold rounded-sm hover:bg-blue-50 transition-all w-full justify-center border border-transparent hover:border-blue-100"
                                                            >
                                                                <Edit size={14} /> Modifier
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDelete(tx.id)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 text-xs font-bold rounded-sm hover:bg-red-50 transition-all w-full justify-center border border-transparent hover:border-red-100"
                                                            >
                                                                <Trash2 size={14} /> Supprimer
                                                            </button>
                                                        </>
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

                {/* Confirm Delete Modal */}
                <ConfirmationModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                    onConfirm={handleDelete}
                    title="Annuler cette vente ?"
                    description="Cette action est irréversible. Le stock sera automatiquement restauré."
                    confirmText="Oui, Annuler Vente"
                    loading={deleteLoading}
                />

                {/* Edit Modal */}
                <EditTransactionModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ ...editModal, isOpen: false })}
                    transaction={editModal.tx}
                    onSuccess={fetchTransactions}
                    exchangeRate={rate}
                />

                {/* Hidden Print Area */}
                <div style={{ display: "none" }}>
                    <div ref={printRef}>
                        {printSale && <ReceiptTemplate sale={printSale} exchangeRate={rate} />}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
