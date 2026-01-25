"use client";

import { usePosStore } from "@/store/usePosStore";
import { useState } from "react";
import { X, DollarSign, Award, Loader2, Calendar, Smartphone, Banknote, List } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (sale?: any) => void;
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
    const { total, totalCdf, cart, selectedClient, clearCart, currentDraftId } = usePosStore();
    const { data: session } = useSession();
    const [usePoints, setUsePoints] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [customDate, setCustomDate] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY" | "CARD" | "">("");
    const [paymentReference, setPaymentReference] = useState("");

    const formatUsd = (val: number) => {
        const rounded = Math.round(val * 100) / 100;
        return rounded.toString();
    };

    const isAdmin = session?.user?.role === "ADMIN";

    const totalAmountUsd = total();
    const totalAmountCdf = totalCdf();

    // Approximate exchange rate from cart items (if available)
    const exchangeRate = totalAmountUsd > 0 ? totalAmountCdf / totalAmountUsd : 2850;

    // 10 points = 10 USD = ~28,500 CDF (depending on exchange rate)
    const clientPointsBlock = selectedClient ? Math.floor(selectedClient.points / 10) : 0;
    const maxDiscountUsd = clientPointsBlock * 10;
    const maxDiscountCdf = maxDiscountUsd * exchangeRate;

    // Discount cannot exceed total
    const possibleDiscountUsd = Math.min(maxDiscountUsd, totalAmountUsd);
    const possibleDiscountCdf = Math.min(maxDiscountCdf, totalAmountCdf);

    const amountToPayUsd = usePoints ? Math.max(0, totalAmountUsd - possibleDiscountUsd) : totalAmountUsd;
    const amountToPayCdf = usePoints ? Math.max(0, totalAmountCdf - possibleDiscountCdf) : totalAmountCdf;

    const handlePay = async () => {
        if (!paymentMethod) {
            setError("Veuillez choisir un moyen de paiement");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const payload = {
                items: cart.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    price: i.price,
                    priceCdf: i.priceCdf,
                    saleUnit: i.saleUnit,
                    // Pass unitPrice for PUT consistency
                    unitPrice: i.price
                })),
                clientId: selectedClient?.id,
                paymentMethod: paymentMethod,
                paymentReference: paymentReference,
                totalReceived: amountToPayUsd,
                status: "COMPLETED",
                ...(customDate && isAdmin && { createdAt: new Date(customDate).toISOString() })
            };

            let res;
            if (currentDraftId) {
                // UPDATE/VALIDATE DRAFT
                res = await fetch(`/api/transactions?id=${currentDraftId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } else {
                // NEW SALE
                res = await fetch("/api/sales", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Transaction failed");
            }

            const data = await res.json();
            showToast("Paiement effectué avec succès", "success");
            onSuccess(data.data);
            clearCart();
            onClose();
        } catch (e: any) {
            setError(e.message);
            showToast(e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Paiement</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center">
                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">Total à Payer</p>
                        <div className="text-5xl font-black text-gray-900 tracking-tighter">
                            {Math.round(amountToPayCdf).toLocaleString()} <span className="text-2xl text-gray-400">FC</span>
                        </div>
                        <div className="text-lg font-bold text-[#00d3fa] mt-1">
                            ${formatUsd(amountToPayUsd)}
                        </div>
                    </div>

                    {/* Item Summary */}
                    <div className="bg-gray-50 rounded-sm p-4 border border-gray-100">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <List size={12} /> Récapitulatif
                        </h4>
                        <div className="space-y-2">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs font-bold items-center border-b border-gray-100/50 pb-2 last:border-0 last:pb-0">
                                    <span className="text-gray-600">{item.quantity}x {item.name}</span>
                                    <span className="text-gray-900">{(item.quantity * item.priceCdf).toLocaleString()} FC</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1">Moyen de paiement (Obligatoire)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("CASH")}
                                className={cn(
                                    "p-4 rounded-sm border transition-all flex flex-col items-center gap-2",
                                    paymentMethod === 'CASH'
                                        ? "bg-black text-white border-black shadow-lg"
                                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                                )}
                            >
                                <Banknote size={20} />
                                <span className="font-bold text-xs uppercase tracking-tight">Espèces (Cash)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("MOBILE_MONEY")}
                                className={cn(
                                    "p-4 rounded-sm border transition-all flex flex-col items-center gap-2",
                                    paymentMethod === 'MOBILE_MONEY'
                                        ? "bg-black text-white border-black shadow-lg"
                                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                                )}
                            >
                                <Smartphone size={20} />
                                <span className="font-bold text-xs uppercase tracking-tight">Mobile Money</span>
                            </button>
                        </div>

                        {paymentMethod === 'MOBILE_MONEY' && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <input
                                    type="text"
                                    placeholder="Référence (Ex: MP123...)"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-3 text-sm outline-none focus:border-[#00d3fa] transition-all font-bold placeholder:font-medium"
                                />
                            </div>
                        )}
                    </div>

                    {selectedClient && maxDiscountUsd > 0 && (
                        <button
                            type="button"
                            onClick={() => setUsePoints(!usePoints)}
                            className={cn(
                                "w-full border rounded-sm p-4 flex items-center justify-between transition-all group",
                                usePoints
                                    ? "bg-black text-white border-black"
                                    : "bg-white border-gray-200 hover:border-[#00d3fa]"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                    usePoints ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                                )}>
                                    <Award size={20} />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-sm uppercase tracking-tight">Utiliser mes points</h4>
                                    <p className={cn("text-[10px] uppercase font-bold tracking-widest", usePoints ? "text-gray-400" : "text-gray-400")}>
                                        Disponible: {selectedClient.points} pts ({maxDiscountCdf.toLocaleString()} FC)
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                {usePoints ? (
                                    <div className="text-xs font-black">
                                        -{Math.round(possibleDiscountCdf).toLocaleString()} FC
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-sm border-2 border-gray-200 group-hover:border-[#00d3fa]"></div>
                                )}
                            </div>
                        </button>
                    )}

                    {isAdmin && (
                        <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                            <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-3">
                                <Calendar size={14} />
                                Date de la vente (optionnel)
                            </label>
                            <input
                                type="datetime-local"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all font-bold"
                            />
                            <p className="text-[10px] text-gray-400 font-medium mt-2 italic">
                                Laissez vide pour utiliser la date actuelle
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-sm text-center text-xs font-bold border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-4 bg-gray-100 text-gray-600 rounded-sm font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-[0.98]"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={loading}
                            className="py-4 bg-black text-white rounded-sm font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Encaisser {Math.round(amountToPayCdf).toLocaleString()} FC</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
