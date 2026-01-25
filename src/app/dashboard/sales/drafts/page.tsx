"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Search,
    RefreshCw,
    Eye,
    Edit,
    CreditCard,
    Trash2,
    Clock,
    User,
    ArrowRight
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { showToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { usePosStore } from "@/store/usePosStore";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

export default function DraftsPage() {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const router = useRouter();
    const { setCart, setClient, setOrderType, setCurrentDraftId } = usePosStore();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [draftToDelete, setDraftToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDrafts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/transactions?status=DRAFT&limit=100");
            const json = await res.json();
            if (json.success) {
                setDrafts(json.data);
            }
        } catch (error) {
            showToast("Erreur lors du chargement des brouillons", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrafts();
    }, []);

    const handleLoadInPos = (draft: any) => {
        // Map Sale Items to Cart Items
        const newCart = draft.items.map((item: any) => ({
            productId: item.productId,
            name: item.product.name,
            price: Number(item.unitPrice),
            priceCdf: Number(item.unitPriceCdf), // CRITICAL: Use stored CDF, zero recalculation
            spaceName: "Standard",
            quantity: Number(item.quantity),
            saleUnit: item.product.saleUnit
        }));

        setCart(newCart);
        setClient(draft.client || null);
        setOrderType(draft.orderType);
        setCurrentDraftId(draft.id);

        showToast(`Brouillon #${draft.ticketNum} chargé dans le POS`, "info");
        router.push("/dashboard/pos");
    };

    const confirmDelete = (draft: any) => {
        setDraftToDelete(draft);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!draftToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/transactions?id=${draftToDelete.id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Brouillon supprimé", "success");
                fetchDrafts();
                setIsDeleteModalOpen(false);
            } else {
                showToast("Erreur lors de la suppression", "error");
            }
        } catch (error) {
            showToast("Erreur réseau", "error");
        } finally {
            setIsDeleting(false);
            setDraftToDelete(null);
        }
    };

    const filteredDrafts = drafts.filter(d =>
        d.ticketNum.toLowerCase().includes(search.toLowerCase()) ||
        (d.client?.name || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <FileText className="text-orange-500" size={28} />
                            Gestion des Brouillons
                        </h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                            Commandes en attente de paiement
                        </p>
                    </div>
                    <button
                        onClick={fetchDrafts}
                        className="p-2.5 bg-white border border-gray-200 rounded-sm hover:bg-gray-50 transition-all text-gray-600 shadow-sm"
                        title="Actualiser"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nombre de brouillons</p>
                        <p className="text-3xl font-black text-gray-800">{drafts.length}</p>
                    </div>
                    <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm md:col-span-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valeur Totale Estimée</p>
                        <p className="text-3xl font-black text-orange-600">
                            {drafts.reduce((acc, d) => acc + Number(d.totalCdf || 0), 0).toLocaleString()} <span className="text-sm">FC</span>
                        </p>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher par N° ou Client..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:border-orange-500 focus:outline-none font-medium"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1 h-full scrollbar-thin scrollbar-thumb-gray-200">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 sticky top-0 z-10 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Ticket</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Montant</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading && drafts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <RefreshCw size={32} className="animate-spin opacity-20" />
                                                <span className="text-sm font-medium italic">Chargement des brouillons...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredDrafts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <FileText size={48} className="opacity-10" />
                                                <span className="text-sm font-medium italic">Aucun brouillon trouvé</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDrafts.map((draft) => (
                                        <tr key={draft.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800 text-sm">{draft.ticketNum}</span>
                                                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-sm font-bold uppercase w-fit mt-1">BROUILLON</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                    <Clock size={14} className="text-gray-400" />
                                                    {new Date(draft.createdAt).toLocaleString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {draft.client ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black border border-blue-100 uppercase">
                                                            {draft.client.name.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-700">{draft.client.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic font-medium">Client Anonyme</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-gray-800 text-sm">
                                                        {Number(draft.totalCdf).toLocaleString()} FC
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                        ${Number(draft.totalBrut).toFixed(2)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleLoadInPos(draft)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-sm transition-all"
                                                        title="Reprendre la vente"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(draft)}
                                                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-sm transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Supprimer le brouillon ?"
                message="Cette commande n'est pas payée. Sa suppression est irréversible."
                itemName={draftToDelete?.ticketNum}
                isLoading={isDeleting}
            />
        </DashboardLayout>
    );
}
