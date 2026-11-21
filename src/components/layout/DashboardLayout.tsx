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
  Receipt,
  Sparkles,
  LayoutDashboard,
  type LucideIcon,
  UserCog,
  ClipboardList,
} from "lucide-react";
import "@/styles/theme.scss";
import { cn } from "@/lib/utils";

// Menu items with role-based visibility and Lucide icons
const menuItems = [
  {
    label: "POS (Ventes)",
    href: "/dashboard/pos",
    section: "Ventes",
    icon: ShoppingCart,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Stock",
    href: "/dashboard/stock",
    section: "Cuisine & stock",
    icon: Package,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Mini Inventaire",
    href: "/dashboard/mini-inventory",
    section: "Cuisine & stock",
    icon: ClipboardList,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Amélie",
    href: "/dashboard/amelie",
    section: "Gestion",
    icon: Sparkles,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Cuisine (KDS)",
    href: "/dashboard/kitchen",
    section: "Cuisine & stock",
    icon: Flame,
    roles: ["ADMIN", "MANAGER", "KITCHEN"],
  },
  {
    label: "Produits",
    href: "/dashboard/products",
    section: "Cuisine & stock",
    icon: UtensilsCrossed,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    section: "Ventes",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Achats",
    href: "/dashboard/purchases",
    section: "Cuisine & stock",
    icon: ShoppingBag,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Dépenses",
    href: "/dashboard/expenses",
    section: "Gestion",
    icon: TrendingDown,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Brouillons",
    href: "/dashboard/sales/drafts",
    section: "Ventes",
    icon: FileText,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Historique Ventes",
    href: "/dashboard/transactions",
    section: "Ventes",
    icon: Receipt,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Transactions",
    href: "/dashboard/sales/transactions",
    section: "Ventes",
    icon: TrendingUp,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Rapports",
    href: "/dashboard/reports",
    section: "Gestion",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Utilisateurs",
    href: "/dashboard/users",
    section: "Administration",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Employés (RH)",
    href: "/dashboard/employees",
    section: "Administration",
    icon: UserCog,
    roles: ["ADMIN"],
  },
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    section: "Administration",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

const sectionOrder = ["Ventes", "Cuisine & stock", "Gestion", "Administration"];

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Gérant",
  CASHIER: "Caissier",
  KITCHEN: "Cuisine",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  disablePadding?: boolean;
}



function DashboardLayout({ children, disablePadding = false }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Auto-collapse sidebar in POS mode on landscape/tablets
  useEffect(() => {
    if (disablePadding && window.innerWidth < 1280) {
      setSidebarOpen(false);
    }
  }, [disablePadding]);


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

  const groupedMenuItems = useMemo(
    () =>
      sectionOrder
        .map((section) => ({ section, items: filteredMenuItems.filter((i) => i.section === section) }))
        .filter((g) => g.items.length > 0),
    [filteredMenuItems]
  );

  const currentItem = useMemo(
    () =>
      menuItems
        .filter((i) => pathname === i.href || pathname?.startsWith(i.href + "/"))
        .sort((a, b) => b.href.length - a.href.length)[0],
    [pathname]
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
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-950/40 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-[264px] bg-white border-r border-gray-200/80 z-50 flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          disablePadding && "lg:hidden xl:flex xl:static" // Hide on large, show only on extra large in POS
        )}
      >
        <Link
          href="/dashboard"
          onClick={closeSidebar}
          className="px-6 pt-6 pb-5 flex flex-col items-center gap-2 group"
        >
          <Image
            src="/images/logos/logo.png"
            alt="Mellia POS"
            width={124}
            height={41}
            priority
            className="object-contain transition-transform group-hover:scale-[1.02]"
          />
          <span className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-gray-400 tracking-[0.18em]">
            <span className="h-1 w-1 rounded-full bg-[#71de00]" />
            Système de caisse
            <span className="h-1 w-1 rounded-full bg-[#ff4900]" />
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
          <NavItem
            item={{ label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, roles: [], section: "" }}
            isActive={pathname === "/dashboard"}
            onClick={closeSidebar}
          />
          {groupedMenuItems.map((group) => (
            <div key={group.section}>
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                {group.section}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    isActive={currentItem?.href === item.href}
                    onClick={closeSidebar}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <UserInfo
            initials={userInitials}
            name={session?.user?.name || "User"}
            role={roleLabels[userRole] || userRole}
            onLogout={handleLogoutClick}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/90 backdrop-blur border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className={cn(
                "p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors",
                disablePadding ? "flex" : "lg:hidden" // Always show toggle in POS mode if sidebar is hidden
              )}
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <div className="hidden sm:block text-[11px] font-medium text-gray-400 leading-none mb-1">
                {currentItem?.section || "Mellia"}
              </div>
              <h1 className="text-base sm:text-[17px] font-semibold text-gray-900 truncate leading-tight">
                {currentItem?.label || "Tableau de bord"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50 pl-3 pr-1 py-1">
              <span className="text-xs font-medium text-gray-500 capitalize">{formattedDate}</span>
              <span className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-gray-900 shadow-xs">
                {formattedTime}
              </span>
            </div>
            <span className="md:hidden text-sm font-semibold tabular-nums text-gray-900">{formattedTime}</span>
            <div
              className="h-9 w-9 shrink-0 rounded-full bg-gray-900 text-[#00d3fa] flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm"
              title={session?.user?.name || ""}
            >
              {userInitials}
            </div>
          </div>
        </header>

        <div className={cn("flex-1 overflow-auto bg-gray-50", !disablePadding && "p-4 sm:p-6")}>
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

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  section: string;
};

const NavItem = memo(function NavItem({
  item,
  isActive,
  onClick
}: {
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const IconComponent = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors group",
        isActive
          ? "bg-gray-900 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
      onClick={onClick}
    >
      <IconComponent
        size={18}
        strokeWidth={isActive ? 2.2 : 1.8}
        className={cn(
          "shrink-0 transition-colors",
          isActive ? "text-[#00d3fa]" : "text-gray-400 group-hover:text-blue-600"
        )}
      />
      <span className="truncate">{item.label}</span>
      {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#71de00]" />}
    </Link>
  );
});

NavItem.displayName = "NavItem";

const UserInfo = memo(function UserInfo({
  initials,
  name,
  role,
  onLogout,
}: {
  initials: string;
  name: string;
  role: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 transition-colors">
      <div className="w-9 h-9 flex shrink-0 items-center justify-center bg-gray-900 text-[#00d3fa] rounded-full text-xs font-bold">
        {initials}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900 truncate leading-tight">{name}</div>
        <div className="text-xs text-gray-500 truncate">{role}</div>
      </div>
      <button
        onClick={onLogout}
        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Déconnexion"
        aria-label="Déconnexion"
      >
        <LogOut size={17} />
      </button>
    </div>
  );
});

UserInfo.displayName = "UserInfo";

export default memo(DashboardLayout);
