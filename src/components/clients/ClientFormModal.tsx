"use client";

import { useForm } from "react-hook-form";
import { X, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { showToast } from "@/components/ui/Toast";

type ClientFormData = {
    name: string;
    phone: string;
    email: string;
    notes: string;
};

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (client: any) => void;
    clientToEdit?: any;
}

export default function ClientFormModal({ isOpen, onClose, onSuccess, clientToEdit }: ClientFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
        defaultValues: {
            name: clientToEdit?.name || "",
            phone: clientToEdit?.phone || "",
            email: clientToEdit?.email || "",
            notes: clientToEdit?.notes || "",
        }
    });

    const onSubmit = async (data: ClientFormData) => {
        setLoading(true);
        setError("");

        try {
            const url = clientToEdit ? `/api/clients/${clientToEdit.id}` : "/api/clients";
            const method = clientToEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Error saving client");
            }
            const dataJson = await res.json();
            showToast(clientToEdit ? "Client modifié avec succès" : "Client créé avec succès", "success");
            onSuccess(dataJson.data || dataJson);
            onClose();
        } catch (e: any) {
            setError(e.message);
            showToast(e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-md flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b bg-black text-white shrink-0">
                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        {clientToEdit ? "Modifier Client" : "Nouveau Client"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 overflow-y-auto min-h-0">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nom complet *</label>
                        <input
                            {...register("name", { required: "Le nom est requis" })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm focus:border-orange-500 outline-none transition-all font-bold text-sm"
                            placeholder="Ex: Jean Paul"
                        />
                        {errors.name && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Téléphone</label>
                        <input
                            {...register("phone")}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm focus:border-orange-500 outline-none transition-all font-bold text-sm"
                            placeholder="Ex: 099000000"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                        <input
                            {...register("email")}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm focus:border-orange-500 outline-none transition-all font-bold text-sm"
                            placeholder="Ex: jean@mail.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Note</label>
                        <textarea
                            {...register("notes")}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm focus:border-orange-500 outline-none transition-all font-bold text-sm"
                            placeholder="Infos supplémentaires..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 bg-orange-600 text-white rounded-sm hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            Valider
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
