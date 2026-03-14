import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CartItem, Producto } from '../types';

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (producto: Producto) => void;
    removeFromCart: (productoId: string) => void;
    incrementQuantity: (productoId: string) => void;
    decrementQuantity: (productoId: string) => void;
    clearCart: () => void;
    subtotal: number;
    totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const addToCart = useCallback((producto: Producto) => {
        setCartItems((prev) => {
            const existingItem = prev.find((item) => item.producto.id === producto.id);
            if (existingItem) {
                return prev.map((item) =>
                    item.producto.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.producto.precio }
                        : item
                );
            }
            return [...prev, { producto, cantidad: 1, subtotal: producto.precio }];
        });
    }, []);

    const removeFromCart = useCallback((productoId: string) => {
        setCartItems((prev) => prev.filter((item) => item.producto.id !== productoId));
    }, []);

    const incrementQuantity = useCallback((productoId: string) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.producto.id === productoId
                    ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.producto.precio }
                    : item
            )
        );
    }, []);

    const decrementQuantity = useCallback((productoId: string) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.producto.id === productoId && item.cantidad > 1
                    ? { ...item, cantidad: item.cantidad - 1, subtotal: (item.cantidad - 1) * item.producto.precio }
                    : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const subtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
    const totalItems = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                incrementQuantity,
                decrementQuantity,
                clearCart,
                subtotal,
                totalItems,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
