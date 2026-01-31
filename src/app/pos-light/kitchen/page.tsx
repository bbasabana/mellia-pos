"use client";

import { useEffect, useState } from "react";
import LightLayout from "@/components/layout/LightLayout";
import { Utensils, Clock, CheckCircle, Flame, Truck, ShoppingBag, RotateCcw, ChefHat, Trash2, Loader2, AlertCircle, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { showToast } from "@/components/ui/Toast";
import { useCallback } from "react";

interface KitchenOrder {
    id: string;
    ticketNum: string;
    orderType: string;
    status: 'PENDING' | 'IN_PREPARATION' | 'READY' | 'DELIVERED';
    createdAt: string;
    priority: number;
    sale: {
        ticketNum: string;
        items: {
            id: string;
            product: {
                name: string;
                type: string;
            };
            quantity: number;
            saleUnit: string;
        }[];
        client?: {
            name: string;
        };
    };
}

export default function KitchenLightPage() {
    const { data: session } = useSession();
    const isAdmin = (session?.user as any)?.role === "ADMIN";

    const [activeTab, setActiveTab] = useState<'active' | 'today' | 'past'>('active');
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<KitchenOrder | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/kitchen/orders?type=${activeTab}`);
            const json = await res.json();
            if (json.success) {
                setOrders(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch kitchen orders", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        if (activeTab === 'active') {
            const interval = setInterval(fetchOrders, 30000);
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchOrders]);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/kitchen/orders/${id}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                fetchOrders();
            } else {
                const errorData = await res.json();
                showToast(errorData.error || "Erreur lors de la mise à jour", "error");
            }
        } catch (error) {
            showToast("Erreur de connexion", "error");
        }
    };

    const handleDeleteOrder = async () => {
        if (!orderToDelete) return;
        setDeletingId(orderToDelete.id);
        try {
            const res = await fetch(`/api/kitchen/orders/${orderToDelete.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                showToast("Commande supprimée", "success");
                fetchOrders();
                setIsDeleteModalOpen(false);
                setOrderToDelete(null);
            }
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PENDING': return 'border-red-500 bg-red-50/30';
            case 'IN_PREPARATION': return 'border-orange-500 bg-orange-50/30';
            case 'READY': return 'border-green-500 bg-green-50/30';
            case 'DELIVERED': return 'border-gray-200 bg-gray-50';
            default: return 'border-gray-200 bg-white';
        }
    };

    if (!hasMounted) return null;

    return (
        <LightLayout>
            <div className="h-full flex flex-col bg-gray-50 overflow-hidden px-4 py-4">
                {/* Tabs */}
                <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            "px-6 py-3 font-black uppercase tracking-widest text-[10px] rounded-sm transition-all flex items-center gap-2",
                            activeTab === 'active' ? "bg-orange-600 text-white shadow-lg shadow-orange-100" : "bg-white text-gray-400 border border-gray-100"
                        )}
                    >
                        <Flame size={14} />
                        Actives
                        <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-[8px]", activeTab === 'active' ? "bg-orange-500 text-white" : "bg-gray-100 uppercase")}>
                            {activeTab === 'active' ? orders.length : ""}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('today')}
                        className={cn(
                            "px-6 py-3 font-black uppercase tracking-widest text-[10px] rounded-sm transition-all flex items-center gap-2",
                            activeTab === 'today' ? "bg-gray-900 text-white shadow-lg shadow-gray-200" : "bg-white text-gray-400 border border-gray-100"
                        )}
                    >
                        <Clock size={14} />
                        Aujourd&apos;hui
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={cn(
                            "px-6 py-3 font-black uppercase tracking-widest text-[10px] rounded-sm transition-all flex items-center gap-2",
                            activeTab === 'past' ? "bg-gray-900 text-white shadow-lg shadow-gray-200" : "bg-white text-gray-400 border border-gray-100"
                        )}
                    >
                        <History size={14} />
                        Historique
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse uppercase tracking-widest">Chargement...</div>
                    ) : orders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <ChefHat size={80} strokeWidth={1} className="mb-4 opacity-20" />
                            <p className="font-black uppercase tracking-widest">Aucune commande</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {orders.map(order => {
                                const elapsedTime = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
                                const isLate = elapsedTime > 20 && order.status !== 'DELIVERED';

                                return (
                                    <div key={order.id} className={cn(
                                        "bg-white border-2 rounded-sm p-4 flex flex-col gap-4 shadow-sm transition-all",
                                        getStatusStyles(order.status),
                                        order.status === 'DELIVERED' && "opacity-60 bg-gray-50 border-gray-100"
                                    )}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-2xl font-black text-gray-900 leading-none mb-2">
                                                    #{order.sale.ticketNum.split('-')[1]}
                                                </div>
                                                <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest",
                                                    isLate ? "bg-red-600 text-white animate-pulse" : "bg-gray-900 text-white"
                                                )}>
                                                    <Clock size={10} />
                                                    {order.status === 'DELIVERED' ? "SERVIE" : `${elapsedTime} MIN`}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-1 rounded-sm">
                                                    {order.orderType}
                                                </span>
                                                {isAdmin && (
                                                    <button onClick={() => { setOrderToDelete(order); setIsDeleteModalOpen(true); }} className="text-red-400 hover:text-red-600 p-1">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-3 py-4 border-t border-b border-gray-100">
                                            {order.sale.items.map(item => (
                                                <div key={item.id} className="flex justify-between items-baseline font-black uppercase tracking-tighter text-sm">
                                                    <span className="text-orange-600">{item.quantity}x</span>
                                                    <span className="flex-1 text-right text-gray-800">{item.product.name}</span>
                                                </div>
                                            ))}
                                            {order.sale.client && (
                                                <div className="pt-2 text-[10px] font-bold text-gray-400 uppercase italic">
                                                    Client: {order.sale.client.name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            {order.status === 'PENDING' && (
                                                <button onClick={() => updateStatus(order.id, 'IN_PREPARATION')} className="w-full py-4 bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-sm hover:bg-orange-700 active:scale-95 transition-all shadow-lg">
                                                    Commencer la préparation
                                                </button>
                                            )}
                                            {order.status === 'IN_PREPARATION' && (
                                                <button onClick={() => updateStatus(order.id, 'READY')} className="w-full py-4 bg-green-600 text-white font-black uppercase tracking-widest text-xs rounded-sm hover:bg-green-700 active:scale-95 transition-all shadow-lg">
                                                    Marquer comme Prêt
                                                </button>
                                            )}
                                            {order.status === 'READY' && (
                                                <button onClick={() => updateStatus(order.id, 'DELIVERED')} className="w-full py-4 bg-gray-900 text-white font-black uppercase tracking-widest text-xs rounded-sm hover:bg-black active:scale-95 transition-all shadow-lg">
                                                    Commande Servie
                                                </button>
                                            )}
                                            {order.status === 'DELIVERED' && (
                                                <div className="w-full py-3 bg-gray-100 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-sm text-center">
                                                    Livrée le {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <ConfirmDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDeleteOrder}
                    title="Supprimer la commande ?"
                    message="Cette action annulera l'ordre de cuisine."
                    itemName={orderToDelete ? `#${orderToDelete.sale.ticketNum.split('-')[1]}` : ""}
                    isLoading={!!deletingId}
                />
            </div>
        </LightLayout>
    );
}
