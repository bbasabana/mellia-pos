"use client";

import { useState, useEffect, useRef } from "react";
import { usePosStore } from "@/store/usePosStore";
import { useReactToPrint } from "react-to-print";
import PosLightProductGrid from "@/components/pos-light/PosLightProductGrid";
import PosLightCart from "@/components/pos-light/PosLightCart";
import PaymentModal from "@/components/pos/PaymentModal";
import PriceSelectionModal from "@/components/pos/PriceSelectionModal";
import ClientFormModal from "@/components/clients/ClientFormModal";
import DeliveryFormModal from "@/components/pos/DeliveryFormModal";
import { ReceiptTemplate } from "@/components/pos/ReceiptTemplate";
import { X, Search, FileText, RefreshCw, Trash2, Clock, User } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import LightLayout from "@/components/layout/LightLayout";

// --- Light Drafts Modal ---
const LightDraftsModal = ({ isOpen, onClose, onLoad }: { isOpen: boolean, onClose: () => void, onLoad: (sale: any) => void }) => {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDrafts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/transactions?status=DRAFT&limit=20");
            const json = await res.json();
            if (json.success) setDrafts(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchDrafts();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl flex flex-col h-[80vh] overflow-hidden">
                <div className="p-4 bg-black text-white flex justify-between items-center shrink-0">
                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} className="text-orange-500" />
                        Brouillons en attente
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-gray-400 font-bold animate-pulse">Chargement...</div>
                    ) : drafts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 italic">
                            <FileText size={48} className="mb-4 opacity-10" />
                            <p className="text-xs uppercase font-bold tracking-widest">Aucun brouillon</p>
                        </div>
                    ) : (
                        drafts.map((d) => (
                            <div
                                key={d.id}
                                onClick={() => { onLoad(d); onClose(); }}
                                className="bg-white border border-gray-200 p-4 rounded-sm shadow-sm hover:border-orange-500 cursor-pointer transition-all flex justify-between items-center group"
                            >
                                <div>
                                    <div className="text-sm font-black text-gray-800 flex items-center gap-2">
                                        #{d.ticketNum}
                                        <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 rounded uppercase font-black">{d.orderType}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 font-bold flex items-center gap-2">
                                        <Clock size={10} />
                                        {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {d.client && <span className="flex items-center gap-1 text-orange-600"><User size={10} /> {d.client.name}</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-black">{(d.totalCdf || 0).toLocaleString()} <span className="text-[10px] text-gray-400">FC</span></div>
                                    <div className="text-[10px] text-orange-600 font-black uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Charger</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Client Select Modal (Lite) ---
const LightClientModal = ({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (c: any) => void }) => {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (!search) { setResults([]); return; }
        const t = setTimeout(async () => {
            const res = await fetch(`/api/clients?query=${search}`);
            const data = await res.json();
            setResults(data);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-sm shadow-2xl flex flex-col h-[70vh] overflow-hidden">
                <div className="p-4 bg-black text-white flex justify-between items-center shrink-0">
                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Search size={16} className="text-orange-500" />
                        Sélectionner Client
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nom ou téléphone..."
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-sm text-sm focus:border-orange-500 outline-none font-bold"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {results.map(c => (
                        <div
                            key={c.id}
                            onClick={() => { onSelect(c); onClose(); }}
                            className="p-4 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center group"
                        >
                            <div>
                                <div className="font-black text-sm text-gray-800 group-hover:text-orange-700 uppercase tracking-tighter">{c.name}</div>
                                <div className="text-[10px] text-gray-400 font-bold">{c.phone || "Pas de numéro"}</div>
                            </div>
                            <div className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-sm font-black uppercase">
                                {c.points} PTS
                            </div>
                        </div>
                    ))}
                    {search && results.length === 0 && <div className="p-10 text-center text-gray-400 text-xs italic">Aucun client trouvé</div>}
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-2.5 bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-sm hover:bg-orange-700 transition-all shadow-md active:scale-[0.98]"
                    >
                        Nouveau Client
                    </button>
                </div>

                <ClientFormModal isOpen={isAdding} onClose={() => setIsAdding(false)} onSuccess={(c) => { onSelect(c); setIsAdding(false); onClose(); }} />
            </div>
        </div>
    );
}

// --- MAIN PAGE ---
export default function PosLightPage() {
    const {
        cart,
        setCart,
        setClient,
        setOrderType,
        setCurrentDraftId,
        clearCart,
        orderType,
        deliveryInfo,
        setDeliveryInfo
    } = usePosStore();

    // Modals
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isDraftsOpen, setIsDraftsOpen] = useState(false);
    const [isClientOpen, setIsClientOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);

    // Printing
    const [printSale, setPrintSale] = useState<any | null>(null);
    const [exchangeRate, setExchangeRate] = useState(2850);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        onAfterPrint: () => setPrintSale(null),
    });

    useEffect(() => {
        if (printSale && printRef.current) handlePrint();
    }, [printSale, handlePrint]);

    useEffect(() => {
        const fetchRate = async () => {
            const res = await fetch("/api/exchange-rate");
            const json = await res.json();
            if (json.success) setExchangeRate(Number(json.data.rateUsdToCdf));
        };
        fetchRate();
    }, []);

    const handleLoadDraft = (sale: any) => {
        const newCart = sale.items.map((item: any) => ({
            productId: item.productId,
            name: item.product.name,
            price: Number(item.unitPrice),
            priceCdf: Math.round(Number(item.unitPriceCdf)),
            spaceName: "Standard",
            quantity: Number(item.quantity),
            saleUnit: item.product.saleUnit
        }));

        setCart(newCart);
        setClient(sale.client || null);
        setOrderType(sale.orderType);
        setCurrentDraftId(sale.id);

        showToast(`Brouillon #${sale.ticketNum} chargé`, "info");
    };

    const handleNewSale = () => {
        if (confirm("Voulez-vous vraiment annuler la vente en cours ?")) {
            clearCart();
            showToast("Nouvelle vente initialisée", "info");
        }
    };

    const posActions = (
        <button
            onClick={handleNewSale}
            className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-sm text-[10px] font-black uppercase tracking-widest border border-orange-100 hover:bg-orange-100 transition-all active:scale-95"
        >
            <RefreshCw size={12} />
            Nouvelle Vente
        </button>
    );

    return (
        <LightLayout headerActions={posActions}>
            <div className="flex-1 flex overflow-hidden h-full">
                {/* Left: Product Grid - Max Width */}
                <div className="flex-1 h-full overflow-hidden border-r border-gray-100">
                    <PosLightProductGrid onSelectPrice={setSelectedProduct} />
                </div>

                {/* Right: Cart - Fixed Width, optimized for landscape */}
                <div className="w-[300px] md:w-[320px] lg:w-[350px] h-full shrink-0 flex flex-col">
                    <PosLightCart
                        onOpenPayment={() => setIsPaymentOpen(true)}
                        onOpenDrafts={() => setIsDraftsOpen(true)}
                        onOpenClient={() => setIsClientOpen(true)}
                    />
                </div>
            </div>

            {/* Modals Mapping */}
            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                onSuccess={(sale) => { if (sale) setPrintSale(sale); }}
            />

            <LightDraftsModal
                isOpen={isDraftsOpen}
                onClose={() => setIsDraftsOpen(false)}
                onLoad={handleLoadDraft}
            />

            <LightClientModal
                isOpen={isClientOpen}
                onClose={() => setIsClientOpen(false)}
                onSelect={(c) => setClient(c)}
            />

            {selectedProduct && (
                <PriceSelectionModal
                    isOpen={!!selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    product={selectedProduct}
                    onSelectPrice={(price) => {
                        usePosStore.getState().addToCart({
                            id: selectedProduct.id,
                            name: selectedProduct.name,
                            price: parseFloat(price.priceUsd || 0),
                            priceCdf: parseFloat(price.priceCdf || 0),
                            spaceName: price.space?.name,
                            saleUnit: selectedProduct.saleUnit
                        });
                        setSelectedProduct(null);
                    }}
                />
            )}

            {/* Hidden Print Area */}
            <div style={{ display: "none" }}>
                <div ref={printRef}>
                    {printSale && <ReceiptTemplate sale={printSale} exchangeRate={exchangeRate} />}
                </div>
            </div>
        </LightLayout>
    );
}
