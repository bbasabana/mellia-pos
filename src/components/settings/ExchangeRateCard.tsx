"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Save, DollarSign } from "lucide-react";

export function ExchangeRateCard() {
    const [loading, setLoading] = useState(false);
    const [currentRate, setCurrentRate] = useState<number>(0);
    const [newRate, setNewRate] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchRate();
    }, []);

    const fetchRate = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/exchange-rate");
            const data = await res.json();
            if (data.success && data.data) {
                setCurrentRate(parseFloat(data.data.rateUsdToCdf));
                setNewRate(data.data.rateUsdToCdf.toString());
            }
        } catch (error) {
            console.error("Error fetching rate:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRate || isNaN(parseFloat(newRate))) return;

        setLoading(true);
        try {
            const res = await fetch("/api/exchange-rate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rateUsdToCdf: newRate }),
            });
            const data = await res.json();
            if (data.success) {
                setCurrentRate(parseFloat(data.data.rateUsdToCdf));
                setIsEditing(false);
            } else {
                alert("Erreur: " + data.error);
            }
        } catch (error) {
            console.error("Error updating rate:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <div>
                    <h3 className="text-sm font-bold text-gray-800">Taux de Change</h3>
                </div>
                <div className="text-[#71de00]">
                    <DollarSign size={16} />
                </div>
            </div>

            <div className="px-4 py-3">
                {/* Current Rate Display */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">1 USD vaut</p>
                        <p className="text-xl font-bold text-[#00d3fa]">
                            {currentRate.toLocaleString('fr-FR')} <span className="text-xs text-gray-500 font-normal">CDF</span>
                        </p>
                    </div>

                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-medium text-gray-400 hover:text-[#00d3fa] transition-colors uppercase tracking-wide"
                        >
                            Modifier
                        </button>
                    )}
                </div>

                {isEditing && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                        <form onSubmit={handleUpdate} className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                            <input
                                type="number"
                                step="0.01"
                                value={newRate}
                                onChange={(e) => setNewRate(e.target.value)}
                                className="w-24 p-1 text-sm border border-gray-300 rounded focus:border-[#00d3fa] focus:ring-1 focus:ring-[#00d3fa] outline-none transition-all"
                                placeholder="2900"
                                autoFocus
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-2 py-1 bg-[#00d3fa] text-white text-xs font-bold rounded hover:opacity-90 transition-opacity"
                            >
                                OK
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200"
                            >
                                X
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
