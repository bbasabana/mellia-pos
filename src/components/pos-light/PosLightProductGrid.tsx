"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Box } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function PosLightProductGrid({ onSelectPrice }: { onSelectPrice: (product: any) => void }) {
    const { addToCart } = usePosStore();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch("/api/products?active=true&vendable=true");
                const json = await res.json();
                if (json.success) setProducts(json.data);
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const categories = ["ALL", ...Array.from(new Set(products.map(p => {
        if (p.type === "BEVERAGE") return p.beverageCategory || "AUTRE";
        if (p.type === "FOOD") return p.foodCategory || "AUTRE";
        return "AUTRE";
    }))).sort()];

    const filtered = products.filter(p => {
        const cat = p.type === "BEVERAGE" ? p.beverageCategory : p.foodCategory;
        const matchesCategory = activeCategory === "ALL" || (cat || "AUTRE") === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categoryTranslations: Record<string, string> = {
        "ALL": "Tout",
        "FAST_FOOD": "Fast Food",
        "GRILLADE": "Grillades",
        "ACCOMPAGNEMENT": "Accompagnements",
        "BIERE": "Bières",
        "SUCRE": "Sucrés",
        "EAU": "Eaux",
        "JUS": "Jus",
        "VIN": "Vins",
        "WHISKY": "Whiskies",
        "CHAMPAGNE": "Champagnes",
        "LIQUEUR": "Liqueurs",
        "COCKTAIL": "Cocktails",
        "AUTRE": "Autres"
    };

    const handleProductClick = (product: any) => {
        const targetLocation = product.type === 'BEVERAGE' ? 'FRIGO' : 'CUISINE';
        const stockItem = product.stockItems?.find((s: any) => s.location === targetLocation);
        const stock = stockItem ? Number(stockItem.quantity) : 0;

        if (stock <= 0) {
            showToast(`Épuisé: ${product.name}`, "error");
            return;
        }

        const prices = product.prices || [];
        if (prices.length === 0) {
            showToast("Prix non défini", "error");
            return;
        }

        if (prices.length === 1) {
            const price = prices[0];
            addToCart({
                id: product.id,
                name: product.name,
                price: parseFloat(price.priceUsd || 0),
                priceCdf: parseFloat(price.priceCdf || 0),
                spaceName: price.space?.name,
                saleUnit: product.saleUnit
            });
        } else {
            onSelectPrice(product);
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 font-bold animate-pulse">Chargement catalogue...</div>;

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            {/* Search & Categories Bar - Very Compact */}
            <div className="bg-white border-b border-gray-200 shrink-0 flex items-center px-4 py-2 gap-4 overflow-hidden shadow-sm">
                <div className="relative w-56 shrink-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-xs focus:border-orange-500 focus:outline-none transition-all font-bold"
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-4 py-1.5 rounded-sm text-[10px] font-black whitespace-nowrap uppercase transition-all border",
                                activeCategory === cat
                                    ? "bg-orange-600 text-white border-orange-600 shadow-md transform scale-[1.02]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:bg-orange-50"
                            )}
                        >
                            {categoryTranslations[cat] || cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid - Maximum Space */}
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                    {filtered.map(product => {
                        const targetLocation = product.type === 'BEVERAGE' ? 'FRIGO' : 'CUISINE';
                        const stock = product.stockItems?.find((s: any) => s.location === targetLocation)?.quantity || 0;
                        const isOutOfStock = Number(stock) <= 0;

                        return (
                            <button
                                key={product.id}
                                disabled={isOutOfStock}
                                onClick={() => handleProductClick(product)}
                                className={cn(
                                    "relative flex flex-col items-center justify-between p-3 bg-white border border-gray-200 rounded-sm shadow-sm transition-all active:scale-95 group overflow-hidden h-28",
                                    isOutOfStock ? "opacity-40 grayscale pointer-events-none" : "hover:border-orange-500 hover:shadow-lg"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full",
                                    isOutOfStock ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-700"
                                )}>
                                    {stock}
                                </div>

                                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-black text-base shrink-0 mb-1 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    {product.name.charAt(0)}
                                </div>

                                <span className="text-[10px] font-extrabold text-gray-900 text-center line-clamp-2 leading-tight w-full mb-1">
                                    {product.name}
                                </span>

                                <div className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-sm mt-auto w-full text-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    {product.prices?.[0]?.priceCdf.toLocaleString()} FC
                                </div>
                            </button>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-300 italic">
                        <Box size={32} className="mb-2 opacity-20" />
                        <span className="text-xs font-bold uppercase tracking-widest">Aucun produit</span>
                    </div>
                )}
            </div>
        </div>
    );
}
