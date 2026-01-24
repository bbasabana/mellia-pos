"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, Search, DollarSign, Calendar, Clock, ChevronDown, ChevronUp, Check, AlertCircle } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { PayrollModal } from "@/components/users/PayrollModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Payroll Modal State
    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/users"); // We fetch all users but will filter/display relevant ones
            const data = await res.json();
            if (data.success) {
                // Filter specifically for roles that are employees (CASHIER, MANAGER, KITCHEN, etc.)
                // ADMINs are also listable but maybe we highlight them differently
                setEmployees(data.data);
            }
        } catch (error) {
            console.error(error);
            showToast("Erreur lors du chargement", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPayroll = (employee: any) => {
        setSelectedEmployee(employee);
        setIsPayrollModalOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Users className="text-[#00d3fa]" />
                            Gestion des Employés & Paie
                        </h1>
                        <p className="text-sm text-gray-500">Suivi des salaires, avances et paiements</p>
                    </div>
                    {/* Add Employee Button could go here if we want to create users from here too, 
                        but for now we keep user creation in Users page to separate concerns? 
                        Or duplicates? Let's check plan. Plan says separate. 
                        Let's focus on View/Manage Payroll here. */}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Effectif du Personnel</h3>
                            <div className="text-xs text-gray-500 font-medium">
                                {employees.length} employés actifs
                            </div>
                        </div>

                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Employé</th>
                                    <th className="px-6 py-3">Rôle</th>
                                    <th className="px-6 py-3 text-right">Salaire Base</th>
                                    <th className="px-6 py-3 text-right">Avances (Mois)</th>
                                    <th className="px-6 py-3 text-right">Net à Payer</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400">Chargement...</td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400">Aucun employé trouvé.</td>
                                    </tr>
                                ) : (
                                    employees.map((emp) => {
                                        const baseSalary = parseFloat(emp.baseSalary || 0);
                                        const advances = parseFloat(emp.currentMonthAdvances || 0);
                                        const netToPay = Math.max(0, baseSalary - advances);

                                        return (
                                            <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                                                            {emp.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800">{emp.name}</div>
                                                            <div className="text-xs text-gray-500">{emp.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-sm text-[10px] uppercase font-bold bg-gray-100 text-gray-600">
                                                        {emp.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-700">
                                                    {formatCurrency(baseSalary)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-orange-600">
                                                    {formatCurrency(advances)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-green-700">
                                                    {formatCurrency(netToPay)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleOpenPayroll(emp)}
                                                        className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-sm hover:bg-gray-800 transition-all shadow-sm flex items-center gap-1 mx-auto"
                                                    >
                                                        <DollarSign size={14} /> Gérer Paie
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <PayrollModal
                    isOpen={isPayrollModalOpen}
                    onClose={() => setIsPayrollModalOpen(false)}
                    user={selectedEmployee}
                    onSuccess={fetchEmployees}
                />
            </div>
        </DashboardLayout>
    );
}
