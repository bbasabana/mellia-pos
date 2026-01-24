"use client";

import { History } from "lucide-react";

import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, AlertTriangle, Trash2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";

export function MovementHistory() {
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/stock/movements?limit=50");
            const data = await res.json();
            if (data.success) {
                setMovements(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovements();
    }, []);

    const handleDelete = async (id: string, type: string, qty: number, product: string) => {
        if (!confirm(`Attention: Voulez-vous vraiment annuler ce mouvement ?\n\nCela va INVERSER l'opération sur le stock.\n\nProduit: ${product}\nQté: ${qty}`)) {
            return;
        }

        try {
            const res = await fetch(`/api/stock/movements/${id}`, { method: "DELETE" });
            const data = await res.json();

            if (data.success) {
                showToast("Mouvement annulé et stock rétabli", "success");
                fetchMovements();
            } else {
                showToast(`Erreur: ${data.error}`, "error");
            }
        } catch (err) {
            showToast("Erreur serveur", "error");
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "IN": return { label: "Entrée (Achat)", color: "text-green-600 bg-green-50", icon: <ArrowDownLeft size={14} /> };
            case "OUT": return { label: "Sortie (Vente)", color: "text-blue-600 bg-blue-50", icon: <ArrowUpRight size={14} /> };
            case "TRANSFER": return { label: "Transfert", color: "text-orange-600 bg-orange-50", icon: <RefreshCcw size={14} /> };
            case "LOSS": return { label: "Perte / Casse", color: "text-red-600 bg-red-50", icon: <AlertTriangle size={14} /> };
            case "ADJUSTMENT": return { label: "Ajustement", color: "text-purple-600 bg-purple-50", icon: <RefreshCcw size={14} /> };
            default: return { label: type, color: "text-gray-600 bg-gray-50", icon: <History size={14} /> };
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-sm">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <History size={16} />
                    Derniers Mouvements
                </h3>
                <button onClick={fetchMovements} className="text-xs text-blue-500 hover:underline">Accualiser</button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-400">Chargement...</div>
            ) : movements.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                    <div className="bg-gray-50 p-4 rounded-full mb-3">
                        <History size={24} className="text-gray-300" />
                    </div>
                    <p>Aucun mouvement enregistré.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Produit</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Quantité</th>
                                <th className="px-4 py-3">Source &rarr; Dest.</th>
                                <th className="px-4 py-3">Raison / User</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {movements.map((m) => {
                                const typeInfo = getTypeLabel(m.type);
                                return (
                                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                            {formatDate(new Date(m.createdAt))}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {m.product.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn("flex items-center gap-1 w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase", typeInfo.color)}>
                                                {typeInfo.icon}
                                                {typeInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-gray-700">
                                            {Number(m.quantity)} <span className="text-xs font-normal text-gray-400">{m.product.saleUnit}s</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {m.fromLocation || "-"} &rarr; {m.toLocation || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            <div className="truncate max-w-[150px]" title={m.reason}>{m.reason || "-"}</div>
                                            <div className="text-[10px] text-gray-400">{m.user?.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(m.id, m.type, Number(m.quantity), m.product.name)}
                                                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                                                title="Annuler ce mouvement"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
