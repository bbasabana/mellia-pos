"use client";

import { useEffect, useState } from "react";
import LightLayout from "@/components/layout/LightLayout";
import { Search, UserPlus, Phone, CreditCard, Award, ChevronRight, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ClientFormModal from "@/components/clients/ClientFormModal";
import { showToast } from "@/components/ui/Toast";

export default function ClientsLightPage() {
    const [search, setSearch] = useState("");
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchClients = async (query = "") => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clients?query=${query}`);
            const data = await res.json();
            setClients(data);
        } catch (e) {
            console.error(e);
            showToast("Erreur lors du chargement des clients", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(() => fetchClients(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    return (
        <LightLayout>
            <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
                {/* Search Header */}
                <div className="bg-white p-4 border-b border-gray-100 flex gap-3 shrink-0">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un client (nom, téléphone...)"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-sm text-sm font-bold focus:border-orange-500 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 bg-orange-600 text-white rounded-sm flex items-center justify-center gap-2 hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                    >
                        <UserPlus size={20} />
                        <span className="hidden sm:block font-black uppercase text-[10px] tracking-widest">Ajouter</span>
                    </button>
                </div>

                {/* Clients List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading && clients.length === 0 ? (
                        <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse uppercase tracking-widest">Chargement...</div>
                    ) : (
                        clients.map((client) => (
                            <div
                                key={client.id}
                                className="bg-white border-2 border-transparent hover:border-orange-500 p-4 rounded-sm shadow-sm transition-all flex items-center justify-between group cursor-pointer active:bg-orange-50"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black text-orange-500 rounded-sm flex items-center justify-center font-black text-lg ring-4 ring-orange-50">
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-900 uppercase tracking-tighter text-base group-hover:text-orange-600 transition-colors">
                                            {client.name}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                <Phone size={10} className="text-gray-300" />
                                                {client.phone || "N/A"}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded">
                                                <Award size={10} />
                                                {client.points} PTS
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Balance</span>
                                        <span className="text-sm font-black text-gray-800">
                                            {Number(client.debt || 0) > 0 ? (
                                                <span className="text-red-500">{(client.debt).toLocaleString()} FC</span>
                                            ) : (
                                                "0 FC"
                                            )}
                                        </span>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-200 group-hover:text-orange-500 transition-all group-hover:translate-x-1" />
                                </div>
                            </div>
                        ))
                    )}
                    {!loading && clients.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 py-12">
                            <User size={64} strokeWidth={1} className="mb-4 opacity-20" />
                            <p className="font-black uppercase tracking-widest">Aucun client trouvé</p>
                        </div>
                    )}
                </div>

                <ClientFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        fetchClients(search);
                        setIsAddModalOpen(false);
                    }}
                />
            </div>
        </LightLayout>
    );
}
