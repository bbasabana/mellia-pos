"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate, formatDateUTC, cn } from "@/lib/utils";
import { User, Calendar, DollarSign, Wallet, Eye, Trash2, Edit } from "lucide-react";
import { PurchaseDetailsModal } from "./PurchaseDetailsModal";
import { PurchaseAnalytics } from "./PurchaseAnalytics";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { showToast } from "@/components/ui/Toast";

export function PurchaseHistoryList({ 
    onEdit, 
    period, 
    setPeriod 
}: { 
    onEdit?: (id: string) => void;
    period: string;
    setPeriod: (p: string) => void;
}) {
    const [loading, setLoading] = useState(true);
    const [investments, setInvestments] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);

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
    }, [period]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/investments?period=${period}`);
            const data = await res.json();
            if (data.success) {
                setInvestments(data.data.history || []);
                setAnalytics(data.data.analytics || null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getPeriodLabel = () => {
        switch (period) {
            case "day": return "Aujourd'hui";
            case "week": return "Cette Semaine";
            case "month": return "Ce Mois";
            case "year": return "Cette Année";
            default: return "Tout";
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

    return (
        <div className="flex flex-col gap-6">
            {/* PERIOD FILTERS */}
            <div className="flex items-center justify-between px-4 pt-4">
                <div className="flex bg-gray-100 p-1 rounded-md">
                    {[
                        { id: 'day', label: 'Jour' },
                        { id: 'week', label: 'Semaine' },
                        { id: 'month', label: 'Mois' },
                        { id: 'year', label: 'Année' },
                        { id: 'all', label: 'Tout' }
                    ].map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPeriod(p.id)}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                                period === p.id 
                                    ? "bg-white text-blue-600 shadow-sm" 
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ANALYTICS SECTION */}
            {analytics?.topItems?.length > 0 && (
                <div className="px-4">
                    <PurchaseAnalytics 
                        topItems={analytics.topItems} 
                        periodLabel={getPeriodLabel()} 
                    />
                </div>
            )}

            <div className="overflow-x-auto">
                {investments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Aucun achat enregistré pour cette période.</div>
                ) : (
                    <table className="w-full text-sm text-left border-t border-gray-100">
                        <thead className="bg-gray-50/50 text-[10px] text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3 text-center">Source</th>
                                <th className="px-4 py-3 text-right">Montant Investi</th>
                                <th className="px-4 py-3 text-right text-green-600">ROI Attendu</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {investments.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {formatDateUTC(new Date(inv.date))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {(() => {
                                            const desc = inv.description || "";
                                            const buyerMatch = desc.match(/^\[Acheteur:\s*([^\]]+)\]\s*(.*)/);
                                            const realBuyer = buyerMatch ? buyerMatch[1] : null;
                                            const cleanDesc = buyerMatch ? buyerMatch[2] : (inv.description || "Sans description");

                                            return (
                                                <>
                                                    <div className="font-medium text-gray-800">{cleanDesc || "Sans description"}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <span className={realBuyer ? "font-bold text-blue-600 flex items-center gap-1" : "flex items-center gap-1"}>
                                                            <User size={10} />
                                                            {realBuyer || inv.user?.name || "Inconnu"}
                                                        </span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
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
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(inv.id)}
                                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center"
                                                    title="Modifier"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                            )}
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
                )}
            </div>

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
