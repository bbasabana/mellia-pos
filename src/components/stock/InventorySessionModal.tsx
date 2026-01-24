"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, AlertOctagon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialSessionId?: string; // If provided, resumes this session
}

export function InventorySessionModal({ isOpen, onClose, initialSessionId }: Props) {
    const [step, setStep] = useState<"START" | "COUNTING" | "REVIEW">("START");
    const [sessionId, setSessionId] = useState("");
    const [items, setItems] = useState<any[]>([]); // Expected snapshot
    const [counts, setCounts] = useState<Record<string, number>>({}); // key: "prodId-loc"
    const [loading, setLoading] = useState(false);

    // Quick fetch for MVP counting
    const [products, setProducts] = useState<any[]>([]);

    const fetchProducts = useCallback(async () => {
        const res = await fetch("/api/stock");
        const data = await res.json();
        if (data.success) setProducts(data.data);
    }, []);

    const fetchSessionDetails = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/${id}`);
            const data = await res.json();
            if (data.success) {
                // Reconstruct counts and products from the stored items
                // items struct: { productId, location, expectedQuantity, actualQuantity, product }

                const sessionItems = data.data.items;
                const reconstCounts: Record<string, number> = {};

                // We need to rebuild the "products" list for the table
                // Since our table maps over `products`, we need to extract unique products from items.
                // However, our table structure expected `products` with `stockItems` (locations).
                // The `items` from session is a flat list of `InventoryItems`.

                // Let's adapt. We will fetch "All Products" to keep the table structure consistent (showing all rows),
                // OR we just show rows that were snapshotted.
                // Better to fetch standard products list for UI consistency, 
                // AND pre-fill values from the session items.

                await fetchProducts(); // Load base structure

                sessionItems.forEach((item: any) => {
                    // Pre-fill counts if they were saved (inventoryItem stores actualQuantity)
                    // Note: actualQuantity is 0 by default. If it was a meaningful 0, it's 0.
                    // If we want to support "Resume", we must trust `actualQuantity`.

                    // Key format: productId-location
                    reconstCounts[`${item.productId}-${item.location}`] = Number(item.actualQuantity);
                });

                setCounts(reconstCounts);
            }
        } catch (e) {
            console.error("Failed to load session", e);
        } finally {
            setLoading(false);
        }
    }, [fetchProducts]);

    // If initialSessionId is provided, we skip start and load data
    useEffect(() => {
        if (isOpen && initialSessionId) {
            setSessionId(initialSessionId);
            setStep("COUNTING");
            fetchSessionDetails(initialSessionId);
        } else if (isOpen && !initialSessionId) {
            setStep("START");
            setSessionId("");
            setCounts({});
        }
    }, [isOpen, initialSessionId, fetchSessionDetails]);

    const startSession = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/inventory", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setSessionId(data.data.id);
                setStep("COUNTING");
                fetchProducts();
            } else {
                alert(data.message || "Erreur");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCountChange = (productId: string, location: string, val: string) => {
        setCounts({
            ...counts,
            [`${productId}-${location}`]: parseFloat(val) || 0
        });
    };

    const submitInventory = async () => {
        if (!confirm("Êtes-vous sûr de vouloir clôturer l'inventaire ? Cette action est irréversible.")) return;

        setLoading(true);
        // Transform counts object to array
        const payload = Object.entries(counts).map(([key, val]) => {
            const [productId, location] = key.split("-");
            return { productId, location, actualQuantity: val };
        });

        const res = await fetch("/api/inventory", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, counts: payload })
        });

        if (res.ok) {
            alert("Inventaire Clôturé ! Les écarts ont été enregistrés.");
            onClose();
        }
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Session d'Inventaire" size="2xl">
            {step === "START" && (
                <div className="text-center p-8 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-[#00d3fa]">
                        <AlertOctagon size={32} />
                    </div>
                    <h3 className="text-lg font-bold">Prêt à commencer l&apos;inventaire ?</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Le système va figer le stock théorique actuel. Vous devrez compter physiquement tous les produits.
                    </p>
                    <button
                        onClick={startSession}
                        className="bg-[#00d3fa] text-white px-6 py-2 rounded font-bold shadow-md hover:opacity-90 mt-4"
                    >
                        Démarrer le Comptage
                    </button>
                </div>
            )}

            {step === "COUNTING" && (
                <div className="space-y-6">
                    <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200">
                        Comptez le stock réel pour chaque emplacement.
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-3 text-left">Produit</th>
                                    <th className="p-3 text-center bg-blue-50 text-blue-600">FRIGO</th>
                                    <th className="p-3 text-center bg-gray-50 text-gray-600">DEPOT</th>
                                    <th className="p-3 text-center bg-yellow-50 text-yellow-600">ECONOMAT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.map(p => (
                                    <tr key={p.id}>
                                        <td className="p-3 font-medium">{p.name}</td>
                                        {/* FRIGO */}
                                        <td className="p-2 text-center bg-blue-50/20">
                                            <input
                                                type="number"
                                                placeholder={p.locations.FRIGO.toString()} // Show theoretical as placeholder hint
                                                className="w-16 p-1 border border-gray-300 rounded text-center"
                                                onChange={(e) => handleCountChange(p.id, "FRIGO", e.target.value)}
                                            />
                                        </td>
                                        {/* DEPOT */}
                                        <td className="p-2 text-center bg-gray-50/20">
                                            <input
                                                type="number"
                                                placeholder={p.locations.DEPOT.toString()}
                                                className="w-16 p-1 border border-gray-300 rounded text-center"
                                                onChange={(e) => handleCountChange(p.id, "DEPOT", e.target.value)}
                                            />
                                        </td>
                                        {/* ECONOMAT */}
                                        <td className="p-2 text-center bg-yellow-50/20">
                                            <input
                                                type="number"
                                                placeholder={p.locations.ECONOMAT.toString()}
                                                className="w-16 p-1 border border-gray-300 rounded text-center"
                                                onChange={(e) => handleCountChange(p.id, "ECONOMAT", e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            onClick={submitInventory}
                            className="bg-[#71de00] text-white px-6 py-2 rounded font-bold shadow-md hover:opacity-90 flex items-center gap-2"
                        >
                            <Check size={18} />
                            Clôturer & Valider
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
