import React, { createContext, useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode'; 
import axiosInstance from '../axiosInstance'; 

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

//dekodar token
interface DecodedToken {
  userId: number;
  role: string;
  exp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: string;
  token: string | null;
  login: (token: string) => void;
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
  const [token, setToken] = useState<string | null>(null);
  const [cartTotalCount, setCartTotalCount] = useState<number>(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const cartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetCartStock = async (items: CartItem[]) => {
    for (const item of items) {
      try {
        await axiosInstance.patch(`/products/${item.id}/release`, { amount: item.quantity });
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
    const storedToken = sessionStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded: DecodedToken = jwtDecode(storedToken); 
        const currentTime = Date.now() / 1000;
        if (decoded.exp > currentTime) {
          setIsAuthenticated(true);
          setRole(decoded.role);
          setToken(storedToken);
        } else {
          sessionStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Ogiltig token.');
        sessionStorage.removeItem('token');
      }
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
      logout();
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
      const response = await axiosInstance.get('/products');
      const updatedData = response.data;
      setProducts(updatedData);
    } catch (error) {
      console.error('Kunde inte hämta uppdaterade produkter');
    }
  };

  const login = (newToken: string) => {
    try {
      const decoded: DecodedToken = jwtDecode(newToken); 
      setIsAuthenticated(true);
      setRole(decoded.role);
      setToken(newToken);
      sessionStorage.setItem('token', newToken);
    } catch (error) {
      console.error('Failed to decode token.');
    }
  };

  const logout = async () => {
    await resetCartStock(cartItems);
    setIsAuthenticated(false);
    setRole('');
    setToken(null);
    sessionStorage.removeItem('token');
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
      const response = await axiosInstance.patch(`/products/${product.id}/reserve`, { amount: 1 });
      if (response.status === 200) {
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
      const response = await axiosInstance.patch(`/products/${productId}/release`, { amount: quantity });
      if (response.status === 200) {
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
        token,
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
