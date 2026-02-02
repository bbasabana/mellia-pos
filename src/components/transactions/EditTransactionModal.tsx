"use client";

import { useEffect, useState } from "react";
import { X, Save, Trash2, Plus, Minus, Loader2, AlertTriangle, Search, Calculator } from "lucide-react";
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

    // Product search state
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        if (isOpen && transaction) {
            setIsVisible(true);
            setItems(transaction.items.map((item: any) => ({
                ...item,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                unitPriceCdf: Number(item.unitPriceCdf || Math.round(Number(item.unitPrice) * exchangeRate)),
            })));
        } else {
            setIsVisible(false);
            setSearch("");
            setSearchResults([]);
        }
    }, [isOpen, transaction]);

    useEffect(() => {
        if (!search || search.length < 2) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setLoadingProducts(true);
            try {
                const res = await fetch(`/api/products?query=${search}&active=true&vendable=true`);
                const json = await res.json();
                if (json.success) {
                    setSearchResults(json.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingProducts(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const addProduct = (product: any) => {
        const existing = items.find(i => i.productId === product.id);
        if (existing) {
            handleQuantityChange(items.indexOf(existing), 1);
        } else {
            // Get default price (first one found)
            const price = product.prices?.[0];
            const upUsd = Number(price?.priceUsd || 0);
            const upCdf = Number(price?.priceCdf || Math.round(upUsd * exchangeRate));

            setItems([...items, {
                productId: product.id,
                product: { name: product.name },
                quantity: 1,
                unitPrice: upUsd,
                unitPriceCdf: upCdf,
            }]);
        }
        setSearch("");
        setSearchResults([]);
    };

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

    const handlePriceChange = (index: number, newPrice: string) => {
        const val = parseFloat(newPrice);
        if (isNaN(val)) return;
        const newItems = [...items];
        newItems[index].unitPrice = val;
        // Also update CDF price as an approximation, but user can still override
        newItems[index].unitPriceCdf = Math.round(val * exchangeRate);
        setItems(newItems);
    };

    const handlePriceCdfChange = (index: number, newPrice: string) => {
        const val = parseFloat(newPrice);
        if (isNaN(val)) return;
        const newItems = [...items];
        newItems[index].unitPriceCdf = val;
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const calculateTotalCdf = () => {
        return items.reduce((sum, item) => sum + (item.quantity * (item.unitPriceCdf || 0)), 0);
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
                        unitPriceCdf: item.unitPriceCdf,
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

                {/* Product search */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00d3fa] transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Ajouter un produit (nom du produit...)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-sm text-sm outline-none focus:border-[#00d3fa] transition-all"
                        />
                        {loadingProducts && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00d3fa] animate-spin" size={14} />}

                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-b-sm mt-1 border border-gray-200 z-[60] max-h-60 overflow-y-auto">
                                {searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addProduct(p)}
                                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex justify-between items-center group/item"
                                    >
                                        <div>
                                            <div className="font-bold text-sm text-gray-800 group-hover/item:text-[#00d3fa] transition-colors">{p.name}</div>
                                            <div className="text-[10px] text-gray-400 uppercase font-black">{p.type}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-xs text-gray-900">
                                                {Number(p.prices?.[0]?.priceCdf || 0).toLocaleString()} FC
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold">${Number(p.prices?.[0]?.priceUsd || 0).toFixed(2)}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 italic bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            Tous les articles ont été supprimés. Cette vente sera annulée si vous enregistrez.
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div key={item.productId || index} className="flex flex-col gap-3 p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-[#00d3fa] transition-colors group">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800 text-sm">{item.product?.name || item.name}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                            Code: {item.productId?.slice(-6) || "NOUVEAU"}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-gray-900 text-base">
                                            {(item.quantity * item.unitPriceCdf).toLocaleString()} FC
                                        </div>
                                        <div className="text-xs text-gray-400 font-bold">
                                            ${(item.quantity * item.unitPrice).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase">Prix $</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handlePriceChange(index, e.target.value)}
                                                    className="w-20 pl-4 pr-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-bold outline-none focus:border-[#00d3fa]"
                                                />
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">$</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase">Prix FC</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={item.unitPriceCdf}
                                                    onChange={(e) => handlePriceCdfChange(index, e.target.value)}
                                                    className="w-24 pl-2 pr-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-bold outline-none focus:border-[#00d3fa]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-gray-50 rounded-md border border-gray-200 h-8">
                                        <button
                                            onClick={() => handleQuantityChange(index, -1)}
                                            className="w-8 h-full flex items-center justify-center hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors border-r border-gray-200"
                                        >
                                            {item.quantity <= 1 ? <Trash2 size={14} /> : <Minus size={14} />}
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
                                {calculateTotalCdf().toLocaleString()} FC
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
