"use client";

/**
 * Dashboard Layout Component (Optimized)
 * Fixed sidebar, clean design, with date/time
 */

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Package,
  UtensilsCrossed,
  Users,
  ShoppingBag,
  TrendingDown,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Flame,
  FileText,
  TrendingUp,
  Receipt
} from "lucide-react";
import "@/styles/theme.scss";
import { cn } from "@/lib/utils";

// Menu items with role-based visibility and Lucide icons
const menuItems = [
  {
    label: "POS (Ventes)",
    href: "/dashboard/pos",
    icon: ShoppingCart,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Stock",
    href: "/dashboard/stock",
    icon: Package,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Cuisine (KDS)",
    href: "/dashboard/kitchen",
    icon: Flame,
    roles: ["ADMIN", "MANAGER", "KITCHEN"],
  },
  {
    label: "Produits",
    href: "/dashboard/products",
    icon: UtensilsCrossed,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Achats",
    href: "/dashboard/purchases",
    icon: ShoppingBag,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Dépenses",
    href: "/dashboard/expenses",
    icon: TrendingDown,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Brouillons",
    href: "/dashboard/sales/drafts",
    icon: FileText,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Historique Ventes",
    href: "/dashboard/transactions",
    icon: Receipt,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Transactions",
    href: "/dashboard/sales/transactions",
    icon: TrendingUp,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Rapports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Utilisateurs",
    href: "/dashboard/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Employés (RH)",
    href: "/dashboard/employees",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  disablePadding?: boolean;
}



function DashboardLayout({ children, disablePadding = false }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Update time every minute
  useEffect(() => {
    setCurrentTime(new Date()); // Set initial time on client only
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Memoize user role to prevent recalculation
  const userRole = useMemo(
    () => (session?.user as any)?.role || "CASHIER",
    [session?.user]
  );

  // Memoize filtered menu items
  const filteredMenuItems = useMemo(
    () => menuItems.filter((item) => item.roles.includes(userRole)),
    [userRole]
  );

  // Memoize user initials
  const userInitials = useMemo(() => {
    const name = session?.user?.name || "User";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [session?.user?.name]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Memoize callbacks
  const handleLogoutClick = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const confirmLogout = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Format time and date
  const formattedTime = useMemo(() => {
    if (!currentTime) return "";
    return currentTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    if (!currentTime) return "";
    return currentTime.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [currentTime]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="px-6 py-8 border-b border-gray-100 flex flex-col items-center">
          <div className="mb-2">
            <Image
              src="/images/logos/logo.png"
              alt="Mellia POS"
              width={140}
              height={46}
              priority
              className="object-contain"
            />
          </div>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Système de caisse</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {filteredMenuItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              onClick={closeSidebar}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4 bg-gray-50/50">
          <UserInfo
            initials={userInitials}
            name={session?.user?.name || "User"}
            role={userRole}
          />

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm text-sm font-bold text-red-500 hover:bg-red-50 transition-all border border-transparent"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[72px] bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              className="p-2 -ml-2 rounded-sm text-gray-500 hover:bg-gray-100 lg:hidden"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-gray-800">
              {menuItems.find(i => i.href === pathname)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-base font-bold text-gray-800 leading-none">{formattedTime}</span>
              <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">{formattedDate}</span>
            </div>
          </div>
        </header>

        <div className={cn("flex-1 overflow-auto bg-gray-50", !disablePadding && "p-6")}>
          {children}
        </div>
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 shadow-sm">
                <LogOut size={24} className="ml-0.5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Déconnexion</h3>
              <p className="text-gray-500 text-sm">
                Êtes-vous sûr de vouloir vous déconnecter de Mellia POS ?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-500/20 transition-all transform active:scale-95"
              >
                Oui, Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Updated NavItem to fit new Sidebar
const NavItem = memo(function NavItem({
  item,
  isActive,
  onClick
}: {
  item: typeof menuItems[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const IconComponent = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-bold transition-all group",
        isActive
          ? "bg-black text-white shadow-md grayscale-0"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "flex shrink-0 items-center justify-center transition-colors",
        isActive ? "text-[#00d3fa]" : "group-hover:text-[#00d3fa]"
      )}>
        <IconComponent size={20} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className="truncate">{item.label}</span>
      {isActive && (
        <div className="ml-auto w-1 h-5 bg-[#00d3fa] rounded-full hidden lg:block" />
      )}
    </Link>
  );
});

NavItem.displayName = "NavItem";

// Updated UserInfo for Sidebar footer
const UserInfo = memo(function UserInfo({
  initials,
  name,
  role
}: {
  initials: string;
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-gray-200">
      <div className="w-9 h-9 flex shrink-0 items-center justify-center bg-black text-[#00d3fa] rounded-sm text-xs font-bold ring-2 ring-gray-100">
        {initials}
      </div>
      <div className="flex flex-col min-w-0">
        <div className="text-sm font-bold text-gray-800 truncate leading-none mb-1">{name}</div>
        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">{role}</div>
      </div>
    </div>
  );
});

UserInfo.displayName = "UserInfo";

export default memo(DashboardLayout);
