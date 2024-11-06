import React, { createContext, useState, useEffect, useRef } from 'react';

// exporterar CartItem
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: string;
  login: (userId: number, userRole: string) => void;
  logout: () => void;
  cartTotalCount: number;
  cartItems: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: number, quantity?: number) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string>('');
  const [cartTotalCount, setCartTotalCount] = useState<number>(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const cartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetCartStock = async (items: CartItem[]) => {
    for (const item of items) {
      try {
        await fetch(`http://localhost:3001/products/${item.id}/incrementStock`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: item.quantity }),
        });
      } catch (error) {
        console.error('Error resetting stock for product:', item.id);
      }
    }
  };

  const clearCart = async () => {
    await resetCartStock(cartItems);
    setCartItems([]);
    setCartTotalCount(0);
    sessionStorage.removeItem('cartItems');
    sessionStorage.removeItem('cartTotalCount');
    sessionStorage.removeItem('cartTimestamp');
    console.log('Varukorgen har rensats');
  };

  const startCartTimer = (remainingTime: number) => {
    if (cartTimeoutRef.current) {
      clearTimeout(cartTimeoutRef.current);
    }
    cartTimeoutRef.current = setTimeout(() => {
      clearCart();
      console.log('Varukorgen har rensats på grund av inaktivitet');
    }, remainingTime);
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setIsAuthenticated(true);
      setRole(user.role);
      console.log('Användare hittades i sessionStorage');
    }

    const storedCartItems = sessionStorage.getItem('cartItems');
    const storedCartTotalCount = sessionStorage.getItem('cartTotalCount');
    const storedCartTimestamp = sessionStorage.getItem('cartTimestamp');

    if (storedCartItems && storedCartTotalCount && storedCartTimestamp) {
      console.log('Laddar varukorgen från sessionStorage');
      const parsedCartItems: CartItem[] = JSON.parse(storedCartItems);
      const parsedCartTotalCount: number = JSON.parse(storedCartTotalCount);
      const cartTimestamp: number = JSON.parse(storedCartTimestamp);
      const currentTime = Date.now();
      const elapsedTime = currentTime - cartTimestamp;
      const expirationTime = 60000; // 1 minut i ms

      if (elapsedTime < expirationTime) {
        setCartItems(parsedCartItems);
        setCartTotalCount(parsedCartTotalCount);
        startCartTimer(expirationTime - elapsedTime);
        console.log('Varukorgen laddades och expiration-timer startades');
      } else {
        console.log('Varukorgen har expirat');
        clearCart();
      }
    }

    const handleLogoutDueToInactivity = () => {
      setIsAuthenticated(false);
      setRole('');
      sessionStorage.removeItem('user');
      window.location.href = '/';
      console.log('Användaren loggades ut på grund av inaktivitet');
    };

    let inactivityTimer: NodeJS.Timeout = setTimeout(handleLogoutDueToInactivity, 300000); // 5 minuter

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(handleLogoutDueToInactivity, 300000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      if (cartTimeoutRef.current) {
        clearTimeout(cartTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
      sessionStorage.setItem('cartTotalCount', JSON.stringify(cartTotalCount));
      sessionStorage.setItem('cartTimestamp', JSON.stringify(Date.now()));
      startCartTimer(60000); // 1 minut
      console.log('Varukorgen har sparats till sessionStorage');
    } else {
      sessionStorage.removeItem('cartItems');
      sessionStorage.removeItem('cartTotalCount');
      sessionStorage.removeItem('cartTimestamp');
      if (cartTimeoutRef.current) {
        clearTimeout(cartTimeoutRef.current);
      }
      console.log('Varukorgen har rensats från sessionStorage');
    }
  }, [cartItems, cartTotalCount]);

  const login = (userId: number, userRole: string) => {
    setIsAuthenticated(true);
    setRole(userRole);
    sessionStorage.setItem('user', JSON.stringify({ userId, role: userRole }));
    console.log('Användaren loggades in');
  };

  const logout = async () => {
    await resetCartStock(cartItems);
    setIsAuthenticated(false);
    setRole('');
    sessionStorage.removeItem('user');
    clearCart();
    console.log('Användaren loggades ut');
  };

  const addToCart = async (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    let updatedCartItems: CartItem[];
    if (existingItem) {
      updatedCartItems = cartItems.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCartItems = [...cartItems, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    }

    setCartItems(updatedCartItems);
    setCartTotalCount(prev => prev + 1);
    console.log(`Lade till ${product.name} i varukorgen`);
  };

  const removeFromCart = async (productId: number, quantity: number = 1) => {
    const existingItem = cartItems.find(item => item.id === productId);
    if (!existingItem) return;

    let updatedCartItems: CartItem[];
    if (existingItem.quantity <= quantity) {
      updatedCartItems = cartItems.filter(item => item.id !== productId);
    } else {
      updatedCartItems = cartItems.map(item =>
        item.id === productId ? { ...item, quantity: item.quantity - quantity } : item
      );
    }

    setCartItems(updatedCartItems);
    setCartTotalCount(prev => prev - quantity);
    console.log(`Tog bort ${quantity} av produkt ID ${productId} från varukorgen`);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout, cartTotalCount, cartItems, addToCart, removeFromCart }}>
      {children}
    </AuthContext.Provider>
  );
};
