"use client";

import { Search } from "lucide-react";

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: string;
  onTypeChange: (value: string) => void;
  size: string;
  onSizeChange: (value: string) => void;
  active: string;
  onActiveChange: (value: string) => void;
}

export function ProductFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  size,
  onSizeChange,
  active,
  onActiveChange,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* SEARCH */}
      <div className="flex-1 min-w-[300px] relative flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#dbeafe] transition-all">
        <Search size={20} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 border-none outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* SELECTS */}
      <div className="flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 cursor-pointer hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe] outline-none transition-all min-w-[150px]"
        >
          <option value="">Tous les types</option>
          <option value="BEVERAGE">Boissons</option>
          <option value="FOOD">Nourritures</option>
          <option value="NON_VENDABLE">Non vendable</option>
        </select>

        <select
          value={size}
          onChange={(e) => onSizeChange(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 cursor-pointer hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe] outline-none transition-all min-w-[150px]"
        >
          <option value="">Toutes les tailles</option>
          <option value="SMALL">Petit</option>
          <option value="LARGE">Gros</option>
          <option value="STANDARD">Standard</option>
        </select>

        <select
          value={active}
          onChange={(e) => onActiveChange(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 cursor-pointer hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe] outline-none transition-all min-w-[150px]"
        >
          <option value="">Tous les statuts</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
      </div>
    </div>
  );
}
