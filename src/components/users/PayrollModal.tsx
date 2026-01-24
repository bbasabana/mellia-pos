
"use client";

import { Modal } from "@/components/ui/Modal";
import { useState, useEffect } from "react";
import { showToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";


interface PayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onSuccess: () => void;
}

export function PayrollModal({ isOpen, onClose, user, onSuccess }: PayrollModalProps) {
    const [activeTab, setActiveTab] = useState("advance");
    const [loading, setLoading] = useState(false);

    // Advance Form
    const [advanceData, setAdvanceData] = useState({ amount: "", reason: "" });

    // Payroll Form
    const [payrollData, setPayrollData] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        bonus: "0",
        penalty: "0",
        notes: ""
    });

    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && user) {
            fetchHistory();
        }
    }, [isOpen, user]);

    const fetchHistory = async () => {
        try {
            const [advRes, payRes] = await Promise.all([
                fetch(`/api/payroll/advances?userId=${user.id}`),
                fetch(`/api/payroll?userId=${user.id}`)
            ]);

            const advData = await advRes.json();
            const payData = await payRes.json();

            const advances = advData.success ? advData.data.map((a: any) => ({
                ...a,
                type: 'ADVANCE',
                displayDate: a.date,
                displayAmount: -Number(a.amount), // Negative as it's taking money out (or shown as advance)
                description: `Avance: ${a.reason}`
            })) : [];

            const payrolls = payData.success ? payData.data.map((p: any) => ({
                ...p,
                type: 'PAYROLL',
                displayDate: p.paymentDate,
                displayAmount: -Number(p.netPaid), // Payment out
                description: `Salaire ${new Date(0, p.month - 1).toLocaleString('fr', { month: 'long' })} ${p.year}`,
                status: "PAID" // Payrolls are always completed effectively
            })) : [];

            // Combine and sort by date descending
            const combined = [...advances, ...payrolls].sort((a, b) =>
                new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime()
            );

            setHistory(combined);
        } catch (e) { console.error(e); }
    };

    const handleAdvanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/payroll/advances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    amount: advanceData.amount,
                    reason: advanceData.reason
                })
            });
            const json = await res.json();
            if (json.success) {
                showToast("Avance accordée", "success");
                setAdvanceData({ amount: "", reason: "" });
                fetchHistory(); // Refresh history
                onSuccess(); // Refresh parent user list stats
            } else {
                showToast(json.error, "error");
            }
        } catch (e) { showToast("Erreur serveur", "error"); }
        finally { setLoading(false); }
    };

    const handlePayrollSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm(`Confirmer le paiement du salaire pour ${user.name} ?`)) return;

        setLoading(true);
        try {
            const res = await fetch("/api/payroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    ...payrollData
                })
            });
            const json = await res.json();
            if (json.success) {
                showToast("Paie validée succès", "success");
                onClose();
                onSuccess();
            } else {
                showToast(json.error, "error");
            }
        } catch (e) { showToast("Erreur serveur", "error"); }
        finally { setLoading(false); }
    };

    // Calculate Estimated Net
    const currentMonthAdvances = history.filter(h => {
        // Very basic filter: show all undeducted advances? Or strictly this month?
        // API logic deducts ALL approved/paid advances not yet linked to payroll.
        // Let's filter by status for estimation.
        return h.status === "APPROVED" || h.status === "PAID";
    }).reduce((sum, h) => sum + Number(h.amount), 0);

    const base = Number(user?.baseSalary || 0);
    const estimatedNet = base + Number(payrollData.bonus) - Number(payrollData.penalty) - currentMonthAdvances;

    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gestion Paie: ${user.name}`} size="lg">
            <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center text-blue-800">
                    <div>
                        <p className="text-xs uppercase font-bold opacity-70">Salaire de Base</p>
                        <p className="text-xl font-bold">{formatCurrency(user.baseSalary || 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold opacity-70">Avances (Non déduites)</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(currentMonthAdvances)}</p>
                    </div>
                </div>

                <div className="flex border-b border-gray-200 mb-4">
                    <button onClick={() => setActiveTab("advance")} className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === "advance" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                        Nouvelle Avance
                    </button>
                    <button onClick={() => setActiveTab("payroll")} className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === "payroll" ? "border-green-500 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                        Payer le Salaire
                    </button>
                    <button onClick={() => setActiveTab("history")} className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === "history" ? "border-gray-500 text-gray-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                        Historique
                    </button>
                </div>

                {activeTab === "advance" && (
                    <form onSubmit={handleAdvanceSubmit} className="space-y-4 animate-in fade-in">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Montant de l&apos;avance ($)</label>
                            <input type="number" step="0.01" required value={advanceData.amount} onChange={e => setAdvanceData({ ...advanceData, amount: e.target.value })} className="w-full border rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="Ex: 50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Raison / Motif</label>
                            <input type="text" required value={advanceData.reason} onChange={e => setAdvanceData({ ...advanceData, reason: e.target.value })} className="w-full border rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="Ex: Achat médicaments" />
                        </div>
                        <button disabled={loading} type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
                            {loading ? "..." : "Accorder l'avance"}
                        </button>
                    </form>
                )}

                {activeTab === "payroll" && (
                    <form onSubmit={handlePayrollSubmit} className="space-y-4 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mois</label>
                                <select value={payrollData.month} onChange={e => setPayrollData({ ...payrollData, month: parseInt(e.target.value) })} className="w-full border rounded px-3 py-2 bg-white">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                        <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('fr', { month: 'long' })}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Année</label>
                                <input type="number" value={payrollData.year} onChange={e => setPayrollData({ ...payrollData, year: parseInt(e.target.value) })} className="w-full border rounded px-3 py-2" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Prime / Bonus (+)</label>
                                <input type="number" value={payrollData.bonus} onChange={e => setPayrollData({ ...payrollData, bonus: e.target.value })} className="w-full border rounded px-3 py-2 text-green-600 font-bold" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sanction / Retenue (-)</label>
                                <input type="number" value={payrollData.penalty} onChange={e => setPayrollData({ ...payrollData, penalty: e.target.value })} className="w-full border rounded px-3 py-2 text-red-600 font-bold" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes (Optionnel)</label>
                            <input type="text" value={payrollData.notes} onChange={e => setPayrollData({ ...payrollData, notes: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Note sur la fiche de paie..." />
                        </div>

                        <div className="bg-gray-100 p-4 rounded flex justify-between items-center text-lg font-bold border border-gray-200">
                            <span>Net à Payer Estimé :</span>
                            <span className={estimatedNet < 0 ? "text-red-500" : "text-green-600"}>{formatCurrency(estimatedNet)}</span>
                        </div>

                        <button disabled={loading} type="submit" className="w-full py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700">
                            {loading ? "..." : "Valider le Paiement"}
                        </button>
                    </form>
                )}

                {activeTab === "history" && (
                    <div className="overflow-auto max-h-60 animate-in fade-in">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-2 py-2">Date</th>
                                    <th className="px-2 py-2">Montant</th>
                                    <th className="px-2 py-2">Raison</th>
                                    <th className="px-2 py-2 text-right">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.map(h => (
                                    <tr key={h.id || h.createdAt}>
                                        <td className="px-2 py-2 text-gray-500">{new Date(h.displayDate).toLocaleDateString()}</td>
                                        <td className="px-2 py-2 font-bold">
                                            <span className={h.type === 'PAYROLL' ? 'text-green-600' : 'text-orange-600'}>
                                                {formatCurrency(Math.abs(h.displayAmount))}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2 text-gray-600 text-xs">
                                            {h.description}
                                            {h.notes && <div className="text-[10px] italic text-gray-400">{h.notes}</div>}
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${h.type === 'PAYROLL' ? 'bg-green-100 text-green-700' :
                                                    h.status.includes('DEDUCTED') ? 'bg-gray-100 text-gray-500 line-through' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {h.type === 'PAYROLL' ? 'PAYÉ' : h.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {history.length === 0 && <p className="text-center text-gray-400 py-4">Aucun historique.</p>}
                    </div>
                )}
            </div>
        </Modal>
    );
}
