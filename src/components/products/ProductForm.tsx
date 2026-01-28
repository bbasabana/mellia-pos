"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PriceInput } from "./PriceInput";
import { CategorySelect } from "./CategorySelect";
import { Save, X, Trash2, Settings, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { showToast } from "@/components/ui/Toast";

interface ProductFormProps {
  product?: any;
  spaces: any[];
  exchangeRate: number;
  mode: "create" | "edit";
  onSuccess?: () => void;
  inModal?: boolean;
  isAdmin?: boolean;
}

export function ProductForm({
  product,
  spaces,
  exchangeRate,
  mode,
  onSuccess,
  inModal = false,
  isAdmin = false,
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data State
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Form state
  const [name, setName] = useState(product?.name || "");
  const [type, setType] = useState<string>(product?.type || "");
  const [category, setCategory] = useState(
    product?.beverageCategory || product?.foodCategory || ""
  );
  const [size, setSize] = useState(product?.size || "STANDARD");
  const [saleUnit, setSaleUnit] = useState(product?.saleUnit || "BOTTLE");
  const [unitValue, setUnitValue] = useState(
    product?.unitValue ? parseFloat(product.unitValue) : 0
  );
  const [description, setDescription] = useState(product?.description || "");
  const [vendable, setVendable] = useState(
    product?.vendable !== undefined ? product.vendable : true
  );

  // Active state - initialized from product but managed carefully
  const [productActive, setProductActive] = useState(
    product?.active !== undefined ? product.active : true
  );

  // Packing State
  const [purchaseUnit, setPurchaseUnit] = useState(product?.purchaseUnit || "");
  const [packingQuantity, setPackingQuantity] = useState(product?.packingQuantity || 1);

  // Prices state (per space)
  const [prices, setPrices] = useState<Record<string, number>>(
    spaces.reduce((acc, space) => {
      const existingPrice = product?.prices?.find(
        (p: any) => p.spaceId === space.id && p.forUnit === (product?.saleUnit === "MEASURE" ? "MEASURE" : "BOTTLE")
      );
      acc[space.id] = existingPrice
        ? parseFloat(existingPrice.priceUsd)
        : 0;
      return acc;
    }, {} as Record<string, number>)
  );

  // Measure prices for whisky
  const [measurePrices, setMeasurePrices] = useState<Record<string, number>>(
    spaces.reduce((acc, space) => {
      const existingPrice = product?.prices?.find(
        (p: any) => p.spaceId === space.id && p.forUnit === "MEASURE"
      );
      acc[space.id] = existingPrice
        ? parseFloat(existingPrice.priceUsd)
        : 0;
      return acc;
    }, {} as Record<string, number>)
  );

  // Half-Plate prices for food
  const [halfPlatePrices, setHalfPlatePrices] = useState<Record<string, number>>(
    spaces.reduce((acc, space) => {
      const existingPrice = product?.prices?.find(
        (p: any) => p.spaceId === space.id && p.forUnit === "HALF_PLATE"
      );
      acc[space.id] = existingPrice
        ? parseFloat(existingPrice.priceUsd)
        : 0;
      return acc;
    }, {} as Record<string, number>)
  );

  // Cost state
  const [cost, setCost] = useState(
    product?.costs?.[0] ? parseFloat(product.costs[0].unitCostUsd) : 0
  );

  // Enable measure pricing for whisky
  const [enableMeasurePrice, setEnableMeasurePrice] = useState(
    product?.beverageCategory === "WHISKY" &&
    product?.prices?.some((p: any) => p.forUnit === "MEASURE")
  );

  // Enable half-plate pricing for food
  const [enableHalfPlate, setEnableHalfPlate] = useState(
    product?.type === "FOOD" &&
    product?.saleUnit === "PLATE" &&
    product?.prices?.some((p: any) => p.forUnit === "HALF_PLATE")
  );

  // Fetch types on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) {
          setProductTypes(data.data.types);
        }
      } catch (err) {
        console.error("Error fetching types:", err);
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchData();
  }, []);

  // Auto-calculate half-plate prices when enabled or when main prices change
  useEffect(() => {
    if (enableHalfPlate && type === "FOOD" && saleUnit === "PLATE") {
      // Only if half-plate prices are mostly empty (first enable), we prefer to preserve existing if user edits
      // But user wanted "auto calculate". We'll do a smart update:
      // If a half-plate price is 0, set it to half of main price.
      setHalfPlatePrices(prev => {
        const next = { ...prev };
        let changed = false;
        spaces.forEach(space => {
          const mainPrice = prices[space.id] || 0;
          // Initial population logic or if it was 0
          if ((!next[space.id] || next[space.id] === 0) && mainPrice > 0) {
            next[space.id] = mainPrice / 2;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [enableHalfPlate, prices, type, saleUnit, spaces]);

  // Conditional Logic helpers
  const isFood = type === "FOOD";
  const isBeverage = type === "BEVERAGE";
  const isNonVendable = type === "NON_VENDABLE";

  const handleSave = async (shouldActivate: boolean, e?: React.MouseEvent) => {
    // Prevent double submission and default form behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      // Validation
      if (!name || !type) {
        throw new Error("Nom et type sont requis");
      }

      if (type !== "NON_VENDABLE" && !category) {
        throw new Error("Catégorie est requise");
      }

      // Prepare product data
      const productData = {
        name,
        type,
        ...(isBeverage && { beverageCategory: category }),
        ...(isFood && { foodCategory: category }),
        size: isFood ? "STANDARD" : size, // Force Standard for food
        saleUnit,
        unitValue: unitValue > 0 ? unitValue : null,
        description,
        vendable,
        active: shouldActivate,
        // Packing info
        purchaseUnit: purchaseUnit || null,
        packingQuantity: packingQuantity > 0 ? packingQuantity : 1
      };

      // Call API
      const url = mode === "create"
        ? "/api/products"
        : `/api/products/${product.id}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: productData,
          prices,
          measurePrices: enableMeasurePrice ? measurePrices : null,
          halfPlatePrices: enableHalfPlate ? halfPlatePrices : null,
          cost,
          exchangeRate,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de l'enregistrement");
      }

      showToast(`Produit ${shouldActivate ? 'publié' : 'enregistré'} avec succès`, "success");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/products");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      showToast("Produit supprimé", "success");
      router.push("/dashboard/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Update sale unit based on type
  const handleTypeChange = (newType: string) => {
    setType(newType);
    setCategory("");

    // Set default sale unit based on type
    if (newType === "BEVERAGE") {
      setSaleUnit("BOTTLE");
      setSize("STANDARD");
    } else if (newType === "FOOD") {
      setSaleUnit("PLATE");
      setSize("STANDARD");
      setVendable(true);
      setPurchaseUnit("");
      setPackingQuantity(1);
    } else {
      setSaleUnit("PIECE");
      setVendable(false); // DEFAULT for NON_VENDABLE
      setPurchaseUnit("");
      setPackingQuantity(1);
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);

    // BUSINESS LOGIC: Automatic conditioning defaults
    if (newCat === "BIERE") {
      setPurchaseUnit("Casier");
      setPackingQuantity(20);
    } else if (newCat === "SUCRE") {
      setPurchaseUnit("Casier");
      setPackingQuantity(24);
    }
  };

  return (
    <div className={`product-form ${inModal ? 'product-form-modal' : ''}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* Status Banner */}
      {mode === "edit" && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${productActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
          {productActive ? <CheckCircle size={20} /> : <FileText size={20} />}
          <div>
            <p className="font-semibold">{productActive ? "Produit Publié" : "Brouillon"}</p>
            <p className="text-sm opacity-80">
              {productActive ? "Ce produit est visible dans le système de vente." : "Ce produit n'est pas encore visible pour la vente."}
            </p>
          </div>
        </div>
      )}

      <div className="form-sections grid gap-6">
        {/* Section 1: Informations de base */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-2">Informations de base</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du produit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-[#00d3fa] focus:ring-[#00d3fa] sm:text-sm border h-10 outline-none transition-all"
                placeholder="Ex: Coca-Cola, Poulet Braisé"
                required
              />
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Type de produit <span className="text-red-500">*</span>
                </label>
                {isAdmin && (
                  <Link
                    href="/dashboard/settings/categories"
                    target="_blank"
                    className="text-xs text-[#00d3fa] flex items-center gap-1 hover:underline font-medium"
                  >
                    <Settings size={12} />
                    Gérer Types
                  </Link>
                )}
              </div>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-[#00d3fa] focus:ring-[#00d3fa] sm:text-sm border h-10 capitalize outline-none transition-all"
                required
                disabled={loadingTypes}
              >
                <option value="">
                  {loadingTypes ? "Chargement..." : "Sélectionnez un type"}
                </option>
                {productTypes.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <CategorySelect
              productType={type as any}
              value={category}
              onChange={handleCategoryChange}
              required={!isNonVendable}
              isAdmin={isAdmin}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Taille - Masqué pour nourriture */}
            {!isFood && !isNonVendable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taille</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="block w-full rounded-md border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-[#00d3fa] focus:ring-[#00d3fa] sm:text-sm border h-10 outline-none transition-all"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="SMALL">Petit</option>
                  <option value="LARGE">Gros</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité de vente</label>
              <select
                value={saleUnit}
                onChange={(e) => setSaleUnit(e.target.value)}
                className="block w-full rounded-md border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-[#00d3fa] focus:ring-[#00d3fa] sm:text-sm border h-10 outline-none transition-all"
              >
                {isBeverage && (
                  <>
                    <option value="BOTTLE">Bouteille</option>
                    <option value="MEASURE">Mesure (cl)</option>
                    <option value="PIECE">Pièce</option>
                  </>
                )}
                {isFood && (
                  <>
                    <option value="PLATE">Plat</option>
                    {/* Explicit Half Plate as main unit is rare, usually it's a variant. Keep as variant logic mainly. */}
                    <option value="PIECE">Pièce</option>
                  </>
                )}
                {!isBeverage && !isFood && (
                  <option value="PIECE">Pièce</option>
                )}
              </select>
            </div>
          </div>

          {(saleUnit === "MEASURE" || (isBeverage && size !== "STANDARD")) && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valeur unitaire (optionnel)
              </label>
              <input
                type="number"
                step="0.01"
                value={unitValue}
                onChange={(e) => setUnitValue(parseFloat(e.target.value))}
                className="block w-full rounded-md border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-[#00d3fa] focus:ring-[#00d3fa] sm:text-sm border h-10 outline-none transition-all"
                placeholder="Ex: 0.33 (33cl), 0.04 (4cl)"
              />
              <small className="text-gray-500 text-xs mt-1">
                Pour boissons: litres (0.33 = 33cl). Pour mesures: centilitres
              </small>
            </div>
          )}


          {/* Section Packing / Conditionnement */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Conditionnement d&apos;Achat</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité d&apos;achat
                </label>
                <input
                  type="text"
                  value={purchaseUnit}
                  onChange={(e) => setPurchaseUnit(e.target.value)}
                  className="block w-full rounded-md border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-[#00d3fa] focus:ring-[#00d3fa] sm:text-sm border h-10 outline-none transition-all placeholder:text-gray-400"
                  placeholder="Ex: Carton, Casier, Sachet..."
                />
                <p className="text-xs text-gray-500 mt-1">Laissez vide si achat à l&apos;unité.</p>
              </div>

              {purchaseUnit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité par {purchaseUnit}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={packingQuantity}
                      onChange={(e) => setPackingQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="block w-full rounded-md border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-[#00d3fa] focus:ring-[#00d3fa] sm:text-sm border h-10 outline-none transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-xs">
                        {saleUnit === "BOTTLE" ? "Bouteilles" : (saleUnit === "PLATE" ? "Plats" : "Pièces")}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    1 {purchaseUnit} contient combien de {saleUnit === "BOTTLE" ? "bouteilles" : (saleUnit === "PLATE" ? "plats" : "pièces")} ?
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-[#00d3fa] focus:ring-[#00d3fa] sm:text-sm border outline-none transition-all"
              rows={3}
              placeholder="Description du produit..."
            />
          </div>

          <div className="mt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={vendable}
                onChange={(e) => setVendable(e.target.checked)}
                className="w-4 h-4 text-[#00d3fa] rounded border-gray-300 focus:ring-[#00d3fa]"
              />
              <span className="text-sm font-medium text-gray-700">
                Produit vendable (visible dans le POS)
                {isNonVendable && <span className="text-xs text-gray-400 ml-2">(Typiquement décoché pour les fournitures)</span>}
              </span>
            </label>
          </div>
        </div>

        {/* Section 2: Prix par espace - HIDE IF NOT VENDABLE */}
        {vendable && !isNonVendable && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-900">Prix & Marges</h3>
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                Taux: 1 USD = {exchangeRate.toLocaleString()} FC
              </div>
            </div>

            {/* Cost Section */}
            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 mb-8">
              <h4 className="text-sm font-bold text-[#1e40af] uppercase tracking-wider mb-4">1. Coût d&apos;achat</h4>
              <PriceInput
                label="Coût d'achat par unité"
                value={cost}
                onChange={setCost}
                exchangeRate={exchangeRate}
                required
              />
            </div>

            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">2. Prix de vente par espace</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {spaces.map((space) => (
                <div key={space.id} className="relative bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-[#00d3fa]/50 transition-colors">
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Espace</span>
                    <h5 className="text-lg font-bold text-gray-900">{space.name}</h5>
                  </div>

                  <PriceInput
                    key={space.id}
                    label={`Prix de vente`}
                    value={prices[space.id] || 0}
                    onChange={(value) =>
                      setPrices((prev) => ({ ...prev, [space.id]: value }))
                    }
                    exchangeRate={exchangeRate}
                    required
                  />

                  {/* Margin preview per space */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {(() => {
                      const price = prices[space.id] || 0;
                      const margin = price - cost;
                      const marginPercent = price > 0 ? ((margin / price) * 100).toFixed(1) : "0";
                      const isPositive = margin > 0;
                      const marginColor = isPositive ? 'text-green-600' : 'text-red-600';
                      const marginBg = isPositive ? 'bg-green-50' : 'bg-red-50';

                      return (
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 mb-1">Marge estimée</span>
                            <span className={`text-lg font-bold ${marginColor}`}>
                              {margin.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
                            </span>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-bold ${marginBg} ${marginColor} border border-current opacity-80`}>
                            {marginPercent}%
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Prix mesure pour whisky */}
            {category === "WHISKY" && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={enableMeasurePrice}
                      onChange={(e) => setEnableMeasurePrice(e.target.checked)}
                      className="w-4 h-4 text-[#00d3fa] rounded border-gray-300 focus:ring-[#00d3fa]"
                    />
                    <span className="font-medium text-gray-900">Activer vente à la mesure</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1 ml-6">
                    Pour vendre ce whisky au verre (ex: 4cl) en plus de la bouteille.
                  </p>
                </div>

                {enableMeasurePrice && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-purple-50 p-6 rounded-xl border border-purple-100">
                    {spaces.map((space) => (
                      <PriceInput
                        key={`measure-${space.id}`}
                        label={`Prix mesure - ${space.name}`}
                        value={measurePrices[space.id] || 0}
                        onChange={(value) =>
                          setMeasurePrices((prev) => ({
                            ...prev,
                            [space.id]: value,
                          }))
                        }
                        exchangeRate={exchangeRate}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DEMI-PLAT pour NOURRITURE */}
            {type === "FOOD" && saleUnit === "PLATE" && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={enableHalfPlate}
                      onChange={(e) => setEnableHalfPlate(e.target.checked)}
                      className="w-4 h-4 text-[#00d3fa] rounded border-gray-300 focus:ring-[#00d3fa]"
                    />
                    <span className="font-medium text-gray-900">Activer vente Demi-plat</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1 ml-6">
                    Génère automatiquement une option demi-plat (50% prix/coût par défaut).
                  </p>
                </div>

                {enableHalfPlate && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-orange-50 p-6 rounded-xl border border-orange-100">
                    {spaces.map((space) => (
                      <div key={`half-${space.id}`} className="flex flex-col gap-2">
                        <PriceInput
                          label={`Prix Demi-plat - ${space.name}`}
                          value={halfPlatePrices[space.id] || 0}
                          onChange={(value) =>
                            setHalfPlatePrices((prev) => ({
                              ...prev,
                              [space.id]: value,
                            }))
                          }
                          exchangeRate={exchangeRate}
                        />
                        {/* Margin preview for half plate */}
                        <div className="flex justify-between px-2">
                          <span className="text-[10px] text-gray-500">
                            Marge: {((halfPlatePrices[space.id] || 0) - (cost / 2)).toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Actions */}
      <div className="form-actions flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
          disabled={loading}
        >
          <X size={18} />
          Annuler
        </button>

        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-5 py-2.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium hover:bg-red-100 transition-colors flex items-center gap-2 shadow-sm"
            disabled={loading}
          >
            <Trash2 size={18} />
            Supprimer
          </button>
        )}

        <div className="flex-1"></div>

        <button
          type="button"
          onClick={(e) => handleSave(false, e)}
          className="px-5 py-2.5 rounded-lg bg-[#1e40af] text-white font-medium hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm opacity-90 hover:opacity-100"
          disabled={loading}
        >
          <FileText size={18} />
          {loading ? "..." : "Enregistrer brouillon"}
        </button>

        <button
          type="button"
          onClick={(e) => handleSave(true, e)}
          className="px-6 py-2.5 rounded-lg bg-[#00d3fa] text-white font-semibold hover:bg-[#00b8e0] transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
          disabled={loading}
        >
          <Save size={18} />
          {loading ? "Enregistrement..." : (productActive ? "Mettre à jour" : "Publier le produit")}
        </button>
      </div>
    </div>
  );
}
