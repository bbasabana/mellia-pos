"use client";

import { usePosStore } from "@/store/usePosStore";
import { Trash2, Minus, Plus, CreditCard, Save, User, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";
import OrderTypeSelector from "@/components/pos/OrderTypeSelector";

export default function PosLightCart({
    onOpenPayment,
    onOpenDrafts,
    onOpenClient
}: {
    onOpenPayment: () => void;
    onOpenDrafts: () => void;
    onOpenClient: () => void;
}) {
    const {
        cart,
        updateQuantity,
        total,
        totalCdf,
        clearCart,
        selectedClient,
        orderType,
        setOrderType,
        deliveryInfo,
        currentDraftId,
        setCurrentDraftId
    } = usePosStore();

    const [mounted, setMounted] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);

    useEffect(() => setMounted(true), []);

    const handleSaveDraft = async () => {
        if (cart.length === 0) return;
        setSavingDraft(true);
        try {
            const payload = {
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    priceCdf: item.priceCdf,
                    saleUnit: item.saleUnit
                })),
                clientId: selectedClient?.id,
                orderType,
                deliveryInfo,
                status: "DRAFT"
            };

            let res;
            if (currentDraftId) {
                res = await fetch(`/api/transactions?id=${currentDraftId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: payload.items.map(i => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            unitPrice: i.price,
                            unitPriceCdf: i.priceCdf
                        })),
                    })
                });
            } else {
                res = await fetch("/api/sales", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            const json = await res.json();
            if (json.success || (res.ok && json.id)) {
                showToast("Brouillon enregistré !", "success");
                clearCart();
            } else {
                throw new Error(json.error || "Erreur inconnue");
            }
        } catch (error: any) {
            showToast(error.message || "Erreur de sauvegarde", "error");
        } finally {
            setSavingDraft(false);
        }
    };

    if (!mounted) return <div className="w-full h-full bg-white animate-pulse" />;

    return (
        <div className="w-full h-full flex flex-col bg-white border-l border-gray-100 shadow-xl overflow-hidden font-sans">
            {/* Top Info Bar - Client & Drafts */}
            <div className="shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-3 py-2 gap-2">
                <button
                    onClick={onOpenClient}
                    className={cn(
                        "flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-sm border transition-all truncate text-left",
                        selectedClient
                            ? "bg-orange-50 border-orange-200 text-orange-700"
                            : "bg-gray-50 border-gray-200 text-gray-500"
                    )}
                >
                    <User size={12} className="shrink-0" />
                    <span className="text-[10px] font-black truncate uppercase">
                        {selectedClient ? selectedClient.name : "CLIENT PASSAGET"}
                    </span>
                </button>

                <button
                    onClick={onOpenDrafts}
                    className="p-1 px-3 bg-gray-900 text-orange-400 rounded-sm text-[9px] font-black uppercase tracking-widest shrink-0 hover:bg-black transition-colors"
                >
                    BROUILLONS
                </button>
            </div>

            {/* Order Type Selector - Parity with normal POS */}
            <div className="px-3 py-2 bg-white border-b border-gray-50">
                <OrderTypeSelector selected={orderType} onChange={setOrderType} />
            </div>

            {/* Cart Items Area - Independent Scroll */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-10">
                        <span className="text-[10px] uppercase font-bold tracking-widest">Panier vide</span>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.productId} className="flex flex-col p-3 bg-white border border-gray-100 rounded-sm shadow-sm">
                            <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-black text-gray-900 leading-tight uppercase mb-1">
                                        {item.name}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1 rounded-sm">
                                            {item.spaceName || 'Standard'}
                                        </div>
                                        <div className="text-[9px] font-black text-orange-600">
                                            {item.priceCdf.toLocaleString()} FC
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-[12px] font-black text-gray-900">
                                        {(item.quantity * item.priceCdf).toLocaleString()}
                                    </div>
                                    <div className="text-[8px] font-bold text-gray-400 uppercase">
                                        $ {(item.quantity * item.price).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => updateQuantity(item.productId, -1, item.spaceName, item.saleUnit)}
                                        className="w-6 h-6 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="text-[11px] font-black text-gray-900 min-w-[12px] text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.productId, 1, item.spaceName, item.saleUnit)}
                                        className="w-6 h-6 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-sm text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>

                                <span className="text-[8px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-sm uppercase font-black tracking-widest">
                                    {item.saleUnit}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Layout Footer - Totals & Actions */}
            <div className="shrink-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                {deliveryInfo && orderType === 'DELIVERY' && (
                    <div className="mb-3 p-2 bg-orange-50 border border-orange-100 rounded-sm text-[9px] text-orange-800 flex items-center gap-2">
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate font-black uppercase tracking-tighter">{deliveryInfo.address}</span>
                    </div>
                )}

                <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total à payer</span>
                        {currentDraftId && <span className="text-[9px] text-orange-500 font-black uppercase mt-1 animate-pulse tracking-tighter">Brouillon en cours</span>}
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-gray-900 leading-none">
                            {totalCdf().toLocaleString()} <span className="text-sm font-bold text-gray-400 uppercase">FC</span>
                        </div>
                        <div className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            $ {total().toFixed(2)} USD
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                    <button
                        onClick={handleSaveDraft}
                        disabled={cart.length === 0 || savingDraft}
                        className="p-3 border-2 border-orange-500 text-orange-600 font-black rounded-sm flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest hover:bg-orange-50 disabled:opacity-30 transition-all active:scale-95"
                    >
                        <Save size={16} />
                        {savingDraft ? "..." : "Brouillon"}
                    </button>
                    <button
                        onClick={onOpenPayment}
                        disabled={cart.length === 0}
                        className="bg-orange-600 text-white font-black py-3 rounded-sm flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:bg-orange-700 disabled:opacity-50 active:scale-95 transition-all"
                    >
                        <CreditCard size={18} />
                        Payer
                    </button>
                </div>

                {cart.length > 0 && (
                    <button
                        onClick={clearCart}
                        className="w-full mt-2 py-1.5 text-[9px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={12} />
                        Vider le panier
                    </button>
                )}
            </div>
        </div>
    );
}
