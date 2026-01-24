/**
 * Zustand Global State Stores
 * Centralized state management for the application
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// ============================================
// AUTH STORE - User session & authentication
// ============================================

interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,

        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          }),

        setLoading: (loading) => set({ isLoading: loading }),

        logout: () =>
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          }),
      }),
      {
        name: "mellia-auth-storage",
      }
    ),
    { name: "AuthStore" }
  )
);

// ============================================
// UI STORE - Global UI state
// ============================================

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    { name: "UIStore" }
  )
);

// ============================================
// CART STORE - POS shopping cart (for future)
// ============================================

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set) => ({
        items: [],
        total: 0,

        addItem: (item) =>
          set((state) => {
            const existingItem = state.items.find((i) => i.id === item.id);
            if (existingItem) {
              return {
                items: state.items.map((i) =>
                  i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
                ),
                total: state.total + item.price * item.quantity,
              };
            }
            return {
              items: [...state.items, item],
              total: state.total + item.price * item.quantity,
            };
          }),

        removeItem: (id) =>
          set((state) => {
            const item = state.items.find((i) => i.id === id);
            if (!item) return state;
            return {
              items: state.items.filter((i) => i.id !== id),
              total: state.total - item.price * item.quantity,
            };
          }),

        updateQuantity: (id, quantity) =>
          set((state) => {
            const item = state.items.find((i) => i.id === id);
            if (!item) return state;
            const priceDiff = item.price * (quantity - item.quantity);
            return {
              items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
              total: state.total + priceDiff,
            };
          }),

        clearCart: () => set({ items: [], total: 0 }),
      }),
      {
        name: "mellia-cart-storage",
      }
    ),
    { name: "CartStore" }
  )
);
