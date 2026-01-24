"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Box, Snowflake, Archive, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

export function StockMatrixTable({ products, loading, onTransfer }: { products: any[], loading: boolean, onTransfer: (productId: string) => void }) {
    if (loading) return <div className="p-8 text-center text-gray-400">Chargement du stock...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 font-medium">Produit</th>
                        <th className="px-4 py-3 font-medium text-center bg-[#00d3fa]/5 text-[#00d3fa]">
                            <div className="flex flex-col items-center gap-1">
                                <Snowflake size={14} />
                                FRIGO
                            </div>
                        </th>
                        <th className="px-4 py-3 font-medium text-center bg-gray-100/50">
                            <div className="flex flex-col items-center gap-1">
                                <Archive size={14} />
                                CASIER
                            </div>
                        </th>
                        <th className="px-4 py-3 font-medium text-center bg-gray-100/50">
                            <div className="flex flex-col items-center gap-1">
                                <Box size={14} />
                                DEPOT
                            </div>
                        </th>
                        <th className="px-4 py-3 font-medium text-center bg-yellow-50/50 text-yellow-600">
                            <div className="flex flex-col items-center gap-1">
                                <Utensils size={14} />
                                ECONOM.
                            </div>
                        </th>
                        <th className="px-4 py-3 font-medium text-right">Valeur Est.</th>
                        <th className="px-4 py-3 font-medium text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {products.map((p) => {
                        const isLowStock = p.totalQuantity <= 5;
                        return (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-800">
                                    <div className={cn(isLowStock && "text-red-500")}>
                                        {p.name}
                                        {isLowStock && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded uppercase">Rupture</span>}
                                    </div>
                                    <span className="block text-[10px] text-gray-400">{p.unit}</span>
                                </td>
                                {/* FRIGO */}
                                <td className="px-4 py-3 text-center bg-[#00d3fa]/5 font-bold text-gray-700">
                                    {p.locations.FRIGO || "-"}
                                </td>
                                {/* CASIER */}
                                <td className="px-4 py-3 text-center text-gray-500">
                                    {p.locations.CASIER || "-"}
                                </td>
                                {/* DEPOT */}
                                <td className="px-4 py-3 text-center font-medium text-gray-600">
                                    {p.locations.DEPOT || "-"}
                                </td>
                                {/* ECONOMAT */}
                                <td className="px-4 py-3 text-center bg-yellow-50/30 text-yellow-700 font-medium">
                                    {p.locations.ECONOMAT || "-"}
                                </td>

                                <td className="px-4 py-3 text-right text-gray-500">
                                    {p.totalValue > 0 ? `${p.totalValue.toLocaleString()} $` : "-"}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => onTransfer(p.id)}
                                        className="text-xs text-[#00d3fa] hover:underline font-medium flex items-center justify-center gap-1 mx-auto"
                                    >
                                        Transfert <ArrowRight size={10} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {products.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-gray-400">
                                Aucun produit en stock. Commencez par faire un Achat/Investissement.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
