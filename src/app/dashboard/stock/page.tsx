"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { Package, ArrowRightLeft, DollarSign, AlertTriangle, History, Plus } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

// COMPONENTS
import { StockMatrixTable } from "@/components/stock/StockMatrixTable";
import { MovementHistory } from "@/components/stock/MovementHistory";
import { InventorySessionModal } from "@/components/stock/InventorySessionModal";
import { StockMovementModal } from "@/components/stock/StockMovementModal";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";

export default function StockPage() {
    const [activeTab, setActiveTab] = useState<"overview" | "movements" | "inventory">("overview");
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
    const [movementType, setMovementType] = useState<"TRANSFER" | "ADJUSTMENT" | "LOSS">("TRANSFER");
    const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);

    const handleOpenMovement = (type: "TRANSFER" | "ADJUSTMENT" | "LOSS" = "TRANSFER", productId?: string) => {
        setMovementType(type);
        setSelectedProductId(productId);
        setIsMovementOpen(true);
    };

    const handleOpenInventory = (sessionId?: string) => {
        setSelectedSessionId(sessionId);
        setIsInventoryOpen(true);
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Package className="text-[#00d3fa]" />
                            Gestion de Stock & Investissements
                        </h1>
                        <p className="text-sm text-gray-500">Suivi en temps réel des dépôts, frigos et économat</p>
                    </div>

                    {/* TABS */}
                    <div className="flex bg-gray-100 p-1 rounded-sm gap-1">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-sm transition-all flex items-center gap-2",
                                activeTab === "overview" ? "bg-white text-[#00d3fa] shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Package size={16} />
                            Stock Actuel
                        </button>
                        <button
                            onClick={() => setActiveTab("movements")}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-sm transition-all flex items-center gap-2",
                                activeTab === "movements" ? "bg-white text-[#00d3fa] shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <ArrowRightLeft size={16} />
                            Mouvements
                        </button>
                        <button
                            onClick={() => setActiveTab("inventory")}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-sm transition-all flex items-center gap-2",
                                activeTab === "inventory" ? "bg-white text-[#ff4900] shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <History size={16} />
                            Inventaire
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-auto p-6">
                    {activeTab === "overview" && <StockOverview onOpenMovement={() => handleOpenMovement("ADJUSTMENT")} onTransfer={(pid) => handleOpenMovement("TRANSFER", pid)} />}
                    {activeTab === "movements" && <StockMovements />}
                    {activeTab === "inventory" && <StockInventory onOpenSession={() => handleOpenInventory()} onResumeSession={(id) => handleOpenInventory(id)} />}
                </div>

                {/* MODALS */}
                <InventorySessionModal
                    isOpen={isInventoryOpen}
                    onClose={() => setIsInventoryOpen(false)}
                    initialSessionId={selectedSessionId}
                />
                <StockMovementModal
                    isOpen={isMovementOpen}
                    onClose={() => setIsMovementOpen(false)}
                    initialProductId={selectedProductId}
                    initialType={movementType}
                />
            </div>
        </DashboardLayout>
    );
}

// ------------------------------------------------------------------
// SUB-VIEWS
// ------------------------------------------------------------------

function StockOverview({ onOpenMovement, onTransfer }: { onOpenMovement: () => void; onTransfer: (id: string) => void }) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [subTab, setSubTab] = useState<"vendable" | "non_vendable">("vendable");

    useEffect(() => {
        fetchStock();
    }, []);

    const fetchStock = async () => {
        try {
            const res = await fetch("/api/stock");
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Filtered lists for specific logic if needed
    const vendableProducts = products.filter(p => p.vendable);
    const nonVendableProducts = products.filter(p => !p.vendable);

    // Dynamic products based on tab
    const displayedProducts = subTab === "vendable" ? vendableProducts : nonVendableProducts;

    // KPI Calculations (Based on total stock or filtered? User usually wants total context, but maybe filtered for value)
    const currentStockValue = displayedProducts.reduce((acc, p) => acc + p.totalValue, 0);
    const lowStockCount = displayedProducts.filter((p: any) => p.totalQuantity <= 5).length;

    return (
        <div className="space-y-6">
            {/* SUB-TABS SELECTOR */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setSubTab("vendable")}
                    className={cn(
                        "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                        subTab === "vendable"
                            ? "border-[#00d3fa] text-[#00d3fa]"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                >
                    PRODUITS DE VENTE
                    <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px]",
                        subTab === "vendable" ? "bg-[#00d3fa] text-white" : "bg-gray-100 text-gray-500"
                    )}>
                        {vendableProducts.length}
                    </span>
                </button>
                <button
                    onClick={() => setSubTab("non_vendable")}
                    className={cn(
                        "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                        subTab === "non_vendable"
                            ? "border-orange-500 text-orange-500"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                >
                    CHARGES & NON-VENDABLES
                    <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px]",
                        subTab === "non_vendable" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"
                    )}>
                        {nonVendableProducts.length}
                    </span>
                </button>
            </div>

            <div className="flex justify-between items-center">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mr-4">
                    <KpiCard
                        title={subTab === "vendable" ? "Valeur Stock Vente" : "Valeur Charges/Stock"}
                        value={`${currentStockValue.toLocaleString()} $`}
                        icon={<DollarSign />}
                        color={subTab === "vendable" ? "text-[#00d3fa]" : "text-orange-500"}
                    />
                    <KpiCard
                        title="Alertes Rupture"
                        value={lowStockCount}
                        icon={<AlertTriangle />}
                        color={lowStockCount > 0 ? "text-red-500 bg-red-50" : "text-[#71de00]"}
                    />
                </div>

                <button
                    onClick={onOpenMovement}
                    className="h-full px-6 py-4 bg-[#71de00] text-white font-bold rounded shadow-sm hover:opacity-90 flex flex-col items-center justify-center gap-1"
                >
                    <Plus size={24} />
                    <span>Mouvement Manuel</span>
                    <span className="text-[10px] opacity-80 uppercase">Ajustement / Transfert</span>
                </button>
            </div>

            {/* Matrix Table */}
            <div className="bg-white border border-gray-200 rounded-sm">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">
                        {subTab === "vendable" ? "Inventaire des Produits de Vente" : "Inventaire des Charges & Consommables"}
                    </h3>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-[#00d3fa]/10 text-[#00d3fa] rounded-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00d3fa]"></span> Frigo
                        </span>
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-[#71de00]/10 text-[#71de00] rounded-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#71de00]"></span> Dépôt
                        </span>
                    </div>
                </div>
                <StockMatrixTable products={displayedProducts} loading={loading} onTransfer={onTransfer} />
            </div>
        </div>
    );
}

function StockMovements() {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-bold text-gray-700">Historique des Mouvements</h2>
            <div className="bg-yellow-50 p-4 border border-yellow-100 rounded text-xs text-yellow-800 mb-4">
                ℹ️ Ce journal inclut les achats (venus du Module 4), les ventes, les pertes et les ajustements d&apos;inventaire.
            </div>
            <MovementHistory />
        </div>
    );
}

import { useSession } from "next-auth/react";

function StockInventory({ onOpenSession, onResumeSession }: { onOpenSession: () => void; onResumeSession: (id: string) => void }) {
    const { data: session } = useSession();
    const isAdmin = (session?.user as any)?.role === "ADMIN";

    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch("/api/inventory");
            const data = await res.json();
            if (data.success) {
                setSessions(data.data);
            } else {
                console.error("Failed to fetch sessions:", data.error, data.details, data.stack);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        if (!isAdmin) return;
        setSessionToDelete(id);
    };

    const confirmDelete = async () => {
        if (!sessionToDelete) return;
        try {
            const res = await fetch(`/api/inventory/${sessionToDelete}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showToast("Session supprimée avec succès", "success");
                fetchSessions();
            } else {
                showToast("Erreur: " + data.error, "error");
            }
        } catch (e) {
            showToast("Erreur serveur lors de la suppression", "error");
        } finally {
            setSessionToDelete(null);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-700">Inventaire & Contrôle</h2>
                    <p className="text-sm text-gray-500">Comparaison Stock Théorique vs Réel.</p>
                </div>
                <button
                    onClick={onOpenSession}
                    className="px-4 py-2 bg-[#00d3fa] text-white font-bold rounded flex items-center gap-2 hover:opacity-90 shadow-sm"
                >
                    <History size={18} />
                    Nouvelle Session d&apos;Inventaire
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-400">Chargement...</div>
            ) : sessions.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">Responsable</th>
                                <th className="px-4 py-3 text-right">Écart Valeur</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sessions.map((sess) => (
                                <tr key={sess.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-gray-700 font-medium">
                                        {formatDate(new Date(sess.createdAt))}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase",
                                            sess.status === "OPEN" ? "bg-blue-100 text-blue-600 animate-pulse" : "bg-gray-100 text-gray-600"
                                        )}>
                                            {sess.status === "OPEN" ? "EN COURS" : "CLÔTURÉ"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {sess.user?.name || "N/A"}
                                    </td>
                                    <td className={cn("px-4 py-3 text-right font-bold",
                                        Number(sess.totalVariance) < 0 ? "text-red-500" : "text-green-500"
                                    )}>
                                        {sess.totalVariance ? `${Number(sess.totalVariance).toFixed(2)} $` : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {sess.status === "OPEN" && (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => onResumeSession(sess.id)}
                                                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-bold"
                                                >
                                                    Reprendre
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteClick(sess.id)}
                                                        className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 font-bold"
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white p-12 border border-gray-200 rounded text-center text-gray-400">
                    <p>Aucune session d&apos;inventaire enregistrée.</p>
                </div>
            )}

            <Modal isOpen={!!sessionToDelete} onClose={() => setSessionToDelete(null)} title="Supprimer la session ?" size="md">
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Voulez-vous vraiment supprimer cette session d&apos;inventaire ?<br />
                        Cette action est irréversible.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setSessionToDelete(null)}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600 shadow-sm"
                        >
                            Confirmer la suppression
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}


function KpiCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-4 border border-gray-200 rounded-sm flex items-center justify-between">
            <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">{title}</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className={cn("p-3 rounded-full bg-gray-50", color)}>
                {icon}
            </div>
        </div>
    )
}

