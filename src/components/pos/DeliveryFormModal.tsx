"use client";

import { useState } from "react";
import { X, MapPin, Phone, FileText } from "lucide-react";

interface DeliveryInfo {
    address: string;
    phone: string;
    instructions?: string;
}

interface DeliveryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (info: DeliveryInfo) => void;
    initialData?: DeliveryInfo | null;
}

export default function DeliveryFormModal({ isOpen, onClose, onSubmit, initialData }: DeliveryFormModalProps) {
    const [address, setAddress] = useState(initialData?.address || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [instructions, setInstructions] = useState(initialData?.instructions || '');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!address.trim()) {
            setError('Adresse requise');
            return;
        }

        if (!phone.trim()) {
            setError('Téléphone requis');
            return;
        }

        onSubmit({
            address: address.trim(),
            phone: phone.trim(),
            instructions: instructions.trim() || undefined
        });

        // Reset form
        setAddress('');
        setPhone('');
        setInstructions('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                            <MapPin size={20} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Informations Livraison</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Address */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <MapPin size={16} className="inline mr-1" />
                            Adresse de livraison *
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Ex: 123 Avenue Lumumba, Kinshasa"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Phone size={16} className="inline mr-1" />
                            Téléphone *
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ex: +243 XXX XXX XXX"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                            required
                        />
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <FileText size={16} className="inline mr-1" />
                            Instructions spéciales (optionnel)
                        </label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Ex: Sonner à la porte bleue, 2ème étage..."
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-3 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="py-3 rounded-lg font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30"
                        >
                            Confirmer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
