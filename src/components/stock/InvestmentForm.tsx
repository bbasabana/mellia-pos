"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, PlusCircle, RefreshCw, Save, Search, Trash2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";
import { fc, kinshasaDateStr, kinshasaTodayStr, unitOne } from "@/components/purchases/purchase-format";

/**
 * Formulaire d'achat. Each line is bought either by pack (casier, carton… as configured on the
 * product: « 1 Casier = 20 bouteilles ») or by stock unit (bouteille, pièce…). The price is the
 * price of ONE unit chosen, or the total of the line.
 *
 *   stock entered = quantity × (pack size if bought by pack, else 1)
 *   line total    = quantity × price   (or the total typed)
 *   cost price    = line total ÷ stock entered   (per bottle, per piece…)
 *
 * Amounts typed in USD are converted with the rate of the purchase (from Settings by default).
 */

type Currency = "CDF" | "USD";

type Line = {
    productId: string;
    productName: string;
    isNew: boolean;
    newUnit: string | null;
    saleUnit: string;
    purchaseUnit: string | null;
    packQty: number; // stock units per pack, for this line
    buyBy: "PACK" | "UNIT";
    displayQty: number; // in the unit bought
    quantity: number; // stock units entered
    amount: number; // line total, in amountCurrency
    amountCurrency: Currency;
    location: string;
    isVendable: boolean;
    currentCostCdf: number | null; // cost price before this purchase
};

const LOCATIONS = [
    { id: "DEPOT", label: "Dépôt" },
    { id: "ECONOMAT", label: "Économat" },
    { id: "FRIGO", label: "Frigo" },
    { id: "CUISINE", label: "Cuisine" },
];

const NEW_UNITS = [
    { id: "PIECE", label: "Pièce" },
    { id: "BOTTLE", label: "Bouteille" },
    { id: "KG", label: "Kg" },
    { id: "LITER", label: "Litre" },
    { id: "BOX", label: "Boîte" },
    { id: "PACK", label: "Paquet" },
];

const num = (v: string) => {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
};

function currentCost(product: any): number | null {
    const c = product?.costs?.find((x: any) => x.forUnit === product.saleUnit) ?? product?.costs?.[0];
    const v = c ? Number(c.unitCostCdf) : 0;
    return v > 0 ? v : null;
}

export function InvestmentForm({ editId, onSuccess, onCancel }: { editId?: string; onSuccess?: () => void; onCancel?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [fetchingEditData, setFetchingEditData] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [knownBuyers, setKnownBuyers] = useState<string[]>([]);

    // Purchase
    const [source, setSource] = useState("OWNER_CAPITAL");
    const [buyerName, setBuyerName] = useState("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState(kinshasaTodayStr());
    const [currency, setCurrency] = useState<Currency>("CDF");
    const [settingsRate, setSettingsRate] = useState<number | null>(null);
    const [exchangeRate, setExchangeRate] = useState("");
    // Transport keeps the currency it was typed in (no rounding drift when switching FC ⇄ USD).
    const [transport, setTransport] = useState<{ input: string; currency: Currency }>({ input: "", currency: "CDF" });
    const [items, setItems] = useState<Line[]>([]);

    // Line being entered
    const [selectedProduct, setSelectedProduct] = useState("");
    const [productSearch, setProductSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newName, setNewName] = useState("");
    const [newUnit, setNewUnit] = useState("PIECE");
    const [buyBy, setBuyBy] = useState<"PACK" | "UNIT">("PACK");
    const [packQtyInput, setPackQtyInput] = useState("1");
    const [qty, setQty] = useState("");
    const [priceMode, setPriceMode] = useState<"UNIT" | "TOTAL">("UNIT");
    const [priceInput, setPriceInput] = useState("");
    const [location, setLocation] = useState("DEPOT");

    useEffect(() => {
        fetch("/api/products")
            .then((r) => r.json())
            .then((d) => d.success && setProducts(d.data))
            .catch(() => showToast("Produits indisponibles", "error"));
        fetch("/api/exchange-rate")
            .then((r) => r.json())
            .then((d) => {
                const rate = Number(d?.data?.rateUsdToCdf);
                if (rate > 0) {
                    setSettingsRate(rate);
                    // A new purchase starts at the rate set in Settings; an edited one keeps its own.
                    if (!editId) setExchangeRate((cur) => cur || String(rate));
                }
            })
            .catch(() => {});
        fetch("/api/investments?period=all")
            .then((r) => r.json())
            .then((d) => d.success && setKnownBuyers((d.data.buyers || []).map((b: any) => b.name)))
            .catch(() => {});
    }, [editId]);

    useEffect(() => {
        if (!editId) return;
        (async () => {
            setFetchingEditData(true);
            try {
                const res = await fetch(`/api/investments?id=${editId}`);
                const json = await res.json();
                if (!json.success || !json.data) throw new Error(json.error);
                const inv = json.data;
                const invRate = Number(inv.exchangeRate) || 0;
                setSource(inv.source);
                setDate(kinshasaDateStr(inv.date));
                setCurrency("CDF");
                if (invRate > 0) setExchangeRate(String(invRate));
                setTransport({ input: Number(inv.transportFeeCdf || 0) ? String(Number(inv.transportFeeCdf)) : "", currency: "CDF" });
                setBuyerName(inv.buyer || "");
                setNotes(inv.notes || "");
                setItems(
                    inv.movements.map((mov: any): Line => {
                        const prod = mov.product;
                        const pack = Number(prod.packingQuantity) || 1;
                        const q = Number(mov.quantity);
                        const byPack = pack > 1 && !!prod.purchaseUnit && q % pack === 0;
                        return {
                            productId: mov.productId,
                            productName: prod.name,
                            isNew: false,
                            newUnit: null,
                            saleUnit: prod.saleUnit,
                            purchaseUnit: prod.purchaseUnit,
                            packQty: pack,
                            buyBy: byPack ? "PACK" : "UNIT",
                            displayQty: byPack ? q / pack : q,
                            quantity: q,
                            amount: Number(mov.costValue || 0),
                            amountCurrency: "CDF",
                            location: mov.toLocation || "DEPOT",
                            isVendable: prod.type !== "NON_VENDABLE",
                            currentCostCdf: null,
                        };
                    })
                );
            } catch {
                showToast("Erreur lors de la récupération de l'achat", "error");
            } finally {
                setFetchingEditData(false);
            }
        })();
    }, [editId]);

    const rate = num(exchangeRate) || settingsRate || 0;
    const toCdf = (amount: number, cur: Currency) => (cur === "USD" ? amount * rate : amount);
    const show = (cdf: number) => (currency === "CDF" ? fc(cdf) : `${(rate ? cdf / rate : 0).toFixed(2)} $`);

    const product = useMemo(() => products.find((p) => p.id === selectedProduct), [products, selectedProduct]);
    const productPack = Number(product?.packingQuantity) || 1;
    const hasPack = !isCreatingNew && !!product?.purchaseUnit && productPack > 1;
    const lineBuyBy = hasPack ? buyBy : "UNIT";
    const linePack = hasPack ? Math.max(1, Math.round(num(packQtyInput)) || productPack) : 1;
    const lineSaleUnit = isCreatingNew ? newUnit : product?.saleUnit;
    const boughtUnit = lineBuyBy === "PACK" ? product?.purchaseUnit : unitOne(lineSaleUnit);

    // Live result of the line being entered.
    const preview = useMemo(() => {
        const q = num(qty);
        const price = num(priceInput);
        if (!(q > 0) || !(price > 0)) return null;
        const stockQty = q * (lineBuyBy === "PACK" ? linePack : 1);
        const total = priceMode === "TOTAL" ? price : q * price;
        const totalCdf = toCdf(total, currency);
        return { q, stockQty, total, totalCdf, unitCostCdf: totalCdf / stockQty };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qty, priceInput, priceMode, lineBuyBy, linePack, currency, rate]);

    const resetLine = () => {
        setQty("");
        setPriceInput("");
        setNewName("");
        setIsCreatingNew(false);
        setSelectedProduct("");
        setProductSearch("");
        setPackQtyInput("1");
    };

    const pickProduct = (p: any) => {
        setSelectedProduct(p.id);
        setProductSearch(p.name);
        setPackQtyInput(String(p.packingQuantity || 1));
        setBuyBy(p.purchaseUnit && (p.packingQuantity || 1) > 1 ? "PACK" : "UNIT");
        setShowSuggestions(false);
    };

    const addItem = () => {
        if (!preview) return;
        if (!isCreatingNew && !product) return;
        if (isCreatingNew && newName.trim().length < 2) return;
        if (currency === "USD" && !(rate > 0)) {
            showToast("Indiquez le taux de change", "error");
            return;
        }
        const line: Line = isCreatingNew
            ? {
                productId: "NEW_" + Date.now(),
                productName: newName.trim(),
                isNew: true,
                newUnit,
                saleUnit: newUnit,
                purchaseUnit: null,
                packQty: 1,
                buyBy: "UNIT",
                displayQty: preview.q,
                quantity: preview.stockQty,
                amount: preview.total,
                amountCurrency: currency,
                location,
                isVendable: false,
                currentCostCdf: null,
            }
            : {
                productId: product.id,
                productName: product.name,
                isNew: false,
                newUnit: null,
                saleUnit: product.saleUnit,
                purchaseUnit: product.purchaseUnit,
                packQty: linePack,
                buyBy: lineBuyBy,
                displayQty: preview.q,
                quantity: preview.stockQty,
                amount: preview.total,
                amountCurrency: currency,
                location,
                isVendable: product.type !== "NON_VENDABLE",
                currentCostCdf: currentCost(product),
            };
        setItems((prev) => [...prev, line]);
        resetLine();
    };

    const switchCurrency = (next: Currency) => setCurrency(next);

    const itemsTotalCdf = items.reduce((acc, i) => acc + toCdf(i.amount, i.amountCurrency), 0);
    const transportCdf = toCdf(num(transport.input), transport.currency);
    const transportShown =
        transport.currency === currency || !transport.input
            ? transport.input
            : currency === "USD"
                ? rate ? String(Math.round((transportCdf / rate) * 100) / 100) : ""
                : String(Math.round(transportCdf));
    const totalCdf = itemsTotalCdf + transportCdf;
    const usesUsd = currency === "USD" || items.some((i) => i.amountCurrency === "USD");
    const canSubmit = items.length > 0 && buyerName.trim().length >= 2 && rate > 0 && !loading;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            const res = await fetch("/api/investments", {
                method: editId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editId,
                    date,
                    exchangeRate: rate,
                    source,
                    buyerName: buyerName.trim(),
                    description: notes.trim(),
                    transportFeeCdf: Math.round(transportCdf * 100) / 100,
                    items: items.map((i) => ({
                        productId: i.isNew ? undefined : i.productId,
                        isNew: i.isNew,
                        productName: i.productName,
                        newUnit: i.newUnit,
                        quantity: i.quantity,
                        lineTotalCdf: Math.round(toCdf(i.amount, i.amountCurrency) * 100) / 100,
                        location: i.location,
                    })),
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(editId ? "Achat mis à jour, stock recalculé." : "Achat enregistré, stock mis à jour.", "success");
                setItems([]);
                onSuccess?.();
            } else {
                showToast(data.error || "Erreur lors de l'enregistrement", "error");
            }
        } catch {
            showToast("Erreur de connexion", "error");
        } finally {
            setLoading(false);
        }
    };

    if (fetchingEditData) return <div className="p-12 text-center text-gray-400">Chargement de l&apos;achat...</div>;

    const matches = products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase().trim()));
    const exact = products.some((p) => p.name.toLowerCase().trim() === productSearch.toLowerCase().trim());
    const rateDiffers = settingsRate !== null && rate > 0 && Math.abs(rate - settingsRate) > 0.001;

    return (
        <div className="bg-white p-1 sm:p-2">
            {/* 1. Purchase */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5 p-4 bg-gray-50 rounded border border-gray-100">
                <Field label="Date de l'achat">
                    <input type="date" value={date} max={kinshasaTodayStr()} onChange={(e) => setDate(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded" />
                </Field>
                <Field label="L'argent vient d'où ?">
                    <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded">
                        <option value="OWNER_CAPITAL">Poche du patron</option>
                        <option value="CASH_REGISTER">Caisse du restaurant</option>
                    </select>
                </Field>
                <Field label="Acheté par">
                    <div className="relative">
                        <User size={14} className="absolute left-2 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            list="known-buyers"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            placeholder="Ex : Ada, Lefils"
                            className="w-full pl-7 p-2 text-sm border border-gray-300 rounded"
                        />
                        <datalist id="known-buyers">
                            {knownBuyers.map((b) => <option key={b} value={b} />)}
                        </datalist>
                    </div>
                </Field>
                <Field label="Devise de saisie">
                    <div className="flex bg-white rounded border border-gray-300 overflow-hidden">
                        {(["CDF", "USD"] as Currency[]).map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => switchCurrency(c)}
                                className={cn(
                                    "flex-1 text-xs font-bold py-2",
                                    currency === c ? (c === "CDF" ? "bg-[#00d3fa] text-white" : "bg-[#71de00] text-white") : "text-gray-600 hover:bg-gray-100"
                                )}
                            >
                                {c === "CDF" ? "FC" : "USD"}
                            </button>
                        ))}
                    </div>
                </Field>
                <Field label="Taux (FC pour 1 $)">
                    <input
                        type="number"
                        inputMode="decimal"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        placeholder={settingsRate ? String(settingsRate) : "Taux"}
                        className="w-full p-2 text-sm border border-gray-300 rounded"
                    />
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        {settingsRate !== null ? <>Paramètres : {settingsRate.toLocaleString("fr-FR")}</> : "Taux des paramètres…"}
                        {rateDiffers && (
                            <button type="button" onClick={() => setExchangeRate(String(settingsRate))} className="ml-1 text-blue-600 font-bold flex items-center gap-0.5">
                                <RefreshCw size={10} /> remettre
                            </button>
                        )}
                    </div>
                </Field>
                <Field label={`Transport (${currency === "CDF" ? "FC" : "$"})`}>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={transportShown}
                        onChange={(e) => setTransport({ input: e.target.value, currency })}
                        placeholder="0"
                        className="w-full p-2 text-sm border border-purple-200 rounded bg-purple-50 font-bold text-purple-700 outline-none"
                    />
                    <div className="text-[10px] text-gray-400 mt-1">Ajouté au total, pas au prix des produits</div>
                </Field>
            </div>

            {/* 2. Line */}
            <div className="mb-5 bg-blue-50/30 p-4 rounded border border-blue-100 space-y-3">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[230px] relative">
                        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Produit</div>
                        {isCreatingNew ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Nom de la fourniture"
                                    className="flex-1 p-2 border border-orange-300 rounded text-sm bg-orange-50 font-bold text-orange-800 outline-none"
                                    autoFocus
                                />
                                <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="p-2 border border-orange-200 rounded text-sm">
                                    {NEW_UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                                </select>
                                <button type="button" onClick={resetLine} className="px-3 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 text-xs font-bold">
                                    Annuler
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setSelectedProduct("");
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Rechercher (ex : Castel, Huile…)"
                                    className={cn(
                                        "w-full p-2 pl-8 border rounded text-sm outline-none",
                                        selectedProduct ? "border-blue-400 bg-blue-50/50 font-bold text-blue-900" : "border-gray-300 focus:border-blue-300"
                                    )}
                                />
                                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
                                {selectedProduct && (
                                    <button type="button" onClick={resetLine} className="absolute right-2 top-2 text-gray-400 hover:text-red-500">
                                        <X size={16} />
                                    </button>
                                )}
                                {showSuggestions && productSearch.trim() && !selectedProduct && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                                        {matches.map((p) => (
                                            <div key={p.id} onClick={() => pickProduct(p)} className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center">
                                                <span className="font-bold text-sm text-gray-700">{p.name}</span>
                                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold", p.type === "NON_VENDABLE" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")}>
                                                    {p.type === "NON_VENDABLE" ? "FOURNITURE" : p.purchaseUnit && p.packingQuantity > 1 ? `${p.purchaseUnit} de ${p.packingQuantity}` : unitOne(p.saleUnit)}
                                                </span>
                                            </div>
                                        ))}
                                        {!exact && (
                                            <div
                                                onClick={() => {
                                                    setIsCreatingNew(true);
                                                    setNewName(productSearch.trim());
                                                    setShowSuggestions(false);
                                                    setNewUnit("PIECE");
                                                }}
                                                className="p-3 hover:bg-orange-50 cursor-pointer text-orange-700 bg-orange-50/30 flex items-center gap-2"
                                            >
                                                <PlusCircle size={16} />
                                                <span className="font-bold text-sm">Nouvelle fourniture « {productSearch.trim()} » (non revendue)</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {hasPack && (
                        <Field label="Acheter par">
                            <div className="flex bg-white rounded border border-gray-300 overflow-hidden">
                                <button type="button" onClick={() => setBuyBy("PACK")} className={cn("px-3 py-2 text-xs font-bold", buyBy === "PACK" ? "bg-gray-800 text-white" : "text-gray-600")}>
                                    {product.purchaseUnit}
                                </button>
                                <button type="button" onClick={() => setBuyBy("UNIT")} className={cn("px-3 py-2 text-xs font-bold capitalize", buyBy === "UNIT" ? "bg-gray-800 text-white" : "text-gray-600")}>
                                    {unitOne(product.saleUnit)}
                                </button>
                            </div>
                        </Field>
                    )}
                    {hasPack && buyBy === "PACK" && (
                        <Field label={`${unitOne(product.saleUnit)}s par ${product.purchaseUnit}`}>
                            <input type="number" min={1} value={packQtyInput} onChange={(e) => setPackQtyInput(e.target.value)} className="w-20 p-2 border border-gray-300 rounded text-sm text-center font-bold" />
                        </Field>
                    )}

                    <Field label={`Quantité${boughtUnit ? ` (${boughtUnit})` : ""}`}>
                        <input type="number" inputMode="decimal" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" className="w-24 p-2 border border-blue-200 rounded text-sm text-center font-bold outline-none" />
                    </Field>

                    <div>
                        <div className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex gap-1">
                            {(["UNIT", "TOTAL"] as const).map((m) => (
                                <button key={m} type="button" onClick={() => setPriceMode(m)} className={cn("px-1.5 rounded-[2px] text-[9px] font-bold", priceMode === m ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-500")}>
                                    {m === "UNIT" ? `Prix par ${boughtUnit || "unité"}` : "Total de la ligne"}
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            placeholder={currency === "CDF" ? "FC" : "$"}
                            className={cn("w-36 p-2 border rounded text-sm text-right font-bold outline-none", priceMode === "TOTAL" ? "border-orange-200 bg-orange-50" : "border-blue-200")}
                        />
                    </div>

                    <Field label="Destination">
                        <select value={location} onChange={(e) => setLocation(e.target.value)} className="p-2 border border-gray-300 rounded text-sm bg-gray-50">
                            {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                        </select>
                    </Field>

                    <button
                        type="button"
                        onClick={addItem}
                        disabled={!preview || (!isCreatingNew && !product) || (isCreatingNew && newName.trim().length < 2)}
                        className="p-2 bg-blue-600 text-white rounded hover:opacity-90 disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center"
                        title="Ajouter la ligne"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {preview && (product || isCreatingNew) && (
                    <div className="text-xs text-blue-900 bg-white border border-blue-100 rounded px-3 py-2 flex flex-wrap gap-x-5 gap-y-1">
                        <span>
                            Stock : <b>+{preview.stockQty.toLocaleString("fr-FR")} {unitOne(lineSaleUnit)}(s)</b>
                            {lineBuyBy === "PACK" && <span className="text-gray-500"> ({preview.q} × {linePack})</span>}
                        </span>
                        <span>Total ligne : <b>{show(preview.totalCdf)}</b></span>
                        <span>
                            Coût : <b>{fc(preview.unitCostCdf)} / {unitOne(lineSaleUnit)}</b>
                            {lineBuyBy === "PACK" && <span className="text-gray-500"> · {fc(preview.unitCostCdf * linePack)} / {product?.purchaseUnit}</span>}
                        </span>
                        {!isCreatingNew && currentCost(product) !== null && (
                            <span className="text-gray-500">Prix de revient actuel : {fc(currentCost(product)!)} / {unitOne(lineSaleUnit)}</span>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Lines */}
            {items.length > 0 ? (
                <div className="border border-gray-200 rounded overflow-x-auto mb-5">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-semibold">
                            <tr>
                                <th className="p-3 text-left">Produit</th>
                                <th className="p-3 text-center">Lieu</th>
                                <th className="p-3 text-right">Quantité</th>
                                <th className="p-3 text-right">Prix de revient</th>
                                <th className="p-3 text-right">Total</th>
                                <th className="p-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item, idx) => {
                                const lineCdf = toCdf(item.amount, item.amountCurrency);
                                const unitCdf = item.quantity > 0 ? lineCdf / item.quantity : 0;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="p-3 font-medium text-gray-800">
                                            {item.productName}
                                            {!item.isVendable && (
                                                <span className="ml-1.5 text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-bold">CHARGE</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center text-xs text-gray-500">{LOCATIONS.find((l) => l.id === item.location)?.label ?? item.location}</td>
                                        <td className="p-3 text-right">
                                            <div className="font-bold">
                                                {item.displayQty.toLocaleString("fr-FR")} {item.buyBy === "PACK" ? item.purchaseUnit : unitOne(item.saleUnit)}
                                            </div>
                                            {item.buyBy === "PACK" && (
                                                <div className="text-[10px] text-blue-500">= {item.quantity.toLocaleString("fr-FR")} {unitOne(item.saleUnit)}(s) en stock</div>
                                            )}
                                        </td>
                                        <td className="p-3 text-right text-gray-600">
                                            <div className="font-bold">{fc(unitCdf)} / {unitOne(item.saleUnit)}</div>
                                            {item.currentCostCdf !== null && Math.abs(item.currentCostCdf - unitCdf) >= 1 && (
                                                <div className={cn("text-[10px]", unitCdf > item.currentCostCdf ? "text-red-500" : "text-green-600")}>
                                                    avant : {fc(item.currentCostCdf)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-right font-bold text-gray-700">
                                            {show(lineCdf)}
                                            {item.amountCurrency !== currency && (
                                                <div className="text-[10px] text-gray-400 font-normal">
                                                    saisi {item.amountCurrency === "USD" ? `${item.amount.toFixed(2)} $` : fc(item.amount)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200 text-xs">
                            <tr>
                                <td colSpan={4} className="px-3 pt-3 text-right text-gray-500 uppercase font-bold">Produits</td>
                                <td className="px-3 pt-3 text-right font-bold">{show(itemsTotalCdf)}</td>
                                <td />
                            </tr>
                            <tr>
                                <td colSpan={4} className="px-3 text-right text-purple-600 uppercase font-bold">+ Transport</td>
                                <td className="px-3 text-right font-bold text-purple-600">{show(transportCdf)}</td>
                                <td />
                            </tr>
                            <tr>
                                <td colSpan={4} className="px-3 pb-1 text-right text-gray-700 uppercase font-black">Total payé</td>
                                <td className="px-3 pb-1 text-right font-black text-lg text-[#00a8c7]">{show(totalCdf)}</td>
                                <td />
                            </tr>
                            <tr>
                                <td colSpan={4} className="px-3 pb-3 text-right text-gray-400 italic">
                                    {currency === "CDF" ? "En dollars" : "En francs"} (taux {rate.toLocaleString("fr-FR")})
                                </td>
                                <td className="px-3 pb-3 text-right text-gray-500">
                                    {currency === "CDF" ? `${(rate ? totalCdf / rate : 0).toFixed(2)} $` : fc(totalCdf)}
                                </td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded mb-5 text-gray-400 text-sm">
                    Ajoutez les produits achetés…
                </div>
            )}

            <Field label="Notes (facultatif)">
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex : marché central, fournisseur…" className="w-full p-2 text-sm border border-gray-300 rounded" />
            </Field>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
                {items.length > 0 && buyerName.trim().length < 2 && <p className="text-xs text-red-500 mr-auto">Indiquez qui a fait l&apos;achat.</p>}
                {usesUsd && !(rate > 0) && <p className="text-xs text-red-500 mr-auto">Indiquez le taux de change.</p>}
                {onCancel && (
                    <button type="button" onClick={onCancel} className="px-4 py-3 bg-gray-200 text-gray-600 font-bold rounded hover:bg-gray-300">
                        Annuler
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="px-8 py-3 bg-green-600 text-white font-bold rounded shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    <Save size={18} />
                    {loading ? "Enregistrement..." : editId ? "Mettre à jour" : `Valider l'achat · ${fc(totalCdf)}`}
                </button>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</div>
            {children}
        </div>
    );
}
