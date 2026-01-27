"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { Users, UserPlus, Edit2, Unlock, Trash2, Shield, Mail, Key } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Roles matching Prisma Schema (UserRole)
    const AVAILABLE_ROLES = [
        { value: "CASHIER", label: "Caissier" },
        { value: "MANAGER", label: "Manager" },
        { value: "ADMIN", label: "Admin" },
        { value: "KITCHEN", label: "Cuisine" },
    ];

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "CASHIER",
    });

    // Password Display State (for Create & Reset)
    const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
    const [generatedPwd, setGeneratedPwd] = useState("");
    const [pwdModalTitle, setPwdModalTitle] = useState("");

    // Reset Confirmation State
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (data.success) setUsers(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = selectedUser ? `/api/users/${selectedUser.id}` : "/api/users";
            const method = selectedUser ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const json = await res.json();
            if (json.success) {
                showToast(selectedUser ? "Utilisateur mis à jour" : "Utilisateur créé", "success");
                setIsCreateOpen(false);
                setSelectedUser(null);
                setFormData({ name: "", email: "", role: "CASHIER" });
                fetchUsers();

                // If created new user, show password
                if (!selectedUser && json.data.generatedPassword) {
                    setGeneratedPwd(json.data.generatedPassword);
                    setPwdModalTitle("Utilisateur Créé");
                    setIsPwdModalOpen(true);
                }
            } else {
                showToast(json.error, "error");
            }
        } catch (err) {
            showToast("Erreur serveur", "error");
        }
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
        });
        setIsCreateOpen(true);
    };

    const handleResetClick = (user: any) => {
        setUserToReset(user);
        setIsResetConfirmOpen(true);
    };

    const confirmReset = async () => {
        if (!userToReset) return;

        try {
            const res = await fetch(`/api/users/${userToReset.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "RESET_PASSWORD" })
            });

            const json = await res.json();
            if (res.ok && json.success) {
                setIsResetConfirmOpen(false);
                setGeneratedPwd(json.generatedPassword);
                setPwdModalTitle("Mot de passe réinitialisé");
                setIsPwdModalOpen(true);
            } else {
                showToast("Erreur lors de la réinitialisation", "error");
            }
        } catch (e) { showToast("Erreur", "error"); }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Shield className="text-[#00d3fa]" />
                            Gestion des Utilisateurs
                        </h1>
                        <p className="text-sm text-gray-500">Gérez les accès système et les rôles</p>
                    </div>
                    <button
                        onClick={() => { setSelectedUser(null); setFormData({ name: "", email: "", role: "CASHIER" }); setIsCreateOpen(true); }}
                        className="px-4 py-2 bg-black text-white font-bold rounded-sm flex items-center gap-2 hover:bg-gray-800 shadow-sm transition-all text-sm"
                    >
                        <UserPlus size={16} />
                        Nouvel Utilisateur
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Comptes Système</h3>
                            <div className="text-xs text-gray-500 font-medium">
                                {users.length} comptes actifs
                            </div>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Utilisateur</th>
                                    <th className="px-6 py-3">Rôle</th>
                                    <th className="px-6 py-3">Email (Connexion)</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-400">Chargement...</td></tr>
                                ) : users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-sm text-[10px] uppercase font-bold ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-600' :
                                                user.role === 'MANAGER' ? 'bg-orange-50 text-orange-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                                            <Mail size={14} className="text-gray-400" />
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {user.status || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleResetClick(user)} className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded" title="Réinitialiser MDP">
                                                    <Unlock size={16} />
                                                </button>
                                                <button onClick={() => handleEdit(user)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="Modifier">
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create/Edit Modal */}
                <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={selectedUser ? "Modifier Utilisateur" : "Nouvel Utilisateur"}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400">Nom Complet</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa]" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400">Email (Connexion)</label>
                            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa]" disabled={!!selectedUser} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400">Rôle</label>
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-[#00d3fa] appearance-none">
                                {AVAILABLE_ROLES.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-4">
                            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-sm">Annuler</button>
                            <button type="submit" className="px-6 py-2 bg-black text-white font-bold text-sm rounded-sm hover:bg-gray-800 shadow-sm">Enregistrer</button>
                        </div>
                    </form>
                </Modal>

                {/* Reset Password Confirmation Modal */}
                <Modal
                    isOpen={isResetConfirmOpen}
                    onClose={() => setIsResetConfirmOpen(false)}
                    title="Confirmer Réinitialisation"
                >
                    <div className="space-y-4">
                        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-sm text-sm border border-yellow-100 flex items-start gap-3">
                            <Unlock className="shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="font-bold">Attention</p>
                                <p>Vous êtes sur le point de réinitialiser le mot de passe de <span className="font-bold">{userToReset?.name}</span>.</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setIsResetConfirmOpen(false)}
                                className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-sm"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmReset}
                                className="px-4 py-2 bg-black text-white font-bold text-sm rounded-sm hover:bg-gray-800"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Password Display Modal (Success) */}
                <Modal
                    isOpen={isPwdModalOpen}
                    onClose={() => setIsPwdModalOpen(false)}
                    title={pwdModalTitle}
                >
                    <div className="space-y-6 text-center py-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Key size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Mot de passe généré</h3>
                            <p className="text-gray-500 text-sm">Veuillez noter ce mot de passe, il ne sera plus affiché.</p>
                        </div>

                        <div className="bg-gray-100 p-4 rounded border border-gray-200">
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Mot de Passe</p>
                            <p className="text-3xl font-mono font-bold text-black tracking-widest">{generatedPwd}</p>
                        </div>

                        <button
                            onClick={() => setIsPwdModalOpen(false)}
                            className="w-full py-2 bg-black text-white font-bold text-sm rounded-sm"
                        >
                            Fermer
                        </button>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
