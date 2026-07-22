const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    db.serialize(() => {
      // Users (RH)
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        role TEXT,
        email TEXT,
        phone TEXT,
        contract_type TEXT DEFAULT 'PJ',
        salary REAL DEFAULT 0,
        status TEXT DEFAULT 'Ativo',
        hired_at TEXT DEFAULT (date('now'))
      )`);

      ['email','phone','contract_type','salary','status','hired_at'].forEach(col => {
        db.run(`ALTER TABLE users ADD COLUMN ${col} TEXT`, () => {});
      });

      // CRM Clients
      db.run(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, company TEXT, email TEXT,
        phone TEXT, source TEXT, notes TEXT, status TEXT
      )`);
      ['phone','source','notes'].forEach(col =>
        db.run(`ALTER TABLE clients ADD COLUMN ${col} TEXT`, () => {})
      );

      // Deals (Bitrix-style)
      db.run(`CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        client_id INTEGER,
        value REAL DEFAULT 0,
        stage TEXT DEFAULT 'Novo Lead',
        assignee_id INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`);

      // Financial Transactions
      db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        amount REAL,
        type TEXT,
        category TEXT,
        month TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`);

      // Tasks
      db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT, description TEXT,
        assignee_id INTEGER, status TEXT, file_url TEXT,
        FOREIGN KEY (assignee_id) REFERENCES users (id)
      )`);

      // ── Seed Data ──
      db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (!err && row.count <= 3) {
          db.run(`DELETE FROM users`);
          db.run(`INSERT INTO users (name, role, email, phone, contract_type, salary, status, hired_at) VALUES
            ('João CEO', 'CEO / Executivo', 'joao@solutionmath.com', '(11) 98888-1001', 'Sócio', 15000, 'Ativo', '2024-01-15'),
            ('Ana Vendas', 'Gerente Comercial', 'ana.vendas@solutionmath.com', '(11) 97777-2002', 'CLT', 6500, 'Ativo', '2024-03-01'),
            ('Pedro Dev', 'Tech Lead Full Stack', 'pedro.dev@solutionmath.com', '(11) 96666-3003', 'PJ', 9500, 'Ativo', '2024-02-10'),
            ('Carla Design', 'UI/UX Designer Senior', 'carla.design@solutionmath.com', '(11) 95555-4004', 'PJ', 7000, 'Ativo', '2024-05-20')`);
        }
      });

      db.get("SELECT count(*) as count FROM transactions", (err, row) => {
        if (!err) {
          db.run(`DELETE FROM transactions`);
          const revenues = [
            // Feb
            ['Sistema E-commerce','42000','income','Sistemas','2026-02'],
            ['Landing Page Pack','8500','income','Sites','2026-02'],
            ['Servidor AWS','3200','expense','Infraestrutura','2026-02'],
            ['Salários','18000','expense','Pessoas','2026-02'],
            // Mar
            ['App Mobile Fintech','35000','income','Apps','2026-03'],
            ['Agente IA Atendimento','12000','income','IA','2026-03'],
            ['Ferramentas SaaS','2100','expense','Ferramentas','2026-03'],
            ['Salários','18000','expense','Pessoas','2026-03'],
            // Apr
            ['Site Institucional','7500','income','Sites','2026-04'],
            ['Integração API Pagamentos','18000','income','Integrações','2026-04'],
            ['Sistema ERP Módulo','28000','income','Sistemas','2026-04'],
            ['Marketing Ads','4500','expense','Marketing','2026-04'],
            ['Salários','20000','expense','Pessoas','2026-04'],
            // May
            ['Automação Workflows','15000','income','Automações','2026-05'],
            ['Landing Page Premium','9000','income','Sites','2026-05'],
            ['Consultoria IA','22000','income','IA','2026-05'],
            ['Servidor AWS','3500','expense','Infraestrutura','2026-05'],
            ['Salários','20000','expense','Pessoas','2026-05'],
            // Jun
            ['Dashboard Analytics','19000','income','Sistemas','2026-06'],
            ['App Mobile v2','25000','income','Apps','2026-06'],
            ['Agente IA Vendas','18000','income','IA','2026-06'],
            ['Google Ads','3000','expense','Marketing','2026-06'],
            ['Salários','22000','expense','Pessoas','2026-06'],
            // Jul (current - 22/07/2026)
            ['Sistema OS SolutionMath','38000','income','Sistemas','2026-07'],
            ['Pack 3 Landing Pages','14500','income','Sites','2026-07'],
            ['Integração CRM Custom','18000','income','Integrações','2026-07'],
            ['Agente IA Suporte','14000','income','IA','2026-07'],
            ['Servidor AWS','3800','expense','Infraestrutura','2026-07'],
            ['Salários','22000','expense','Pessoas','2026-07'],
            ['Ferramentas Dev','2200','expense','Ferramentas','2026-07'],
          ];
          revenues.forEach(([desc, amt, type, cat, month]) => {
            db.run(`INSERT INTO transactions (description,amount,type,category,month) VALUES (?,?,?,?,?)`,
              [desc, parseFloat(amt), type, cat, month]);
          });
        }
      });

      db.get("SELECT count(*) as count FROM deals", (err, row) => {
        if (!err && row.count === 0) {
          const deals = [
            ['App Mobile Startup XYZ', 1, 45000, 'Negociação', 1],
            ['Sistema ERP Empresa ABC', 2, 72000, 'Proposta Enviada', 2],
            ['Landing Page + Ads', 3, 8500, 'Novo Lead', 3],
            ['Agente IA Atendimento', 1, 28000, 'Contato Feito', 1],
            ['Integração Marketplace', 2, 35000, 'Ganho', 2],
            ['Site Institucional Pro', 3, 12000, 'Novo Lead', 3],
            ['Automação Financeira', 1, 19500, 'Proposta Enviada', 1],
            ['Dashboard BI Executivo', 2, 31000, 'Negociação', 2],
          ];
          deals.forEach(([title, clientId, value, stage, assigneeId]) => {
            db.run(`INSERT INTO deals (title,client_id,value,stage,assignee_id) VALUES (?,?,?,?,?)`,
              [title, clientId, value, stage, assigneeId]);
          });
        }
      });
    });
  }
});

module.exports = db;
