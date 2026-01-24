"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { Users, UserPlus, Search, Edit2, Lock, Unlock, DollarSign, Trash2 } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { PayrollModal } from "@/components/users/PayrollModal";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null); // For Edit/Details

    // Payroll Modal State
    const [isPayrollOpen, setIsPayrollOpen] = useState(false);
    const [payrollUser, setPayrollUser] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "CASHIER",
        baseSalary: "",
        phone: ""
    });

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
                setFormData({ name: "", email: "", role: "CASHIER", baseSalary: "", phone: "" });
                fetchUsers();
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
            baseSalary: user.baseSalary || "",
            phone: user.phone || ""
        });
        setIsCreateOpen(true);
    };

    const handleResetPassword = async (id: string, name: string) => {
        if (!confirm(`Réinitialiser le mot de passe de ${name} à "U" ?`)) return;

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "RESET_PASSWORD" })
            });
            if (res.ok) showToast("Mot de passe réinitialisé", "success");
        } catch (e) { showToast("Erreur", "error"); }
    };

    const openPayroll = (user: any) => {
        setPayrollUser(user);
        setIsPayrollOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Users className="text-[#00d3fa]" />
                            Gestion des Utilisateurs & RH
                        </h1>
                        <p className="text-sm text-gray-500">Gérez les accès et les salaires des employés</p>
                    </div>
                    <button
                        onClick={() => { setSelectedUser(null); setFormData({ name: "", email: "", role: "CASHIER", baseSalary: "", phone: "" }); setIsCreateOpen(true); }}
                        className="px-4 py-2 bg-[#00d3fa] text-white font-bold rounded flex items-center gap-2 hover:opacity-90 shadow-sm"
                    >
                        <UserPlus size={18} />
                        Nouvel Utilisateur
                    </button>
                </div>

                <div className="p-6 overflow-auto">
                    {loading ? <p className="text-center text-gray-400">Chargement...</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users.map(user => (
                                <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{user.name}</h3>
                                                <div className="flex gap-2 text-xs">
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">{user.role}</span>
                                                    {user.status !== "ACTIVE" && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded font-medium">BLOQUÉ</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleEdit(user)} className="text-gray-400 hover:text-[#00d3fa]"><Edit2 size={16} /></button>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div className="flex justify-between">
                                            <span>Email:</span>
                                            <span className="font-medium text-gray-800">{user.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Téléphone:</span>
                                            <span className="font-medium text-gray-800">{user.phone || "-"}</span>
                                        </div>
                                        <div className="border-t border-gray-100 my-2 pt-2"></div>
                                        <div className="flex justify-between items-center text-green-700">
                                            <span>Salaire Base:</span>
                                            <span className="font-bold">{user.baseSalary ? formatCurrency(user.baseSalary) : "-"}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-red-600">
                                            <span>Avances (Ce mois):</span>
                                            <span className="font-bold">{formatCurrency(user.currentMonthAdvances)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleResetPassword(user.id, user.name)}
                                            className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded flex items-center justify-center gap-1"
                                        >
                                            <Unlock size={12} /> Reset Pass
                                        </button>
                                        <button
                                            className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded flex items-center justify-center gap-1"
                                            onClick={() => openPayroll(user)}
                                        >
                                            <DollarSign size={12} /> Paie / Avance
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={selectedUser ? "Modifier Utilisateur" : "Nouvel Utilisateur"}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nom Complet</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded px-3 py-2 outline-none focus:border-[#00d3fa]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email (Connexion)</label>
                            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded px-3 py-2 outline-none focus:border-[#00d3fa]" disabled={!!selectedUser} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Rôle</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full border rounded px-3 py-2 outline-none bg-white">
                                    <option value="CASHIER">Caissier</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="KITCHEN">Cuisine</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Salaire Base ($)</label>
                                <input type="number" value={formData.baseSalary} onChange={e => setFormData({ ...formData, baseSalary: e.target.value })} className="w-full border rounded px-3 py-2 outline-none focus:border-[#00d3fa]" placeholder="0.00" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border rounded px-3 py-2 outline-none focus:border-[#00d3fa]" placeholder="+243..." />
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
                            <button type="submit" className="px-4 py-2 bg-[#00d3fa] text-white font-bold rounded hover:opacity-90">Enregistrer</button>
                        </div>
                    </form>
                </Modal>

                <PayrollModal
                    isOpen={isPayrollOpen}
                    onClose={() => setIsPayrollOpen(false)}
                    user={payrollUser}
                    onSuccess={() => { fetchUsers(); }}
                />

            </div>
        </DashboardLayout>
    );
}
