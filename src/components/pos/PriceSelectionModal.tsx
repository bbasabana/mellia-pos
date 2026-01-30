import { X } from "lucide-react";
import React from "react";

interface PriceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    onSelectPrice: (price: any) => void;
}

export default function PriceSelectionModal({
    isOpen,
    onClose,
    product,
    onSelectPrice,
}: PriceSelectionModalProps) {
    if (!isOpen || !product) return null;

    // Filter relevant prices (e.g. BOTTLE vs MEASURE if needed, or just list all available space prices)
    // Assuming product.prices contains { space: { name: "VIP" }, priceUsd: 2.5, priceCdf: 2500 }
    // We sort by price to show hierarchy if needed

    const prices = product.prices || [];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Choisir le prix</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-4 text-center">
                        <span className="block text-sm text-gray-500 uppercase tracking-widest font-bold">{product.name}</span>
                        <span className="text-xs text-gray-400">{product.saleUnit}</span>
                    </div>

                    <div className="space-y-3">
                        {prices.length > 0 ? (
                            prices.map((price: any) => (
                                <button
                                    key={price.id}
                                    onClick={() => onSelectPrice(price)}
                                    className="w-full group flex flex-col items-center p-4 border-2 border-gray-100 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all"
                                >
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-orange-500">
                                        {price.space?.name || "Standard"}
                                    </span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black text-gray-800 group-hover:text-orange-700">
                                            {Number(price.priceCdf || 0).toLocaleString()} FC
                                        </span>
                                        <span className="text-sm font-medium text-gray-500 group-hover:text-orange-600">
                                            ${Number(price.priceUsd || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                Aucun prix disponible
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-3 bg-gray-50 border-t text-center">
                    <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 font-medium">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
}
