"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    User,
    Phone,
    Mail,
    Award,
    Edit2,
    Users,
    Filter,
    Loader2,
    MessageSquare,
    Smartphone,
    Trash2
} from "lucide-react";
import ClientFormModal from "@/components/clients/ClientFormModal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function ClientsPage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role;
    const isAdmin = userRole === "ADMIN";
    const canEdit = ["ADMIN", "MANAGER"].includes(userRole);

    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any | null>(null);

    // Delete states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clients?query=${search}`);
            const data = await res.json();
            setClients(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (client: any) => {
        if (!canEdit) return;
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (client: any) => {
        if (!isAdmin) return;
        setClientToDelete(client);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!clientToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/clients/${clientToDelete.id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                fetchClients();
                setDeleteModalOpen(false);
                setClientToDelete(null);
            } else {
                alert("Erreur: " + (data.error || "Impossible de supprimer"));
            }
        } catch (e) {
            alert("Erreur serveur");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleNew = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    // Derived stats
    const totalPoints = clients.reduce((acc, client) => acc + (client.points || 0), 0);
    const withPhone = clients.filter(c => c.phone).length;
    const withEmail = clients.filter(c => c.email).length;

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Users className="text-[#00d3fa]" />
                            Gestion des Clients
                        </h1>
                        <p className="text-sm text-gray-500">Base de données clients et programme de fidélité</p>
                    </div>
                    <button
                        onClick={handleNew}
                        className="bg-[#000] text-white px-4 py-2.5 rounded-sm font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        Nouveau Client
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-auto p-6 space-y-6">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            title="Total Clients"
                            value={clients.length}
                            icon={<Users size={20} />}
                            color="text-[#00d3fa]"
                        />
                        <KpiCard
                            title="Points Distribués"
                            value={totalPoints.toLocaleString()}
                            icon={<Award size={20} />}
                            color="text-yellow-500"
                        />
                        <KpiCard
                            title="Avec Téléphone"
                            value={withPhone}
                            icon={<Smartphone size={20} />}
                            color="text-green-500"
                        />
                        <KpiCard
                            title="Avec Email"
                            value={withEmail}
                            icon={<Mail size={20} />}
                            color="text-purple-500"
                        />
                    </div>

                    {/* FILTERS & TABLE CONTAINER */}
                    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">

                        {/* Toolbar */}
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Filter size={16} className="text-gray-400" />
                                Recherche
                            </h3>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Nom, téléphone, email..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-sm pl-9 pr-4 py-2 text-sm outline-none focus:border-[#00d3fa] transition-all"
                                />
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 border-b border-gray-100">Client</th>
                                        <th className="px-6 py-3 border-b border-gray-100">Contact</th>
                                        <th className="px-6 py-3 border-b border-gray-100 text-center">Points Fidelité</th>
                                        <th className="px-6 py-3 border-b border-gray-100 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-12 text-gray-400 italic text-sm">
                                                <Loader2 className="animate-spin inline-block mr-2" size={16} /> Chargement...
                                            </td>
                                        </tr>
                                    ) : clients.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-12 text-gray-400 italic text-sm">
                                                Aucun client trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        clients.map((client) => (
                                            <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-white shadow-sm">
                                                            {client.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800 text-sm">{client.name}</div>
                                                            {client.notes && (
                                                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                                    <MessageSquare size={10} />
                                                                    {client.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {client.phone ? (
                                                            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                                                <Phone size={12} className="text-gray-400" /> {client.phone}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400 italic">Pas de téléphone</span>
                                                        )}
                                                        {client.email && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <Mail size={12} className="text-gray-400" /> {client.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-100">
                                                        <Award size={12} />
                                                        {client.points}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => handleEdit(client)}
                                                                className="p-1.5 text-gray-400 hover:text-[#00d3fa] hover:bg-blue-50 rounded-sm transition-all"
                                                                title="Modifier"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        )}
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => handleDeleteClick(client)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-all"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <ClientFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchClients}
                clientToEdit={editingClient}
            />

            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setClientToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Supprimer le client"
                message="Êtes-vous sûr de vouloir supprimer ce client ?"
                itemName={clientToDelete?.name}
                isLoading={isDeleting}
            />
        </DashboardLayout>
    );
}

function KpiCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-4 border border-gray-200 rounded-sm flex items-center justify-between shadow-sm">
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{title}</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className={cn("p-2.5 rounded-sm bg-gray-50 border border-gray-100", color)}>
                {icon}
            </div>
        </div>
    );
}
