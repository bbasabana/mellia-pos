"use client";

import { History } from "lucide-react";

export function MovementHistory() {
    return (
        <div className="bg-white border border-gray-200 rounded-sm">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <History size={16} />
                    Derniers Mouvements
                </h3>
            </div>
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <History size={24} className="text-gray-300" />
                </div>
                <p>Le journal des mouvements (Entrées/Sorties) apparaîtra ici.</p>
                <p className="text-xs mt-1">Fonctionnalité en cours d&apos;implémentation.</p>
            </div>
        </div>
    );
}
