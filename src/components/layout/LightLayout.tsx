"use client";

import { useState, useMemo, memo, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    ShoppingCart,
    Flame,
    Users,
    FileText,
    Receipt,
    LogOut,
    Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

const lightMenuItems = [
    {
        label: "POS",
        href: "/pos-light",
        icon: ShoppingCart,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
    },
    {
        label: "Cuisine",
        href: "/pos-light/kitchen",
        icon: Flame,
        roles: ["ADMIN", "MANAGER", "KITCHEN"],
    },
    {
        label: "Clients",
        href: "/pos-light/clients",
        icon: Users,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
    },
    {
        label: "Brouillons",
        href: "/pos-light/drafts",
        icon: FileText,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
    },
    {
        label: "Historique",
        href: "/pos-light/history",
        icon: Receipt,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
    },
];

interface LightLayoutProps {
    children: React.ReactNode;
}

function LightLayout({ children }: LightLayoutProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [hasMounted, setHasMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setHasMounted(true);
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const userRole = useMemo(() => (session?.user as any)?.role || "CASHIER", [session?.user]);
    const filteredMenuItems = useMemo(() => lightMenuItems.filter((item) => item.roles.includes(userRole)), [userRole]);

    const formattedTime = useMemo(() => {
        if (!currentTime) return "--:--";
        return currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }, [currentTime]);

    const formattedDate = useMemo(() => {
        if (!currentTime) return "";
        return currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    }, [currentTime]);

    if (!hasMounted) return <div className="h-screen bg-gray-50 flex items-center justify-center font-black text-orange-500 animate-pulse uppercase tracking-widest">Mellia POS...</div>;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans selection:bg-orange-500 selection:text-white flex-col">
            {/* Horizontal Header Menu */}
            <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-4 px-4 shrink-0 z-50 overflow-hidden">
                {/* Logo & Platform Info */}
                <div className="flex items-center gap-3 shrink-0 mr-2">
                    <Image src="/images/logos/logo.png" alt="Logo" width={80} height={24} className="object-contain" />
                    <div className="h-4 w-[1px] bg-gray-200" />
                    <span className="text-[10px] font-black uppercase text-orange-600 tracking-tighter">Light</span>
                </div>

                {/* Scrolling Navigation */}
                <nav className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth h-full px-2">
                    {filteredMenuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-3 h-10 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2",
                                    isActive
                                        ? "border-orange-600 text-orange-600 bg-orange-50 tracking-tight"
                                        : "border-transparent text-gray-400 hover:text-gray-900"
                                )}
                            >
                                <Icon size={14} strokeWidth={isActive ? 3 : 2} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Actions: User & Time */}
                <div className="flex items-center gap-4 shrink-0 pl-2">
                    {/* Time (Hydration safe via hasMounted check above) */}
                    <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-xs font-black text-gray-900 leading-none">{formattedTime}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{formattedDate}</span>
                    </div>

                    {/* User Info & Logout */}
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                        <div className="hidden lg:flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-800 uppercase leading-none truncate max-w-[80px]">{(session?.user?.name || "").split(' ')[0]}</span>
                            <span className="text-[8px] font-black text-orange-600 uppercase tracking-tighter">{userRole}</span>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-all active:scale-95"
                            title="Quitter"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-hidden relative">
                {children}
            </main>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}

export default memo(LightLayout);
