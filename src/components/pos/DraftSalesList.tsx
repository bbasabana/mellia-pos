"use client";

import { FileText, Trash2, Clock, User, Utensils, Truck, ShoppingBag } from "lucide-react";

type OrderType = 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';

interface DraftSale {
    id: string;
    name: string;
    cart: any[];
    client: any;
    orderType: OrderType;
    deliveryInfo: any;
    createdAt: Date;
}

interface DraftSalesListProps {
    drafts: DraftSale[];
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function DraftSalesList({ drafts, onLoad, onDelete }: DraftSalesListProps) {
    if (drafts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <FileText className="mx-auto mb-2 opacity-50" size={40} />
                <p className="text-sm">Aucun brouillon</p>
            </div>
        );
    }

    const getOrderTypeIcon = (type: OrderType) => {
        switch (type) {
            case 'DINE_IN':
                return <Utensils size={14} className="text-blue-600" />;
            case 'DELIVERY':
                return <Truck size={14} className="text-orange-600" />;
            case 'TAKEAWAY':
                return <ShoppingBag size={14} className="text-green-600" />;
        }
    };

    const getOrderTypeLabel = (type: OrderType) => {
        switch (type) {
            case 'DINE_IN':
                return 'Sur place';
            case 'DELIVERY':
                return 'Livraison';
            case 'TAKEAWAY':
                return 'À emporter';
        }
    };

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                Brouillons ({drafts.length})
            </h3>
            {drafts.map((draft) => {
                const itemCount = draft.cart.reduce((sum, item) => sum + item.quantity, 0);
                const createdDate = new Date(draft.createdAt);

                return (
                    <div
                        key={draft.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                                <div className="font-semibold text-gray-800 text-sm mb-1">
                                    {draft.name}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        {getOrderTypeIcon(draft.orderType)}
                                        <span>{getOrderTypeLabel(draft.orderType)}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{itemCount} article{itemCount > 1 ? 's' : ''}</span>
                                </div>
                                {draft.client && (
                                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                        <User size={12} />
                                        <span>{draft.client.name}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => onDelete(draft.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={12} />
                                <span>{createdDate.toLocaleTimeString()}</span>
                            </div>
                            <button
                                onClick={() => onLoad(draft.id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                                Charger
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
