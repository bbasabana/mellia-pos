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
    Menu,
    LogOut,
    X,
    Clock,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const lightMenuItems = [
    {
        label: "POS Ventes",
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
    showSidebarInitial?: boolean;
    headerActions?: React.ReactNode;
}

function LightLayout({ children, showSidebarInitial = false, headerActions }: LightLayoutProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(showSidebarInitial);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const userRole = useMemo(() => (session?.user as any)?.role || "CASHIER", [session?.user]);
    const filteredMenuItems = useMemo(() => lightMenuItems.filter((item) => item.roles.includes(userRole)), [userRole]);

    const formattedTime = useMemo(() => {
        if (!currentTime) return "";
        return currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }, [currentTime]);

    const formattedDate = useMemo(() => {
        if (!currentTime) return "";
        return currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    }, [currentTime]);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Modern Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 z-[70] flex flex-col transition-all duration-300 transform shadow-2xl",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <Image src="/images/logos/logo.png" alt="Logo" width={100} height={32} className="object-contain" />
                    <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    {filteredMenuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-4 rounded-sm text-sm font-black uppercase tracking-widest transition-all group",
                                    isActive
                                        ? "bg-orange-600 text-white shadow-xl shadow-orange-500/20"
                                        : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
                                )}
                            >
                                <Icon size={20} strokeWidth={isActive ? 3 : 2} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && <ChevronRight size={16} />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-gray-100 mb-4">
                        <div className="w-10 h-10 bg-black text-orange-500 rounded-sm flex items-center justify-center font-black text-xs">
                            {(session?.user?.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-gray-800 truncate uppercase">{session?.user?.name}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{userRole}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-red-100 text-red-500 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={14} />
                        Quitter
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Unified Top Header */}
                <header className="h-14 bg-white border-b border-gray-100 px-4 flex items-center justify-between shrink-0 z-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 hover:bg-gray-50 rounded-sm text-gray-800 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-4">
                            <Image src="/images/logos/logo.png" alt="Logo" width={90} height={28} className="object-contain hidden sm:block" />
                            <div className="h-6 w-[1px] bg-gray-100 hidden sm:block" />
                            <h1 className="text-xs font-black uppercase tracking-widest text-gray-900 truncate">
                                {lightMenuItems.find(m => m.href === pathname)?.label || "Mellia POS"}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {headerActions && <div className="hidden sm:flex items-center gap-2 mr-4">{headerActions}</div>}
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-gray-900 leading-none">{formattedTime}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{formattedDate}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default memo(LightLayout);
