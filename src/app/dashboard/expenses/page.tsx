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
    TrendingUp,
    PieChart
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
    category: { id: string, name: string };
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

    // Filters
    const [selectedCategory, setSelectedCategory] = useState("ALL");

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
                console.error("❌ [Expenses] Failed to fetch summary:", sumData.error);
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
        return new Intl.NumberFormat('fr-CD', {
            style: 'currency',
            currency: 'CDF',
            maximumFractionDigits: 0
        }).format(val).replace('CDF', 'FC');
    };

    // Filter Logic
    const filteredExpenses = selectedCategory === "ALL"
        ? expenses
        : expenses.filter(e => e.category?.id === selectedCategory);

    // Group Top Expenses
    const topExpenses = Object.values(expenses.reduce((acc: any, curr) => {
        const catName = curr.category?.name || "Autre";
        if (!acc[catName]) acc[catName] = { name: catName, total: 0, count: 0 };
        acc[catName].total += Number(curr.amount);
        acc[catName].count += 1;
        return acc;
    }, {})).sort((a: any, b: any) => b.total - a.total).slice(0, 5);

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50/50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <DollarSign className="text-[#00d3fa]" />
                            Gestion des Dépenses & Trésorerie
                        </h1>
                        <p className="text-sm text-gray-500">Suivi des flux financiers et du solde de caisse</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white p-1 rounded-sm border border-gray-200 shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-gray-400 px-2 flex items-center gap-1">
                                <Calendar size={12} /> Période
                            </span>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="bg-transparent border-l border-gray-100 px-3 py-1.5 text-xs font-bold text-gray-800 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <option value="today">Aujourd&apos;hui</option>
                                <option value="week">Cette Semaine</option>
                                <option value="month">Ce Mois</option>
                                <option value="year">Cette Année</option>
                            </select>
                        </div>
                        <button
                            className="bg-black text-white px-4 py-2 rounded-sm font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-all shadow-md active:scale-95"
                            onClick={() => setShowModal(true)}
                        >
                            <Plus size={16} />
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
                                title="Total Ventes (Caisse)"
                                value={formatCurrency(summary?.totalSales || 0)}
                                icon={<TrendingUp size={20} />}
                                color="bg-green-50 text-green-600 border-green-100"
                            />
                            <KpiCard
                                title="Dépenses payées par Caisse"
                                value={'- ' + formatCurrency(summary?.totalExpenses || 0)}
                                icon={<TrendingDown size={20} />}
                                color="bg-red-50 text-red-500 border-red-100"
                            />
                            <KpiCard
                                title="Achats payés par Caisse"
                                value={'- ' + formatCurrency(summary?.totalPurchases || 0)}
                                icon={<ShoppingCart size={20} />}
                                color="bg-orange-50 text-orange-500 border-orange-100"
                            />
                            <div className="bg-[#00d3fa] p-4 rounded-sm shadow-md flex flex-col justify-between text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform">
                                    <Wallet size={48} />
                                </div>
                                <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Solde Théorique Caisse</p>
                                <p className="text-2xl font-black mt-1 tracking-tight">
                                    {formatCurrency(summary?.balance || 0)}
                                </p>
                                <div className="mt-2 text-[10px] font-medium bg-white/20 inline-block px-2 py-0.5 rounded backdrop-blur-sm self-start">
                                    Total Caisse en FC
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT: Expenses Table */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Filters */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setSelectedCategory("ALL")}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-full border transition-all whitespace-nowrap",
                                        selectedCategory === "ALL"
                                            ? "bg-gray-800 text-white border-gray-800"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    Tout voir
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold rounded-full border transition-all whitespace-nowrap",
                                            selectedCategory === cat.id
                                                ? "bg-gray-800 text-white border-gray-800"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                        )}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                        <Filter size={14} className="text-gray-400" />
                                        Historique Détaillé
                                    </h3>
                                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-sm">
                                        {filteredExpenses.length} opérations
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-3 border-b border-gray-100">Date</th>
                                                <th className="px-6 py-3 border-b border-gray-100">Description</th>
                                                <th className="px-6 py-3 border-b border-gray-100">Catégorie</th>
                                                <th className="px-6 py-3 border-b border-gray-100">Source</th>
                                                <th className="px-6 py-3 border-b border-gray-100 text-right">Montant</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-12 text-gray-400 italic text-sm">
                                                        <Loader2 className="animate-spin inline-block mr-2" size={16} /> Chargement...
                                                    </td>
                                                </tr>
                                            ) : filteredExpenses.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-12 text-gray-400 italic text-sm">
                                                        Aucune dépense trouvée pour ce filtre.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredExpenses.map((exp) => (
                                                    <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                                                            {format(new Date(exp.date), "dd MMM HH:mm", { locale: fr })}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-800 font-bold group-hover:text-[#00d3fa] transition-colors">
                                                            {exp.description}
                                                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">Par {exp.user?.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 text-gray-600 rounded-sm border border-gray-200">
                                                                {exp.category?.name}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={cn(
                                                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                                                exp.source === "CASH_REGISTER"
                                                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                                                    : "bg-purple-50 text-purple-600 border-purple-100"
                                                            )}>
                                                                {exp.source === "CASH_REGISTER" ? "Caisse" : "Boss"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-black text-gray-800">
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
                        </div>

                        {/* RIGHT: Top Expenses & Stats */}
                        <div className="space-y-6">
                            <div className="bg-white border border-gray-200 rounded-sm p-5 shadow-sm">
                                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <PieChart size={16} className="text-gray-400" />
                                    Postes de Dépenses
                                </h3>

                                {topExpenses.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic text-center py-4">Pas de données</div>
                                ) : (
                                    <div className="space-y-4">
                                        {topExpenses.map((group: any, i: number) => (
                                            <div key={i} className="group">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold text-gray-700">{group.name}</span>
                                                    <span className="text-xs font-bold text-gray-900">{formatCurrency(group.total)}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-gray-800 h-full rounded-full group-hover:bg-[#00d3fa] transition-colors"
                                                        style={{ width: `${(group.total / (summary?.totalExpenses || 1)) * 100}%` }}
                                                    />
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5 text-right font-medium">
                                                    {group.count} opérations
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Info */}
                            <div className="bg-blue-50 border border-blue-100 rounded-sm p-4">
                                <h4 className="font-bold text-blue-800 text-xs uppercase mb-2">Note d&apos;information</h4>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Le <strong>Solde Caisse</strong> est calculé uniquement sur base des ventes encaissées en CASH et des dépenses sorties de la CAISSE. Les mouvements d&apos;argent du patron ne sont pas déduits du solde caisse.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-sm shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
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
                                            <label className="text-[10px] font-bold uppercase text-gray-400">Montant (FC)</label>
                                            <input
                                                type="number"
                                                step="1"
                                                required
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all font-bold"
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
                                            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Sélectionner...</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Source de fonds</label>
                                        <select
                                            value={formData.source}
                                            onChange={e => setFormData({ ...formData, source: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="CASH_REGISTER">Caisse Restaurant (Déduit du solde)</option>
                                            <option value="OWNER_CAPITAL">Argent du Boss (Non déduit)</option>
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
        <div className="bg-white p-4 border border-gray-200 rounded-sm flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{title}</p>
                <p className="text-lg font-black text-gray-900 mt-1">{value}</p>
            </div>
            <div className={cn("p-2.5 rounded-full border", color)}>
                {icon}
            </div>
        </div>
    );
}
