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

// ... types ...

interface PosState {
    cart: CartItem[];
    selectedClient: Client | null;
    orderType: OrderType;
    deliveryInfo: DeliveryInfo | null;

    // Server-side draft tracking
    currentDraftId: string | null;

    // Cart actions
    addToCart: (product: any) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, delta: number, spaceName?: string, saleUnit?: string) => void;
    clearCart: () => void;
    setCart: (items: CartItem[]) => void; // Needed to load draft

    // Client actions
    setClient: (client: Client | null) => void;

    // Order type actions
    setOrderType: (type: OrderType) => void;
    setDeliveryInfo: (info: DeliveryInfo | null) => void;

    // Draft actions
    setCurrentDraftId: (id: string | null) => void;

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
            currentDraftId: null,

            addToCart: (product) => {
                const { cart } = get();
                const productId = product.id || product.productId;
                const saleUnit = product.saleUnit || 'UNIT';
                const spaceName = product.spaceName || 'Standard';

                const existingIndex = cart.findIndex((item) =>
                    item.productId === productId &&
                    item.spaceName === spaceName &&
                    item.saleUnit === saleUnit
                );

                if (existingIndex > -1) {
                    const newCart = [...cart];
                    newCart[existingIndex] = {
                        ...newCart[existingIndex],
                        quantity: newCart[existingIndex].quantity + 1
                    };
                    set({ cart: newCart });
                } else {
                    set({
                        cart: [
                            ...cart,
                            {
                                productId: productId,
                                name: product.name,
                                price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
                                priceCdf: Math.round(typeof product.priceCdf === 'string' ? parseFloat(product.priceCdf) : (product.priceCdf || 0)),
                                spaceName: spaceName,
                                quantity: 1,
                                saleUnit: saleUnit,
                            },
                        ],
                    });
                }
            },

            removeFromCart: (productId) => {
                set({ cart: get().cart.filter((item) => item.productId !== productId) });
            },

            updateQuantity: (productId, delta, spaceName, saleUnit) => {
                const { cart } = get();
                set({
                    cart: cart
                        .map((item) => {
                            const isMatch = item.productId === productId &&
                                (spaceName === undefined || item.spaceName === spaceName) &&
                                (saleUnit === undefined || item.saleUnit === saleUnit);

                            return isMatch
                                ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                                : item;
                        })
                        .filter((item) => item.quantity > 0),
                });
            },

            clearCart: () => set({
                cart: [],
                selectedClient: null,
                orderType: 'DINE_IN',
                deliveryInfo: null,
                currentDraftId: null
            }),

            setCart: (items) => set({ cart: items }),

            setClient: (client) => set({ selectedClient: client }),

            setOrderType: (type) => {
                set({ orderType: type });
                if (type !== 'DELIVERY') {
                    set({ deliveryInfo: null });
                }
            },

            setDeliveryInfo: (info) => set({ deliveryInfo: info }),

            setCurrentDraftId: (id) => set({ currentDraftId: id }),

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
            partialize: (state) => ({
                cart: state.cart,
                selectedClient: state.selectedClient,
                orderType: state.orderType,
                deliveryInfo: state.deliveryInfo,
                currentDraftId: state.currentDraftId
            }),
        }
    )
);
