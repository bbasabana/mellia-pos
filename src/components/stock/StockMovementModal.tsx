"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { ArrowRightLeft, AlertTriangle, PlusCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCATIONS = ["DEPOT", "FRIGO", "CASIER", "ECONOMAT", "CUISINE"];

type MovementType = "TRANSFER" | "ADJUSTMENT" | "LOSS";

export function StockMovementModal({ isOpen, onClose, initialProductId, initialType }: { isOpen: boolean; onClose: () => void; initialProductId?: string; initialType?: MovementType }) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    // Form State
    const [type, setType] = useState<MovementType>("TRANSFER");
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [fromLocation, setFromLocation] = useState("DEPOT");
    const [toLocation, setToLocation] = useState("FRIGO");
    const [reason, setReason] = useState("");

    // For Adjustment (Stock Initial)
    const [adjType, setAdjType] = useState<"ADD" | "REMOVE">("ADD");

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            if (initialProductId) setProductId(initialProductId);
            if (initialType) setType(initialType);
        }
    }, [isOpen, initialProductId, initialType]);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            if (data.success) {
                // Filter active products
                setProducts(data.data.filter((p: any) => p.active));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async () => {
        if (!productId || !quantity) return;
        setLoading(true);

        // Prepare Payload based on Type
        let payload: any = {
            productId,
            quantity: parseFloat(quantity),
            reason: reason || (type === "TRANSFER" ? "Transfert interne" : "Ajustement Stock"),
            type: type
        };

        if (type === "TRANSFER") {
            payload.fromLocation = fromLocation;
            payload.toLocation = toLocation;
        } else if (type === "ADJUSTMENT") {
            // STOCK INITIAL / AJUSTEMENT
            // "ADD" -> No From, To = Location (Increment)
            // "REMOVE" -> From = Location, No To (Decrement, treated mostly as LOSS but kept as ADJ type for logic if backend allows)
            // Actually backend POST logic:
            // If fromLocation provided -> Decrement
            // If toLocation provided -> Increment

            if (adjType === "ADD") {
                payload.toLocation = toLocation; // Will Increment
                payload.type = "ADJUSTMENT";
            } else {
                payload.fromLocation = fromLocation; // Will Decrement
                payload.type = "ADJUSTMENT"; // Or LOSS? Use ADJUSTMENT for corrections.
            }
        } else if (type === "LOSS") {
            payload.fromLocation = fromLocation;
            payload.type = "LOSS";
        }

        try {
            const res = await fetch("/api/stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                alert("Mouvement enregistré !");
                onClose();
                // Reset form
                setQuantity("");
                setReason("");
            } else {
                alert("Erreur: " + data.error);
            }
        } catch (err) {
            alert("Erreur serveur");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mouvement de Stock" size="lg">
            <div className="space-y-6">

                {/* 1. Type Selection */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setType("TRANSFER")}
                        className={cn("flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2",
                            type === "TRANSFER" ? "bg-white text-blue-500 shadow-sm" : "text-gray-500")}
                    >
                        <ArrowRightLeft size={16} /> Transfert
                    </button>
                    <button
                        onClick={() => setType("ADJUSTMENT")}
                        className={cn("flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2",
                            type === "ADJUSTMENT" ? "bg-white text-green-500 shadow-sm" : "text-gray-500")}
                    >
                        <PlusCircle size={16} /> Ajustement / Stock Initial
                    </button>
                    <button
                        onClick={() => setType("LOSS")}
                        className={cn("flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2",
                            type === "LOSS" ? "bg-white text-red-500 shadow-sm" : "text-gray-500")}
                    >
                        <AlertTriangle size={16} /> Perte / Casse
                    </button>
                </div>

                {/* 2. Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Product */}
                    <div className="md:col-span-2">
                        <label className="label">Produit Concerne</label>
                        <select
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="input"
                        >
                            <option value="">-- Choisir un produit --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.saleUnit})</option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="label">Quantité</label>
                        <input
                            type="number"
                            step="0.01"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="input font-bold"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Locations Logic */}
                    {type === "TRANSFER" && (
                        <>
                            <div>
                                <label className="label">De (Source)</label>
                                <select value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} className="input">
                                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Vers (Destination)</label>
                                <select value={toLocation} onChange={(e) => setToLocation(e.target.value)} className="input">
                                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    {type === "ADJUSTMENT" && (
                        <div className="md:col-span-1">
                            <label className="label">Type d&apos;ajustement</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setAdjType("ADD")}
                                    className={cn("flex-1 py-2 text-xs font-bold border rounded", adjType === "ADD" ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-50")}
                                >
                                    + AJOUTER (Stock Initial)
                                </button>
                                <button
                                    onClick={() => setAdjType("REMOVE")}
                                    className={cn("flex-1 py-2 text-xs font-bold border rounded", adjType === "REMOVE" ? "bg-red-50 border-red-200 text-red-600" : "bg-gray-50")}
                                >
                                    - RETIRER
                                </button>
                            </div>
                        </div>
                    )}

                    {type === "ADJUSTMENT" && adjType === "ADD" && (
                        <div>
                            <label className="label">Ajouter dans (Lieu)</label>
                            <select value={toLocation} onChange={(e) => setToLocation(e.target.value)} className="input">
                                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    )}

                    {type === "ADJUSTMENT" && adjType === "REMOVE" && (
                        <div>
                            <label className="label">Retirer de (Lieu)</label>
                            <select value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} className="input">
                                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    )}

                    {type === "LOSS" && (
                        <div>
                            <label className="label">Perdu depuis (Lieu)</label>
                            <select value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} className="input">
                                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <label className="label">Motif / Commentaire</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex: inventaire de départ, bouteille cassée..."
                            className="input"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !productId || !quantity}
                        className="px-6 py-2 bg-[#00d3fa] text-white font-bold rounded shadow hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? "Traitement..." : "Valider Mouvement"}
                    </button>
                </div>

                <style jsx>{`
                    .label { @apply block text-[10px] font-bold text-gray-400 uppercase mb-1; }
                    .input { @apply w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#00d3fa]; }
                `}</style>
            </div>
        </Modal>
    );
}
