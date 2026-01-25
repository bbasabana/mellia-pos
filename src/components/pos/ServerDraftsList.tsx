"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2, Clock, User, Utensils, Truck, ShoppingBag, RefreshCw } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { usePosStore } from "@/store/usePosStore";

type OrderType = 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';

interface DraftSale {
    id: string;
    ticketNum: string;
    items: any[];
    client: any;
    orderType: OrderType;
    totalBrut: number;
    createdAt: string;
}

interface ServerDraftsListProps {
    onLoad: (sale: any) => void;
}

export default function ServerDraftsList({ onLoad }: ServerDraftsListProps) {
    const [drafts, setDrafts] = useState<DraftSale[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentDraftId } = usePosStore();

    const fetchDrafts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/transactions?status=DRAFT&limit=50");
            const json = await res.json();
            if (json.success) {
                setDrafts(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch drafts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrafts();
    }, [currentDraftId]); // Refetch when current draft changes (saved/validated)

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Supprimer ce brouillon définitivement ?")) return;

        try {
            const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                showToast("Brouillon supprimé", "success");
                fetchDrafts();
            } else {
                showToast(json.error || "Erreur", "error");
            }
        } catch (error) {
            showToast("Erreur de connexion", "error");
        }
    };

    const getOrderTypeIcon = (type: OrderType) => {
        switch (type) {
            case 'DINE_IN': return <Utensils size={14} className="text-blue-600" />;
            case 'DELIVERY': return <Truck size={14} className="text-orange-600" />;
            case 'TAKEAWAY': return <ShoppingBag size={14} className="text-green-600" />;
            default: return <User size={14} />;
        }
    };

    const totalDraftsValue = drafts.reduce((acc, curr) => acc + Number(curr.totalBrut), 0);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Brouillons ({drafts.length})
                </h3>
                <button
                    onClick={fetchDrafts}
                    className={`p-1 text-gray-400 hover:text-blue-600 transition-colors ${loading ? 'animate-spin' : ''}`}
                    title="Actualiser"
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* TOTAL SUMMARY CARD */}
            {drafts.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-sm p-3 mx-1">
                    <p className="text-[10px] text-orange-600 font-bold uppercase mb-1">Total en attente</p>
                    <div className="flex items-end justify-between">
                        <span className="text-orange-900 font-black text-lg">
                            {(totalDraftsValue * 2850).toLocaleString()} FC
                            {/* Assuming fixed rate for display approximation, or fetch real rate */}
                        </span>
                        <span className="text-xs text-orange-500 font-medium">
                            ${totalDraftsValue.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            {drafts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50/50 rounded-sm mx-1 border border-dashed border-gray-200">
                    <FileText className="mx-auto mb-2 opacity-30" size={32} />
                    <p className="text-xs">Aucun brouillon en cours</p>
                </div>
            ) : (
                <div className="space-y-2 overflow-y-auto max-h-[300px] px-1 scrollbar-thin scrollbar-thumb-gray-200">
                    {drafts.map((draft) => {
                        const itemCount = draft.items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
                        const createdDate = new Date(draft.createdAt);

                        return (
                            <div
                                key={draft.id}
                                className={`bg-white border rounded-sm p-3 transition-all cursor-pointer group hover:shadow-md
                                    ${currentDraftId === draft.id ? 'border-green-500 ring-1 ring-green-500 bg-green-50/30' : 'border-gray-200 hover:border-blue-300'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-800 text-sm">
                                                {draft.ticketNum}
                                            </span>
                                            {currentDraftId === draft.id && (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                                    Actif
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-1" title={draft.orderType}>
                                                {getOrderTypeIcon(draft.orderType)}
                                            </div>
                                            <span>•</span>
                                            <span>{itemCount} article{itemCount > 1 ? 's' : ''}</span>
                                        </div>
                                        {draft.client && (
                                            <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                                <User size={12} />
                                                <span>{draft.client.name}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(draft.id, e)}
                                        className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                        <Clock size={10} />
                                        <span>{createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    <div className="text-right">
                                        <span className="block font-bold text-gray-800 text-sm">
                                            {Number(draft.totalBrut).toFixed(2)}$
                                        </span>
                                        {currentDraftId !== draft.id && (
                                            <button
                                                onClick={() => onLoad(draft)}
                                                className="mt-1 text-[10px] font-bold text-blue-600 hover:underline"
                                            >
                                                Charger
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
