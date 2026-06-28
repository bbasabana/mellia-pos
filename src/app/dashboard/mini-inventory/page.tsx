"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertTriangle, Package, Search, ShoppingBasket, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "day" | "week" | "month" | "year" | "all";
type ProductFilter = "all" | "vendable" | "non_vendable";

type MiniInventoryRow = {
  id: string;
  name: string;
  type: string;
  vendable: boolean;
  unit: string;
  purchasedInPeriod: number;
  purchasedTotal: number;
  soldInPeriod: number;
  soldTotal: number;
  expectedStock: number;
  currentStock: number;
  stockGap: number;
  lastPurchaseAt: string | null;
  purchasedOnDate: number;
  soldOnDate: number;
  remainingOnDate: number;
  needsRestock: boolean;
};

type MiniInventoryResponse = {
  period: Period;
  startDate?: string;
  targetDate: string;
  threshold: number;
  summary: {
    totalProducts: number;
    lowStockCount: number;
    productsToBuyCount: number;
    purchasedInPeriod: number;
    soldInPeriod: number;
    totalCurrentStock: number;
    purchasedOnDate: number;
    soldOnDate: number;
    remainingOnDate: number;
  };
  rows: MiniInventoryRow[];
};

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: "day", label: "Jour" },
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
  { id: "all", label: "Tout" },
];

const PRODUCT_FILTER_OPTIONS: { id: ProductFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "vendable", label: "Vendables" },
  { id: "non_vendable", label: "Non vendables" },
];

function formatQuantity(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString("fr-FR");
  }
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateOnly(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MiniInventoryPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const [selectedProductId, setSelectedProductId] = useState("all");
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [query, setQuery] = useState("");
  const [data, setData] = useState<MiniInventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        productFilter,
        targetDate: selectedDate,
      });

      if (query.trim()) {
        params.set("query", query.trim());
      }

      if (selectedProductId !== "all") {
        params.set("productId", selectedProductId);
      }

      const response = await fetch(`/api/reports/mini-inventory?${params.toString()}`);
      const json = await response.json();

      if (json.success) {
        setData(json.data);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Error loading mini inventory:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, productFilter, query, selectedDate, selectedProductId]);

  const selectedDateLabel = (() => {
    const parsed = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return selectedDate;
    return parsed.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  })();

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 250);

    return () => clearTimeout(timeout);
  }, [fetchData]);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBasket className="text-[#00d3fa]" />
            Mini Inventaire
          </h1>
          <p className="text-sm text-gray-500">
            Résumé rapide par produit: acheté, vendu, stock attendu et stock actuel.
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPeriod(option.id)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-full border transition-all",
                    period === option.id
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex items-center bg-gray-100 rounded-sm px-3 py-2 flex-1">
                <Search size={15} className="text-gray-400 mr-2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-2 bg-gray-100 rounded-sm px-3 py-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-gray-100 rounded-sm px-3 py-2 min-w-[220px]">
                <span className="text-xs font-bold text-gray-500 uppercase">Produit</span>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full"
                >
                  <option value="all">Tous les produits</option>
                  {(data?.rows || []).map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center bg-gray-100 p-1 rounded-md">
                {PRODUCT_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setProductFilter(option.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                      productFilter === option.id
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Produits suivis"
              value={loading ? "..." : `${data?.summary.totalProducts || 0}`}
              icon={<Package size={18} />}
              color="text-blue-500 bg-blue-50"
            />
            <StatCard
              title="En stock faible"
              value={loading ? "..." : `${data?.summary.lowStockCount || 0}`}
              icon={<AlertTriangle size={18} />}
              color="text-red-500 bg-red-50"
            />
            <StatCard
              title={`Achats (${selectedDateLabel})`}
              value={loading ? "..." : formatQuantity(data?.summary.purchasedOnDate || 0)}
              icon={<ShoppingBasket size={18} />}
              color="text-green-600 bg-green-50"
            />
            <StatCard
              title={`Ventes (${selectedDateLabel})`}
              value={loading ? "..." : formatQuantity(data?.summary.soldOnDate || 0)}
              icon={<TrendingDown size={18} />}
              color="text-orange-500 bg-orange-50"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-sm px-4 py-3 text-xs text-blue-700">
            Le {selectedDateLabel} : achats ={" "}
            <span className="font-bold">{formatQuantity(data?.summary.purchasedOnDate || 0)}</span>, ventes ={" "}
            <span className="font-bold">{formatQuantity(data?.summary.soldOnDate || 0)}</span>, reste théorique ={" "}
            <span className="font-bold">{formatQuantity(data?.summary.remainingOnDate || 0)}</span>.
          </div>

          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Chargement du mini inventaire...</div>
              ) : !data || data.rows.length === 0 ? (
                <div className="p-8 text-center text-gray-400">Aucune donnée pour ces filtres.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Produit</th>
                      <th className="px-4 py-3">Dernier achat</th>
                      <th className="px-4 py-3 text-right">Achat ({selectedDateLabel})</th>
                      <th className="px-4 py-3 text-right">Vente ({selectedDateLabel})</th>
                      <th className="px-4 py-3 text-right">Reste ({selectedDateLabel})</th>
                      <th className="px-4 py-3 text-right">Achats période</th>
                      <th className="px-4 py-3 text-right">Ventes période</th>
                      <th className="px-4 py-3 text-right">Achats total</th>
                      <th className="px-4 py-3 text-right">Ventes total</th>
                      <th className="px-4 py-3 text-right">Stock attendu</th>
                      <th className="px-4 py-3 text-right">Stock actuel</th>
                      <th className="px-4 py-3 text-right">Écart</th>
                      <th className="px-4 py-3 text-center">Achat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{row.name}</div>
                          <div className="text-[10px] text-gray-400 uppercase">
                            {row.vendable ? "Vendable" : "Non vendable"} - {row.unit}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDateOnly(row.lastPurchaseAt)}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-700">
                          {formatQuantity(row.purchasedOnDate)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-orange-600">
                          {formatQuantity(row.soldOnDate)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">
                          {formatQuantity(row.remainingOnDate)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-green-700">
                          {formatQuantity(row.purchasedInPeriod)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-orange-600">
                          {formatQuantity(row.soldInPeriod)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatQuantity(row.purchasedTotal)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatQuantity(row.soldTotal)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">
                          {formatQuantity(row.expectedStock)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatQuantity(row.currentStock)}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-bold",
                            row.stockGap < 0
                              ? "text-red-600"
                              : row.stockGap > 0
                              ? "text-emerald-600"
                              : "text-gray-500"
                          )}
                        >
                          {row.stockGap > 0 ? "+" : ""}
                          {formatQuantity(row.stockGap)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.needsRestock ? (
                            <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">
                              Acheter
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white p-4 border border-gray-200 rounded-sm flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase font-bold">{title}</p>
        <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={cn("p-3 rounded-full", color)}>{icon}</div>
    </div>
  );
}
