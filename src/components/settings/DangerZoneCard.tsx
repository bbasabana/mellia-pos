"use client";

import { useState } from "react";
import { AlertOctagon, RefreshCcw, AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";

export function DangerZoneCard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        if (confirmationText !== "EFFACER") {
            showToast("Veuillez saisir 'EFFACER' pour confirmer.", "error");
            return;
        }

        setIsResetting(true);
        try {
            const response = await fetch("/api/admin/reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ confirmation: confirmationText }),
            });

            const data = await response.json();

            if (data.success) {
                showToast(data.message, "success");
                setIsModalOpen(false);
                setConfirmationText("");
                // Reload page to refresh all stats after a delay
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                showToast(data.error || "Une erreur est survenue.", "error");
            }
        } catch (error) {
            console.error("Reset error:", error);
            showToast("Erreur de connexion au serveur.", "error");
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-none border border-red-200 overflow-hidden shadow-sm">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
                    <AlertOctagon className="text-red-500" size={20} />
                    <h2 className="text-red-800 font-bold uppercase tracking-wider text-sm">Zone de Danger</h2>
                </div>

                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Remise à zéro du système</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Cette action supprimera toutes les transactions (ventes, dépenses, investissements, etc.)
                                et réinitialisera les stocks à zéro. <span className="font-bold text-red-600">Les produits et les utilisateurs ne seront pas supprimés.</span>
                            </p>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 whitespace-nowrap"
                        >
                            <RefreshCcw size={18} />
                            Tout réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => !isResetting && setIsModalOpen(false)}
                title="Confirmation de réinitialisation totale"
                size="md"
            >
                <div className="space-y-6">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-4">
                        <AlertTriangle className="text-red-600 shrink-0" size={24} />
                        <div>
                            <p className="text-sm font-bold text-red-800">Attention : action irréversible</p>
                            <p className="text-xs text-red-700 mt-1">
                                Toutes les données de vente, d'inventaire et les statistiques financières seront définitivement effacées.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 block">
                            Veuillez saisir <span className="font-bold text-red-600 select-none">EFFACER</span> pour confirmer :
                        </label>
                        <input
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                            disabled={isResetting}
                            placeholder="Tapez EFFACER ici"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-0 outline-none transition-colors text-center font-bold tracking-widest uppercase"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            disabled={isResetting}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={isResetting || confirmationText !== "EFFACER"}
                            className="flex-[2] px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
                        >
                            {isResetting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Réinitialisation...
                                </>
                            ) : (
                                "Confirmer la suppression"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
