"use client";

import { useState, useEffect } from "react";
import { Save, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface InitialStockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InitialStockModal({ isOpen, onClose }: InitialStockModalProps) {
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [quantity, setQuantity] = useState("");
    const [location, setLocation] = useState("DEPOT");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) fetchProducts();
    }, [isOpen]);

    const fetchProducts = async () => {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) setProducts(data.data);
    };

    const handleSubmit = async () => {
        if (!selectedProduct || !quantity) return;
        setLoading(true);

        try {
            const res = await fetch("/api/stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct,
                    type: "ADJUSTMENT",
                    quantity: parseFloat(quantity),
                    toLocation: location, // Adding to this location
                    reason: "Initial Stock / Ajustement Manuel"
                })
            });

            if (res.ok) {
                alert("Stock initialisé avec succès !");
                onClose();
                // Reset
                setQuantity("");
                setSelectedProduct("");
            } else {
                alert("Erreur lors de l'initialisation.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Initialisation Stock (Sans Achat)">
            <div className="space-y-4">
                <div className="bg-orange-50 p-3 rounded text-orange-800 text-sm flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <p>
                        Utilisez ceci uniquement pour **corriger** le stock ou entrer le **stock de départ** (inventaire existant).
                        Cela ne crée PAS d&apos;écriture comptable (pas de sortie d&apos;argent).
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Produit</label>
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                    >
                        <option value="">-- Choisir --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Emplacement</label>
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50"
                        >
                            <option value="DEPOT">Dépôt</option>
                            <option value="FRIGO">Frigo</option>
                            <option value="ECONOMAT">Economat</option>
                            <option value="CASIER">Casier</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantité Réelle</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm font-bold"
                            placeholder="Ex: 50"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedProduct}
                        className="px-6 py-2 bg-[#00d3fa] text-white font-bold rounded hover:opacity-90 transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        Enregistrer Stock
                    </button>
                </div>
            </div>
        </Modal>
    );
}
