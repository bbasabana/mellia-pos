"use client";

import { usePosStore } from "@/store/usePosStore";
import { Search, Calculator, Trash2, UserPlus, CreditCard, Minus, Plus, Save, Store, Filter, ShoppingCart, X, Printer, FilePlus, RefreshCcw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { ReceiptTemplate } from "@/components/pos/ReceiptTemplate";
import ClientFormModal from "@/components/clients/ClientFormModal";
import PaymentModal from "@/components/pos/PaymentModal";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PriceSelectionModal from "@/components/pos/PriceSelectionModal";
import OrderTypeSelector from "@/components/pos/OrderTypeSelector";
import DeliveryFormModal from "@/components/pos/DeliveryFormModal";
import ServerDraftsList from "@/components/pos/ServerDraftsList";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";

// --- Components (Inline for now, can extract) ---

const ClientSelector = () => {
    const { selectedClient, setClient } = usePosStore();
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);


    useEffect(() => {
        if (!search) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/clients?query=${search}`);
                const data = await res.json();
                setResults(data);
            } catch (e) {
                console.error(e);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="bg-white border-b border-gray-200 p-3">
            {!selectedClient ? (
                <div className="relative flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un client..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:border-[#00d3fa] focus:outline-none transition-colors font-medium"
                        />
                        {results.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-b-sm mt-1 border border-gray-100 z-50 max-h-60 overflow-y-auto">
                                {results.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => { setClient(c); setSearch(""); setResults([]); }}
                                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                    >
                                        <div className="font-bold text-sm text-gray-800">{c.name}</div>
                                        <div className="text-xs text-gray-500">{c.phone || "Pas de numéro"}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-3 bg-blue-50 text-blue-600 rounded-sm hover:bg-blue-100 transition-colors"
                        title="Nouveau Client"
                    >
                        <UserPlus size={18} />
                    </button>
                    <ClientFormModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={() => { }}
                    />
                </div>
            ) : (
                <div className="flex justify-between items-center bg-blue-50 rounded-sm p-3 border border-blue-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-black text-xs shrink-0 ring-2 ring-white">
                            {selectedClient.name.charAt(0)}
                        </div>
                        <div className="truncate">
                            <div className="font-bold text-sm text-blue-900 truncate">{selectedClient.name}</div>
                            <div className="text-xs text-blue-600 font-medium leading-none mt-0.5">{selectedClient.points} points</div>
                        </div>
                    </div>
                    <button onClick={() => setClient(null)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

const Cart = ({ setPrintSale }: { setPrintSale: (sale: any) => void }) => {
    const {
        cart,
        updateQuantity,
        total,
        totalCdf,
        clearCart,
        orderType,
        setOrderType,
        deliveryInfo,
        setDeliveryInfo,
        setCart,
        setClient,
        currentDraftId,
        setCurrentDraftId
    } = usePosStore();

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);

    // Prevent hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleOrderTypeChange = (type: any) => {
        setOrderType(type);
        if (type === 'DELIVERY') {
            setIsDeliveryModalOpen(true);
        }
    };

    const formatUsd = (val: number) => {
        // Round to 2 decimals
        const rounded = Math.round(val * 100) / 100;
        // Format to string and remove useless trailing zeros
        return rounded.toString();
    };

    const handleSaveDraft = async () => {
        if (cart.length === 0) return;
        setSavingDraft(true);

        try {
            // Prepare Payload
            const payload = {
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    priceCdf: item.priceCdf, // CRITICAL: Pass exact CDF
                    saleUnit: item.saleUnit
                })),
                clientId: usePosStore.getState().selectedClient?.id,
                orderType,
                deliveryInfo,
                status: "DRAFT"
            };

            let res;
            if (currentDraftId) {
                res = await fetch(`/api/transactions?id=${currentDraftId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: payload.items.map(i => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            unitPrice: i.price,
                            unitPriceCdf: i.priceCdf // Pass exact CDF for update
                        })),
                    })
                });
            } else {
                res = await fetch("/api/sales", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            const json = await res.json();

            if (json.success || (res.ok && json.id)) {
                showToast("Brouillon enregistré !", "success");
                clearCart();
            } else {
                throw new Error(json.error || "Erreur inconnue");
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.message || "Erreur lors de la sauvegarde", "error");
        } finally {
            setSavingDraft(false);
        }
    };

    const handleLoadDraft = (sale: any) => {
        if (cart.length > 0) {
            if (!confirm("Le panier actuel sera remplacé. Continuer ?")) return;
        }

        // Map Sale Items to Cart Items
        const newCart = sale.items.map((item: any) => ({
            productId: item.productId,
            name: item.product.name,
            price: Number(item.unitPrice),
            priceCdf: Math.round(Number(item.unitPriceCdf)), // Use stored CDF, rounded to be sure
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
        if (cart.length > 0) {
            if (!confirm("Vider le panier et commencer une nouvelle vente ?")) return;
        }
        clearCart();
        showToast("Nouvelle vente", "info");
    }

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl z-20">
            <ClientSelector />

            <div className="px-3 pt-3 pb-0">
                <OrderTypeSelector selected={orderType} onChange={handleOrderTypeChange} />

                {orderType === 'DELIVERY' && deliveryInfo && (
                    <div className="mt-2 p-2.5 bg-orange-50 border border-orange-100 rounded-sm text-xs text-orange-800 flex justify-between items-center">
                        <span className="truncate flex-1 font-bold">
                            📍 {deliveryInfo.address}
                        </span>
                        <button
                            onClick={() => setIsDeliveryModalOpen(true)}
                            className="text-orange-600 underline ml-2 whitespace-nowrap font-medium cursor-pointer"
                        >
                            Modifier
                        </button>
                    </div>
                )}
            </div>

            {/* Drafts List Component */}
            <div className="px-3 pt-2">
                <ServerDraftsList onLoad={handleLoadDraft} />
                {/* Divider */}
                <div className="h-px bg-gray-100 my-2"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/30 mt-0">
                {/* Header Cart */}
                <div className="flex justify-between items-center px-1 pb-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                            {cart.length > 0 ? `Panier (${cart.length})` : 'Vide'}
                        </span>
                        {currentDraftId && (
                            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                                Mode Édition
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={handleNewSale}
                            className="text-gray-400 hover:text-gray-800 p-1.5 hover:bg-gray-200 rounded-sm transition-colors"
                            title="Nouvelle vente"
                        >
                            <FilePlus size={16} />
                        </button>
                        {cart.length > 0 && (
                            <button
                                onClick={handleSaveDraft}
                                disabled={savingDraft}
                                className={`text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-sm transition-colors ${savingDraft ? 'animate-pulse' : ''}`}
                                title={currentDraftId ? "Mettre à jour le brouillon" : "Sauvegarder en brouillon"}
                            >
                                <Save size={16} />
                            </button>
                        )}
                        {(cart.length > 0 || orderType !== 'DINE_IN') && (
                            <button onClick={clearCart} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-sm transition-colors">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {!mounted ? (
                    <div className="text-center py-10 text-gray-400 text-sm">Chargement...</div>
                ) : cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                        <Calculator className="mb-3 opacity-20" size={32} />
                        <p className="text-sm font-bold opacity-50">Panier vide</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.productId} className="bg-white border border-gray-100 rounded-sm p-3 shadow-sm flex flex-col gap-2 group hover:border-[#00d3fa] transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="leading-tight">
                                    <div className="font-bold text-gray-800 text-sm mb-0.5">
                                        {item.name}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                        {item.spaceName && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">{item.spaceName}</span>}
                                        {item.priceCdf.toLocaleString()} FC / {item.saleUnit}
                                    </div>
                                </div>
                                <div className="text-right leading-tight">
                                    <span className="font-black text-gray-900 block text-base">
                                        {(item.quantity * item.priceCdf).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                                        ${formatUsd(item.price * item.quantity)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-gray-50 mt-1">
                                <div className="flex items-center bg-gray-50 rounded-sm border border-gray-200 h-8 overflow-hidden">
                                    <button
                                        onClick={() => updateQuantity(item.productId, -1)}
                                        className="w-8 h-full flex items-center justify-center hover:bg-gray-200 text-gray-500 hover:text-red-500 transition-colors border-r border-gray-200"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="w-10 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.productId, 1)}
                                        className="w-8 h-full flex items-center justify-center hover:bg-gray-200 text-gray-500 hover:text-green-600 transition-colors border-l border-gray-200"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-gray-200 space-y-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-10">
                <div className="flex justify-between items-end px-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total à payer</span>
                    <div className="text-right leading-none">
                        <div className="text-2xl font-black text-gray-900">
                            {mounted ? totalCdf().toLocaleString() : '0'} <span className="text-lg text-gray-500 font-bold">FC</span>
                        </div>
                        <div className="text-sm font-medium text-gray-400 mt-1">
                            ${mounted ? formatUsd(total()) : '0'} USD
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        disabled={!mounted || cart.length === 0}
                        onClick={handleSaveDraft}
                        className="flex-1 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold py-3.5 rounded-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] text-sm tracking-wide uppercase"
                    >
                        <Save size={18} />
                        <span>Brouillon</span>
                    </button>
                    <button
                        disabled={!mounted || cart.length === 0}
                        onClick={() => setIsPaymentOpen(true)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] text-sm tracking-wide uppercase"
                    >
                        <CreditCard size={18} />
                        <span>Payer</span>
                    </button>
                </div>
            </div>

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                onSuccess={(sale) => {
                    if (sale) {
                        setPrintSale(sale);
                    }
                }}
            />

            <DeliveryFormModal
                isOpen={isDeliveryModalOpen}
                onClose={() => {
                    setIsDeliveryModalOpen(false);
                    if (!deliveryInfo && orderType === 'DELIVERY') {
                        setOrderType('DINE_IN');
                    }
                }}
                onSubmit={(info) => {
                    setDeliveryInfo(info);
                    setIsDeliveryModalOpen(false);
                }}
                initialData={deliveryInfo}
            />
        </div>
    );
};


// ... (ClientSelector and Cart stay mostly same but Cart needs update for display)

// Updated ProductGrid with Real Data
const ProductGrid = () => {
    const { addToCart } = usePosStore();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("ALL");

    // Modal State
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch only active and vendable products for POS
                const res = await fetch("/api/products?active=true&vendable=true");
                const json = await res.json();
                if (json.success) {
                    setProducts(json.data);
                }
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Derive categories dynamically
    const categories = ["ALL", ...Array.from(new Set(products.map(p => {
        if (p.type === "BEVERAGE") return p.beverageCategory || "AUTRE";
        if (p.type === "FOOD") return p.foodCategory || "AUTRE";
        return "AUTRE";
    }))).sort()];

    const filtered = activeCategory === "ALL"
        ? products
        : products.filter(p => {
            const cat = p.type === "BEVERAGE" ? p.beverageCategory : p.foodCategory;
            return (cat || "AUTRE") === activeCategory;
        });

    const getProductStock = (product: any) => {
        const targetLocation = product.type === 'BEVERAGE' ? 'FRIGO' : 'CUISINE';
        const stockItem = product.stockItems?.find((s: any) => s.location === targetLocation);
        return stockItem ? Number(stockItem.quantity) : 0;
    };

    const handleProductClick = (product: any) => {
        const availableStock = getProductStock(product);
        if (availableStock <= 0) {
            showToast(`Stock épuisé pour ${product.name}`, "error");
            return;
        }

        // Check prices
        const prices = product.prices || [];
        if (prices.length === 0) {
            showToast("Ce produit n'a pas de prix défini.", "error");
            return;
        }

        if (prices.length === 1) {
            // Add directly
            const price = prices[0];
            addToCart({
                id: product.id,
                name: product.name,
                price: parseFloat(price.priceUsd || 0), // Ensure number
                priceCdf: parseFloat(price.priceCdf || 0),
                spaceName: price.space?.name,
                saleUnit: product.saleUnit
            });
        } else {
            // Open modal
            setSelectedProduct(product);
            setIsPriceModalOpen(true);
        }
    };

    const handlePriceSelect = (price: any) => {
        if (!selectedProduct) return;
        addToCart({
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: parseFloat(price.priceUsd || 0),
            priceCdf: parseFloat(price.priceCdf || 0),
            spaceName: price.space?.name,
            saleUnit: selectedProduct.saleUnit
        });
        setIsPriceModalOpen(false);
        setSelectedProduct(null);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-gray-500 text-sm font-medium animate-pulse">Chargement du catalogue...</div>
        </div>
    );

    // Translate categories
    const categoryTranslations: Record<string, string> = {
        "ALL": "Tout le catalogue",
        "FAST_FOOD": "Fast Food",
        "GRILLADE": "Grillades",
        "ACCOMPAGNEMENT": "Accompagnements",
        "BIERE": "Bières",
        "SUCRE": "Boissons Sucrées",
        "EAU": "Eaux",
        "JUS": "Jus",
        "VIN": "Vins",
        "WHISKY": "Whiskies",
        "CHAMPAGNE": "Champagnes",
        "LIQUEUR": "Liqueurs",
        "COCKTAIL": "Cocktails",
        "AUTRE": "Autres"
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">

            {/* Header POS */}
            <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Store className="text-[#00d3fa]" />
                        Point de Vente
                    </h1>
                    <p className="text-xs text-gray-500">Caisse et prise de commande</p>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto pb-2 shrink-0 border-b border-gray-200 bg-white">
                <Filter size={14} className="text-gray-400 shrink-0 mr-1" />
                {categories.map((cat: any) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-sm text-xs font-bold whitespace-nowrap transition-all border ${activeCategory === cat
                            ? "bg-gray-800 text-white border-gray-800 shadow-md"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        {categoryTranslations[cat] || cat}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {filtered.map((product) => {
                        const stock = getProductStock(product);
                        const isOutOfStock = stock <= 0;
                        const isLowStock = stock <= 5 && stock > 0;

                        return (
                            <button
                                key={product.id}
                                onClick={() => handleProductClick(product)}
                                disabled={isOutOfStock}
                                className={`flex flex-col items-center p-4 bg-white border border-gray-200 rounded-sm shadow-sm transition-all relative overflow-hidden group text-left
                                    ${isOutOfStock ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-lg hover:border-[#00d3fa] active:scale-[0.98]'}
                                `}
                            >
                                {/* Stock Badge */}
                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${isOutOfStock ? 'bg-red-50 text-red-600' :
                                    isLowStock ? 'bg-orange-50 text-orange-600' :
                                        'bg-green-50 text-green-600'
                                    }`}>
                                    {isOutOfStock ? 'Épuisé' : `${stock} dispo`}
                                </div>

                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600 group-hover:bg-[#00d3fa] group-hover:text-white transition-colors duration-300">
                                    <span className="font-black text-lg">{product.name.charAt(0)}</span>
                                </div>

                                <span className="font-bold text-gray-800 text-center text-sm leading-tight mb-2 line-clamp-2 h-10 flex items-center justify-center w-full">
                                    {product.name}
                                </span>

                                <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-sm w-full text-center group-hover:bg-gray-100 transition-colors">
                                    {product.prices?.length > 1
                                        ? `${product.prices.length} choix`
                                        : product.prices?.[0]?.priceCdf
                                            ? `${Number(product.prices[0].priceCdf).toLocaleString()} FC`
                                            : '--'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <PriceSelectionModal
                isOpen={isPriceModalOpen}
                onClose={() => setIsPriceModalOpen(false)}
                product={selectedProduct}
                onSelectPrice={handlePriceSelect}
            />
        </div>
    );
};

export default function PosPage() {
    const { cart } = usePosStore();
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(2850); // Default fallback

    // Fetch exchange rate on mount
    useEffect(() => {
        const fetchRate = async () => {
            try {
                const res = await fetch("/api/exchange-rate");
                const json = await res.json();
                if (json.success && json.data?.rateUsdToCdf) {
                    setExchangeRate(Number(json.data.rateUsdToCdf));
                }
            } catch (e) {
                console.error("Failed to fetch exchange rate", e);
            }
        };
        fetchRate();
    }, []);

    // Printing Logic
    const [printSale, setPrintSale] = useState<any | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        onAfterPrint: () => setPrintSale(null),
    });

    useEffect(() => {
        if (printSale && printRef.current) {
            handlePrint();
        }
    }, [printSale, handlePrint]);

    return (
        <DashboardLayout disablePadding={true}>
            <div className="flex h-full overflow-hidden relative">
                {/* Left: Product Grid */}
                <div className="flex-1 h-full overflow-hidden bg-gray-50 relative">
                    <ProductGrid />

                    {/* FAB for Mobile Cart */}
                    <button
                        onClick={() => setIsMobileCartOpen(true)}
                        className="lg:hidden absolute bottom-6 right-6 w-14 h-14 bg-[#000] text-white rounded-full shadow-xl flex items-center justify-center z-40 transition-transform active:scale-95"
                    >
                        <ShoppingCart size={24} />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Right: Cart (Responsive: Hidden on small screens, sidebar on large) */}
                <div className="hidden lg:flex w-[350px] xl:w-[380px] h-full shrink-0 z-10 relative border-l border-gray-200">
                    <Cart setPrintSale={setPrintSale} />
                </div>

                {/* Hidden Print Area */}
                <div style={{ display: "none" }}>
                    <div ref={printRef}>
                        {printSale && <ReceiptTemplate sale={printSale} exchangeRate={exchangeRate} />}
                    </div>
                </div>

                {/* Mobile: Drawer/Overlay */}
                {isMobileCartOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 bg-white animate-in slide-in-from-right duration-200 flex flex-col">
                        <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <span className="font-bold text-sm text-gray-700 pl-2">Panier & Résumé</span>
                            <button
                                onClick={() => setIsMobileCartOpen(false)}
                                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <Cart setPrintSale={setPrintSale} />
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
