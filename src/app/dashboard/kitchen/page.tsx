"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
    Utensils,
    Clock,
    CheckCircle2,
    Flame,
    Truck,
    ShoppingBag,
    RotateCcw,
    ChefHat,
    Trash2,
    Loader2,
    CheckCheck,
    CalendarX,
    GlassWater,
    AlertTriangle,
    X,
    MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { showToast } from "@/components/ui/Toast";

type Status = "PENDING" | "IN_PREPARATION" | "READY" | "DELIVERED";

interface KitchenOrder {
    id: string;
    orderType: string;
    status: Status;
    createdAt: string;
    priority: number;
    sale: {
        ticketNum: string;
        items: {
            id: string;
            product: { name: string; type: string };
            quantity: number | string;
        }[];
        client?: { name: string } | null;
    };
}

type Filter = "ALL" | "PENDING" | "IN_PREPARATION" | "READY";

/** Bulk actions offered to managers; each one names exactly what it touches. */
type BulkAction = {
    id: "complete-all" | "delete-before-today" | "delete-drinks" | "delete-all";
    method: "PATCH" | "DELETE";
    scope: string;
    title: string;
    detail: string;
    confirm: string;
    danger: boolean;
    icon: typeof CheckCheck;
};

const BULK_ACTIONS: BulkAction[] = [
    {
        id: "complete-all",
        method: "PATCH",
        scope: "active",
        title: "Tout marquer comme servi",
        detail: "Vide l'écran sans rien supprimer : l'historique reste.",
        confirm: "Marquer servi",
        danger: false,
        icon: CheckCheck,
    },
    {
        id: "delete-before-today",
        method: "DELETE",
        scope: "before-today",
        title: "Supprimer les commandes d'avant aujourd'hui",
        detail: "Retire les vieux tickets qui encombrent la cuisine.",
        confirm: "Supprimer",
        danger: true,
        icon: CalendarX,
    },
    {
        id: "delete-drinks",
        method: "DELETE",
        scope: "drinks",
        title: "Supprimer les commandes sans plat",
        detail: "Tickets de boissons seules : rien à préparer en cuisine.",
        confirm: "Supprimer",
        danger: true,
        icon: GlassWater,
    },
    {
        id: "delete-all",
        method: "DELETE",
        scope: "all",
        title: "Tout supprimer",
        detail: "Efface toutes les commandes de la cuisine.",
        confirm: "Tout supprimer",
        danger: true,
        icon: Trash2,
    },
];

const STATUS_META: Record<Exclude<Status, "DELIVERED">, { label: string; dot: string; chip: string; bar: string }> = {
    PENDING: { label: "En attente", dot: "bg-red-500", chip: "bg-red-50 text-red-700 ring-red-100", bar: "bg-red-500" },
    IN_PREPARATION: { label: "En cours", dot: "bg-orange-500", chip: "bg-orange-50 text-orange-700 ring-orange-100", bar: "bg-orange-500" },
    READY: { label: "Prête", dot: "bg-green-500", chip: "bg-green-50 text-green-700 ring-green-100", bar: "bg-[#71de00]" },
};

const ORDER_TYPE: Record<string, { label: string; icon: typeof Utensils }> = {
    DINE_IN: { label: "Sur place", icon: Utensils },
    TAKEAWAY: { label: "À emporter", icon: ShoppingBag },
    DELIVERY: { label: "Livraison", icon: Truck },
};

function shortTicket(ticketNum: string) {
    return ticketNum.split("-")[1] || ticketNum;
}

function minutesSince(date: string, now: number) {
    return Math.max(0, Math.floor((now - new Date(date).getTime()) / 60000));
}

function formatElapsed(min: number) {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} h ${String(min % 60).padStart(2, "0")}`;
    return `${Math.floor(h / 24)} j`;
}

export default function KitchenPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const canManage = role === "ADMIN" || role === "MANAGER";

    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<Filter>("ALL");
    const [now, setNow] = useState(() => Date.now());
    const [busyId, setBusyId] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [pendingBulk, setPendingBulk] = useState<BulkAction | null>(null);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<KitchenOrder | null>(null);

    const fetchOrders = useCallback(async (manual = false) => {
        if (manual) setRefreshing(true);
        try {
            const res = await fetch("/api/kitchen/orders");
            const json = await res.json();
            if (json.success) setOrders(json.data);
        } catch (error) {
            console.error("Failed to fetch kitchen orders", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setNow(Date.now());
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const refresh = setInterval(() => fetchOrders(), 20000);
        const tick = setInterval(() => setNow(Date.now()), 30000);
        return () => {
            clearInterval(refresh);
            clearInterval(tick);
        };
    }, [fetchOrders]);

    const activeOrders = useMemo(() => orders.filter((o) => o.status !== "DELIVERED"), [orders]);

    const counts = useMemo(() => {
        const c = { ALL: activeOrders.length, PENDING: 0, IN_PREPARATION: 0, READY: 0, late: 0 };
        for (const o of activeOrders) {
            c[o.status as Exclude<Status, "DELIVERED">]++;
            if (o.status !== "READY" && minutesSince(o.createdAt, now) > 20) c.late++;
        }
        return c;
    }, [activeOrders, now]);

    const visibleOrders = useMemo(
        () => (filter === "ALL" ? activeOrders : activeOrders.filter((o) => o.status === filter)),
        [activeOrders, filter]
    );

    const updateStatus = async (id: string, status: Status) => {
        setBusyId(id);
        // Optimistic: the card moves at once, the server confirms.
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
        try {
            const res = await fetch(`/api/kitchen/orders/${id}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                showToast(data.error || "Erreur lors de la mise à jour", "error");
            }
        } catch {
            showToast("Erreur de connexion", "error");
        } finally {
            setBusyId(null);
            fetchOrders();
        }
    };

    const deleteOne = async () => {
        if (!orderToDelete) return;
        const id = orderToDelete.id;
        setBusyId(id);
        try {
            const res = await fetch(`/api/kitchen/orders/${id}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setOrders((prev) => prev.filter((o) => o.id !== id));
                showToast("Commande retirée de la cuisine", "success");
                setOrderToDelete(null);
            } else {
                showToast(data.error || "Erreur lors de la suppression", "error");
            }
        } catch {
            showToast("Erreur de connexion", "error");
        } finally {
            setBusyId(null);
        }
    };

    const runBulk = async () => {
        if (!pendingBulk) return;
        setBulkBusy(true);
        try {
            const res =
                pendingBulk.method === "DELETE"
                    ? await fetch(`/api/kitchen/orders?scope=${pendingBulk.scope}`, { method: "DELETE" })
                    : await fetch(`/api/kitchen/orders`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ scope: pendingBulk.scope }),
                      });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                const n = data.count ?? 0;
                showToast(
                    pendingBulk.method === "DELETE"
                        ? `${n} commande${n > 1 ? "s" : ""} supprimée${n > 1 ? "s" : ""}`
                        : `${n} commande${n > 1 ? "s" : ""} marquée${n > 1 ? "s" : ""} servie${n > 1 ? "s" : ""}`,
                    "success"
                );
                setPendingBulk(null);
                fetchOrders();
            } else {
                showToast(data.error || "Action impossible", "error");
            }
        } catch {
            showToast("Erreur de connexion", "error");
        } finally {
            setBulkBusy(false);
        }
    };

    const tabs: { id: Filter; label: string; count: number; dot?: string }[] = [
        { id: "ALL", label: "Toutes", count: counts.ALL },
        { id: "PENDING", label: "En attente", count: counts.PENDING, dot: STATUS_META.PENDING.dot },
        { id: "IN_PREPARATION", label: "En cours", count: counts.IN_PREPARATION, dot: STATUS_META.IN_PREPARATION.dot },
        { id: "READY", label: "Prêtes", count: counts.READY, dot: STATUS_META.READY.dot },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-5 min-h-full">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="ui-page-title flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                                <ChefHat size={20} />
                            </span>
                            Cuisine
                        </h1>
                        <p className="ui-page-subtitle mt-1">
                            Les plats à préparer, du plus ancien au plus récent. Mise à jour automatique.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => fetchOrders(true)} className="ui-btn-ghost">
                            <RotateCcw size={16} className={cn(refreshing && "animate-spin")} />
                            Actualiser
                        </button>
                        {canManage && (
                            <div className="relative">
                                <button
                                    onClick={() => setMenuOpen((v) => !v)}
                                    className="ui-btn-primary"
                                    aria-expanded={menuOpen}
                                >
                                    <MoreHorizontal size={16} />
                                    Nettoyer
                                </button>
                                {menuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                                        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl animate-fade-up">
                                            {BULK_ACTIONS.map((action) => (
                                                <button
                                                    key={action.id}
                                                    onClick={() => {
                                                        setMenuOpen(false);
                                                        setPendingBulk(action);
                                                    }}
                                                    className={cn(
                                                        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                                                        action.danger ? "hover:bg-red-50" : "hover:bg-gray-50"
                                                    )}
                                                >
                                                    <action.icon
                                                        size={17}
                                                        className={cn("mt-0.5 shrink-0", action.danger ? "text-red-500" : "text-green-600")}
                                                    />
                                                    <span>
                                                        <span className={cn("block text-sm font-semibold", action.danger ? "text-red-700" : "text-gray-900")}>
                                                            {action.title}
                                                        </span>
                                                        <span className="block text-xs text-gray-500">{action.detail}</span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex max-w-full overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={cn(
                                    "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                                    filter === tab.id ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
                                )}
                            >
                                {tab.dot && <span className={cn("h-2 w-2 rounded-full", tab.dot)} />}
                                {tab.label}
                                <span
                                    className={cn(
                                        "min-w-[1.5rem] rounded-full px-1.5 text-xs tabular-nums",
                                        filter === tab.id ? "bg-white/15 text-white" : "bg-gray-100 text-gray-600"
                                    )}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                    {counts.late > 0 && (
                        <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-100">
                            <AlertTriangle size={15} />
                            {counts.late} en retard (+20 min)
                        </div>
                    )}
                </div>

                {/* Orders */}
                {loading ? (
                    <div className="flex flex-1 items-center justify-center py-24 text-gray-400">
                        <Loader2 className="mr-2 animate-spin" size={18} /> Chargement des commandes…
                    </div>
                ) : visibleOrders.length === 0 ? (
                    <div className="ui-card flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                            <ChefHat size={30} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {filter === "ALL" ? "Aucune commande en cours" : "Rien dans cette colonne"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">Tout est calme en cuisine pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {visibleOrders.map((order) => {
                            const meta = STATUS_META[order.status as Exclude<Status, "DELIVERED">];
                            const type = ORDER_TYPE[order.orderType] || ORDER_TYPE.DINE_IN;
                            const food = order.sale.items.filter((i) => i.product.type === "FOOD");
                            const others = order.sale.items.filter((i) => i.product.type !== "FOOD");
                            const elapsed = minutesSince(order.createdAt, now);
                            const late = order.status !== "READY" && elapsed > 20;
                            const busy = busyId === order.id;

                            return (
                                <article
                                    key={order.id}
                                    className={cn(
                                        "ui-card relative flex flex-col overflow-hidden transition-shadow hover:shadow-md animate-fade-up",
                                        late && "ring-1 ring-red-200"
                                    )}
                                >
                                    <span className={cn("absolute inset-x-0 top-0 h-1", meta.bar)} />

                                    <header className="flex items-start justify-between gap-3 px-4 pt-4">
                                        <div className="min-w-0">
                                            <div className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
                                                #{shortTicket(order.sale.ticketNum)}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                                <span className="inline-flex items-center gap-1">
                                                    <type.icon size={13} /> {type.label}
                                                </span>
                                                <span className={cn("inline-flex items-center gap-1 tabular-nums", late && "font-semibold text-red-600")}>
                                                    <Clock size={13} /> {formatElapsed(elapsed)}
                                                </span>
                                            </div>
                                            {order.sale.client?.name && (
                                                <div className="mt-1 truncate text-xs font-medium text-gray-600">{order.sale.client.name}</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className={cn("ui-chip ring-1", meta.chip)}>
                                                <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                                                {meta.label}
                                            </span>
                                            {canManage && (
                                                <button
                                                    onClick={() => setOrderToDelete(order)}
                                                    disabled={busy}
                                                    className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600"
                                                    title="Supprimer la commande"
                                                    aria-label="Supprimer la commande"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </header>

                                    <ul className="mx-4 my-3 flex-1 space-y-1.5 border-t border-dashed border-gray-200 pt-3">
                                        {(food.length > 0 ? food : order.sale.items).map((item) => (
                                            <li key={item.id} className="flex items-baseline gap-2 text-[15px]">
                                                <span className="min-w-[2rem] rounded-md bg-gray-100 px-1.5 text-center text-sm font-bold tabular-nums text-gray-900">
                                                    {Number(item.quantity)}
                                                </span>
                                                <span className="font-medium text-gray-900">{item.product.name}</span>
                                            </li>
                                        ))}
                                        {food.length > 0 && others.length > 0 && (
                                            <li className="flex items-center gap-1.5 pt-1 text-xs text-gray-400">
                                                <GlassWater size={12} />
                                                + {others.length} boisson{others.length > 1 ? "s" : ""} / autre{others.length > 1 ? "s" : ""}
                                            </li>
                                        )}
                                    </ul>

                                    <footer className="px-4 pb-4">
                                        {order.status === "PENDING" && (
                                            <button
                                                onClick={() => updateStatus(order.id, "IN_PREPARATION")}
                                                disabled={busy}
                                                className="ui-btn w-full bg-orange-500 py-3 text-white hover:bg-orange-600"
                                            >
                                                <Flame size={16} /> Lancer la préparation
                                            </button>
                                        )}
                                        {order.status === "IN_PREPARATION" && (
                                            <button
                                                onClick={() => updateStatus(order.id, "READY")}
                                                disabled={busy}
                                                className="ui-btn w-full bg-green-600 py-3 text-white hover:bg-green-700"
                                            >
                                                <CheckCircle2 size={16} /> Marquer prête
                                            </button>
                                        )}
                                        {order.status === "READY" && (
                                            <button
                                                onClick={() => updateStatus(order.id, "DELIVERED")}
                                                disabled={busy}
                                                className="ui-btn-primary w-full py-3"
                                            >
                                                <CheckCheck size={16} /> Servie
                                            </button>
                                        )}
                                    </footer>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Confirm: one order */}
            {orderToDelete && (
                <ConfirmDialog
                    title={`Supprimer la commande #${shortTicket(orderToDelete.sale.ticketNum)} ?`}
                    detail="Elle disparaît de la cuisine. La vente, le paiement et le stock ne changent pas."
                    confirmLabel="Supprimer"
                    danger
                    busy={busyId === orderToDelete.id}
                    onCancel={() => setOrderToDelete(null)}
                    onConfirm={deleteOne}
                />
            )}

            {/* Confirm: bulk */}
            {pendingBulk && (
                <ConfirmDialog
                    title={`${pendingBulk.title} ?`}
                    detail={`${pendingBulk.detail} Les ventes, les paiements et le stock ne changent pas.`}
                    confirmLabel={pendingBulk.confirm}
                    danger={pendingBulk.danger}
                    busy={bulkBusy}
                    onCancel={() => setPendingBulk(null)}
                    onConfirm={runBulk}
                />
            )}
        </DashboardLayout>
    );
}

function ConfirmDialog({
    title,
    detail,
    confirmLabel,
    danger,
    busy,
    onCancel,
    onConfirm,
}: {
    title: string;
    detail: string;
    confirmLabel: string;
    danger?: boolean;
    busy?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/40 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-fade-up">
                <div className="flex items-start justify-between">
                    <div
                        className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-xl",
                            danger ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                        )}
                    >
                        {danger ? <Trash2 size={20} /> : <CheckCheck size={20} />}
                    </div>
                    <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Fermer">
                        <X size={18} />
                    </button>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-1.5 text-sm text-gray-500">{detail}</p>
                <div className="mt-6 flex gap-2">
                    <button onClick={onCancel} disabled={busy} className="ui-btn-ghost flex-1">
                        Annuler
                    </button>
                    <button onClick={onConfirm} disabled={busy} className={cn("flex-1", danger ? "ui-btn-danger" : "ui-btn-primary")}>
                        {busy && <Loader2 size={16} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
