"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Calendar, Download, DollarSign, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type SessionOption = {
  id: string;
  date: string;
  label: string;
  sessionStart: string;
  sessionEnd: string;
  isActive: boolean;
};

type AmelieData = {
  sessions: SessionOption[];
  selected: {
    investmentId: string;
    date: string;
    label: string;
    sessionStart: string;
    sessionEnd: string;
    isActive: boolean;
    investedCdfTotal: number;
    investedCdfBeverage: number;
    investedCdfFood: number;
    expectedRevenueTerraceCdf: number;
    expectedRevenueVipCdf: number;
    expectedProfitTerraceCdf: number;
    expectedProfitVipCdf: number;
    soldUsdTotal: number;
    soldUsdBeverage: number;
    soldUsdFood: number;
    soldProfitUsd: number;
    soldQtyTotal: number;
    soldQtyBeverage: number;
    soldQtyFood: number;
    openingQtyTotal: number;
    purchasedQtyTotal: number;
    availableQtyTotal: number;
    remainingQtyTotal: number;
    remainingValueCostCdf: number;
    remainingTerraceUsd: number;
    remainingVipUsd: number;
    remainingProfitTerraceUsd: number;
    remainingProfitVipUsd: number;
    topProductByQty: {
      id: string;
      name: string;
      qty: number;
      revenueUsd: number;
    } | null;
    topProductByRevenue: {
      id: string;
      name: string;
      qty: number;
      revenueUsd: number;
    } | null;
  } | null;
  dailySales: Array<{ date: string; beverage: number; food: number; total: number }>;
  products: Array<{
    id: string;
    name: string;
    type: string;
    unit: string;
    openingQty: number;
    purchasedQty: number;
    availableQty: number;
    investedCdf: number;
    soldQty: number;
    soldUsd: number;
    soldProfitUsd: number;
    remainingQty: number;
    remainingValueCostCdf: number;
    remainingTerraceUsd: number;
    remainingVipUsd: number;
    remainingProfitTerraceUsd: number;
    remainingProfitVipUsd: number;
  }>;
};

function fmtCdf(v: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF", maximumFractionDigits: 0 }).format(v || 0);
}

function fmtUsd(v: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(v || 0);
}

function fmtQty(v: number) {
  return Number.isInteger(v) ? v.toLocaleString("fr-FR") : v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AmeliePage() {
  const [data, setData] = useState<AmelieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [investmentId, setInvestmentId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (investmentId) params.set("investmentId", investmentId);
      const res = await fetch(`/api/reports/amelie?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (!investmentId && json.data.selected?.investmentId) {
          setInvestmentId(json.data.selected.investmentId);
        }
      } else {
        setData(null);
      }
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sel = data?.selected;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-[#ff4900]" />
            Amélie — Précision Investissement
          </h1>
          <p className="text-sm text-gray-500">
            Session d&apos;achat : du jour d&apos;approvisionnement jusqu&apos;au prochain achat. Tous les produits vendables — ventes depuis l&apos;historique.
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="bg-white border border-gray-200 rounded-sm p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              <Calendar size={16} />
              Session d&apos;achat
            </div>
            <select
              value={investmentId}
              onChange={(e) => setInvestmentId(e.target.value)}
              className="flex-1 max-w-xl border border-gray-200 rounded-sm px-3 py-2 text-sm bg-gray-50"
            >
              {(data?.sessions || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {fmtDate(s.date)} — {s.label} {s.isActive ? "(en cours)" : ""}
                </option>
              ))}
            </select>
            {sel && (
              <a
                href={`/api/reports/amelie/export?investmentId=${sel.investmentId}`}
                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-sm hover:bg-emerald-700"
              >
                <Download size={14} />
                Export Excel
              </a>
            )}
            {sel && (
              <div className="text-xs text-gray-500">
                Période : {fmtDate(sel.sessionStart)} → {fmtDate(sel.sessionEnd)}
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Chargement Amélie...</div>
          ) : !sel ? (
            <div className="p-12 text-center text-gray-400">Aucun achat enregistré.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card
                  title="Investi (session)"
                  value={fmtCdf(sel.investedCdfTotal)}
                  lines={[
                    `Boisson: ${fmtCdf(sel.investedCdfBeverage)}`,
                    `Nourriture: ${fmtCdf(sel.investedCdfFood)}`,
                  ]}
                  color="bg-blue-50 text-blue-600"
                />
                <Card
                  title="Bénéfice attendu"
                  value={fmtCdf(sel.expectedProfitTerraceCdf)}
                  lines={[
                    `Terrasse: ${fmtCdf(sel.expectedRevenueTerraceCdf)} CA`,
                    `VIP: ${fmtCdf(sel.expectedRevenueVipCdf)} CA / ${fmtCdf(sel.expectedProfitVipCdf)} profit`,
                  ]}
                  color="bg-purple-50 text-purple-600"
                />
                <Card
                  title="Preuve stock session"
                  value={`${fmtQty(sel.remainingQtyTotal)} unités restantes`}
                  lines={[
                    `Stock avant achat: ${fmtQty(sel.openingQtyTotal)}`,
                    `Achat session: ${fmtQty(sel.purchasedQtyTotal)} / Disponible: ${fmtQty(sel.availableQtyTotal)}`,
                    `Vendu session: ${fmtQty(sel.soldQtyTotal)}`,
                  ]}
                  color="bg-slate-50 text-slate-600"
                />
                <Card
                  title="Vendu (session)"
                  value={fmtUsd(sel.soldUsdTotal)}
                  lines={[
                    `Boisson: ${fmtUsd(sel.soldUsdBeverage)}`,
                    `Nourriture: ${fmtUsd(sel.soldUsdFood)}`,
                    `Qté Boisson: ${fmtQty(sel.soldQtyBeverage)} | Qté Nourriture: ${fmtQty(sel.soldQtyFood)}`,
                    `Profit réalisé: ${fmtUsd(sel.soldProfitUsd)}`,
                  ]}
                  color="bg-emerald-50 text-emerald-600"
                />
                <Card
                  title="Reste à vendre"
                  value={fmtCdf(sel.remainingValueCostCdf)}
                  lines={[
                    `Terrasse: ${fmtUsd(sel.remainingTerraceUsd)} (${fmtUsd(sel.remainingProfitTerraceUsd)})`,
                    `VIP: ${fmtUsd(sel.remainingVipUsd)} (${fmtUsd(sel.remainingProfitVipUsd)})`,
                  ]}
                  color="bg-orange-50 text-orange-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TopCard
                  title="Produit le plus vendu (quantité)"
                  productName={sel.topProductByQty?.name || "-"}
                  subtitle={
                    sel.topProductByQty
                      ? `${fmtQty(sel.topProductByQty.qty)} unités · ${fmtUsd(sel.topProductByQty.revenueUsd)}`
                      : "Aucune vente sur cette session"
                  }
                />
                <TopCard
                  title="Produit le plus vendu (chiffre)"
                  productName={sel.topProductByRevenue?.name || "-"}
                  subtitle={
                    sel.topProductByRevenue
                      ? `${fmtUsd(sel.topProductByRevenue.revenueUsd)} · ${fmtQty(sel.topProductByRevenue.qty)} unités`
                      : "Aucune vente sur cette session"
                  }
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 font-bold text-gray-700 text-sm">
                  Ventes journalières (boisson / nourriture séparés)
                </div>
                {data!.dailySales.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Aucune vente sur cette session.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-[10px] uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-right">Boisson</th>
                        <th className="px-4 py-2 text-right">Nourriture</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data!.dailySales.map((row) => (
                        <tr key={row.date}>
                          <td className="px-4 py-2">{fmtDate(row.date)}</td>
                          <td className="px-4 py-2 text-right text-blue-700">{fmtUsd(row.beverage)}</td>
                          <td className="px-4 py-2 text-right text-amber-700">{fmtUsd(row.food)}</td>
                          <td className="px-4 py-2 text-right font-bold">{fmtUsd(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 font-bold text-gray-700 text-sm">
                  Détail par produit vendable (session)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[960px]">
                    <thead className="bg-gray-50 text-[10px] uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Produit</th>
                        <th className="px-3 py-2 text-right">Stock avant achat</th>
                        <th className="px-3 py-2 text-right">Acheté</th>
                        <th className="px-3 py-2 text-right">Disponible</th>
                        <th className="px-3 py-2 text-right">Investi</th>
                        <th className="px-3 py-2 text-right">Vendu</th>
                        <th className="px-3 py-2 text-right">CA vendu</th>
                        <th className="px-3 py-2 text-right">Reste</th>
                        <th className="px-3 py-2 text-right">Pot. Terrasse</th>
                        <th className="px-3 py-2 text-right">Pot. VIP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data!.products.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2">
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-[10px] text-gray-400 uppercase">{p.type} · {p.unit}</div>
                          </td>
                          <td className="px-3 py-2 text-right">{fmtQty(p.openingQty)}</td>
                          <td className="px-3 py-2 text-right">{fmtQty(p.purchasedQty)}</td>
                          <td className="px-3 py-2 text-right font-bold">{fmtQty(p.availableQty)}</td>
                          <td className="px-3 py-2 text-right">{fmtCdf(p.investedCdf)}</td>
                          <td className="px-3 py-2 text-right text-orange-600">{fmtQty(p.soldQty)}</td>
                          <td className="px-3 py-2 text-right">{fmtUsd(p.soldUsd)}</td>
                          <td className="px-3 py-2 text-right font-bold text-blue-700">{fmtQty(p.remainingQty)}</td>
                          <td className="px-3 py-2 text-right text-purple-700">
                            <div>{fmtUsd(p.remainingTerraceUsd)}</div>
                            <div className="text-[10px] text-gray-400">+{fmtUsd(p.remainingProfitTerraceUsd)}</div>
                          </td>
                          <td className="px-3 py-2 text-right text-indigo-700">
                            <div>{fmtUsd(p.remainingVipUsd)}</div>
                            <div className="text-[10px] text-gray-400">+{fmtUsd(p.remainingProfitVipUsd)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function TopCard({
  title,
  productName,
  subtitle,
}: {
  title: string;
  productName: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white p-4 border border-gray-200 rounded-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">{title}</p>
          <p className="text-lg font-black text-gray-900 mt-1">{productName}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="p-2 rounded-full bg-yellow-50 text-yellow-600">
          <Trophy size={16} />
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  lines,
  color,
}: {
  title: string;
  value: string;
  lines: string[];
  color: string;
}) {
  return (
    <div className="bg-white p-4 border border-gray-200 rounded-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">{title}</p>
          <p className="text-lg font-black text-gray-900 mt-1">{value}</p>
        </div>
        <div className={cn("p-2 rounded-full", color)}>
          <DollarSign size={16} />
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        {lines.map((l) => (
          <p key={l} className="text-xs text-gray-500">
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}
