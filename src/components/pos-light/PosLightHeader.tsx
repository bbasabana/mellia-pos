"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { LogOut, User, Clock } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";

export default function PosLightHeader() {
    const { data: session } = useSession();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="h-12 bg-black text-white px-4 flex items-center justify-between shrink-0 border-b border-gray-800">
            <div className="flex items-center gap-3">
                <Image src="/images/logos/logo.png" alt="Logo" width={80} height={26} className="object-contain brightness-0 invert" />
                <div className="h-4 w-px bg-gray-700 hidden sm:block"></div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#00d3fa] uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-[#00d3fa] animate-pulse"></span>
                    Terminal POS Light
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-mono font-bold text-gray-300">
                    <Clock size={14} className="text-[#00d3fa]" />
                    {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#00d3fa] text-black rounded-full flex items-center justify-center text-[10px] font-black">
                            {session?.user?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs font-bold hidden md:block">{session?.user?.name}</span>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors rounded-sm"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
