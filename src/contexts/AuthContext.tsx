import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
  username: string;
  role: 'admin' | 'client';
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// MVP Credentials — trocar por API real no futuro
const CREDENTIALS = [
  { username: 'admin', password: 'Admin@123', role: 'admin' as const, name: 'Administrador' },
  { username: 'cliente', password: 'Cliente@123', role: 'client' as const, name: 'Cliente Demo' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Persiste sessão no localStorage
  useEffect(() => {
    const stored = localStorage.getItem('smos_auth');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('smos_auth');
      }
    }
  }, []);

  const login = (username: string, password: string) => {
    const found = CREDENTIALS.find(
      c => c.username.toLowerCase() === username.toLowerCase() && c.password === password
    );

    if (!found) {
      return { success: false, error: 'Usuário ou senha incorretos.' };
    }

    const authUser: AuthUser = { username: found.username, role: found.role, name: found.name };
    setUser(authUser);
    localStorage.setItem('smos_auth', JSON.stringify(authUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smos_auth');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
