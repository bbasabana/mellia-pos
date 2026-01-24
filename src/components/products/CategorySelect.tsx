"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

interface CategorySelectProps {
  productType: "BEVERAGE" | "FOOD" | "NON_VENDABLE" | "";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  isAdmin?: boolean;
}

export function CategorySelect({
  productType,
  value,
  onChange,
  required = false,
  isAdmin = false,
}: CategorySelectProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productType && productType !== "NON_VENDABLE") {
      fetchCategories();
    } else {
      setCategories([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success && data.data.categories[productType]) {
        setCategories(data.data.categories[productType]);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  if (productType === "NON_VENDABLE") {
    return (
      <div className="form-group">
        <label className="form-label">Catégorie</label>
        <input
          type="text"
          className="form-input"
          value="Produit non vendable"
          disabled
        />
        <small className="form-hint">
          Les produits non vendables n&apos;ont pas de catégorie
        </small>
      </div>
    );
  }

  if (!productType) {
    return (
      <div className="form-group">
        <label className="form-label">Catégorie</label>
        <select className="form-input" disabled>
          <option>Sélectionnez d&apos;abord un type de produit</option>
        </select>
      </div>
    );
  }

  return (
    <div className="form-group">
      <div className="flex justify-between items-center mb-1">
        <label className="form-label mb-0">
          Catégorie {required && <span className="text-[#ff4900]">*</span>}
        </label>
        {isAdmin && (
          <Link
            href="/dashboard/settings/categories"
            target="_blank"
            className="text-xs text-[#00d3fa] flex items-center gap-1 hover:underline"
          >
            <Settings size={12} />
            Gérer
          </Link>
        )}
      </div>
      <select
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={loading}
      >
        <option value="">
          {loading ? "Chargement..." : "Sélectionnez une catégorie"}
        </option>
        {categories.map((cat) => (
          <option key={cat.code} value={cat.code}>
            {cat.label}
          </option>
        ))}
      </select>
      <small className="form-hint">
        {productType === "BEVERAGE"
          ? "Catégorie de boisson selon le type"
          : "Catégorie de nourriture selon le type"}
      </small>
    </div>
  );
}
