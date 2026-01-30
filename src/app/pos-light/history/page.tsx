"use client";

import { useEffect, useState, useMemo } from "react";
import LightLayout from "@/components/layout/LightLayout";
import { Receipt, Calendar, User as UserIcon, CreditCard, ChevronRight, Search, FileText, Smartphone, Banknote, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";

export default function HistoryLightPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedSale, setSelectedSale] = useState<any | null>(null);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/transactions?limit=100&status=COMPLETED");
            const json = await res.json();
            if (json.success) setTransactions(json.data);
        } catch (e) {
            console.error(e);
            showToast("Erreur lors du chargement de l'historique", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = useMemo(() => {
        if (!search) return transactions;
        return transactions.filter(t =>
            t.ticketNum?.toLowerCase().includes(search.toLowerCase()) ||
            t.client?.name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [transactions, search]);

    const totalRevenueCdf = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => acc + (t.totalCdf || 0), 0);
    }, [filteredTransactions]);

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'MOBILE_MONEY': return <Smartphone size={10} />;
            case 'CARD': return <CreditCard size={10} />;
            default: return <Banknote size={10} />;
        }
    };

    return (
        <LightLayout>
            <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
                {/* Stats & Search Header */}
                <div className="bg-white border-b border-gray-100 shrink-0">
                    <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-sm">
                            <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest block mb-1">Recettes Total (Session)</span>
                            <span className="text-xl font-black text-orange-600 leading-none">
                                {totalRevenueCdf.toLocaleString()} <span className="text-xs">FC</span>
                            </span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-sm">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Ventes</span>
                            <span className="text-xl font-black text-gray-800 leading-none">
                                {filteredTransactions.length}
                            </span>
                        </div>
                    </div>
                    <div className="px-4 pb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher par Ticket # ou Client..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-sm text-sm font-bold focus:border-orange-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* List */}
                    <div className={cn(
                        "flex-1 overflow-y-auto p-4 space-y-2",
                        selectedSale ? "hidden lg:block lg:max-w-md lg:border-r lg:border-gray-100" : "block"
                    )}>
                        {loading && transactions.length === 0 ? (
                            <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse uppercase tracking-widest">Chargement...</div>
                        ) : (
                            filteredTransactions.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedSale(t)}
                                    className={cn(
                                        "bg-white border-2 p-4 rounded-sm shadow-sm transition-all flex items-center justify-between group cursor-pointer active:bg-orange-50",
                                        selectedSale?.id === t.id ? "border-orange-500" : "border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-900 text-orange-500 rounded-sm flex items-center justify-center font-black text-xs ring-4 ring-gray-100">
                                            {t.ticketNum.split('-')[1]}
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900 uppercase tracking-tighter text-sm">
                                                Ticket #{t.ticketNum}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-orange-600 uppercase bg-orange-50 px-1 py-0.5 rounded flex items-center gap-1">
                                                    {getPaymentIcon(t.paymentMethod)}
                                                    {t.paymentMethod}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                    {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div>
                                            <div className="text-sm font-black text-gray-800">
                                                {(t.totalCdf || 0).toLocaleString()} FC
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                                                $ {Number(t.totalReceived || 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-200 group-hover:text-orange-500 transition-all group-hover:translate-x-1 sm:block hidden" />
                                    </div>
                                </div>
                            ))
                        )}
                        {!loading && filteredTransactions.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 py-12">
                                <Receipt size={64} strokeWidth={1} className="mb-4 opacity-10" />
                                <p className="font-black uppercase tracking-widest text-xs">Aucune transaction trouvée</p>
                            </div>
                        )}
                    </div>

                    {/* Details Panel */}
                    <div className={cn(
                        "flex-1 bg-white overflow-y-auto p-8",
                        selectedSale ? "flex flex-col" : "hidden"
                    )}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <button onClick={() => setSelectedSale(null)} className="lg:hidden mb-4 text-orange-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                                    <ChevronRight size={12} className="rotate-180" /> Retour
                                </button>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-2">FACTURE #{selectedSale?.ticketNum}</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={12} /> {selectedSale && new Date(selectedSale.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="bg-black text-white p-4 rounded-sm text-center min-w-[120px]">
                                <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-50">STATUT</span>
                                <span className="text-sm font-black uppercase text-orange-500">PAYÉ</span>
                            </div>
                        </div>

                        {selectedSale?.client && (
                            <div className="bg-orange-50/50 border border-orange-100 p-6 rounded-sm mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white text-orange-600 rounded-sm flex items-center justify-center font-black text-lg border border-orange-100">
                                        <UserIcon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">CLIENT</p>
                                        <p className="text-lg font-black text-gray-800 uppercase leading-none">{selectedSale.client.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-sm border border-orange-100 shadow-sm">
                                    <Award size={18} className="text-orange-500" />
                                    <span className="text-base font-black text-orange-600">{selectedSale.client.points} PTS</span>
                                </div>
                            </div>
                        )}

                        <div className="flex-1">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-100">
                                    <tr>
                                        <th className="py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Article</th>
                                        <th className="py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Quantité</th>
                                        <th className="py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Prix</th>
                                        <th className="py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {selectedSale?.items?.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="py-4">
                                                <div className="font-black text-gray-800 text-sm uppercase tracking-tighter">{item.product.name}</div>
                                                <div className="text-[10px] font-bold text-gray-400">Unit: {item.product.saleUnit}</div>
                                            </td>
                                            <td className="py-4 text-center font-black text-sm text-gray-600">x {item.quantity}</td>
                                            <td className="py-4 text-right font-bold text-xs text-gray-500">{(item.unitPriceCdf || 0).toLocaleString()} FC</td>
                                            <td className="py-4 text-right font-black text-sm text-gray-900">{(item.quantity * (item.unitPriceCdf || 0)).toLocaleString()} FC</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 space-y-3 shrink-0">
                            <div className="flex justify-between items-center text-lg font-black">
                                <span className="text-gray-400 uppercase tracking-widest text-xs">Total Facture</span>
                                <span className="text-3xl tracking-tighter text-gray-900">{(selectedSale?.totalCdf || 0).toLocaleString()} <span className="text-sm font-bold opacity-30">FC</span></span>
                            </div>
                            <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3">
                                <span className="text-gray-400 uppercase tracking-widest text-[10px] font-black">Moyen de Paiement</span>
                                <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2 bg-gray-50 px-3 py-1 rounded">
                                    {selectedSale && getPaymentIcon(selectedSale.paymentMethod)}
                                    {selectedSale?.paymentMethod}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LightLayout>
    );
}
