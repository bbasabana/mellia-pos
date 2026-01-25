"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
    Plus,
    Filter,
    Users,
    Search,
    User,
    Phone,
    Mail,
    Award,
    Edit2,
    Trash2,
    Loader2,
    X,
    MessageSquare,
    Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useSession } from "next-auth/react";

interface Client {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    points: number;
    notes?: string;
}

export default function ClientsPage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role;
    const isAdmin = userRole === "ADMIN";
    const canEdit = ["ADMIN", "MANAGER"].includes(userRole);

    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Delete state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        id: "", // present if editing
        name: "",
        phone: "",
        email: "",
        notes: ""
    });
    const [isEditing, setIsEditing] = useState(false);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clients?query=${search}`);
            const data = await res.json();
            setClients(data);
        } catch (error) {
            console.error("Failed to fetch clients", error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, fetchClients]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const url = isEditing ? `/api/clients/${formData.id}` : "/api/clients";
        const method = isEditing ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                resetForm();
                fetchClients();
                showToast(isEditing ? "Client modifié avec succès" : "Client ajouté avec succès", "success");
            } else {
                showToast("Erreur: " + (data.error || "Une erreur est survenue"), "error");
            }
        } catch (error) {
            showToast("Erreur de connexion", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            id: "",
            name: "",
            phone: "",
            email: "",
            notes: ""
        });
        setIsEditing(false);
    };

    const handleNew = () => {
        resetForm();
        setShowModal(true);
    };

    const handleEdit = (client: Client) => {
        setFormData({
            id: client.id,
            name: client.name,
            phone: client.phone || "",
            email: client.email || "",
            notes: client.notes || ""
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDeleteClick = (client: Client) => {
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
                showToast("Client supprimé avec succès", "success");
                fetchClients();
                setDeleteModalOpen(false);
                setClientToDelete(null);
            } else {
                showToast("Erreur: " + (data.error || "Impossible de supprimer"), "error");
            }
        } catch (e) {
            showToast("Erreur serveur lors de la suppression", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    // Stats
    const totalPoints = clients.reduce((acc, c) => acc + (c.points || 0), 0);
    const withPhone = clients.filter(c => c.phone).length;
    const withEmail = clients.filter(c => c.email).length;

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50/50">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Users className="text-[#00d3fa]" />
                            Gestion des Clients
                        </h1>
                        <p className="text-sm text-gray-500">Base de données clients et programme de fidélité</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher..."
                                className="bg-gray-50 border border-gray-200 rounded-sm pl-9 pr-4 py-2 text-sm outline-none focus:border-[#00d3fa] transition-all w-64"
                            />
                        </div>
                        <button
                            className="bg-black text-white px-4 py-2 rounded-sm font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-all shadow-md active:scale-95"
                            onClick={handleNew}
                        >
                            <Plus size={16} />
                            Nouveau Client
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            title="Total Clients"
                            value={clients.length}
                            icon={<Users size={20} />}
                            color="bg-[#00d3fa]/10 text-[#00d3fa] border-[#00d3fa]/20"
                        />
                        <KpiCard
                            title="Points Distribués"
                            value={totalPoints.toLocaleString()}
                            icon={<Award size={20} />}
                            color="bg-yellow-50 text-yellow-600 border-yellow-100"
                        />
                        <KpiCard
                            title="Avec Téléphone"
                            value={withPhone}
                            icon={<Smartphone size={20} />}
                            color="bg-green-50 text-green-600 border-green-100"
                        />
                        <KpiCard
                            title="Avec Email"
                            value={withEmail}
                            icon={<Mail size={20} />}
                            color="bg-purple-50 text-purple-600 border-purple-100"
                        />
                    </div>

                    {/* TABLE */}
                    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Filter size={14} className="text-gray-400" />
                                Annuaire Clients
                            </h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-sm">
                                {clients.length} clients
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 border-b border-gray-100">Client</th>
                                        <th className="px-6 py-3 border-b border-gray-100">Contact</th>
                                        <th className="px-6 py-3 border-b border-gray-100 text-center">Points</th>
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
                                            <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-white shadow-sm border border-blue-100">
                                                            {client.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800 text-sm group-hover:text-[#00d3fa] transition-colors">{client.name}</div>
                                                            {client.notes && (
                                                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 max-w-[200px] truncate">
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
                                                    <div className="flex items-center justify-end gap-2 opactity-0 group-hover:opacity-100 transition-opacity">
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

                {/* MODAL */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-sm shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="font-bold text-gray-800 text-lg">{isEditing ? "Modifier Client" : "Nouveau Client"}</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Nom complet *</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Jean Paul"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Téléphone</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: 099000000"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Ex: jean@mail.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Note</label>
                                        <textarea
                                            placeholder="Infos supplémentaires..."
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all min-h-[80px]"
                                        />
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        className="px-6 py-2 rounded-sm text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all border border-transparent"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2 bg-black text-white rounded-sm font-bold text-sm hover:bg-gray-800 transition-all shadow-md disabled:opacity-50"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Enregistrement..." : "Enregistrer"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

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
            </div>
        </DashboardLayout>
    );
}

function KpiCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-4 border border-gray-200 rounded-sm flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{title}</p>
                <p className="text-lg font-black text-gray-900 mt-1">{value}</p>
            </div>
            <div className={cn("p-2.5 rounded-full border", color)}>
                {icon}
            </div>
        </div>
    );
}
