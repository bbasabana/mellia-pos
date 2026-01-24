"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
    Plus,
    Filter,
    DollarSign,
    TrendingDown,
    ShoppingCart,
    Wallet,
    Calendar,
    MoreVertical,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    X,
    TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";

interface Summary {
    totalSales: number;
    totalExpenses: number;
    totalPurchases: number;
    balance: number;
    totalExpensesBoss: number;
    period: string;
}

interface Category {
    id: string;
    name: string;
}

interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    source: string;
    category: { name: string };
    user: { name: string };
}

export default function ExpensesPage() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("today");
    const [summary, setSummary] = useState<Summary | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        categoryId: "",
        source: "CASH_REGISTER",
        date: new Date().toISOString().split('T')[0]
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [sumRes, expRes, catRes] = await Promise.all([
                fetch(`/api/expenses/summary?period=${period}`),
                fetch(`/api/expenses?period=${period}`),
                fetch(`/api/expenses/categories`)
            ]);

            const sumData = await sumRes.json();
            const expData = await expRes.json();
            const catData = await catRes.json();

            if (sumData.success) {
                setSummary(sumData.data);
            } else {
                console.error("❌ [Expenses] Failed to fetch summary:", sumData.error, sumData.details, sumData.stack);
            }

            if (expData.success) setExpenses(expData.data);
            if (catData.success) setCategories(catData.data);
        } catch (error) {
            console.error("❌ [Expenses] Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount)
                })
            });

            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                setFormData({
                    description: "",
                    amount: "",
                    categoryId: "",
                    source: "CASH_REGISTER",
                    date: new Date().toISOString().split('T')[0]
                });
                fetchData();
                showToast("Dépense enregistrée avec succès", "success");
            } else {
                showToast("Erreur: " + data.error, "error");
            }
        } catch (error) {
            showToast("Une erreur est survenue", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <DollarSign className="text-[#00d3fa]" />
                            Gestion des Dépenses & Caisse
                        </h1>
                        <p className="text-sm text-gray-500">Suivi en temps réel des flux de trésorerie</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-sm border border-gray-200">
                            <span className="text-[10px] uppercase font-bold text-gray-400 px-2">Période</span>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="bg-white border border-gray-200 rounded-sm px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#00d3fa]"
                            >
                                <option value="today">Aujourd&apos;hui</option>
                                <option value="month">Ce mois</option>
                                <option value="year">Cette année</option>
                            </select>
                        </div>
                        <button
                            className="bg-[#000] text-white px-4 py-2.5 rounded-sm font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-all shadow-sm"
                            onClick={() => setShowModal(true)}
                        >
                            <Plus size={18} />
                            Nouvelle Dépense
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* Summary Cards */}
                    {loading && !summary ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="animate-spin text-[#00d3fa]" size={40} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard
                                title="Total Ventes"
                                value={formatCurrency(summary?.totalSales || 0)}
                                icon={<TrendingUp size={20} />}
                                color="text-[#71de00]"
                            />
                            <KpiCard
                                title="Dépenses Caisse"
                                value={formatCurrency(summary?.totalExpenses || 0)}
                                icon={<TrendingDown size={20} />}
                                color="text-red-500"
                            />
                            <KpiCard
                                title="Achats Caisse"
                                value={formatCurrency(summary?.totalPurchases || 0)}
                                icon={<ShoppingCart size={20} />}
                                color="text-orange-500"
                            />
                            <KpiCard
                                title="Solde en Caisse"
                                value={formatCurrency(summary?.balance || 0)}
                                icon={<Wallet size={20} />}
                                color="text-[#00d3fa]"
                            />
                        </div>
                    )}

                    {/* Expenses Table */}
                    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Historique des Flux</h3>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 border-b border-gray-100">Date</th>
                                    <th className="px-6 py-3 border-b border-gray-100">Description</th>
                                    <th className="px-6 py-3 border-b border-gray-100">Catégorie</th>
                                    <th className="px-6 py-3 border-b border-gray-100">Source</th>
                                    <th className="px-6 py-3 border-b border-gray-100">Auteur</th>
                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400 italic text-sm">
                                            <Loader2 className="animate-spin inline-block mr-2" size={16} /> Chargement des données...
                                        </td>
                                    </tr>
                                ) : expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400 italic text-sm">
                                            Aucune opération enregistrée pour cette période.
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-xs font-medium text-gray-600">
                                                {format(new Date(exp.date), "dd MMM yyyy", { locale: fr })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                                {exp.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 text-gray-600 rounded-sm">
                                                    {exp.category?.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase px-2 py-1 rounded-sm",
                                                    exp.source === "CASH_REGISTER" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                                )}>
                                                    {exp.source === "CASH_REGISTER" ? "Caisse Restaurant" : "Argent du Boss"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                                                {exp.user?.name}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-red-500">
                                                    {formatCurrency(exp.amount)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-sm shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-800 text-lg">Ajouter une dépense</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Description</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Carburant pour générateur"
                                            required
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-gray-400">Montant (USD)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-gray-400">Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Catégorie</label>
                                        <select
                                            required
                                            value={formData.categoryId}
                                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all appearance-none"
                                        >
                                            <option value="">Sélectionner...</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Source</label>
                                        <select
                                            value={formData.source}
                                            onChange={e => setFormData({ ...formData, source: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all appearance-none"
                                        >
                                            <option value="CASH_REGISTER">Caisse Restaurant</option>
                                            <option value="OWNER_CAPITAL">Argent du Boss</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        className="px-6 py-2 rounded-sm text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all border border-transparent"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2 bg-black text-white rounded-sm font-bold text-sm hover:bg-gray-800 transition-all shadow-md disabled:opacity-50"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Enregistrement..." : "Enregistrer"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function KpiCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-4 border border-gray-200 rounded-sm flex items-center justify-between shadow-sm">
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{title}</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className={cn("p-2.5 rounded-sm bg-gray-50 border border-gray-100", color)}>
                {icon}
            </div>
        </div>
    );
}
