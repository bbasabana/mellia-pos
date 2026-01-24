"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { DollarSign, Plus, Coins, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PurchaseHistoryList } from "@/components/purchases/PurchaseHistoryList";
import { InvestmentForm } from "@/components/stock/InvestmentForm";
import { Modal } from "@/components/ui/Modal";

export default function PurchasesPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);

    // ... (rest of component)

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Coins className="text-[#00d3fa]" />
                            Achats & Appros (Module 4)
                        </h1>
                        <p className="text-sm text-gray-500">Gérez les achats, dépenses et l&apos;alimentation du stock.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* ACTION & KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="bg-[#71de00] text-white p-4 rounded-sm shadow-sm hover:opacity-90 transition-all flex flex-col items-center justify-center gap-2"
                        >
                            <Plus size={32} />
                            <span className="font-bold">Nouvel Achat / Invest.</span>
                            <span className="text-[10px] uppercase opacity-80">(CDF ou USD)</span>
                        </button>

                        <KpiCard title="Investi ce mois" value="0 $" icon={<DollarSign />} color="text-blue-500 bg-blue-50" />
                        <KpiCard title="Dépenses Sèches" value="0 $" icon={<Coins />} color="text-orange-500 bg-orange-50" />
                        <KpiCard title="ROI Prévisionnel" value="+0 %" icon={<TrendingUp />} color="text-green-500 bg-green-50" />
                    </div>

                    {/* RECENT PURCHASES LIST */}
                    <div className="bg-white border border-gray-200 rounded-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Journal des Achats</h3>
                        </div>
                        <PurchaseHistoryList />
                    </div>
                </div>

                {/* MODAL FORM */}
                <Modal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    title="Nouvel Investissement (Achat Stock)"
                    size="2xl"
                >
                    <InvestmentForm onSuccess={() => setIsFormOpen(false)} />
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
