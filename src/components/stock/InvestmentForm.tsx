"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, DollarSign, Calculator, User, RefreshCw, Search, X, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";

const DEFAULT_RATE = 2850; // Taux par défaut (à récupérer du backend idéalement)

export function InvestmentForm({ editId, onSuccess, onCancel }: { editId?: string, onSuccess?: () => void, onCancel?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [fetchingEditData, setFetchingEditData] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    // Form State
    const [source, setSource] = useState("OWNER_CAPITAL");
    const [buyerName, setBuyerName] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [currency, setCurrency] = useState<"USD" | "CDF">("CDF");
    const [exchangeRate, setExchangeRate] = useState(DEFAULT_RATE.toString());

    const [items, setItems] = useState<any[]>([]);

    // Line Item State
    const [selectedProduct, setSelectedProduct] = useState("");
    const [qty, setQty] = useState("");
    const [unitPrice, setUnitPrice] = useState(""); // In selected currency
    const [location, setLocation] = useState("DEPOT");

    // On-the-fly NEW product state
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newName, setNewName] = useState("");
    const [newUnit, setNewUnit] = useState("PIECE");
    const [priceMode, setPriceMode] = useState<"PER_PACK" | "PER_ITEM">("PER_PACK");
    const [editPackQty, setEditPackQty] = useState("1");
    // Combobox State
    const [productSearch, setProductSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);


    useEffect(() => {
        fetchProducts();
        if (editId) {
            fetchEditData();
        }
    }, [editId]);

    const fetchEditData = async () => {
        setFetchingEditData(true);
        try {
            const res = await fetch(`/api/investments?id=${editId}`);
            const json = await res.json();
            if (json.success && json.data) {
                const inv = json.data;
                setSource(inv.source);
                if (inv.date) setDate(new Date(inv.date).toISOString().split('T')[0]);
                setCurrency(inv.exchangeRate ? "USD" : "CDF"); // Simple heuristic
                setExchangeRate(inv.exchangeRate?.toString() || DEFAULT_RATE.toString());

                // Parse Buyer Name: "[Acheteur: Name] Actual Description"
                const desc = inv.description || "";
                const buyerMatch = desc.match(/^\[Acheteur:\s*([^\]]+)\]\s*(.*)/);
                if (buyerMatch) {
                    setBuyerName(buyerMatch[1]);
                    setDescription(buyerMatch[2]);
                } else {
                    setDescription(desc);
                }

                // Map movements to form items
                const mappedItems = inv.movements.map((mov: any) => {
                    const prod = mov.product;
                    // We need to reconstruct the "display" values
                    // Note: This is an estimation since we don't store displayQty in DB
                    // If packingQuantity > 1, displayQty = quantity / packingQuantity
                    const packQty = prod.packingQuantity || 1;
                    const displayQty = packQty > 1 ? Number(mov.quantity) / packQty : Number(mov.quantity);
                    const costTotal = Number(mov.costValue || 0);
                    const unitCost = costTotal / Number(mov.quantity);

                    return {
                        productId: mov.productId,
                        productName: prod.name,
                        isNew: false,
                        newUnit: null,
                        displayQty: displayQty,
                        displayUnit: (packQty > 1 && prod.purchaseUnit) ? prod.purchaseUnit : prod.saleUnit,
                        displayPrice: packQty > 1 ? unitCost * packQty : unitCost,
                        packingQuantity: packQty,
                        saleUnit: prod.saleUnit,
                        quantity: Number(mov.quantity),
                        itemPrice: packQty > 1 ? unitCost * packQty : unitCost,
                        priceMode: packQty > 1 ? "PER_PACK" : "PER_ITEM",
                        lineTotal: costTotal,
                        inputCurrency: "USD", // Logic: costs are USD in DB
                        costUsd: unitCost,
                        location: mov.toLocation || "DEPOT",
                        isVendable: prod.vendable
                    };
                });
                setItems(mappedItems);
            }
        } catch (error) {
            console.error(error);
            showToast("Erreur lors de la récupération des données", "error");
        } finally {
            setFetchingEditData(false);
        }
    };

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
        if (!isCreatingNew && !selectedProduct) return;
        if (isCreatingNew && !newName) return;
        if (!qty || !unitPrice) return;

        const rate = parseFloat(exchangeRate) || DEFAULT_RATE;
        const inputPriceVal = parseFloat(unitPrice);
        const inputQtyVal = parseFloat(qty);

        let quantityToAdd = inputQtyVal;
        let realUnitCost = inputPriceVal;
        let pName = "";
        let sUnit = "";
        let isVendable = true;
        let productId = selectedProduct;
        let packQty = 1;
        let pUnit = "";

        if (isCreatingNew) {
            pName = newName;
            sUnit = newUnit;
            isVendable = false;
            productId = "NEW_" + Date.now();
        } else {
            const product = products.find(p => p.id === selectedProduct);
            pName = product?.name;
            sUnit = product?.saleUnit;
            isVendable = product?.type !== "NON_VENDABLE";
            packQty = parseFloat(editPackQty) || product?.packingQuantity || 1;
            pUnit = product?.purchaseUnit;

            // BUSINESS LOGIC: Automatic conversion if purchase unit exists
            if (pUnit && packQty > 1) {
                quantityToAdd = inputQtyVal * packQty;
                // Cost per INTERNAL unit (ex: per bottle)
                realUnitCost = priceMode === "PER_PACK" ? (inputPriceVal / packQty) : inputPriceVal;
            } else {
                realUnitCost = inputPriceVal;
            }
        }

        const lineTotal = priceMode === "PER_PACK" ? (inputQtyVal * inputPriceVal) : (inputQtyVal * packQty * inputPriceVal);

        const costUsd = currency === "USD" ? realUnitCost : (realUnitCost / rate);

        const newItem = {
            productId,
            productName: pName,
            isNew: isCreatingNew,
            newUnit: isCreatingNew ? newUnit : null,

            // Display Data
            displayQty: inputQtyVal,
            displayUnit: (!isCreatingNew && pUnit) ? pUnit : sUnit,
            displayPrice: inputPriceVal,
            packingQuantity: packQty,
            saleUnit: sUnit,

            // Backend Data
            quantity: quantityToAdd,
            itemPrice: inputPriceVal, // The price entered (might be per pack or per item)
            priceMode: priceMode,
            lineTotal: lineTotal,
            inputCurrency: currency,
            costUsd: costUsd,
            location: location,
            isVendable: isVendable
        };

        setItems([...items, newItem]);
        setQty("");
        setUnitPrice("");
        setNewName("");
        setIsCreatingNew(false);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (items.length === 0) return;
        setLoading(true);

        const totalUsd = items.reduce((acc, item) => acc + (item.costUsd * item.quantity), 0);
        // Sum of all line totals in the entered currency (CDF or USD)
        const totalAmountEntered = items.reduce((acc, item) => acc + item.lineTotal, 0);
        const totalCdf = currency === "CDF" ? totalAmountEntered : (totalAmountEntered * parseFloat(exchangeRate));

        // Append Buyer Name to description if present
        const finalDesc = buyerName ? `[Acheteur: ${buyerName}] ${description}` : description;

        try {
            const res = await fetch("/api/investments", {
                method: editId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editId,
                    date,
                    totalAmount: totalUsd,
                    totalAmountCdf: totalCdf,
                    exchangeRate: parseFloat(exchangeRate),
                    source,
                    description: finalDesc,
                    items: items.map(i => ({
                        productId: i.productId,
                        isNew: i.isNew,
                        productName: i.productName,
                        newUnit: i.newUnit,
                        quantity: i.quantity,
                        cost: i.costUsd,
                        location: i.location,
                        isVendable: i.isVendable
                    }))
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(editId ? "Achat mis à jour !" : "Achat enregistré ! Stock mis à jour.", "success");
                setItems([]);
                if (onSuccess) onSuccess();
            } else {
                showToast(data.error || "Erreur lors de l'enregistrement", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Erreur de connexion", "error");
        } finally {
            setLoading(false);
        }
    };

    // Calculate Totals for UI
    const totalDisplay = items.reduce((acc, item) => acc + item.lineTotal, 0);
    const convertedTotal = currency === "CDF"
        ? (totalDisplay / (parseFloat(exchangeRate) || DEFAULT_RATE)).toFixed(2) + " $"
        : (totalDisplay * (parseFloat(exchangeRate) || DEFAULT_RATE)).toLocaleString() + " FC";

    if (fetchingEditData) return <div className="p-12 text-center text-gray-400">Chargement des données de l&apos;achat...</div>;

    return (
        <div className="bg-white p-6 border border-gray-200 rounded-sm">
            {/* 1. Header & Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded border border-gray-100">
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date Achat</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 text-sm border-gray-300 rounded"
                    />
                </div>
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
            <div className="flex flex-wrap gap-3 items-end mb-6 bg-blue-50/30 p-4 rounded border border-blue-100">

                {/* SMART COMBOBOX */}
                <div className="flex-1 min-w-[250px] relative group">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Produit (Recherche)
                    </label>

                    {isCreatingNew ? (
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Nom du nouveau produit..."
                                    className="w-full p-2 border border-orange-300 rounded text-sm focus:ring-2 focus:ring-orange-200 outline-none bg-orange-50 font-bold text-orange-800"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setIsCreatingNew(false);
                                    setNewName("");
                                    setProductSearch("");
                                }}
                                className="px-3 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 text-xs font-bold"
                            >
                                ANNULER
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setSelectedProduct(""); // Clear selection when typing
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Rechercher (ex: Oignon, Savon...)"
                                    className={cn(
                                        "w-full p-2 pl-8 border rounded text-sm outline-none transition-all",
                                        selectedProduct ? "border-blue-400 bg-blue-50/50 font-bold text-blue-900" : "border-gray-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                    )}
                                />
                                <div className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none">
                                    <Search size={14} />
                                </div>
                                {selectedProduct && (
                                    <button
                                        onClick={() => {
                                            setSelectedProduct("");
                                            setProductSearch("");
                                            setEditPackQty("1");
                                        }}
                                        className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && productSearch && !selectedProduct && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                                    {/* 1. MATCHING PRODUCTS */}
                                    {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedProduct(p.id);
                                                setProductSearch(p.name);
                                                setEditPackQty(p.packingQuantity?.toString() || "1");
                                                setShowSuggestions(false);
                                                setNewUnit(p.saleUnit); // Default unit from product
                                            }}
                                            className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-sm text-gray-700">{p.name}</span>
                                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold",
                                                    p.type === 'NON_VENDABLE' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                                                )}>
                                                    {p.type === 'NON_VENDABLE' ? 'CHARGE' : p.saleUnit}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* 2. NO MATCH -> CREATE OPTION */}
                                    {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                                        <div
                                            onClick={() => {
                                                setIsCreatingNew(true);
                                                setNewName(productSearch); // Pre-fill with typed text
                                                setShowSuggestions(false);
                                                setNewUnit("PIECE");
                                            }}
                                            className="p-3 hover:bg-orange-50 cursor-pointer text-orange-700 bg-orange-50/30"
                                        >
                                            <div className="flex items-center gap-2">
                                                <PlusCircle size={16} />
                                                <span className="font-bold text-sm">Créer &quot;{productSearch}&quot; (Non-Vendable)</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isCreatingNew && (
                    <div className="w-24">
                        <div className="text-[10px] uppercase font-bold text-orange-400 mb-1">Unité</div>
                        <select
                            value={newUnit}
                            onChange={(e) => setNewUnit(e.target.value)}
                            className="w-full p-2 border border-orange-200 rounded text-sm focus:ring-2 focus:ring-orange-100 outline-none"
                        >
                            <option value="PIECE">Pièce</option>
                            <option value="BOTTLE">Bouteille</option>
                            <option value="KG">Kg</option>
                            <option value="LITER">Litre</option>
                            <option value="BOX">Boite</option>
                            <option value="PACK">Paquet</option>
                        </select>
                    </div>
                )}

                <div className="w-24">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                        Qté ({isCreatingNew ? newUnit : (products.find(p => p.id === selectedProduct)?.purchaseUnit || products.find(p => p.id === selectedProduct)?.saleUnit || 'Unit')})
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="w-full p-2 border border-blue-200 focus:border-blue-400 rounded text-sm text-center font-bold outline-none"
                        placeholder="0"
                    />
                </div>

                <div className="w-32">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex justify-between">
                        <span>Prix ({currency})</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPriceMode("PER_PACK")}
                                className={cn("px-1 rounded-[2px] text-[9px]", priceMode === "PER_PACK" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500")}
                                title="Prix par Carton"
                            >PACK</button>
                            <button
                                onClick={() => setPriceMode("PER_ITEM")}
                                className={cn("px-1 rounded-[2px] text-[9px]", priceMode === "PER_ITEM" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500")}
                                title="Prix par Unité"
                            >ITEM</button>
                        </div>
                    </div>
                    <input
                        type="number"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        className="w-full p-2 border border-blue-200 focus:border-blue-400 rounded text-sm text-right font-bold outline-none"
                        placeholder="0"
                    />
                </div>

                {/* Live Preview & Packing Override */}
                {!isCreatingNew && (products.find(p => p.id === selectedProduct)?.purchaseUnit) && (
                    <div className="flex flex-col gap-1 p-2 bg-[#f0f9ff] border border-blue-100 rounded min-w-[140px]">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-bold text-blue-400 uppercase">Items par {products.find(p => p.id === selectedProduct)?.purchaseUnit}</span>
                            <input
                                type="number"
                                value={editPackQty}
                                onChange={(e) => setEditPackQty(e.target.value)}
                                className="w-10 p-0.5 text-center text-xs border border-blue-200 rounded font-bold text-blue-700 bg-white"
                            />
                        </div>
                        {qty && (
                            <div className="text-[11px] font-bold text-blue-600 border-t border-blue-50 pt-1">
                                {qty} {products.find(p => p.id === selectedProduct)?.purchaseUnit} = {(parseFloat(qty) * (parseFloat(editPackQty) || 1)).toFixed(0)} {products.find(p => p.id === selectedProduct)?.saleUnit === "BOTTLE" ? "Bout." : "Unité"}
                            </div>
                        )}
                        {qty && unitPrice && (
                            <div className="text-[11px] font-black text-orange-600">
                                Total: {priceMode === "PER_PACK"
                                    ? (parseFloat(qty) * parseFloat(unitPrice)).toLocaleString()
                                    : (parseFloat(qty) * (parseFloat(editPackQty) || 1) * parseFloat(unitPrice)).toLocaleString()
                                } {currency}
                            </div>
                        )}
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
                    disabled={(!selectedProduct && !isCreatingNew) || (!newName && isCreatingNew) || !qty || !unitPrice}
                    className="p-2 bg-[#00d3fa] text-white rounded hover:opacity-90 transition-all disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center mb-[1px]"
                >
                    <Plus size={20} />
                </button>
            </div>


            {/* 3. Items List */}
            {
                items.length > 0 ? (
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
                                        <td className="p-3 font-medium text-gray-800">
                                            <div className="flex flex-col">
                                                <span>{item.productName}</span>
                                                {!item.isVendable && (
                                                    <span className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded w-fit font-bold mt-0.5 border border-orange-200">
                                                        CHARGE (NON-VENDABLE)
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-center text-xs text-gray-400">{item.location}</td>
                                        <td className="p-3 text-right">
                                            <div className="font-bold">{item.displayQty} {item.displayUnit}</div>
                                            {item.packingQuantity > 1 && (
                                                <div className="text-[10px] text-blue-500 font-medium">
                                                    Formula: {item.displayQty} × {item.packingQuantity} = {item.quantity} {item.saleUnit === "BOTTLE" ? "Bout." : "Unit"}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-right text-gray-500">
                                            <div className="font-bold">{item.itemPrice.toLocaleString()} {item.inputCurrency}</div>
                                            <div className="text-[10px] text-gray-400 capitalize">Par {item.priceMode === "PER_PACK" ? (item.displayUnit || "Pack") : (item.saleUnit || "Item")}</div>
                                        </td>
                                        <td className="p-3 text-right font-bold text-gray-700">
                                            {item.lineTotal.toLocaleString()} {item.inputCurrency}
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
                )
            }

            <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                    onClick={handleSubmit}
                    disabled={items.length === 0 || loading || !buyerName}
                    className="px-8 py-3 bg-[#71de00] text-white font-bold rounded shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center gap-2"
                >
                    <Save size={18} />
                    {loading ? "Traitement..." : (editId ? "Mettre à jour" : "Valider l'Achat")}
                </button>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="ml-2 px-4 py-3 bg-gray-200 text-gray-600 font-bold rounded hover:bg-gray-300 transition-all"
                    >
                        Annuler
                    </button>
                )}
            </div>
            {
                !buyerName && items.length > 0 && (
                    <p className="text-right text-xs text-red-400 mt-2">Veuillez entrer le nom de l&apos;acheteur.</p>
                )
            }
        </div >
    );
}
