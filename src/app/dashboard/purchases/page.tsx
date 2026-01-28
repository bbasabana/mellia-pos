"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { DollarSign, Plus, Coins, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PurchaseHistoryList } from "@/components/purchases/PurchaseHistoryList";
import { InvestmentForm } from "@/components/stock/InvestmentForm";
import { Modal } from "@/components/ui/Modal";

export default function PurchasesPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editId, setEditId] = useState<string | undefined>(undefined);
    const [stats, setStats] = useState<any>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/investments");
            const data = await res.json();
            if (data.success) {
                setStats(data.data.stats);
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error("Error fetching investment stats:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Coins className="text-[#00d3fa]" />
                            Gestion des Achats & Investissements
                        </h1>
                        <p className="text-sm text-gray-500">Flux d&apos;approvisionnement intelligent (Produits & Consommables)</p>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* ACTION & KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="bg-[#000] text-white p-4 rounded-sm shadow-sm hover:bg-gray-800 transition-all flex flex-col items-center justify-center gap-2"
                        >
                            <Plus size={32} />
                            <span className="font-bold">Nouvel Achat</span>
                            <span className="text-[10px] uppercase opacity-80">Produit ou Fourniture</span>
                        </button>

                        <KpiCard
                            title="Total Investi (Mois)"
                            value={`${(stats?.monthTotal || 0).toLocaleString()} $`}
                            icon={<DollarSign />}
                            color="text-blue-500 bg-blue-50"
                        />
                        <KpiCard
                            title="Stock Revendable"
                            value={`${(stats?.monthVendable || 0).toLocaleString()} $`}
                            icon={<TrendingUp />}
                            color="text-green-500 bg-green-50"
                        />
                        <KpiCard
                            title="Charges (Consommables)"
                            value={`${(stats?.monthNonVendable || 0).toLocaleString()} $`}
                            icon={<Coins />}
                            color="text-orange-500 bg-orange-50"
                        />
                    </div>

                    {/* RECENT PURCHASES LIST */}
                    <div className="bg-white border border-gray-200 rounded-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Journal des Achats</h3>
                        </div>
                        <PurchaseHistoryList
                            key={refreshTrigger}
                            onEdit={(id) => {
                                setEditId(id);
                                setIsFormOpen(true);
                            }}
                        />
                    </div>
                </div>

                {/* MODAL FORM */}
                <Modal
                    isOpen={isFormOpen}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditId(undefined);
                    }}
                    title={editId ? "Modifier l'Achat" : "Nouvel Investissement (Achat Stock)"}
                    size="2xl"
                >
                    <InvestmentForm
                        editId={editId}
                        onSuccess={() => {
                            setIsFormOpen(false);
                            setEditId(undefined);
                            fetchData();
                        }}
                        onCancel={() => {
                            setIsFormOpen(false);
                            setEditId(undefined);
                        }}
                    />
                </Modal>
            </div>
        </DashboardLayout>
    );
}

function KpiCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-4 border border-gray-200 rounded-sm flex items-center justify-between">
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold">{title}</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className={cn("p-3 rounded-full", color)}>
                {icon}
            </div>
        </div>
    )
}
