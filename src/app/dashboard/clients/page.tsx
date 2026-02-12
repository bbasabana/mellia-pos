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
                <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 sticky top-0 z-10 shadow-sm">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Users className="text-[#00d3fa]" size={20} />
                                    <span className="hidden sm:inline">Gestion des Clients</span>
                                    <span className="sm:hidden">Clients</span>
                                </h1>
                                <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Base de données clients et programme de fidélité</p>
                            </div>
                            <button
                                className="bg-black text-white px-3 md:px-4 py-2 rounded-lg md:rounded-sm font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-gray-800 transition-all shadow-md active:scale-95"
                                onClick={handleNew}
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Nouveau Client</span>
                                <span className="sm:hidden">Nouveau</span>
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg md:rounded-sm pl-9 pr-4 py-2 text-sm outline-none focus:border-[#00d3fa] transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-auto p-3 md:p-6 space-y-4 md:space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <KpiCard
                            title="Total Clients"
                            value={clients.length}
                            icon={<Users size={18} />}
                            color="bg-[#00d3fa]/10 text-[#00d3fa] border-[#00d3fa]/20"
                        />
                        <KpiCard
                            title="Points Distribués"
                            value={totalPoints.toLocaleString()}
                            icon={<Award size={18} />}
                            color="bg-yellow-50 text-yellow-600 border-yellow-100"
                        />
                        <KpiCard
                            title="Avec Téléphone"
                            value={withPhone}
                            icon={<Smartphone size={18} />}
                            color="bg-green-50 text-green-600 border-green-100"
                        />
                        <KpiCard
                            title="Avec Email"
                            value={withEmail}
                            icon={<Mail size={18} />}
                            color="bg-purple-50 text-purple-600 border-purple-100"
                        />
                    </div>

                    {/* Desktop Table View - Hidden on Mobile */}
                    <div className="hidden md:block bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
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

                    {/* Mobile Card View - Visible on Mobile Only */}
                    <div className="md:hidden space-y-3">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="animate-spin text-[#00d3fa]" size={32} />
                                    <span className="text-sm font-medium text-gray-500">Chargement...</span>
                                </div>
                            </div>
                        ) : clients.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <Users size={40} strokeWidth={1.5} />
                                    <p className="text-sm italic">Aucun client trouvé</p>
                                </div>
                            </div>
                        ) : (
                            clients.map((client) => (
                                <div key={client.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    {/* Card Header */}
                                    <div className="bg-gradient-to-r from-blue-50 to-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm ring-2 ring-white shadow-sm border border-blue-100 shrink-0">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-gray-900 text-sm truncate">{client.name}</div>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-100 w-fit mt-1">
                                                    <Award size={11} />
                                                    {client.points} pts
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="px-4 py-3 space-y-2">
                                        {/* Contact Info */}
                                        <div className="space-y-1.5">
                                            {client.phone ? (
                                                <div className="flex items-center gap-2 text-xs text-gray-600 font-medium bg-gray-50 px-2 py-1.5 rounded">
                                                    <Phone size={13} className="text-gray-400 shrink-0" />
                                                    <span className="truncate">{client.phone}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs text-gray-400 italic bg-gray-50 px-2 py-1.5 rounded">
                                                    <Phone size={13} className="shrink-0" />
                                                    <span>Pas de téléphone</span>
                                                </div>
                                            )}
                                            {client.email && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded">
                                                    <Mail size={13} className="text-gray-400 shrink-0" />
                                                    <span className="truncate">{client.email}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        {client.notes && (
                                            <div className="bg-blue-50 border border-blue-100 rounded px-2 py-1.5">
                                                <div className="flex items-start gap-2 text-xs text-blue-600">
                                                    <MessageSquare size={11} className="mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">{client.notes}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                                        {canEdit && (
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white text-[#00d3fa] text-xs font-bold rounded-lg hover:bg-blue-50 transition-all border border-blue-200"
                                            >
                                                <Edit2 size={14} /> Modifier
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteClick(client)}
                                                className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* MODAL */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
                        <div className="bg-white rounded-lg md:rounded-sm shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="font-bold text-gray-800 text-base md:text-lg">{isEditing ? "Modifier Client" : "Nouveau Client"}</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="px-4 md:px-6 py-4 md:py-6 space-y-3 md:space-y-4 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Nom complet *</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Jean Paul"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg md:rounded-sm px-3 md:px-4 py-2 md:py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Téléphone</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: 099000000"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg md:rounded-sm px-3 md:px-4 py-2 md:py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Ex: jean@mail.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg md:rounded-sm px-3 md:px-4 py-2 md:py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Note</label>
                                        <textarea
                                            placeholder="Infos supplémentaires..."
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg md:rounded-sm px-3 md:px-4 py-2 md:py-2.5 text-sm outline-none focus:border-[#00d3fa] transition-all min-h-[80px]"
                                        />
                                    </div>
                                </div>
                                <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-2 rounded-lg md:rounded-sm text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all border border-gray-200"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-2 bg-black text-white rounded-lg md:rounded-sm font-bold text-sm hover:bg-gray-800 transition-all shadow-md disabled:opacity-50"
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
        <div className="bg-white p-3 md:p-4 border border-gray-200 rounded-lg md:rounded-sm flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="flex-1 min-w-0">
                <p className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-wider truncate">{title}</p>
                <p className="text-base md:text-lg font-black text-gray-900 mt-0.5 md:mt-1 truncate">{value}</p>
            </div>
            <div className={cn("p-2 md:p-2.5 rounded-full border shrink-0", color)}>
                {icon}
            </div>
        </div>
    );
}
