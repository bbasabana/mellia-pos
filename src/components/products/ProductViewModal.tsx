"use client";

import { Modal } from "../ui/Modal";

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export function ProductViewModal({ isOpen, onClose, product }: ProductViewModalProps) {
  if (!product) return null;

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "BEVERAGE":
        return "bg-[#dbeafe] text-[#2563eb]";
      case "FOOD":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "BEVERAGE":
        return "Boisson";
      case "FOOD":
        return "Nourriture";
      default:
        return "Autre";
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case "SMALL":
        return "Petit";
      case "LARGE":
        return "Gros";
      case "STANDARD":
        return "Standard";
      default:
        return size;
    }
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case "HALF_PLATE":
        return "Demi-plat";
      case "MEASURE":
        return "Mesure";
      case "BOTTLE":
        return "Bouteille";
      case "PLATE":
        return "Plat";
      case "PIECE":
        return "Pièce";
      default:
        return unit;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails du Produit" size="lg">
      <div className="space-y-4">
        {/* Info Générale */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Nom du Produit
            </label>
            <p className="mt-1 text-sm font-semibold text-gray-900">{product.name}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Type
            </label>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getBadgeColor(product.type)}`}>
                {getTypeLabel(product.type)}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Catégorie
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {product.beverageCategory || product.foodCategory || "-"}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Taille
            </label>
            <p className="mt-1 text-sm text-gray-900">{getSizeLabel(product.size)}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Unité de Vente
            </label>
            <p className="mt-1 text-sm text-gray-900">{getUnitLabel(product.saleUnit)}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Statut
            </label>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${product.active ? "bg-[#d1fae5] text-[#059669]" : "bg-orange-100 text-orange-800"}`}>
                {product.active ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Description
            </label>
            <p className="mt-1 text-sm text-gray-700">{product.description}</p>
          </div>
        )}

        {/* Prix par Espace */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
            Prix par Espace de Vente
          </label>
          <div className="grid grid-cols-1 gap-2">
            {product.prices && product.prices.length > 0 ? (
              product.prices.map((price: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {price.space?.name || "Espace"}
                      {price.forUnit && price.forUnit !== "BOTTLE" && price.forUnit !== "PLATE" && (
                        <span className="ml-2 text-xs text-gray-500">({getUnitLabel(price.forUnit)})</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#2563eb]">
                      ${parseFloat(price.priceUsd).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      {parseFloat(price.priceCdf).toLocaleString('fr-FR')} CDF
                    </p>

                    {/* MARGIN DISPLAY */}
                    {(() => {
                      // Find matching cost
                      const cost = product.costs?.find((c: any) => c.forUnit === price.forUnit)
                        || product.costs?.[0]; // Fallback to first cost if strictly matching unit not found (or for standard items)

                      if (cost) {
                        const priceVal = parseFloat(price.priceUsd);
                        const costVal = parseFloat(cost.unitCostUsd);
                        const margin = priceVal - costVal;
                        const marginPercent = priceVal > 0 ? (margin / priceVal) * 100 : 0;

                        return (
                          <div className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 inline-block font-medium">
                            Marge: ${margin.toFixed(2)} ({marginPercent.toFixed(0)}%)
                          </div>
                        )
                      }
                      return null;
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Aucun prix défini</p>
            )}
          </div>
        </div>

        {/* Coût */}
        {product.costs && product.costs.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Coût d&apos;Achat
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-bold text-gray-900">
                ${parseFloat(product.costs[0].unitCostUsd).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {parseFloat(product.costs[0].unitCostCdf).toLocaleString('fr-FR')} CDF
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
