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

      // Products Catalog
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        ticket_price REAL DEFAULT 0,
        cost REAL DEFAULT 0,
        profit REAL DEFAULT 0,
        category TEXT,
        description TEXT
      )`);

      // Operational Agenda
      db.run(`CREATE TABLE IF NOT EXISTS agenda_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        date TEXT,
        time TEXT,
        category TEXT,
        assignee_id INTEGER,
        status TEXT DEFAULT 'Agendado'
      )`);

      // Tasks
      db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT, description TEXT,
        assignee_id INTEGER, status TEXT, file_url TEXT,
        FOREIGN KEY (assignee_id) REFERENCES users (id)
      )`);

      // ═══════════════════════════════════
      // STORE MODULE TABLES
      // ═══════════════════════════════════

      // Store Products
      db.run(`CREATE TABLE IF NOT EXISTS store_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT,
        barcode TEXT,
        category TEXT DEFAULT 'Geral',
        cost_price REAL DEFAULT 0,
        sell_price REAL NOT NULL DEFAULT 0,
        stock_qty INTEGER DEFAULT 0,
        stock_min INTEGER DEFAULT 5,
        external_id TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`);

      // Store Orders
      db.run(`CREATE TABLE IF NOT EXISTS store_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        status TEXT DEFAULT 'Pago',
        total REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        payment_method TEXT DEFAULT 'Dinheiro',
        notes TEXT,
        source_financial_id INTEGER,
        external_order_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES clients (id)
      )`);

      // Store Order Items
      db.run(`CREATE TABLE IF NOT EXISTS store_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        qty INTEGER DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total REAL DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES store_orders (id),
        FOREIGN KEY (product_id) REFERENCES store_products (id)
      )`);

      // Store Stock Movements
      db.run(`CREATE TABLE IF NOT EXISTS store_stock_moves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        qty INTEGER NOT NULL,
        reason TEXT,
        order_id INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES store_products (id)
      )`);

      // Add source_type/source_id to transactions for idempotency
      db.run(`ALTER TABLE transactions ADD COLUMN source_type TEXT`, () => {});
      db.run(`ALTER TABLE transactions ADD COLUMN source_id INTEGER`, () => {});

      // ── Seed Store Products ──
      db.get("SELECT count(*) as count FROM store_products", (err, row) => {
        if (!err && row.count === 0) {
          const sampleProducts = [
            ['Camiseta Básica Premium', 'CAM-001', 'Vestuário', 29.90, 89.90, 50, 10],
            ['Tênis Runner Pro', 'TEN-002', 'Calçados', 89.00, 249.90, 20, 5],
            ['Mochila Urban 25L', 'MOC-003', 'Acessórios', 45.00, 149.90, 15, 3],
            ['Calça Cargo Slim', 'CAL-004', 'Vestuário', 55.00, 169.90, 30, 8],
            ['Boné Aba Curva', 'BON-005', 'Acessórios', 18.00, 59.90, 40, 10],
            ['Jaqueta Corta-Vento', 'JAQ-006', 'Vestuário', 120.00, 349.90, 8, 3],
          ];
          sampleProducts.forEach(([name, sku, category, cost, price, stock, min]) => {
            db.run(
              `INSERT INTO store_products (name, sku, category, cost_price, sell_price, stock_qty, stock_min) VALUES (?,?,?,?,?,?,?)`,
              [name, sku, category, cost, price, stock, min]
            );
          });
        }
      });

      // ── Seed Users ──
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

      // ── Seed Products ──
      db.get("SELECT count(*) as count FROM products", (err, row) => {
        if (!err && row.count === 0) {
          const sampleProducts = [
            ['Pacote Software Customizado', 5000, 1700, 3300, 'Sistemas', 'Sistema sob medida com ticket de R$ 5k, custo de R$ 1.7k e margem de R$ 3.3k (66%)'],
            ['Agente de IA de Atendimento', 12000, 3200, 8800, 'IA', 'Automação inteligente de suporte e vendas com IA'],
            ['Pack 3 Landing Pages Alta Conversão', 8500, 2200, 6300, 'Sites', 'Páginas otimizadas para tráfego pago'],
            ['Integração de APIs & ERP', 15000, 4500, 10500, 'Integrações', 'Conexão entre plataformas e bancos de dados'],
            ['Dashboard de BI & Analytics', 9000, 2500, 6500, 'Sistemas', 'Painel de inteligência de negócios customizado']
          ];
          sampleProducts.forEach(([name, price, cost, profit, cat, desc]) => {
            db.run(`INSERT INTO products (name, ticket_price, cost, profit, category, description) VALUES (?,?,?,?,?,?)`,
              [name, price, cost, profit, cat, desc]);
          });
        }
      });

      // ── Seed Agenda Events (All 2026 including 22/07, 23/07, etc) ──
      db.get("SELECT count(*) as count FROM agenda_events", (err, row) => {
        if (!err && row.count === 0) {
          const sampleEvents = [
            ['Reunião de Alinhamento com Cliente XYZ', '2026-07-22', '14:00', 'Cliente', 2, 'Concluído'],
            ['Apresentação de Proposta ERP', '2026-07-22', '16:30', 'Vendas', 2, 'Concluído'],
            ['Entrega da Fase 1 - Sistema OS', '2026-07-23', '10:00', 'Projeto', 3, 'Agendado'],
            ['Code Review Agente IA', '2026-07-23', '15:00', 'Dev', 3, 'Agendado'],
            ['Sprints Planning Agosto/2026', '2026-07-25', '09:00', 'Interno', 1, 'Agendado'],
            ['Workshop de Treinamento de Clientes', '2026-07-28', '11:00', 'Cliente', 4, 'Agendado'],
            ['Fechamento Financeiro de Julho/2026', '2026-07-31', '17:00', 'Financeiro', 1, 'Agendado']
          ];
          sampleEvents.forEach(([title, date, time, cat, assignee, status]) => {
            db.run(`INSERT INTO agenda_events (title, date, time, category, assignee_id, status) VALUES (?,?,?,?,?,?)`,
              [title, date, time, cat, assignee, status]);
          });
        }
      });

      // ── Seed Transactions (Full 2026 Calendar Jan-Dec) ──
      db.get("SELECT count(*) as count FROM transactions", (err, row) => {
        if (!err) {
          db.run(`DELETE FROM transactions`);
          const revenues = [
            // Jan
            ['Sistema ERP Módulo Alpha','38000','income','Sistemas','2026-01'],
            ['Landing Page Institucional','6500','income','Sites','2026-01'],
            ['Servidor AWS','3000','expense','Infraestrutura','2026-01'],
            ['Salários','18000','expense','Pessoas','2026-01'],
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
            // Jul (Current - 22/07/2026)
            ['Sistema OS SolutionMath','38000','income','Sistemas','2026-07'],
            ['Pack 3 Landing Pages','14500','income','Sites','2026-07'],
            ['Integração CRM Custom','18000','income','Integrações','2026-07'],
            ['Agente IA Suporte','14000','income','IA','2026-07'],
            ['Servidor AWS','3800','expense','Infraestrutura','2026-07'],
            ['Salários','22000','expense','Pessoas','2026-07'],
            ['Ferramentas Dev','2200','expense','Ferramentas','2026-07'],
            // Aug (Forecast/Projeção)
            ['[Projeção] Contrato ERP Beta','45000','income','Sistemas','2026-08'],
            ['[Projeção] Agente IA Vendas v2','25000','income','IA','2026-08'],
            ['[Projeção] Custo Fixo Operacional','25000','expense','Pessoas','2026-08'],
            // Sep (Forecast/Projeção)
            ['[Projeção] App Mobile SaaS','38000','income','Apps','2026-09'],
            ['[Projeção] Integração API Cloud','20000','income','Integrações','2026-09'],
            ['[Projeção] Custo Fixo Operacional','25000','expense','Pessoas','2026-09'],
            // Oct (Forecast/Projeção)
            ['[Projeção] Renovação Contratos IA','30000','income','IA','2026-10'],
            ['[Projeção] Sistema Sob Medida Corp','50000','income','Sistemas','2026-10'],
            ['[Projeção] Custo Fixo Operacional','26000','expense','Pessoas','2026-10'],
            // Nov (Forecast/Projeção)
            ['[Projeção] Licenciamento SaaS','40000','income','Sistemas','2026-11'],
            ['[Projeção] Consultoria IA Enterprise','35000','income','IA','2026-11'],
            ['[Projeção] Custo Fixo Operacional','26000','expense','Pessoas','2026-11'],
            // Dec (Forecast/Projeção)
            ['[Projeção] Projeto Especial Fim de Ano','60000','income','Sistemas','2026-12'],
            ['[Projeção] Agentes IA Black Friday','32000','income','IA','2026-12'],
            ['[Projeção] Custo Fixo Operacional','28000','expense','Pessoas','2026-12']
          ];
          revenues.forEach(([desc, amt, type, cat, month]) => {
            db.run(`INSERT INTO transactions (description,amount,type,category,month) VALUES (?,?,?,?,?)`,
              [desc, parseFloat(amt), type, cat, month]);
          });
        }
      });

      // ── Seed Deals ──
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
      // ═══════════════════════════════════
      // HELPDESK / TICKETS MODULE TABLES
      // ═══════════════════════════════════
      db.run(`CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'Geral',
        priority TEXT DEFAULT 'Média',
        status TEXT DEFAULT 'Aberto',
        user_name TEXT DEFAULT 'Cliente',
        assigned_to TEXT DEFAULT 'Não atribuído',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS ticket_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        role TEXT DEFAULT 'funcionario',
        message TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (ticket_id) REFERENCES tickets (id)
      )`);

      // Seed Tickets
      db.get("SELECT count(*) as count FROM tickets", (err, row) => {
        if (!err && row && row.count === 0) {
          const sampleTickets = [
            ['Dúvida na emissão de nota fiscal no PDV', 'Não estou conseguindo configurar o certificado digital para emissão automática.', 'Fiscal', 'Alta', 'Em Atendimento', 'Mercado Aurora', 'Carlos Silva'],
            ['Erro ao importar planilha de produtos', 'Ao fazer upload do arquivo XLSX com 500 itens, o sistema retorna erro na linha 42.', 'Estoque', 'Média', 'Aberto', 'Pet Shop Vida Animal', 'Não atribuído'],
            ['Solicitação de novo usuário gerente', 'Precisamos liberar acesso de Gerente para o novo supervisor de vendas.', 'Acessos', 'Baixa', 'Resolvido', 'Distribuidora Bebidas', 'Ana Souza'],
            ['Lentidão no carregamento do relatório DRE', 'O relatório mensal está demorando mais de 10 segundos para gerar.', 'Desempenho', 'Urgente', 'Aberto', 'Autopeças União', 'Não atribuído']
          ];
          sampleTickets.forEach(([title, desc, cat, prio, status, user, assigned]) => {
            db.run(`INSERT INTO tickets (title, description, category, priority, status, user_name, assigned_to) VALUES (?,?,?,?,?,?,?)`,
              [title, desc, cat, prio, status, user, assigned]);
          });
        }
      });
    });
  }
});

module.exports = db;
