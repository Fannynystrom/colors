import React, { createContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  role: string;
  login: (userId: number, userRole: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string>('');

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

    // timer för inaktivitet (1 minut = 60000 ms)
    let inactivityTimer: NodeJS.Timeout = setTimeout(handleLogoutDueToInactivity, 60000);

    // timern återställs vid aktivitet 
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(handleLogoutDueToInactivity, 60000);
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
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
