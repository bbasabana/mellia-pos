"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { User, Calendar, DollarSign, Wallet, Eye, Trash2 } from "lucide-react";
import { PurchaseDetailsModal } from "./PurchaseDetailsModal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { showToast } from "@/components/ui/Toast";

export function PurchaseHistoryList() {
    const [loading, setLoading] = useState(true);
    const [investments, setInvestments] = useState<any[]>([]);

    // Detail Modal State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Delete Modal State
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
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

    const handleViewDetails = async (id: string) => {
        setLoadingDetail(true);
        setSelectedId(id);
        setIsDetailOpen(true);
        try {
            const res = await fetch(`/api/investments?id=${id}`);
            const json = await res.json();
            if (json.success) {
                setSelectedInvestment(json.data);
            } else {
                showToast("Erreur lors du chargement des détails", "error");
                setIsDetailOpen(false);
            }
        } catch (error) {
            showToast("Erreur de connexion", "error");
            setIsDetailOpen(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/investments?id=${idToDelete}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                showToast("Achat supprimé avec succès. Stock inversé.", "success");
                fetchHistory();
                setIdToDelete(null);
            } else {
                showToast(json.error || "Erreur lors de la suppression", "error");
            }
        } catch (error) {
            showToast("Erreur de connexion", "error");
        } finally {
            setIsDeleting(false);
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
                        <th className="px-4 py-3 text-center">Actions</th>
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
                            <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleViewDetails(inv.id)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Voir détails"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => setIdToDelete(inv.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODALS */}
            <PurchaseDetailsModal
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedInvestment(null);
                }}
                investment={selectedInvestment}
            />

            <ConfirmDeleteModal
                isOpen={!!idToDelete}
                onClose={() => setIdToDelete(null)}
                onConfirm={confirmDelete}
                title="Supprimer l'Achat"
                message="Attention: Supprimer cet achat inversera les entrées en stock correspondantes. Voulez-vous continuer ?"
                isLoading={isDeleting}
            />
        </div>
    );
}
