"use client";

import { usePosStore } from "@/store/usePosStore";
import { useState } from "react";
import { X, DollarSign, Award, Loader2 } from "lucide-react";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
    const { total, totalCdf, cart, selectedClient, clearCart } = usePosStore();
    const [usePoints, setUsePoints] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
        setLoading(true);
        setError("");

        try {
            const payload = {
                items: cart.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    price: i.price,
                    priceCdf: i.priceCdf,
                    saleUnit: i.saleUnit
                })),
                clientId: selectedClient?.id,
                paymentMethod: usePoints && amountToPayUsd === 0 ? "LOYALTY_POINTS" : (usePoints ? "SPLIT" : "CASH"),
                totalReceived: amountToPayUsd
            };

            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Transaction failed");
            }

            const data = await res.json();
            onSuccess();
            clearCart();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Paiement</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center">
                        <p className="text-gray-500 font-medium uppercase tracking-wider text-sm mb-2">Total à Payer</p>
                        <div className="text-5xl font-extrabold text-blue-600 tracking-tight">
                            {amountToPayCdf.toLocaleString()} FC
                        </div>
                        <div className="text-lg text-gray-500 mt-1">
                            ${amountToPayUsd.toFixed(2)}
                        </div>
                    </div>

                    {selectedClient && maxDiscountUsd > 0 && (
                        <div
                            onClick={() => setUsePoints(!usePoints)}
                            className={`cursor-pointer border-2 rounded-xl p-4 flex items-center justify-between transition-all ${usePoints ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${usePoints ? "bg-green-200 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Utiliser mes points</h4>
                                    <p className="text-xs text-gray-500">
                                        Disponible: {selectedClient.points} pts ({maxDiscountCdf.toLocaleString()} FC)
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                {usePoints ? (
                                    <div>
                                        <div className="text-green-700 font-bold">-{possibleDiscountCdf.toLocaleString()} FC</div>
                                        <div className="text-xs text-green-600">-${possibleDiscountUsd.toFixed(2)}</div>
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="py-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handlePay}
                            disabled={loading}
                            className="py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <DollarSign />}
                            Encaisser {amountToPayCdf.toLocaleString()} FC
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
