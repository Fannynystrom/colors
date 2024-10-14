import React, { createContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  role: string | null; 
  login: (role: string) => void; // tar emot roll vid inloggning
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null); // state för roll

  const login = (userRole: string) => {
    setIsAuthenticated(true);
    setRole(userRole); // sparar rollen
  };
  
  const logout = () => {
    setIsAuthenticated(false);
    setRole(null); // återställer roll vid utloggning
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
