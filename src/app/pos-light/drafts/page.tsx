"use client";

import { useEffect, useState } from "react";
import LightLayout from "@/components/layout/LightLayout";
import { FileText, Clock, User, Trash2, ArrowRightCircle, RefreshCw, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toast";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

export default function DraftsLightPage() {
    const router = useRouter();
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [draftToDelete, setDraftToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDrafts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/transactions?status=DRAFT&limit=50");
            const json = await res.json();
            if (json.success) setDrafts(json.data);
        } catch (e) {
            console.error(e);
            showToast("Erreur lors du chargement des brouillons", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrafts();
    }, []);

    const handleDelete = async () => {
        if (!draftToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/transactions?id=${draftToDelete.id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                showToast("Brouillon supprimé", "success");
                fetchDrafts();
                setIsDeleteModalOpen(false);
                setDraftToDelete(null);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <LightLayout>
            <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
                {/* Header Actions */}
                <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 flex items-center gap-2">
                            <FileText size={18} className="text-orange-600" />
                            Brouillons en attente
                        </h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                            {drafts.length} Brouillons sauvegardés
                        </p>
                    </div>
                    <button onClick={fetchDrafts} className="p-2 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 rounded-sm transition-all border border-gray-100">
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Drafts List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading && drafts.length === 0 ? (
                        <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse uppercase tracking-widest">Chargement...</div>
                    ) : drafts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                            <FileText size={80} strokeWidth={1} className="mb-4 opacity-10" />
                            <p className="font-black uppercase tracking-widest">Aucun brouillon</p>
                            <button onClick={() => router.push('/pos-light')} className="mt-4 text-orange-600 font-black text-[10px] uppercase tracking-widest hover:underline">Retour au POS</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {drafts.map((draft) => (
                                <div
                                    key={draft.id}
                                    className="bg-white border-2 border-transparent hover:border-orange-500 rounded-sm p-4 shadow-sm flex flex-col gap-4 transition-all group relative overflow-hidden active:bg-orange-50"
                                >
                                    {/* Action Header */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-xl font-black text-gray-900 leading-none mb-1">
                                                #{draft.ticketNum}
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded-sm inline-block">
                                                {draft.orderType}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDraftToDelete(draft); setIsDeleteModalOpen(true); }}
                                            className="p-1 px-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Info Body */}
                                    <div className="space-y-2 py-3 border-t border-b border-gray-50 flex-1">
                                        {draft.client ? (
                                            <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-tighter">
                                                <User size={14} className="text-orange-600" />
                                                {draft.client.name}
                                            </div>
                                        ) : (
                                            <div className="text-xs font-bold text-gray-400 uppercase italic opacity-50">Aucun client</div>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                            <Clock size={12} />
                                            {new Date(draft.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="mt-1 text-xs font-bold text-gray-500">
                                            {draft.items?.length || 0} articles
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex items-center justify-between mt-auto pt-2">
                                        <div className="text-lg font-black text-gray-900 leading-none">
                                            {(draft.totalCdf || 0).toLocaleString()} <span className="text-xs text-gray-400 font-bold">FC</span>
                                        </div>
                                        <button
                                            onClick={() => router.push('/pos-light')}
                                            className="flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all group-hover:bg-orange-600 group-hover:scale-105"
                                        >
                                            Reprendre
                                            <ArrowRightCircle size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <ConfirmDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    title="Supprimer ce brouillon ?"
                    message="Cette action supprimera définitivement le brouillon en cours."
                    itemName={draftToDelete ? `#${draftToDelete.ticketNum}` : ""}
                    isLoading={isDeleting}
                />
            </div>
        </LightLayout>
    );
}
