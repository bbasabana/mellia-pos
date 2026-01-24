"use client";

import { Utensils, Truck, ShoppingBag } from "lucide-react";

type OrderType = 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';

interface OrderTypeSelectorProps {
    selected: OrderType;
    onChange: (type: OrderType) => void;
}

export default function OrderTypeSelector({ selected, onChange }: OrderTypeSelectorProps) {
    const types: { value: OrderType; label: string; icon: React.ReactNode }[] = [
        { value: 'DINE_IN', label: 'Sur Place', icon: <Utensils size={14} /> },
        { value: 'DELIVERY', label: 'Livraison', icon: <Truck size={14} /> },
        { value: 'TAKEAWAY', label: 'Emporter', icon: <ShoppingBag size={14} /> }
    ];

    return (
        <div className="flex bg-gray-100 p-1 rounded-lg">
            {types.map((type) => {
                const isSelected = selected === type.value;
                return (
                    <button
                        key={type.value}
                        onClick={() => onChange(type.value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-200 ${isSelected
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                    >
                        {type.icon}
                        <span>{type.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
