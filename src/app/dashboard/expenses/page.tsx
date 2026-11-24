"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    ArrowRight,
    Edit,
    Loader2,
    PieChart,
    Plus,
    Receipt,
    Search,
    Store,
    Trash2,
    TrendingDown,
    UserRound,
    Wallet,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { kinshasaDateStr, kinshasaTodayStr } from "@/components/purchases/purchase-format";
import { fc, usd } from "@/components/caisse/MoneyCount";
import { Pager } from "@/components/ui/Pager";

type Category = { id: string; name: string };
type Expense = {
    id: string;
    description: string;
    amount: number | string;
    date: string;
    source: "CASH_REGISTER" | "OWNER_CAPITAL";
    category: Category;
    user: { name: string };
};
type Source = "ALL" | "CASH_REGISTER" | "OWNER_CAPITAL";

const PERIODS = [
    { id: "today", label: "Aujourd'hui" },
    { id: "week", label: "Semaine" },
    { id: "month", label: "Mois" },
    { id: "current", label: "Depuis la clôture" },
    { id: "all", label: "Tout" },
];
const PAGE_SIZE = 12;

const SOURCE_LABEL: Record<Expense["source"], string> = {
    CASH_REGISTER: "Caisse",
    OWNER_CAPITAL: "Patron",
};

export default function ExpensesPage() {
    const { data: session } = useSession();
    const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

    const [period, setPeriod] = useState("current");
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [rate, setRate] = useState(2850);
    const [loading, setLoading] = useState(true);

    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("ALL");
    const [source, setSource] = useState<Source>("ALL");
    const [page, setPage] = useState(1);

    const [editing, setEditing] = useState<Expense | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleting, setDeleting] = useState<Expense | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [expRes, catRes] = await Promise.all([
                fetch(`/api/expenses?period=${period}`),
                fetch("/api/expenses/categories"),
            ]);
            const [expJson, catJson] = await Promise.all([expRes.json(), catRes.json()]);
            if (expJson.success) setExpenses(expJson.data);
            // Count corrections live in the Caisse menu, not here.
            if (catJson.success) setCategories(catJson.data.filter((c: Category) => !/ajustement/i.test(c.name)));
        } catch {
            showToast("Impossible de charger les dépenses", "error");
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        fetch("/api/exchange-rate")
            .then((r) => r.json())
            .then((j) => j.success && setRate(Number(j.data.rateUsdToCdf) || 2850))
            .catch(() => undefined);
    }, []);

    useEffect(() => setPage(1), [period, query, category, source]);

    const amount = (e: Expense) => Number(e.amount) || 0;

    const totals = useMemo(() => {
        const t = { all: 0, caisse: 0, patron: 0 };
        for (const e of expenses) {
            t.all += amount(e);
            if (e.source === "OWNER_CAPITAL") t.patron += amount(e);
            else t.caisse += amount(e);
        }
        return t;
    }, [expenses]);

    const byCategory = useMemo(() => {
        const map = new Map<string, { name: string; total: number; count: number }>();
        for (const e of expenses) {
            const name = e.category?.name ?? "Autre";
            const row = map.get(name) ?? { name, total: 0, count: 0 };
            row.total += amount(e);
            row.count += 1;
            map.set(name, row);
        }
        return [...map.values()].sort((a, b) => b.total - a.total);
    }, [expenses]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return expenses.filter(
            (e) =>
                (category === "ALL" || e.category?.id === category) &&
                (source === "ALL" || e.source === source) &&
                (!q || e.description.toLowerCase().includes(q) || e.category?.name.toLowerCase().includes(q))
        );
    }, [expenses, query, category, source]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const filteredTotal = filtered.reduce((s, e) => s + amount(e), 0);

    const remove = async () => {
        if (!deleting) return;
        setBusy(true);
        try {
            const res = await fetch(`/api/expenses?id=${deleting.id}`, { method: "DELETE" });
            const json = await res.json().catch(() => ({ success: false }));
            if (!json.success) throw new Error(json.error || "Suppression impossible");
            showToast("Dépense supprimée", "success");
            setDeleting(null);
            load();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Suppression impossible", "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                    <div>
                        <h1 className="ui-page-title flex items-center gap-2.5">
                            <TrendingDown className="text-[#ff4900]" />
                            Dépenses
                        </h1>
                        <p className="ui-page-subtitle mt-1">Transport, carburant, petites courses… et qui les a payées.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex rounded-lg bg-gray-100 p-1 overflow-x-auto">
                            {PERIODS.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setPeriod(p.id)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors",
                                        period === p.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(null);
                                setFormOpen(true);
                            }}
                            className="ui-btn-primary"
                        >
                            <Plus size={16} /> Nouvelle dépense
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Kpi label="Total des dépenses" value={fc(totals.all)} sub={usd(totals.all / rate)} icon={<Receipt size={18} />} tone="bg-gray-900 text-white" />
                    <Kpi
                        label="Payées par la caisse"
                        value={fc(totals.caisse)}
                        sub="Retirées du solde de caisse"
                        icon={<Store size={18} />}
                        tone="bg-red-50 text-red-600"
                    />
                    <Kpi
                        label="Payées par le patron"
                        value={fc(totals.patron)}
                        sub="Son argent : non retiré"
                        icon={<UserRound size={18} />}
                        tone="bg-purple-50 text-purple-600"
                    />
                    <Kpi
                        label="Opérations"
                        value={String(expenses.length)}
                        sub={byCategory[0] ? `Poste principal : ${byCategory[0].name}` : "—"}
                        icon={<PieChart size={18} />}
                        tone="bg-blue-50 text-blue-600"
                    />
                </div>

                <Link
                    href="/dashboard/caisse"
                    className="ui-card px-4 py-3 flex items-center justify-between gap-3 hover:border-gray-300 transition-colors"
                >
                    <span className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="h-8 w-8 rounded-lg bg-[#00d3fa]/10 text-[#0891b2] flex items-center justify-center shrink-0">
                            <Wallet size={16} />
                        </span>
                        <span>
                            Le solde de caisse, le comptage de l&apos;argent ($ et FC), le démarrage et la clôture du mois sont dans le
                            menu <strong className="text-gray-900">Caisse</strong>.
                        </span>
                    </span>
                    <ArrowRight size={16} className="text-gray-400 shrink-0" />
                </Link>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    {/* List */}
                    <div className="xl:col-span-2 ui-card overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:flex-wrap gap-2">
                            <div className="relative flex-1 min-w-[220px]">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Rechercher une dépense…"
                                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-gray-900"
                                />
                            </div>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:border-gray-900"
                                aria-label="Catégorie"
                            >
                                <option value="ALL">Toutes les catégories</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex rounded-lg bg-gray-100 p-1">
                                {(["ALL", "CASH_REGISTER", "OWNER_CAPITAL"] as Source[]).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSource(s)}
                                        className={cn(
                                            "px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap",
                                            source === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                                        )}
                                    >
                                        {s === "ALL" ? "Tous" : SOURCE_LABEL[s]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="animate-spin text-gray-400" size={28} />
                            </div>
                        ) : shown.length === 0 ? (
                            <div className="py-16 text-center text-sm text-gray-400">
                                <Receipt size={32} strokeWidth={1.5} className="mx-auto mb-2" />
                                Aucune dépense pour ces filtres.
                            </div>
                        ) : (
                            <>
                                {/* Desktop */}
                                <table className="hidden md:table w-full text-sm">
                                    <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                                            <th className="text-left px-4 py-2.5 font-semibold">Dépense</th>
                                            <th className="text-left px-4 py-2.5 font-semibold">Payé par</th>
                                            <th className="text-right px-4 py-2.5 font-semibold">Montant</th>
                                            <th className="px-4 py-2.5" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {shown.map((e) => (
                                            <tr key={e.id} className="group hover:bg-gray-50/60">
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                                    {format(new Date(e.date), "d MMM", { locale: fr })}
                                                    <div className="text-[11px] text-gray-400">{format(new Date(e.date), "HH:mm")}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900">{e.description}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {e.category?.name} · {e.user?.name}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <SourceChip source={e.source} />
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">{fc(amount(e))}</td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <RowActions
                                                        canDelete={isAdmin}
                                                        onEdit={() => {
                                                            setEditing(e);
                                                            setFormOpen(true);
                                                        }}
                                                        onDelete={() => setDeleting(e)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {/* Mobile */}
                                <ul className="md:hidden divide-y divide-gray-100">
                                    {shown.map((e) => (
                                        <li key={e.id} className="px-4 py-3 flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 text-sm">{e.description}</p>
                                                <p className="text-xs text-gray-400">
                                                    {format(new Date(e.date), "d MMM HH:mm", { locale: fr })} · {e.category?.name}
                                                </p>
                                                <div className="mt-1.5">
                                                    <SourceChip source={e.source} />
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-semibold tabular-nums text-sm">{fc(amount(e))}</p>
                                                <RowActions
                                                    canDelete={isAdmin}
                                                    onEdit={() => {
                                                        setEditing(e);
                                                        setFormOpen(true);
                                                    }}
                                                    onDelete={() => setDeleting(e)}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 text-xs text-gray-500">
                            <span>
                                {filtered.length} dépense{filtered.length > 1 ? "s" : ""} · {fc(filteredTotal)}
                            </span>
                            <Pager page={page} pages={pages} onPage={setPage} />
                        </div>
                    </div>

                    {/* By category */}
                    <div className="ui-card p-5 self-start">
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <PieChart size={16} className="text-gray-400" />
                            Postes de dépenses
                        </p>
                        {byCategory.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">Pas de données</p>
                        ) : (
                            <div className="space-y-4">
                                {byCategory.map((c) => {
                                    const pct = totals.all > 0 ? Math.max(0, (c.total / totals.all) * 100) : 0;
                                    return (
                                        <div key={c.name}>
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-gray-700">{c.name}</span>
                                                <span className="font-semibold tabular-nums">{fc(c.total)}</span>
                                            </div>
                                            <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                <div className="h-full rounded-full bg-[#ff4900]" style={{ width: `${pct}%` }} />
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                {c.count} opération{c.count > 1 ? "s" : ""} · {pct.toFixed(0)} %
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {formOpen && (
                <ExpenseForm
                    expense={editing}
                    categories={categories}
                    rate={rate}
                    onClose={() => setFormOpen(false)}
                    onSaved={() => {
                        setFormOpen(false);
                        load();
                    }}
                />
            )}

            <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Supprimer la dépense ?" size="sm">
                {deleting && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            <strong>{deleting.description}</strong> — {fc(amount(deleting))}. Cette action est définitive.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setDeleting(null)} className="ui-btn-ghost">
                                Annuler
                            </button>
                            <button type="button" onClick={remove} disabled={busy} className="ui-btn-danger">
                                {busy && <Loader2 size={14} className="animate-spin" />}
                                Supprimer
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
}

function Kpi({ label, value, sub, icon, tone }: { label: string; value: string; sub: string; icon: React.ReactNode; tone: string }) {
    return (
        <div className="ui-card p-4">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <span className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", tone)}>{icon}</span>
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-400 truncate">{sub}</p>
        </div>
    );
}

function SourceChip({ source }: { source: Expense["source"] }) {
    return source === "OWNER_CAPITAL" ? (
        <span className="ui-chip bg-purple-50 text-purple-700">
            <UserRound size={11} /> Patron
        </span>
    ) : (
        <span className="ui-chip bg-blue-50 text-blue-700">
            <Store size={11} /> Caisse
        </span>
    );
}

function RowActions({ canDelete, onEdit, onDelete }: { canDelete: boolean; onEdit: () => void; onDelete: () => void }) {
    return (
        <span className="inline-flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={onEdit} className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50" aria-label="Modifier">
                <Edit size={14} />
            </button>
            {canDelete && (
                <button type="button" onClick={onDelete} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label="Supprimer">
                    <Trash2 size={14} />
                </button>
            )}
        </span>
    );
}

function ExpenseForm({
    expense,
    categories,
    rate,
    onClose,
    onSaved,
}: {
    expense: Expense | null;
    categories: Category[];
    rate: number;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [description, setDescription] = useState(expense?.description ?? "");
    const [currency, setCurrency] = useState<"CDF" | "USD">("CDF");
    const [amountText, setAmountText] = useState(expense ? String(Number(expense.amount)) : "");
    const [categoryId, setCategoryId] = useState(expense?.category?.id ?? "");
    const [source, setSource] = useState<Expense["source"]>(expense?.source ?? "CASH_REGISTER");
    const [date, setDate] = useState(expense ? kinshasaDateStr(expense.date) : kinshasaTodayStr());
    const [saving, setSaving] = useState(false);

    const raw = Number(amountText.replace(",", ".")) || 0;
    const amountCdf = Math.round(currency === "USD" ? raw * rate : raw);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amountCdf <= 0 || !categoryId || !description.trim()) {
            showToast("Description, montant et catégorie sont obligatoires", "error");
            return;
        }
        setSaving(true);
        try {
            const note = currency === "USD" ? ` (${raw.toLocaleString("fr-FR")} $ au taux ${rate.toLocaleString("fr-FR")})` : "";
            const res = await fetch("/api/expenses", {
                method: expense ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: expense?.id,
                    description: description.trim() + note,
                    amount: amountCdf,
                    categoryId,
                    source,
                    date,
                }),
            });
            const json = await res.json().catch(() => ({ success: false, error: "Erreur" }));
            if (!json.success) throw new Error(json.error || "Enregistrement impossible");
            showToast(expense ? "Dépense modifiée" : "Dépense enregistrée", "success");
            onSaved();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Enregistrement impossible", "error");
        } finally {
            setSaving(false);
        }
    };

    const field = "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-900";

    return (
        <Modal isOpen onClose={onClose} title={expense ? "Modifier la dépense" : "Nouvelle dépense"} size="md">
            <form onSubmit={submit} className="space-y-4">
                <label className="block">
                    <span className="text-xs font-medium text-gray-600">Description</span>
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex : Transport pour les achats"
                        required
                        autoFocus
                        className={cn(field, "mt-1")}
                    />
                </label>

                <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className="text-xs font-medium text-gray-600">Montant</span>
                        <div className="mt-1 flex rounded-lg border border-gray-200 focus-within:border-gray-900 overflow-hidden">
                            <input
                                inputMode="decimal"
                                value={amountText}
                                onChange={(e) => setAmountText(e.target.value.replace(/[^0-9.,]/g, ""))}
                                placeholder="0"
                                className="w-full px-3 py-2.5 text-sm font-semibold outline-none tabular-nums"
                            />
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as "CDF" | "USD")}
                                className="bg-gray-50 border-l border-gray-200 px-2 text-xs font-semibold outline-none"
                                aria-label="Devise"
                            >
                                <option value="CDF">FC</option>
                                <option value="USD">$</option>
                            </select>
                        </div>
                        {currency === "USD" && raw > 0 && <span className="text-[11px] text-gray-500">= {fc(amountCdf)}</span>}
                    </label>
                    <label className="block">
                        <span className="text-xs font-medium text-gray-600">Date</span>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={cn(field, "mt-1")} />
                    </label>
                </div>

                <label className="block">
                    <span className="text-xs font-medium text-gray-600">Catégorie</span>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={cn(field, "mt-1 bg-white")}>
                        <option value="">Choisir…</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>

                <div>
                    <span className="text-xs font-medium text-gray-600">Qui a payé ?</span>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                        <SourceOption
                            active={source === "CASH_REGISTER"}
                            onClick={() => setSource("CASH_REGISTER")}
                            icon={<Store size={16} />}
                            title="La caisse"
                            text="Retiré du solde de caisse"
                        />
                        <SourceOption
                            active={source === "OWNER_CAPITAL"}
                            onClick={() => setSource("OWNER_CAPITAL")}
                            icon={<UserRound size={16} />}
                            title="Mon argent (patron)"
                            text="Non retiré de la caisse"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button type="button" onClick={onClose} className="ui-btn-ghost">
                        Annuler
                    </button>
                    <button type="submit" disabled={saving} className="ui-btn-primary">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {expense ? "Mettre à jour" : "Enregistrer"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function SourceOption({
    active,
    onClick,
    icon,
    title,
    text,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "text-left rounded-lg border p-3 transition-colors",
                active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:border-gray-300"
            )}
        >
            <span className="flex items-center gap-2 text-sm font-semibold">
                {icon}
                {title}
            </span>
            <span className={cn("block text-[11px] mt-0.5", active ? "text-white/70" : "text-gray-400")}>{text}</span>
        </button>
    );
}
