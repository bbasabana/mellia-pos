"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, DollarSign, Calculator, User, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_RATE = 2850; // Taux par défaut (à récupérer du backend idéalement)

export function InvestmentForm({ onSuccess }: { onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    // Form State
    const [source, setSource] = useState("OWNER_CAPITAL");
    const [buyerName, setBuyerName] = useState("");
    const [description, setDescription] = useState("");
    const [currency, setCurrency] = useState<"USD" | "CDF">("CDF");
    const [exchangeRate, setExchangeRate] = useState(DEFAULT_RATE.toString());

    const [items, setItems] = useState<any[]>([]);

    // Line Item State
    const [selectedProduct, setSelectedProduct] = useState("");
    const [qty, setQty] = useState("");
    const [unitPrice, setUnitPrice] = useState(""); // In selected currency
    const [location, setLocation] = useState("DEPOT");
    // New State for Unit Conversion
    const [buyByPacking, setBuyByPacking] = useState(false); // true = Buying by Carton/Pack, false = Buying by Unit

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            if (data.success) setProducts(data.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    const addItem = () => {
        if (!selectedProduct || !qty || !unitPrice) return;

        const product = products.find(p => p.id === selectedProduct);
        const rate = parseFloat(exchangeRate) || DEFAULT_RATE;
        // User input price is for the UNIT they selected (Carton OR Bottle)
        const inputPriceVal = parseFloat(unitPrice);
        const inputQtyVal = parseFloat(qty);

        let quantityToAdd = inputQtyVal;
        let realUnitCost = inputPriceVal; // Temporary placeholder

        // Conversion Logic
        if (buyByPacking && product.purchaseUnit && product.packingQuantity > 1) {
            // User bought 2 Cartons @ 50$ each
            // Stock needs: 2 * 24 = 48 Bottles
            quantityToAdd = inputQtyVal * product.packingQuantity;

            // Unit cost (per bottle) = Price per carton / Units per carton
            realUnitCost = inputPriceVal / product.packingQuantity;
        } else {
            // User bought units directly
            realUnitCost = inputPriceVal;
        }

        // Always store cost in USD for the backend (per STOCK UNIT)
        const costUsd = currency === "USD" ? realUnitCost : (realUnitCost / rate);

        const newItem = {
            productId: selectedProduct,
            productName: product?.name,

            // Display Data
            displayQty: inputQtyVal,
            displayUnit: buyByPacking && product.purchaseUnit ? product.purchaseUnit : product.saleUnit,
            displayPrice: inputPriceVal,

            // Backend Data
            quantity: quantityToAdd, // Total bottles/plates
            inputPrice: inputPriceVal, // Kept for total calculation display
            inputCurrency: currency,
            costUsd: costUsd,
            location: location,
            isVendable: product?.type !== "NON_VENDABLE"
        };

        setItems([...items, newItem]);
        setQty("");
        setUnitPrice("");

        // Reset toggle preference? No, keep it sticky for speed.
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (items.length === 0) return;
        setLoading(true);

        const totalUsd = items.reduce((acc, item) => acc + (item.costUsd * item.quantity), 0);
        const totalCdf = currency === "CDF" ? items.reduce((acc, item) => acc + (item.inputPrice * item.quantity), 0) : null;

        // Append Buyer Name to description if present
        const finalDesc = buyerName ? `[Acheteur: ${buyerName}] ${description}` : description;

        try {
            const res = await fetch("/api/investments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    totalAmount: totalUsd, // USD is system base
                    totalAmountCdf: totalCdf,
                    exchangeRate: parseFloat(exchangeRate),
                    source,
                    description: finalDesc,
                    items: items.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        cost: i.costUsd, // Backend expects USD unit cost
                        location: i.location
                    }))
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Achat enregistré ! Stock mis à jour.");
                setItems([]);
                if (onSuccess) onSuccess();
            } else {
                alert("Erreur: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    // Calculate Totals for UI
    const totalDisplay = items.reduce((acc, item) => acc + (item.displayPrice * item.displayQty), 0);
    const convertedTotal = currency === "CDF"
        ? (totalDisplay / (parseFloat(exchangeRate) || DEFAULT_RATE)).toFixed(2) + " $"
        : (totalDisplay * (parseFloat(exchangeRate) || DEFAULT_RATE)).toLocaleString() + " FC";

    return (
        <div className="bg-white p-6 border border-gray-200 rounded-sm">
            {/* 1. Header & Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded border border-gray-100">
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Source Fonds</label>
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="w-full p-2 text-sm border-gray-300 rounded"
                    >
                        <option value="OWNER_CAPITAL">Poche du Patron</option>
                        <option value="CASH_REGISTER">Caisse Restaurant</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Devise Achat</label>
                    <div className="flex bg-white rounded border border-gray-300 overflow-hidden">
                        <button
                            onClick={() => setCurrency("CDF")}
                            className={cn("flex-1 text-xs font-bold py-2", currency === "CDF" ? "bg-[#00d3fa] text-white" : "text-gray-600 hover:bg-gray-100")}
                        >
                            CDF
                        </button>
                        <button
                            onClick={() => setCurrency("USD")}
                            className={cn("flex-1 text-xs font-bold py-2", currency === "USD" ? "bg-[#71de00] text-white" : "text-gray-600 hover:bg-gray-100")}
                        >
                            USD
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Taux Change</label>
                    <input
                        type="number"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        className="w-full p-2 text-sm border-gray-300 rounded"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Acheteur (Nom)</label>
                    <div className="relative">
                        <User size={14} className="absolute left-2 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            placeholder="Ex: Jean, Manager"
                            className="w-full pl-7 p-2 text-sm border-gray-300 rounded"
                        />
                    </div>
                </div>
            </div>

            {/* 2. Add Item Row */}
            <div className="flex flex-wrap gap-2 items-end mb-6">
                <div className="flex-1 min-w-[200px]">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Produit</div>
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full p-2 border border-blue-200 rounded text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                        <option value="">choisir produit...</option>
                        <optgroup label="Boissons">
                            {products.filter(p => p.type === "BEVERAGE").map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.saleUnit})</option>
                            ))}
                        </optgroup>
                        <optgroup label="Nourriture/Sec">
                            {products.filter(p => p.type === "FOOD").map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.saleUnit})</option>
                            ))}
                        </optgroup>
                        <optgroup label="Non Vendable">
                            {products.filter(p => p.type === "NON_VENDABLE").map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>
                <div className="w-24">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                        Qté ({buyByPacking && products.find(p => p.id === selectedProduct)?.purchaseUnit ? products.find(p => p.id === selectedProduct)?.purchaseUnit : 'Unit'})
                    </div>
                    <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-center font-bold"
                        placeholder="0"
                    />
                </div>
                <div className="w-32">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                        Prix Unitaire ({currency})
                    </div>
                    <input
                        type="number"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-right"
                        placeholder="0"
                    />
                </div>

                {/* Toggle Unit/Packing */}
                {selectedProduct && products.find(p => p.id === selectedProduct)?.purchaseUnit && (
                    <div className="flex items-center pb-2">
                        <label className="flex items-center cursor-pointer relative">
                            <input type="checkbox" className="sr-only peer" checked={buyByPacking} onChange={(e) => setBuyByPacking(e.target.checked)} />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00d3fa]"></div>
                            <span className="ml-2 text-xs font-medium text-gray-600">
                                Par {products.find(p => p.id === selectedProduct)?.purchaseUnit}
                            </span>
                        </label>
                    </div>
                )}

                <div className="w-32">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Destination</div>
                    <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50"
                    >
                        <option value="DEPOT">Dépôt</option>
                        <option value="ECONOMAT">Economat</option>
                        <option value="FRIGO">Frigo</option>
                    </select>
                </div>
                <button
                    onClick={addItem}
                    disabled={!selectedProduct || !qty || !unitPrice}
                    className="p-2 bg-[#00d3fa] text-white rounded hover:opacity-90 transition-all disabled:opacity-50"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* 3. Items List */}
            {items.length > 0 ? (
                <div className="border border-gray-200 rounded overflow-hidden mb-6">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                            <tr>
                                <th className="p-3 text-left">Produit</th>
                                <th className="p-3 text-center">Lieu</th>
                                <th className="p-3 text-right">Qté</th>
                                <th className="p-3 text-right">Prix Unitaire</th>
                                <th className="p-3 text-right">Total ({currency})</th>
                                <th className="p-3 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-medium text-gray-800">{item.productName}</td>
                                    <td className="p-3 text-center text-xs text-gray-400">{item.location}</td>
                                    <td className="p-3 text-right">
                                        <div className="font-bold">{item.displayQty} {item.displayUnit}</div>
                                        {item.quantity !== item.displayQty && (
                                            <div className="text-[10px] text-gray-400">= {item.quantity} unités stock</div>
                                        )}
                                    </td>
                                    <td className="p-3 text-right text-gray-500">
                                        {item.displayPrice.toLocaleString()} {item.inputCurrency}
                                    </td>
                                    <td className="p-3 text-right font-bold text-gray-700">
                                        {(item.displayPrice * item.displayQty).toLocaleString()} {item.inputCurrency}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr>
                                <td colSpan={4} className="p-3 text-right font-bold text-gray-600 uppercase text-xs">Total à Payer:</td>
                                <td className="p-3 text-right font-bold text-xl text-[#00d3fa]">
                                    {totalDisplay.toLocaleString()} {currency}
                                </td>
                                <td></td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="p-2 text-right text-gray-400 italic text-xs">
                                    Contre-valeur estimée ({currency === "CDF" ? "USD" : "CDF"}):
                                </td>
                                <td className="p-2 text-right text-gray-500 font-medium text-xs">
                                    ~ {convertedTotal}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded mb-6 text-gray-400">
                    <p className="text-sm">Ajoutez des produits au panier d&apos;achat...</p>
                </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                    onClick={handleSubmit}
                    disabled={items.length === 0 || loading || !buyerName}
                    className="px-8 py-3 bg-[#71de00] text-white font-bold rounded shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center gap-2"
                >
                    <Save size={18} />
                    {loading ? "Traitement..." : "Valider l'Achat"}
                </button>
            </div>
            {!buyerName && items.length > 0 && (
                <p className="text-right text-xs text-red-400 mt-2">Veuillez entrer le nom de l&apos;acheteur.</p>
            )}
        </div>
    );
}
