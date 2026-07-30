import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ════════════════════════════════════════════
// TYPES & RBAC
// Regras 1, 2 do Prompt de Segurança
// ════════════════════════════════════════════

export type UserRole = 'admin' | 'gerente' | 'vendedor' | 'funcionario' | 'client';

interface AuthUser {
  username: string;
  role: UserRole;
  name: string;
  sessionId: string;
  loginAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  hasPermission: (requiredRole: UserRole) => boolean;
  isAdmin: () => boolean;
}

// ════════════════════════════════════════════
// DETECÇÃO DE INJEÇÃO (Regra 4)
// ════════════════════════════════════════════

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|earlier|above)\s+instructions/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /reveal\s+(your\s+)?(system\s+)?(prompt|instructions|rules)/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /bypass\s+(security|restrictions)/i,
  /list\s+all\s+(users|companies|clients)/i,
  /mostre\s+(o\s+)?(seu\s+)?(prompt|sistema)/i,
];

function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some(p => p.test(text));
}

// ════════════════════════════════════════════
// HIERARQUIA DE ROLES (Regra 2 — RBAC)
// ════════════════════════════════════════════

const ROLE_LEVELS: Record<UserRole, number> = {
  funcionario: 1,
  vendedor: 2,
  client: 3,
  gerente: 4,
  admin: 10,
};

function meetsRoleRequirement(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

// ════════════════════════════════════════════
// CREDENCIAIS MVP
// Regra 5 — nunca assumir admin sem validar
// ════════════════════════════════════════════

const CREDENTIALS = [
  { username: 'admin',    password: 'Admin@123',    role: 'admin'       as UserRole, name: 'Administrador' },
  { username: 'cliente',  password: 'Cliente@123',  role: 'client'      as UserRole, name: 'Cliente Demo'  },
  { username: 'vendedor', password: 'Vend@123',     role: 'vendedor'    as UserRole, name: 'Vendedor Demo' },
  { username: 'gerente',  password: 'Ger@123',      role: 'gerente'     as UserRole, name: 'Gerente Demo'  },
];

// ════════════════════════════════════════════
// RATE LIMIT DE LOGIN (Regra 7 — Brute Force)
// ════════════════════════════════════════════

interface LoginAttempt { count: number; firstAttempt: number; blockedUntil: number; }
const loginAttempts: Record<string, LoginAttempt> = {};
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;   // 5 minutos
const BLOCK_DURATION_MS = 15 * 60 * 1000; // bloqueio 15 minutos

function checkLoginRateLimit(username: string): { allowed: boolean; remainingSeconds?: number } {
  const now = Date.now();
  const attempt = loginAttempts[username];

  if (!attempt) {
    loginAttempts[username] = { count: 1, firstAttempt: now, blockedUntil: 0 };
    return { allowed: true };
  }

  // Ainda bloqueado?
  if (attempt.blockedUntil > now) {
    return { allowed: false, remainingSeconds: Math.ceil((attempt.blockedUntil - now) / 1000) };
  }

  // Reset da janela
  if (now - attempt.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts[username] = { count: 1, firstAttempt: now, blockedUntil: 0 };
    return { allowed: true };
  }

  attempt.count++;

  if (attempt.count > MAX_LOGIN_ATTEMPTS) {
    attempt.blockedUntil = now + BLOCK_DURATION_MS;
    return { allowed: false, remainingSeconds: BLOCK_DURATION_MS / 1000 };
  }

  return { allowed: true };
}

function recordSuccessfulLogin(username: string): void {
  delete loginAttempts[username];
}

// ════════════════════════════════════════════
// PROVIDER
// ════════════════════════════════════════════

const AuthContext = createContext<AuthContextType | null>(null);

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Regra 12 — Restaurar sessão do localStorage com validação
  useEffect(() => {
    const stored = localStorage.getItem('smos_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        // Valida que o objeto tem todas as propriedades esperadas
        if (parsed.username && parsed.role && parsed.sessionId && parsed.loginAt) {
          // Verifica que o role é válido (Regra 5 — não confiar cegamente)
          if (Object.keys(ROLE_LEVELS).includes(parsed.role)) {
            setUser(parsed);
          } else {
            localStorage.removeItem('smos_auth');
          }
        } else {
          localStorage.removeItem('smos_auth');
        }
      } catch {
        localStorage.removeItem('smos_auth');
      }
    }
  }, []);

  const login = useCallback((username: string, password: string): { success: boolean; error?: string } => {
    // Regra 4 — detectar injeção até mesmo no campo de login
    if (detectInjection(username) || detectInjection(password)) {
      return { success: false, error: 'Entrada inválida detectada.' };
    }

    // Regra 7 — Rate limit de tentativas de login
    const rateCheck = checkLoginRateLimit(username.toLowerCase());
    if (!rateCheck.allowed) {
      const mins = Math.ceil((rateCheck.remainingSeconds || 0) / 60);
      return {
        success: false,
        error: `Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em ${mins} minuto(s).`,
      };
    }

    // Regra 5 — Validação real de credenciais
    const found = CREDENTIALS.find(
      c => c.username.toLowerCase() === username.toLowerCase() && c.password === password
    );

    if (!found) {
      return { success: false, error: 'Usuário ou senha incorretos.' };
    }

    recordSuccessfulLogin(username.toLowerCase());

    const authUser: AuthUser = {
      username: found.username,
      role: found.role,
      name: found.name,
      sessionId: generateSessionId(),
      loginAt: new Date().toISOString(),
    };

    setUser(authUser);
    // Regra 6 — nunca armazenar senha no localStorage
    localStorage.setItem('smos_auth', JSON.stringify(authUser));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    // Regra 12 — limpar sessão completamente ao sair
    setUser(null);
    localStorage.removeItem('smos_auth');
    sessionStorage.clear();
  }, []);

  // Regra 2 — Verificação de permissão por role
  const hasPermission = useCallback((requiredRole: UserRole): boolean => {
    if (!user) return false;
    return meetsRoleRequirement(user.role, requiredRole);
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return user?.role === 'admin';
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasPermission, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Hook auxiliar para proteger componentes por role (Regra 2)
export const useRequireRole = (requiredRole: UserRole) => {
  const { hasPermission, isAuthenticated } = useAuth();
  return { allowed: isAuthenticated && hasPermission(requiredRole) };
};
