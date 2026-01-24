"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Utensils, Clock, CheckCircle, Flame, Truck, ShoppingBag, RotateCcw, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface KitchenOrder {
    id: string;
    ticketNum: string; // From Sale
    orderType: string;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';
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

export default function KitchenPage() {
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [loading, setLoading] = useState(true);

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
        // Auto refresh every 30 seconds
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
                fetchOrders(); // Refresh immediately
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-white border-l-4 border-l-red-500 shadow-sm';
            case 'PREPARING': return 'bg-orange-50 border-l-4 border-l-orange-500 shadow-sm';
            case 'READY': return 'bg-green-50 border-l-4 border-l-green-500 shadow-sm';
            default: return 'bg-gray-50';
        }
    };

    const getOrderTypeIcon = (type: string) => {
        switch (type) {
            case 'DELIVERY': return <Truck size={14} className="text-orange-600" />;
            case 'TAKEAWAY': return <ShoppingBag size={14} className="text-blue-600" />;
            default: return <Utensils size={14} className="text-gray-600" />;
        }
    };

    // Filter logic if needed (e.g. separate completed)
    const activeOrders = orders.filter(o => o.status !== 'COMPLETED');

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <ChefHat className="text-[#00d3fa]" />
                            Cuisine (KDS)
                        </h1>
                        <p className="text-sm text-gray-500">Gestion des commandes en cuisine</p>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-sm text-sm font-bold text-gray-700 transition-colors border border-gray-200"
                    >
                        <RotateCcw size={16} />
                        Actualiser
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-gray-500">Chargement des commandes...</div>
                        </div>
                    ) : activeOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white rounded-sm border border-dashed border-gray-200 p-12">
                            <ChefHat className="mb-4 text-gray-200" size={64} />
                            <h3 className="text-lg font-bold text-gray-600">Aucune commande en cours</h3>
                            <p className="text-sm">Tout est calme en cuisine pour le moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {activeOrders.map((order) => {
                                // Filter items to show mostly food
                                const foodItems = order.sale.items.filter(i => i.product.type === 'FOOD');
                                const otherItems = order.sale.items.filter(i => i.product.type !== 'FOOD');
                                const displayItems = foodItems.length > 0 ? foodItems : order.sale.items;

                                const elapsedTime = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
                                const isLate = elapsedTime > 20; // 20 mins alert

                                return (
                                    <div key={order.id} className={cn("rounded-sm border p-4 flex flex-col gap-3 transition-all hover:shadow-md", getStatusColor(order.status))}>
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-black text-xl text-gray-800">#{order.sale.ticketNum.split('-')[1]}</span>
                                                    <div className="p-1 bg-gray-100 rounded-sm">
                                                        {getOrderTypeIcon(order.orderType)}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                                                    <Clock size={12} className={isLate ? 'text-red-500' : ''} />
                                                    <span className={isLate ? 'font-bold text-red-600' : ''}>{elapsedTime} min</span>
                                                </div>
                                            </div>
                                            <div className={cn("px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider",
                                                order.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                                                    order.status === 'PREPARING' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-green-100 text-green-700'
                                            )}>
                                                {order.status === 'PENDING' ? 'EN ATTENTE' :
                                                    order.status === 'PREPARING' ? 'EN COURS' : 'PRÊT'}
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="space-y-2 flex-1 border-t border-b border-gray-200/50 py-3 my-1">
                                            {displayItems.map((item) => (
                                                <div key={item.id} className="flex justify-between items-start text-sm">
                                                    <div className="font-bold text-gray-800">
                                                        {item.quantity}x {item.product.name}
                                                    </div>
                                                </div>
                                            ))}
                                            {otherItems.length > 0 && foodItems.length > 0 && (
                                                <div className="text-[10px] font-bold text-gray-400 mt-2 flex items-center gap-1">
                                                    + {otherItems.length} Boissons/Autres
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-auto pt-2 grid grid-cols-1 gap-2">
                                            {order.status === 'PENDING' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'PREPARING')}
                                                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-sm font-bold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <Flame size={14} />
                                                    Lancer
                                                </button>
                                            )}
                                            {order.status === 'PREPARING' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'READY')}
                                                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-sm font-bold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <CheckCircle size={14} />
                                                    Prêt
                                                </button>
                                            )}
                                            {order.status === 'READY' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'COMPLETED')}
                                                    className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-sm font-bold text-xs uppercase tracking-wide transition-colors shadow-sm"
                                                >
                                                    Terminer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
