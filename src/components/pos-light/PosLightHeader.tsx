"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { LogOut, User, Clock, RefreshCw } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { usePosStore } from "@/store/usePosStore";
import { showToast } from "@/components/ui/Toast";

export default function PosLightHeader() {
    const { data: session } = useSession();
    const { clearCart } = usePosStore();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleNewSale = () => {
        if (confirm("Voulez-vous vraiment annuler la vente en cours ?")) {
            clearCart();
            showToast("Nouvelle vente initialisée", "info");
        }
    };

    return (
        <header className="h-12 bg-white px-4 flex items-center justify-between shrink-0 border-b border-gray-200">
            <div className="flex items-center gap-6">
                <Image src="/images/logos/logo.png" alt="Logo" width={90} height={28} className="object-contain" />

                <button
                    onClick={handleNewSale}
                    className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-sm text-[10px] font-black uppercase tracking-widest border border-orange-100 hover:bg-orange-100 transition-all active:scale-95"
                >
                    <RefreshCw size={12} />
                    Nouvelle Vente
                </button>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                    <Clock size={14} className="text-orange-500" />
                    {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-orange-500 text-white rounded-sm flex items-center justify-center text-[10px] font-black">
                            {session?.user?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs font-bold hidden md:block text-gray-700">{session?.user?.name}</span>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors rounded-sm ml-2"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
