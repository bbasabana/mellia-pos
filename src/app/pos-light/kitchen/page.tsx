"use client";

import { useEffect, useState } from "react";
import LightLayout from "@/components/layout/LightLayout";
import { Utensils, Clock, CheckCircle, Flame, Truck, ShoppingBag, RotateCcw, ChefHat, Trash2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { showToast } from "@/components/ui/Toast";

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

    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<KitchenOrder | null>(null);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/kitchen/orders");
            const json = await res.json();
            if (json.success) {
                setOrders(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch kitchen orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

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
            default: return 'border-gray-200 bg-white';
        }
    };

    const activeOrders = orders.filter(o => o.status !== 'DELIVERED');

    return (
        <LightLayout>
            <div className="h-full flex flex-col bg-gray-50 overflow-hidden px-4 py-4">
                {/* Header Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
                    <div className="bg-white p-4 rounded-sm border-2 border-red-100 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-1">En Attente</span>
                        <span className="text-2xl font-black text-red-600">{activeOrders.filter(o => o.status === 'PENDING').length}</span>
                    </div>
                    <div className="bg-white p-4 rounded-sm border-2 border-orange-100 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest mb-1">En Cours</span>
                        <span className="text-2xl font-black text-orange-600">{activeOrders.filter(o => o.status === 'IN_PREPARATION').length}</span>
                    </div>
                    <div className="bg-white p-4 rounded-sm border-2 border-green-100 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase text-green-400 tracking-widest mb-1">Prêt</span>
                        <span className="text-2xl font-black text-green-600">{activeOrders.filter(o => o.status === 'READY').length}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse uppercase tracking-widest">Chargement...</div>
                    ) : activeOrders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <ChefHat size={80} strokeWidth={1} className="mb-4 opacity-20" />
                            <p className="font-black uppercase tracking-widest">Cuisine Libre</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeOrders.map(order => {
                                const elapsedTime = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
                                const isLate = elapsedTime > 20;

                                return (
                                    <div key={order.id} className={cn(
                                        "bg-white border-2 rounded-sm p-4 flex flex-col gap-4 shadow-sm transition-all",
                                        getStatusStyles(order.status)
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
                                                    {elapsedTime} MIN
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
