import React, { createContext, useState, useEffect } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: string;
  login: (userId: number, userRole: string) => void;
  logout: () => void;
  cartTotalCount: number; // antal produkter tillagda
  setCartTotalCount: React.Dispatch<React.SetStateAction<number>>;
  cartItems: CartItem[]; // innehållet i varukorgen
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string>('');
  const [cartTotalCount, setCartTotalCount] = useState<number>(0); //  state för antal produkter i kassan
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // state för produkterna i varukorgen

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setIsAuthenticated(true);
      setRole(user.role);
    }

    // logga ut användaren efter inaktivitet
    const handleLogoutDueToInactivity = () => {
      setIsAuthenticated(false);
      setRole('');
      sessionStorage.removeItem('user');
      window.location.href = '/'; // skickas till login
    };

    // timer för inaktivitet (5 minuter = 300000 ms)
    let inactivityTimer: NodeJS.Timeout = setTimeout(handleLogoutDueToInactivity, 300000);

    // timern återställs vid aktivitet 
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(handleLogoutDueToInactivity, 300000);
    };

    // eventlyssnare för att upptäcka aktivitet om man rör mus elr trycker på tangent
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);

    // städar upp händelser/eventlyssnare
    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
    };
  }, []);

  const login = (userId: number, userRole: string) => {
    setIsAuthenticated(true);
    setRole(userRole);
    sessionStorage.setItem('user', JSON.stringify({ userId, role: userRole }));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole('');
    setCartTotalCount(0); // nollställer antal produkter vid utloggning
    setCartItems([]); // nollställer varukorgen vid utloggning
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout, cartTotalCount, setCartTotalCount, cartItems, setCartItems }}>
      {children}
    </AuthContext.Provider>
  );
};
