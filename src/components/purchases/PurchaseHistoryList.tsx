"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, DollarSign, Edit, Eye, Trash2, User, Wallet } from "lucide-react";
import { PurchaseDetailsModal } from "./PurchaseDetailsModal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { showToast } from "@/components/ui/Toast";
import { fc } from "./purchase-format";

/** Kinshasa calendar date of a stored moment (purchases are dated by day). */
export function purchaseDay(date: string | Date): string {
    const d = new Date(new Date(date).getTime() + 3600_000);
    return format(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), "dd MMM yyyy", { locale: fr });
}

/** Journal des achats: one line per purchase, with who bought, who recorded and the source. */
export function PurchaseHistoryList({
    investments,
    loading,
    onEdit,
    onChanged,
}: {
    investments: any[];
    loading: boolean;
    onEdit?: (id: string) => void;
    onChanged: () => void;
}) {
    const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleViewDetails = async (id: string) => {
        setIsDetailOpen(true);
        setSelectedInvestment(null);
        try {
            const res = await fetch(`/api/investments?id=${id}`);
            const json = await res.json();
            if (json.success) setSelectedInvestment(json.data);
            else {
                showToast(json.error || "Erreur lors du chargement des détails", "error");
                setIsDetailOpen(false);
            }
        } catch {
            showToast("Erreur de connexion", "error");
            setIsDetailOpen(false);
        }
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/investments?id=${idToDelete}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                showToast("Achat supprimé : le stock a été retiré.", "success");
                setIdToDelete(null);
                onChanged();
            } else {
                showToast(json.error || "Erreur lors de la suppression", "error");
            }
        } catch {
            showToast("Erreur de connexion", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

    return (
        <div className="flex flex-col">
            <div className="overflow-x-auto">
                {investments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Aucun achat pour ces filtres.</div>
                ) : (
                    <table className="w-full text-sm text-left min-w-[760px]">
                        <thead className="bg-gray-50/50 text-[10px] text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Acheteur / notes</th>
                                <th className="px-4 py-3 text-center">Source</th>
                                <th className="px-4 py-3 text-right">Montant</th>
                                <th className="px-4 py-3 text-right text-green-600">Marge attendue</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {investments.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {purchaseDay(inv.date)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-blue-700 flex items-center gap-1">
                                            <User size={12} />
                                            {inv.buyer || inv.user?.name || "Inconnu"}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {inv.notes || `${inv._count?.movements ?? 0} produit(s)`}
                                        </div>
                                        <div className="text-[10px] text-gray-400">Saisi par {inv.user?.name || "—"}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase ${inv.source === "OWNER_CAPITAL" ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"}`}
                                        >
                                            {inv.source === "OWNER_CAPITAL" ? <Wallet size={10} /> : <DollarSign size={10} />}
                                            {inv.source === "OWNER_CAPITAL" ? "Patron" : "Caisse"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="font-bold text-gray-800">{fc(Number(inv.totalAmountCdf || 0))}</div>
                                        {Number(inv.transportFeeCdf || 0) > 0 && (
                                            <div className="text-[10px] text-purple-500">dont transport {fc(Number(inv.transportFeeCdf))}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-[#5bb300]">
                                        {Number(inv.expectedProfitCdf || 0) > 0 ? `+${fc(Number(inv.expectedProfitCdf))}` : "—"}
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
                title="Supprimer l'achat"
                message="Supprimer cet achat retire du stock les quantités qu'il avait ajoutées. Voulez-vous continuer ?"
                isLoading={isDeleting}
            />
        </div>
    );
}
