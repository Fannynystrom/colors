import React, { createContext, useState, useEffect, useRef } from 'react';

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
  products: Product[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: number, quantity?: number) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string>('');
  const [cartTotalCount, setCartTotalCount] = useState<number>(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const cartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetCartStock = async (items: CartItem[]) => {
    for (const item of items) {
      try {
        await fetch(`http://localhost:3001/products/${item.id}/release`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: item.quantity }),
        });
      } catch (error) {
        console.error(`Kunde inte återställa lagret för produkt ID ${item.id}`);
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
  };

  const startCartTimer = (remainingTime: number) => {
    if (cartTimeoutRef.current) {
      clearTimeout(cartTimeoutRef.current);
    }
    cartTimeoutRef.current = setTimeout(() => {
      clearCart();
    }, remainingTime);
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setIsAuthenticated(true);
      setRole(user.role);
    }

    const storedCartItems = sessionStorage.getItem('cartItems');
    const storedCartTotalCount = sessionStorage.getItem('cartTotalCount');
    const storedCartTimestamp = sessionStorage.getItem('cartTimestamp');

    if (storedCartItems && storedCartTotalCount && storedCartTimestamp) {
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
      } else {
        clearCart();
      }
    }

    const handleLogoutDueToInactivity = () => {
      setIsAuthenticated(false);
      setRole('');
      sessionStorage.removeItem('user');
      window.location.href = '/';
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
    } else {
      sessionStorage.removeItem('cartItems');
      sessionStorage.removeItem('cartTotalCount');
      sessionStorage.removeItem('cartTimestamp');
      if (cartTimeoutRef.current) {
        clearTimeout(cartTimeoutRef.current);
      }
    }
  }, [cartItems, cartTotalCount]);

  const fetchUpdatedProducts = async () => {
    try {
      const response = await fetch('http://localhost:3001/products');
      const updatedData = await response.json();
      setProducts(updatedData);
    } catch (error) {
      console.error('Kunde inte hämta uppdaterade produkter');
    }
  };

  const login = (userId: number, userRole: string) => {
    setIsAuthenticated(true);
    setRole(userRole);
    sessionStorage.setItem('user', JSON.stringify({ userId, role: userRole }));
  };

  const logout = async () => {
    await resetCartStock(cartItems);
    setIsAuthenticated(false);
    setRole('');
    sessionStorage.removeItem('user');
    clearCart();
  };

  const addToCart = async (product: Product) => {
    const totalCartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
    if (totalCartQuantity >= 5) {
      alert("Tyvärr kan du endast välja 5 produkter totalt åt gången.");
      return;
    }
  
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
  
    try {
      const response = await fetch(`http://localhost:3001/products/${product.id}/reserve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1 }),
      });
      if (response.ok) {
        await fetchUpdatedProducts();
      }
    } catch (error) {
      console.error('Kunde inte reservera produkt');
    }
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
  
    try {
      const response = await fetch(`http://localhost:3001/products/${productId}/release`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: quantity }),
      });
      if (response.ok) {
        await fetchUpdatedProducts();
      }
    } catch (error) {
      console.error('Kunde inte släppa produkten');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        login,
        logout,
        cartTotalCount,
        cartItems,
        products,
        addToCart,
        removeFromCart,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
