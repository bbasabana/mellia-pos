"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  Package,
  BarChart3,
  Settings,
  Loader2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as any)?.role || "CASHIER";

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
        setActivity(data.data.activity);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { href: "/dashboard/pos", Icon: ShoppingCart, label: "Nouvelle Vente", variant: "primary", roles: ["ADMIN", "MANAGER", "CASHIER"] },
    { href: "/dashboard/clients", Icon: Users, label: "Clients", roles: ["ADMIN", "MANAGER", "CASHIER"] },
    { href: "/dashboard/products", Icon: UtensilsCrossed, label: "Produits", roles: ["ADMIN", "MANAGER"] },
    { href: "/dashboard/stock", Icon: Package, label: "Stock", roles: ["ADMIN", "MANAGER"] },
    { href: "/dashboard/reports", Icon: BarChart3, label: "Rapports", roles: ["ADMIN"] },
    { href: "/dashboard/settings", Icon: Settings, label: "Paramètres", roles: ["ADMIN"] },
  ];

  const allowedActions = quickActions.filter(action => action.roles.includes(userRole));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-[#00d3fa] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full h-full flex flex-col p-8 overflow-y-auto bg-gray-50/50">

        {/* WELCOME SECTION */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">
            Bonjour, {session?.user?.name || "L'Équipe"}! 👋
          </h1>
          <p className="text-sm text-gray-500">
            Aperçu de l&apos;activité du {format(new Date(), "dd MMMM yyyy", { locale: fr })}
          </p>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Ventes Aujourd'hui"
            value={stats?.salesCount || 0}
            icon={<CreditCard size={20} />}
            color="bg-blue-50 text-blue-600 border-blue-100"
            footer="Commandes finalisées"
          />
          <KpiCard
            title="Chiffre d'Affaires"
            value={`${stats?.salesTotal?.toLocaleString() || 0} USD`}
            icon={<DollarSign size={20} />}
            color="bg-green-50 text-green-600 border-green-100"
            trend={{ value: "Net", direction: "up" }}
          />
          <KpiCard
            title="Panier Moyen"
            value={`${stats?.avgTicket?.toFixed(2) || 0} USD`}
            icon={<TrendingUp size={20} />}
            color="bg-purple-50 text-purple-600 border-purple-100"
            footer="Par commande"
          />
          <KpiCard
            title="Stock Alertes"
            value={stats?.lowStockCount || 0}
            icon={<AlertTriangle size={20} />}
            color="bg-orange-50 text-orange-600 border-orange-100"
            footer="Articles faibles"
          />
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COL: QUICK ACTIONS */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#00d3fa] rounded-full"></span>
                Accès Rapide
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {allowedActions.map((action) => (
                  <Link key={action.href} href={action.href}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-200 group
                                    ${action.variant === 'primary'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 hover:bg-blue-700'
                        : 'bg-white text-gray-600 border-gray-100 hover:border-[#00d3fa] hover:shadow-md'
                      }`}
                  >
                    <div className={`p-3 rounded-full mb-3 transition-transform group-hover:scale-110 
                                    ${action.variant === 'primary' ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-500 group-hover:text-[#00d3fa] group-hover:bg-[#00d3fa]/10'}`}>
                      <action.Icon size={24} />
                    </div>
                    <span className="font-medium text-sm">{action.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COL: RECENT ACTIVITY */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-fit">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              Activité Récente
            </h2>
            <div className="space-y-4">
              {activity.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Aucune activité récente</p>
              ) : (
                activity.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="p-2 bg-gray-50 rounded-full text-gray-500 mt-1">
                      <CreditCard size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500">Par {item.user}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm font-bold text-green-600">{item.value}</p>
                      {/* <p className="text-[10px] text-gray-400">{format(new Date(item.time), 'HH:mm')}</p> */}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 text-center">
              <Link href="/dashboard/reports" className="text-sm text-[#00d3fa] font-medium hover:underline">
                Voir tout l&apos;historique
              </Link>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
