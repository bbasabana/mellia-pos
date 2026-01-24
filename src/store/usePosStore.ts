import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartItem = {
    productId: string;
    name: string;
    price: number;
    priceCdf: number;
    spaceName?: string; // e.g. "VIP", "Terrasse"
    quantity: number;
    saleUnit: string;
};

type Client = {
    id: string;
    name: string;
    points: number;
};

type OrderType = 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';

type DeliveryInfo = {
    address: string;
    phone: string;
    instructions?: string;
};

type DraftSale = {
    id: string;
    name: string;
    cart: CartItem[];
    client: Client | null;
    orderType: OrderType;
    deliveryInfo: DeliveryInfo | null;
    createdAt: Date;
};

interface PosState {
    cart: CartItem[];
    selectedClient: Client | null;
    orderType: OrderType;
    deliveryInfo: DeliveryInfo | null;
    draftSales: DraftSale[];

    // Cart actions
    addToCart: (product: any) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, delta: number) => void;
    clearCart: () => void;

    // Client actions
    setClient: (client: Client | null) => void;

    // Order type actions
    setOrderType: (type: OrderType) => void;
    setDeliveryInfo: (info: DeliveryInfo | null) => void;

    // Draft actions
    saveDraft: (name?: string) => void;
    loadDraft: (id: string) => void;
    deleteDraft: (id: string) => void;

    // Computed
    total: () => number;
    totalCdf: () => number;
    totalItems: () => number;
}

export const usePosStore = create<PosState>()(
    persist(
        (set, get) => ({
            cart: [],
            selectedClient: null,
            orderType: 'DINE_IN',
            deliveryInfo: null,
            draftSales: [],

            addToCart: (product) => {
                const { cart } = get();
                // Handle both product.id and product.productId
                const productId = product.id || product.productId;
                const existing = cart.find((item) => item.productId === productId);

                if (existing) {
                    set({
                        cart: cart.map((item) =>
                            item.productId === productId
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    });
                } else {
                    set({
                        cart: [
                            ...cart,
                            {
                                productId: productId,
                                name: product.name,
                                price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
                                priceCdf: typeof product.priceCdf === 'string' ? parseFloat(product.priceCdf) : (product.priceCdf || 0),
                                spaceName: product.spaceName,
                                quantity: 1,
                                saleUnit: product.saleUnit || 'UNIT',
                            },
                        ],
                    });
                }
            },

            removeFromCart: (productId) => {
                set({ cart: get().cart.filter((item) => item.productId !== productId) });
            },

            updateQuantity: (productId, delta) => {
                const { cart } = get();
                set({
                    cart: cart
                        .map((item) =>
                            item.productId === productId
                                ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                                : item
                        )
                        .filter((item) => item.quantity > 0),
                });
            },

            setClient: (client) => set({ selectedClient: client }),

            clearCart: () => set({
                cart: [],
                selectedClient: null,
                orderType: 'DINE_IN',
                deliveryInfo: null
            }),

            setOrderType: (type) => {
                set({ orderType: type });
                // Clear delivery info if not delivery
                if (type !== 'DELIVERY') {
                    set({ deliveryInfo: null });
                }
            },

            setDeliveryInfo: (info) => set({ deliveryInfo: info }),

            saveDraft: (name) => {
                const { cart, selectedClient, orderType, deliveryInfo, draftSales } = get();

                if (cart.length === 0) return;

                const draft: DraftSale = {
                    id: `draft-${Date.now()}`,
                    name: name || `Brouillon ${new Date().toLocaleTimeString()}`,
                    cart: [...cart],
                    client: selectedClient,
                    orderType,
                    deliveryInfo,
                    createdAt: new Date(),
                };

                set({
                    draftSales: [...draftSales, draft],
                    cart: [],
                    selectedClient: null,
                    orderType: 'DINE_IN',
                    deliveryInfo: null
                });
            },

            loadDraft: (id) => {
                const { draftSales } = get();
                const draft = draftSales.find(d => d.id === id);

                if (draft) {
                    set({
                        cart: [...draft.cart],
                        selectedClient: draft.client,
                        orderType: draft.orderType,
                        deliveryInfo: draft.deliveryInfo,
                    });
                }
            },

            deleteDraft: (id) => {
                const { draftSales } = get();
                set({ draftSales: draftSales.filter(d => d.id !== id) });
            },

            total: () => {
                return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            },

            totalCdf: () => {
                return get().cart.reduce((sum, item) => sum + item.priceCdf * item.quantity, 0);
            },

            totalItems: () => {
                return get().cart.reduce((sum, item) => sum + item.quantity, 0);
            }
        }),
        {
            name: 'pos-storage',
        }
    )
);
