"use client";

import { usePosStore } from "@/store/usePosStore";
import { Trash2, Minus, Plus, CreditCard, Save, User, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";

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
        totalCdf,
        clearCart,
        selectedClient,
        orderType,
        deliveryInfo,
        currentDraftId
    } = usePosStore();

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-full h-full bg-white animate-pulse" />;

    return (
        <div className="w-full h-full flex flex-col bg-white border-l border-gray-200 shadow-xl overflow-hidden">
            {/* Top Info Bar - Client & Drafts */}
            <div className="shrink-0 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-3 py-1.5 gap-2">
                <button
                    onClick={onOpenClient}
                    className={cn(
                        "flex-1 flex items-center gap-2 px-2 py-1 rounded-sm border transition-all truncate text-left",
                        selectedClient
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-white border-gray-200 text-gray-500"
                    )}
                >
                    <User size={12} className="shrink-0" />
                    <span className="text-[10px] font-black truncate">
                        {selectedClient ? selectedClient.name : "CLIENT PASSAGET"}
                    </span>
                </button>

                <button
                    onClick={onOpenDrafts}
                    className="p-1 px-2 bg-black text-[#00d3fa] rounded-sm text-[9px] font-black uppercase tracking-tighter shrink-0 hover:bg-gray-800"
                >
                    BROUILLONS
                </button>
            </div>

            {/* Cart Items Area - MUST SCROLL INDEPENDENTLY */}
            <div className="flex-1 overflow-y-auto bg-white p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-200">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-10">
                        <span className="text-[10px] uppercase font-bold tracking-widest">Panier vide</span>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.productId} className="flex flex-col p-2 bg-gray-50/50 border border-gray-100 rounded-sm">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-black text-gray-800 leading-tight line-clamp-1 uppercase">
                                        {item.name}
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-400 mt-0.5">
                                        {item.priceCdf.toLocaleString()} FC x {item.quantity}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-[11px] font-black text-black">
                                        {(item.quantity * item.priceCdf).toLocaleString()} FC
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => updateQuantity(item.productId, -1)}
                                        className="w-5 h-5 flex items-center justify-center bg-white border border-gray-200 rounded-sm text-gray-400 hover:text-red-500"
                                    >
                                        <Minus size={10} />
                                    </button>
                                    <span className="text-[11px] font-black text-gray-700">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.productId, 1)}
                                        className="w-5 h-5 flex items-center justify-center bg-white border border-gray-200 rounded-sm text-gray-400 hover:text-green-600"
                                    >
                                        <Plus size={10} />
                                    </button>
                                </div>

                                <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 rounded uppercase font-bold">
                                    {item.saleUnit}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Layout Footer - Totals & Actions */}
            <div className="shrink-0 bg-white border-t border-gray-200 p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                {deliveryInfo && (
                    <div className="mb-2 p-1.5 bg-orange-50 border border-orange-100 rounded-sm text-[9px] text-orange-800 flex items-center gap-2">
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate font-bold uppercase">{deliveryInfo.address}</span>
                    </div>
                )}

                <div className="flex justify-between items-end mb-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase leading-none">Total</span>
                        {currentDraftId && <span className="text-[8px] text-orange-500 font-bold uppercase mt-1 animate-pulse">Draft Mode</span>}
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-black text-gray-900 leading-none">
                            {totalCdf().toLocaleString()} <span className="text-xs uppercase text-gray-400">FC</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={clearCart}
                        disabled={cart.length === 0}
                        className="p-2 border border-gray-200 rounded-sm flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-30"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        onClick={onOpenPayment}
                        disabled={cart.length === 0}
                        className="bg-black text-[#00d3fa] font-black py-2.5 rounded-sm flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:bg-gray-900 disabled:opacity-50 active:scale-95 transition-all"
                    >
                        <CreditCard size={14} />
                        Encaisser
                    </button>
                </div>
            </div>
        </div>
    );
}
