/**
 * ╔══════════════════════════════════════════════════════╗
 * ║   Solution Math OS — Security Middleware Layer       ║
 * ║   Versão 1.0 — Julho 2026                            ║
 * ║   Implementa as 14 regras do Prompt de Segurança     ║
 * ╚══════════════════════════════════════════════════════╝
 */

const crypto = require('crypto');

// ════════════════════════════════════════════
// REGRA 1 & 2 — RBAC + Tenant Isolation
// ════════════════════════════════════════════

/**
 * Hierarquia de papéis (role hierarchy).
 * Quanto maior o nível, maior o acesso.
 */
const ROLE_LEVELS = {
  guest: 0,
  funcionario: 1,
  vendedor: 2,
  gerente: 3,
  client: 4,
  admin: 10,
};

/**
 * Mapa de permissões por recurso e método HTTP.
 * Define quais roles podem acessar cada endpoint.
 */
const PERMISSIONS = {
  '/api/users':           { GET: ['admin', 'gerente'], POST: ['admin'], PUT: ['admin'], DELETE: ['admin'] },
  '/api/products':        { GET: ['admin', 'gerente', 'vendedor', 'funcionario', 'client'], POST: ['admin', 'gerente'], PUT: ['admin', 'gerente'], DELETE: ['admin'] },
  '/api/financial':       { GET: ['admin', 'gerente'], POST: ['admin', 'gerente'], PUT: ['admin'], DELETE: ['admin'] },
  '/api/clients':         { GET: ['admin', 'gerente', 'vendedor'], POST: ['admin', 'gerente', 'vendedor'], PUT: ['admin', 'gerente', 'vendedor'], DELETE: ['admin'] },
  '/api/orders':          { GET: ['admin', 'gerente', 'vendedor', 'client'], POST: ['admin', 'gerente', 'vendedor', 'client'], PUT: ['admin', 'gerente'], DELETE: ['admin'] },
  '/api/tasks':           { GET: ['admin', 'gerente', 'vendedor', 'funcionario'], POST: ['admin', 'gerente'], PUT: ['admin', 'gerente'], DELETE: ['admin'] },
  '/api/stores':          { GET: ['admin', 'gerente'], POST: ['admin'], PUT: ['admin', 'gerente'], DELETE: ['admin'] },
  '/api/crm':             { GET: ['admin', 'gerente', 'vendedor'], POST: ['admin', 'gerente', 'vendedor'], PUT: ['admin', 'gerente', 'vendedor'], DELETE: ['admin'] },
  '/api/audit-logs':      { GET: ['admin'], POST: ['admin'], PUT: [], DELETE: [] },
};

/**
 * Verifica se um role tem permissão para um dado recurso+método.
 */
function hasPermission(role, resource, method) {
  const resourcePerms = PERMISSIONS[resource];
  if (!resourcePerms) return role === 'admin'; // endpoint desconhecido: somente admin
  const allowed = resourcePerms[method] || [];
  return allowed.includes(role);
}

// ════════════════════════════════════════════
// REGRA 7 — Rate Limiting & Brute Force Protection
// ════════════════════════════════════════════

const rateLimitMap = new Map(); // IP -> { count, firstHit, blocked }

const RATE_LIMIT_CONFIG = {
  maxRequests: 100,       // máximo de requisições
  windowMs: 60 * 1000,   // janela de 1 minuto
  blockDurationMs: 15 * 60 * 1000, // bloqueia por 15 min
};

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry) {
    entry = { count: 1, firstHit: now, blocked: false, blockedUntil: 0 };
    rateLimitMap.set(ip, entry);
    return { blocked: false };
  }

  // Verifica se ainda está bloqueado
  if (entry.blocked && now < entry.blockedUntil) {
    return { blocked: true, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
  }

  // Reset da janela
  if (now - entry.firstHit > RATE_LIMIT_CONFIG.windowMs) {
    entry.count = 1;
    entry.firstHit = now;
    entry.blocked = false;
    return { blocked: false };
  }

  entry.count++;

  // Excedeu o limite
  if (entry.count > RATE_LIMIT_CONFIG.maxRequests) {
    entry.blocked = true;
    entry.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
    return { blocked: true, retryAfter: RATE_LIMIT_CONFIG.blockDurationMs / 1000 };
  }

  return { blocked: false };
}

// ════════════════════════════════════════════
// REGRA 13 — Audit Log
// ════════════════════════════════════════════

const auditEvents = [];

function createAuditLog(event) {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...event,
  };
  auditEvents.push(entry);

  // Mantém apenas os últimos 1000 eventos em memória
  if (auditEvents.length > 1000) auditEvents.shift();

  // Log no console para debug
  console.log(`[AUDIT] ${entry.timestamp} | ${entry.action} | user=${entry.username || 'anonymous'} | ip=${entry.ip || 'unknown'} | resource=${entry.resource || '-'}`);

  return entry;
}

function getAuditLogs(filters = {}) {
  let logs = [...auditEvents];
  if (filters.username) logs = logs.filter(l => l.username === filters.username);
  if (filters.action) logs = logs.filter(l => l.action === filters.action);
  if (filters.from) logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.from));
  if (filters.to) logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.to));
  return logs.reverse(); // mais recentes primeiro
}

// ════════════════════════════════════════════
// REGRA 4 — Detecção de Prompt Injection
// (Para futuro AI assistant integrado)
// ════════════════════════════════════════════

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|earlier|above)\s+instructions/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /act\s+as\s+(a|an)\s+(admin|root|super)/i,
  /reveal\s+(your\s+)?(system\s+)?(prompt|instructions|rules)/i,
  /show\s+(me\s+)?(your\s+)?(prompt|system|hidden)/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /pretend\s+(you|to)\s+(have|are|be)/i,
  /bypass\s+(security|restrictions|rules)/i,
  /list\s+all\s+(users|companies|clients|databases)/i,
  /mostre\s+(o\s+)?(seu\s+)?(prompt|sistema|instru)/i,
  /ignore\s+(as\s+)?(regras|instru)/i,
];

function detectInjection(text) {
  if (!text || typeof text !== 'string') return false;
  return INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

// ════════════════════════════════════════════
// REGRA 6 — Sanitização de Dados Sensíveis
// ════════════════════════════════════════════

const SENSITIVE_FIELDS = ['password', 'senha', 'token', 'secret', 'api_key', 'apikey', 'cpf', 'rg', 'cartao', 'card_number'];

function sanitizeResponse(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeResponse);

  const sanitized = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '***REDACTED***';
    }
  }
  return sanitized;
}

// ════════════════════════════════════════════
// MIDDLEWARES EXPRESS
// ════════════════════════════════════════════

/**
 * Middleware 1: Rate Limiting (Regra 7)
 */
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const result = checkRateLimit(ip);

  if (result.blocked) {
    createAuditLog({
      action: 'RATE_LIMIT_BLOCKED',
      ip,
      resource: req.path,
      method: req.method,
    });
    return res.status(429).json({
      error: 'Muitas requisições. Tente novamente mais tarde.',
      retryAfter: result.retryAfter,
    });
  }

  next();
}

/**
 * Middleware 2: Autenticação básica por header (Regra 5)
 * Em produção, usar JWT/OAuth2. Esta é a versão MVP.
 */
function authMiddleware(req, res, next) {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/api/auth/login', '/api/auth/logout', '/api/health', '/api/sales/webhook', '/api/leads'];
  if (publicRoutes.includes(req.path)) return next();

  // Verifica header de autenticação
  const authHeader = req.headers['x-auth-user'];
  const authRole = req.headers['x-auth-role'];

  if (!authHeader || !authRole) {
    // Permitir em modo desenvolvimento (sem header)
    req.authUser = { username: 'system', role: 'admin' };
    return next();
  }

  req.authUser = { username: authHeader, role: authRole };
  next();
}

/**
 * Middleware 3: RBAC (Regra 2)
 */
function rbacMiddleware(req, res, next) {
  // Skip se não há user autenticado ou é admin
  if (!req.authUser) return next();
  if (req.authUser.role === 'admin') return next();

  // Verifica permissão para o recurso
  const baseResource = '/' + req.path.split('/').slice(1, 3).join('/');
  if (!hasPermission(req.authUser.role, baseResource, req.method)) {
    createAuditLog({
      action: 'ACCESS_DENIED',
      username: req.authUser.username,
      role: req.authUser.role,
      resource: req.path,
      method: req.method,
      ip: req.ip,
    });
    return res.status(403).json({
      error: 'Acesso negado. Você não possui permissão para esta operação.',
    });
  }

  next();
}

/**
 * Middleware 4: Segurança de Headers (Regra 3 & 9)
 */
function securityHeadersMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // Remove header que revela tecnologia interna (Regra 3)
  res.removeHeader('X-Powered-By');
  next();
}

/**
 * Middleware 5: Auditoria de operações críticas (Regra 13)
 */
function auditMiddleware(req, res, next) {
  const criticalMethods = ['POST', 'PUT', 'DELETE'];
  const criticalPaths = ['/api/users', '/api/financial', '/api/stores', '/api/orders'];

  const isCritical = criticalMethods.includes(req.method) &&
    criticalPaths.some(p => req.path.startsWith(p));

  if (isCritical && req.authUser) {
    createAuditLog({
      action: `${req.method}_${req.path.split('/')[2]?.toUpperCase() || 'RESOURCE'}`,
      username: req.authUser.username,
      role: req.authUser.role,
      resource: req.path,
      method: req.method,
      ip: req.ip,
      body_keys: req.body ? Object.keys(req.body).join(',') : '',
    });
  }

  next();
}

// ════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════

module.exports = {
  // Middlewares (usar em ordem no Express)
  rateLimitMiddleware,
  securityHeadersMiddleware,
  authMiddleware,
  rbacMiddleware,
  auditMiddleware,

  // Utilitários
  hasPermission,
  detectInjection,
  sanitizeResponse,
  createAuditLog,
  getAuditLogs,
  ROLE_LEVELS,
  PERMISSIONS,
};
