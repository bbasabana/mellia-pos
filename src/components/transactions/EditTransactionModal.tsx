"use client";

import { useEffect, useState } from "react";
import { X, Save, Trash2, Plus, Minus, Loader2, AlertTriangle } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    onSuccess: () => void;
    exchangeRate: number;
}

export default function EditTransactionModal({
    isOpen,
    onClose,
    transaction,
    onSuccess,
    exchangeRate
}: EditTransactionModalProps) {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen && transaction) {
            setIsVisible(true);
            // Deep copy items to avoid mutating original state before save
            setItems(transaction.items.map((item: any) => ({
                ...item,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                currentStock: 0 // Will need to fetch real-time stock if increasing quantity
            })));
        } else {
            setIsVisible(false);
        }
    }, [isOpen, transaction]);

    const handleQuantityChange = (index: number, change: number) => {
        const newItems = [...items];
        const item = newItems[index];
        const newQuantity = item.quantity + change;

        if (newQuantity <= 0) {
            // Confirm removal?
            if (confirm("Supprimer ce produit de la vente ?")) {
                newItems.splice(index, 1);
            }
        } else {
            // Logic to check stock if increasing? 
            // For now, we allow it but backend should validate
            item.quantity = newQuantity;
        }
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/transactions?id=${transaction.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        // We need original quantity to calculate stock difference
                        originalQuantity: transaction.items.find((i: any) => i.productId === item.productId)?.quantity || 0
                    }))
                })
            });

            const json = await res.json();
            if (json.success) {
                showToast("Transaction modifiée avec succès", "success");
                onSuccess();
                onClose();
            } else {
                showToast(json.error || "Erreur lors de la modification", "error");
            }
        } catch (e) {
            showToast("Erreur serveur", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Modifier la Vente</h3>
                        <div className="text-xs text-gray-500 font-medium">Ticket #{transaction?.ticketNum}</div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Warning Banner */}
                <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex items-start gap-3">
                    <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-orange-800 leading-relaxed">
                        Attention : Modifier les quantités ajustera automatiquement le stock.
                        Si vous augmentez une quantité, assurez-vous que le produit est disponible.
                    </p>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 italic bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            Tous les articles ont été supprimés. Cette vente sera annulée si vous enregistrez.
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div key={item.productId} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-[#00d3fa] transition-colors group">
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800 text-sm">{item.product?.name || item.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        PU: {Number(item.unitPrice * exchangeRate).toLocaleString()} FC
                                        <span className="text-gray-300 mx-2">|</span>
                                        ${Number(item.unitPrice).toFixed(2)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 text-sm">
                                            {(item.quantity * item.unitPrice * exchangeRate).toLocaleString()} FC
                                        </div>
                                    </div>

                                    <div className="flex items-center bg-gray-50 rounded-md border border-gray-200 h-8">
                                        <button
                                            onClick={() => handleQuantityChange(index, -1)}
                                            className="w-8 h-full flex items-center justify-center hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors border-r border-gray-200"
                                        >
                                            {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                                        </button>
                                        <div className="w-10 text-center font-bold text-sm text-gray-800">
                                            {item.quantity}
                                        </div>
                                        <button
                                            onClick={() => handleQuantityChange(index, 1)}
                                            className="w-8 h-full flex items-center justify-center hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors border-l border-gray-200"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-gray-500 uppercase">Nouveau Total</span>
                        <div className="text-right">
                            <div className="text-xl font-black text-gray-900">
                                {(calculateTotal() * exchangeRate).toLocaleString()} FC
                            </div>
                            <div className="text-xs font-bold text-gray-400">
                                ${calculateTotal().toFixed(2)} USD
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading || items.length === 0}
                            className="flex-1 py-3 bg-black text-white font-bold rounded-lg shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Enregistrer Modifications
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
