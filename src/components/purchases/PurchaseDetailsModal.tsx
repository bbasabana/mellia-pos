"use client";

import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, MapPin, Hash, User, Calendar } from "lucide-react";

interface PurchaseDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    investment: any;
}

export function PurchaseDetailsModal({ isOpen, onClose, investment }: PurchaseDetailsModalProps) {
    if (!investment) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Détails de l'Achat #${investment.id.slice(-6)}`} size="xl">
            <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Date</p>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar size={14} className="text-gray-400" />
                            {formatDate(new Date(investment.date))}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Acheteur</p>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <User size={14} className="text-gray-400" />
                            {(() => {
                                const desc = investment.description || "";
                                const match = desc.match(/^\[Acheteur:\s*([^\]]+)\]/);
                                return match ? match[1] : (investment.user?.name || "Inconnu");
                            })()}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Source</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${investment.source === 'OWNER_CAPITAL' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                            {investment.source === 'OWNER_CAPITAL' ? 'Patron' : 'Caisse'}
                        </span>
                    </div>
                </div>

                {/* Items List */}
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                        <Package size={14} />
                        Produits Achetés
                    </h4>
                    <div className="border border-gray-200 rounded overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-2 text-left">Produit</th>
                                    <th className="px-4 py-2 text-center">Destination</th>
                                    <th className="px-4 py-2 text-right">Quantité</th>
                                    <th className="px-4 py-2 text-right">Coût (Val.)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {investment.movements?.map((mov: any) => (
                                    <tr key={mov.id}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-800">{mov.product?.name}</div>
                                            <div className="text-[10px] text-gray-400">ID: {mov.productId.slice(-6)}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                                                <MapPin size={10} className="text-gray-400" />
                                                {mov.toLocation}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-bold text-gray-800">
                                                {Number(mov.quantity)} {mov.product?.saleUnit === 'BOTTLE' ? 'Bout.' : (mov.product?.saleUnit || 'Unit')}
                                            </div>
                                            {mov.product?.purchaseUnit && mov.product?.packingQuantity > 1 && (
                                                <div className="text-[10px] text-blue-500">
                                                    {(Number(mov.quantity) / mov.product.packingQuantity).toFixed(1)} {mov.product.purchaseUnit}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-bold text-gray-700">
                                                {formatCurrency(Number(mov.costValueCdf || (Number(mov.costValue) * (Number(investment.exchangeRate) || 2850))), "CDF")}
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                {formatCurrency(Number(mov.costValue), "USD")}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-sm flex justify-between items-end border border-gray-100">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Description / Notes</p>
                        <p className="text-sm text-gray-700 italic">
                            {(() => {
                                const desc = investment.description || "";
                                const match = desc.match(/^\[Acheteur:\s*[^\]]+\]\s*(.*)/);
                                return match ? (match[1] || "Aucune note") : (desc || "Aucune note");
                            })()}
                        </p>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="text-xs text-gray-400 flex flex-col items-end">
                            <div>
                                Stock: <span className="font-bold text-gray-600">{formatCurrency(Number(investment.vendableAmountCdf || (Number(investment.vendableAmount) * (Number(investment.exchangeRate) || 2850))), "CDF")}</span>
                                <span className="mx-1">|</span>
                                Charges: <span className="font-bold text-orange-500">{formatCurrency(Number(investment.nonVendableAmountCdf || (Number(investment.nonVendableAmount) * (Number(investment.exchangeRate) || 2850))), "CDF")}</span>
                                <span className="mx-1">|</span>
                                Transport: <span className="font-bold text-purple-500">{formatCurrency(Number(investment.transportFeeCdf || (Number(investment.transportFee) * (Number(investment.exchangeRate) || 2850))), "CDF")}</span>
                            </div>
                            <div className="text-[9px] opacity-70">
                                {formatCurrency(Number(investment.vendableAmount || 0), "USD")} | {formatCurrency(Number(investment.nonVendableAmount || 0), "USD")} | {formatCurrency(Number(investment.transportFee || 0), "USD")}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Total Investi</p>
                            <div className="flex flex-col items-end">
                                <p className="text-2xl font-black text-[#00d3fa]">
                                    {formatCurrency(Number(investment.totalAmountCdf || (Number(investment.totalAmount) * (Number(investment.exchangeRate) || 2850))), "CDF")}
                                </p>
                                <p className="text-sm font-bold text-gray-400">
                                    {formatCurrency(Number(investment.totalAmount), "USD")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROI Info */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Analyse de Rentabilité Prévue</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Space 1: Terrasse */}
                        <div className="p-4 bg-green-50/50 border border-green-100 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-green-100 text-green-700 px-2 py-0.5 text-[9px] font-black rounded-bl-lg uppercase">Terrasse / Salle</div>
                            <p className="text-[10px] text-green-600 uppercase font-bold mb-1">Revenu (Terrasse)</p>
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-green-700">
                                    {formatCurrency(Number(investment.expectedRevenueCdf || (Number(investment.expectedRevenue || 0) * (Number(investment.exchangeRate) || 2850))), "CDF")}
                                </span>
                                <span className="text-xs font-bold text-green-500/70">
                                    {formatCurrency(Number(investment.expectedRevenue || 0), "USD")}
                                </span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-green-100 flex justify-between items-center">
                                <span className="text-[10px] text-green-600 font-bold uppercase">Profit Net</span>
                                <div className="text-right flex flex-col items-end leading-none">
                                    <span className="text-sm font-black text-green-700">
                                        +{formatCurrency(Number(investment.expectedProfitCdf || (Number(investment.expectedProfit || 0) * (Number(investment.exchangeRate) || 2850))), "CDF")}
                                    </span>
                                    <span className="text-[10px] font-bold text-green-500/70">
                                        +{formatCurrency(Number(investment.expectedProfit || 0), "USD")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Space 2: VIP */}
                        <div className="p-4 bg-[#fcf9ff] border border-purple-100 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 px-2 py-0.5 text-[9px] font-black rounded-bl-lg uppercase">VIP / Salon</div>
                            <p className="text-[10px] text-purple-600 uppercase font-bold mb-1">Revenu (VIP)</p>
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-purple-700">
                                    {formatCurrency(Number(investment.expectedRevenueVipCdf || (Number(investment.expectedRevenueVip || investment.expectedRevenue || 0) * (Number(investment.exchangeRate) || 2850))), "CDF")}
                                </span>
                                <span className="text-xs font-bold text-purple-500/70">
                                    {formatCurrency(Number(investment.expectedRevenueVip || investment.expectedRevenue || 0), "USD")}
                                </span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-purple-100 flex justify-between items-center">
                                <span className="text-[10px] text-purple-600 font-bold uppercase">Profit Net</span>
                                <div className="text-right flex flex-col items-end leading-none">
                                    <span className="text-sm font-black text-purple-700">
                                        +{formatCurrency(Number(investment.expectedProfitVipCdf || (Number(investment.expectedProfitVip || investment.expectedProfit || 0) * (Number(investment.exchangeRate) || 2850))), "CDF")}
                                    </span>
                                    <span className="text-[10px] font-bold text-purple-500/70">
                                        +{formatCurrency(Number(investment.expectedProfitVip || investment.expectedProfit || 0), "USD")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
