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
  }, []);

  const login = (userId: number, userRole: string) => {
    setIsAuthenticated(true);
    setRole(userRole);
    sessionStorage.setItem('user', JSON.stringify({ userId, role: userRole })); // sparar i sessionStorage
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole('');
    sessionStorage.removeItem('user'); // tar bort användaren från sessionStorage
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
