"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Loader2,
  Lock,
  Package,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Smartphone,
  Wallet,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

type DayPoint = { day: string; totalCdf: number; count: number; closed: string | null };
type Dashboard = {
  rate: number | null;
  today: {
    day: string;
    closed: string | null;
    salesCount: number;
    totalCdf: number;
    totalUsd: number;
    cashCdf: number;
    otherCdf: number;
    avgCdf: number;
    expensesCdf: number;
    beverageCdf: number;
    foodCdf: number;
    lastWeek: { day: string; totalCdf: number; salesCount: number };
  };
  week: DayPoint[];
  topProducts: { name: string; type: string; quantity: number; totalCdf: number }[];
  recent: {
    id: string;
    ticketNum: string;
    createdAt: string;
    totalCdf: number;
    totalUsd: number;
    paymentMethod: string;
    cashier: string;
  }[];
  manager: {
    pendingDays: { day: string; salesCount: number; salesCashCdf: number }[];
    gaps: { count: number; totalCdf: number };
    lowStock: { count: number; items: { id: string; name: string; quantity: number }[] };
  } | null;
};

const REFRESH_MS = 60_000;

const PAYMENT: Record<string, string> = {
  CASH: "Espèces",
  CARD: "Carte",
  MOBILE_MONEY: "Mobile Money",
  AIRTEL_MONEY: "Airtel Money",
  ORANGE_MONEY: "Orange Money",
  AFRIMONEY: "Afrimoney",
  MPESA: "M-Pesa",
  LOYALTY_POINTS: "Points",
  SPLIT: "Mixte",
  OTHER: "Autre",
};

const fc = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} FC`;
const usd = (v: number) => `$${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** A business day YYYY-MM-DD read as a calendar date. */
const dayDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const dayLabel = (day: string, pattern = "EEEE d MMMM") => format(dayDate(day), pattern, { locale: fr });

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const role = (session?.user as { role?: string } | undefined)?.role ?? "CASHIER";
  const canSell = ["ADMIN", "MANAGER", "CASHIER"].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
      setUpdatedAt(new Date());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
          {failed ? (
            <>
              <p className="text-sm">Impossible de charger le tableau de bord.</p>
              <button type="button" onClick={load} className="text-sm font-bold text-[#0891b2] underline">
                Réessayer
              </button>
            </>
          ) : (
            <Loader2 className="w-8 h-8 text-[#00d3fa] animate-spin" />
          )}
        </div>
      </DashboardLayout>
    );
  }

  const t = data.today;
  const toUsd = (cdf: number) => (data.rate ? usd(cdf / data.rate) : null);
  const trend = t.lastWeek.totalCdf > 0 ? Math.round(((t.totalCdf - t.lastWeek.totalCdf) / t.lastWeek.totalCdf) * 100) : null;
  const netCashCdf = t.cashCdf - t.expensesCdf;
  const splitTotal = t.beverageCdf + t.foodCdf;
  const maxDay = Math.max(1, ...data.week.map((d) => d.totalCdf));
  const m = data.manager;

  return (
    <DashboardLayout>
      <div className="w-full h-full overflow-y-auto bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          {/* HEADER */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Bonjour, {session?.user?.name || "l'équipe"} !</h1>
              <p className="text-sm text-gray-500 mt-1">
                Journée du <span className="font-semibold text-gray-700 capitalize">{dayLabel(t.day)}</span>
                {t.closed && <span className="ml-2 text-indigo-600">· {t.closed}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={load}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800"
                title="Actualiser"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                {updatedAt ? `Mis à jour à ${format(updatedAt, "HH:mm")}` : "Actualiser"}
              </button>
              {canSell && (
                <Link
                  href="/dashboard/pos"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0891b2] text-white text-sm font-bold shadow-sm hover:bg-[#0e7490]"
                >
                  <ShoppingCart size={16} /> Nouvelle vente
                </Link>
              )}
            </div>
          </div>

          {/* TO DO (manager) */}
          {m && (m.pendingDays.length > 0 || m.gaps.count > 0) && (
            <div className="flex flex-wrap gap-3">
              {m.pendingDays.length > 0 && (
                <Link
                  href="/dashboard/transactions"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm hover:bg-amber-100"
                >
                  <Lock size={15} />
                  <span>
                    <strong>
                      {m.pendingDays.length} journée{m.pendingDays.length > 1 ? "s" : ""} à clôturer
                    </strong>{" "}
                    : {m.pendingDays.map((d) => dayLabel(d.day, "EEE d")).join(", ")}
                  </span>
                </Link>
              )}
              {m.gaps.count > 0 && (
                <Link
                  href="/dashboard/transactions"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm hover:bg-red-100"
                >
                  <AlertTriangle size={15} />
                  <span>
                    <strong>
                      {m.gaps.count} écart{m.gaps.count > 1 ? "s" : ""} à vérifier
                    </strong>{" "}
                    · {fc(m.gaps.totalCdf)}
                  </span>
                </Link>
              )}
            </div>
          )}

          {/* KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Stat
              label="Ventes du jour"
              icon={<Receipt size={18} />}
              tone="bg-cyan-50 text-[#0891b2]"
              value={fc(t.totalCdf)}
              sub={`${usd(t.totalUsd)} · ${t.salesCount} ticket${t.salesCount > 1 ? "s" : ""}`}
              foot={
                trend === null ? (
                  <span className="text-gray-400">Pas de ventes le {dayLabel(t.lastWeek.day, "EEE d MMM")}</span>
                ) : (
                  <span className={`flex items-center gap-1 font-semibold ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {trend >= 0 ? "+" : ""}
                    {trend} %<span className="font-normal text-gray-400">vs {dayLabel(t.lastWeek.day, "EEE d MMM")}</span>
                  </span>
                )
              }
            />
            <Stat
              label="Espèces encaissées"
              icon={<Banknote size={18} />}
              tone="bg-green-50 text-green-700"
              value={fc(t.cashCdf)}
              sub={toUsd(t.cashCdf) ?? ""}
              foot={
                <span className="flex items-center gap-1 text-gray-500">
                  <Smartphone size={12} /> Mobile Money / carte : <strong className="text-gray-700">{fc(t.otherCdf)}</strong>
                </span>
              }
            />
            <Stat
              label="Dépenses caisse"
              icon={<Wallet size={18} />}
              tone="bg-red-50 text-red-600"
              value={fc(t.expensesCdf)}
              sub={toUsd(t.expensesCdf) ?? ""}
              foot={
                <span className="text-gray-500">
                  Recette nette (espèces − dépenses) : <strong className={netCashCdf < 0 ? "text-red-600" : "text-gray-800"}>{fc(netCashCdf)}</strong>
                </span>
              }
            />
            <Stat
              label="Panier moyen"
              icon={<ShoppingCart size={18} />}
              tone="bg-purple-50 text-purple-600"
              value={fc(t.avgCdf)}
              sub={toUsd(t.avgCdf) ?? ""}
              foot={data.rate ? <span className="text-gray-400">Taux : 1 $ = {data.rate.toLocaleString("fr-FR")} FC</span> : null}
            />
          </div>

          {/* 7 DAYS + SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="Ventes des 7 derniers jours" className="lg:col-span-2">
              <div className="flex items-end gap-2 h-48">
                {data.week.map((d) => {
                  const isToday = d.day === t.day;
                  const h = d.totalCdf > 0 ? Math.max(4, Math.round((d.totalCdf / maxDay) * 100)) : 0;
                  return (
                    <div
                      key={d.day}
                      className="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0"
                      title={`${dayLabel(d.day)} : ${fc(d.totalCdf)} · ${d.count} ticket${d.count > 1 ? "s" : ""}`}
                    >
                      <span className="text-[10px] font-semibold text-gray-600 tabular-nums truncate max-w-full">
                        {d.totalCdf > 0 ? `${Math.round(d.totalCdf / 1000).toLocaleString("fr-FR")}k` : d.closed ? "fermé" : "—"}
                      </span>
                      <div
                        className={`w-full rounded-t ${isToday ? "bg-[#00d3fa]" : "bg-[#0891b2]/70"}`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2 border-t border-gray-100 pt-2">
                {data.week.map((d) => (
                  <div
                    key={d.day}
                    className={`flex-1 text-center text-[11px] capitalize ${d.day === t.day ? "font-bold text-gray-900" : "text-gray-500"}`}
                  >
                    {dayLabel(d.day, "EEE d")}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Total : {fc(data.week.reduce((a, d) => a + d.totalCdf, 0))} · {data.week.reduce((a, d) => a + d.count, 0)} tickets
              </p>
            </Card>

            <Card title="Boissons / Nourriture · aujourd'hui">
              {splitTotal === 0 ? (
                <Empty text="Aucune vente aujourd'hui" />
              ) : (
                <div className="space-y-4">
                  <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                    <div className="bg-[#00d3fa]" style={{ width: `${(t.beverageCdf / splitTotal) * 100}%` }} />
                    <div className="bg-orange-400" style={{ width: `${(t.foodCdf / splitTotal) * 100}%` }} />
                  </div>
                  <SplitRow color="bg-[#00d3fa]" label="Boissons" cdf={t.beverageCdf} total={splitTotal} usd={toUsd(t.beverageCdf)} />
                  <SplitRow color="bg-orange-400" label="Nourriture" cdf={t.foodCdf} total={splitTotal} usd={toUsd(t.foodCdf)} />
                </div>
              )}
            </Card>
          </div>

          {/* TOP / RECENT / STOCK */}
          <div className={`grid grid-cols-1 gap-4 ${m ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
            <Card title="Meilleures ventes · 7 jours">
              {data.topProducts.length === 0 ? (
                <Empty text="Aucune vente sur 7 jours" />
              ) : (
                <ol className="space-y-2.5">
                  {data.topProducts.map((p, i) => (
                    <li key={p.name} className="flex items-center gap-3 text-sm">
                      <span className="w-5 text-xs font-bold text-gray-400">{i + 1}</span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${p.type === "BEVERAGE" ? "bg-[#00d3fa]" : "bg-orange-400"}`}
                      />
                      <span className="flex-1 truncate text-gray-800">{p.name}</span>
                      <span className="text-xs text-gray-500 tabular-nums">× {p.quantity.toLocaleString("fr-FR")}</span>
                      <span className="w-24 text-right font-semibold tabular-nums text-gray-800">{fc(p.totalCdf)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card
              title="Dernières ventes"
              action={
                <Link href="/dashboard/transactions" className="text-xs font-semibold text-[#0891b2] hover:underline">
                  Tout voir
                </Link>
              }
            >
              {data.recent.length === 0 ? (
                <Empty text="Aucune vente" />
              ) : (
                <ul className="divide-y divide-gray-50">
                  {data.recent.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 truncate">{s.ticketNum}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {format(new Date(s.createdAt), "EEE d MMM · HH:mm", { locale: fr })} · {PAYMENT[s.paymentMethod] ?? s.paymentMethod} ·{" "}
                          {s.cashier}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 tabular-nums">{fc(s.totalCdf)}</p>
                        <p className="text-[11px] text-gray-400 tabular-nums">{usd(s.totalUsd)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {m && (
              <Card
                title={`Stock faible (${m.lowStock.count})`}
                action={
                  <Link href="/dashboard/stock" className="text-xs font-semibold text-[#0891b2] hover:underline">
                    Voir le stock
                  </Link>
                }
              >
                {m.lowStock.count === 0 ? (
                  <Empty text="Aucun article en stock faible" />
                ) : (
                  <ul className="space-y-2">
                    {m.lowStock.items.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <Package size={14} className={p.quantity <= 0 ? "text-red-500" : "text-orange-500"} />
                        <span className="flex-1 truncate text-gray-800">{p.name}</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            p.quantity <= 0 ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          {p.quantity <= 0 ? "Rupture" : p.quantity.toLocaleString("fr-FR")}
                        </span>
                      </li>
                    ))}
                    {m.lowStock.count > m.lowStock.items.length && (
                      <li className="text-[11px] text-gray-400">+ {m.lowStock.count - m.lowStock.items.length} autres</li>
                    )}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Stat({
  label,
  icon,
  tone,
  value,
  sub,
  foot,
}: {
  label: string;
  icon: React.ReactNode;
  tone: string;
  value: string;
  sub: string;
  foot: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase font-bold tracking-wider text-gray-500">{label}</p>
        <span className={`p-2 rounded-lg ${tone}`}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 tabular-nums">{value}</p>
        {sub && <p className="text-sm font-semibold text-green-700 tabular-nums">{sub}</p>}
      </div>
      {foot && <div className="pt-2 border-t border-gray-100 text-xs">{foot}</div>}
    </div>
  );
}

function Card({
  title,
  action,
  className = "",
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SplitRow({ color, label, cdf, total, usd }: { color: string; label: string; cdf: number; total: number; usd: string | null }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="flex-1 text-gray-700">{label}</span>
      <span className="text-xs text-gray-400">{Math.round((cdf / total) * 100)} %</span>
      <div className="text-right">
        <p className="font-bold text-gray-900 tabular-nums">{fc(cdf)}</p>
        {usd && <p className="text-[11px] text-gray-400 tabular-nums">{usd}</p>}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 text-center py-6">{text}</p>;
}
