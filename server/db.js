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

      // ── Seed Agenda Events (Setembro/2026) ──
      db.get("SELECT count(*) as count FROM agenda_events", (err, row) => {
        if (!err && row.count === 0) {
          const sampleEvents = [
            ['Reunião de Alinhamento com Cliente XYZ', '2026-09-15', '14:00', 'Cliente', 2, 'Concluído'],
            ['Apresentação Comercial Solution Math OS', '2026-09-15', '16:30', 'Vendas', 2, 'Agendado'],
            ['Entrega da Fase 2 - Sistema Customizado', '2026-09-16', '10:00', 'Projeto', 3, 'Agendado'],
            ['Code Review Agente de IA Lyra 3.0', '2026-09-17', '15:00', 'Dev', 3, 'Agendado'],
            ['Alinhamento Estratégico Metas Q4', '2026-09-20', '09:00', 'Interno', 1, 'Agendado'],
            ['Treinamento Operacional PDV & Lojas', '2026-09-25', '11:00', 'Cliente', 4, 'Agendado'],
            ['Fechamento Financeiro de Setembro/2026', '2026-09-30', '17:00', 'Financeiro', 1, 'Agendado']
          ];
          sampleEvents.forEach(([title, date, time, cat, assignee, status]) => {
            db.run(`INSERT INTO agenda_events (title, date, time, category, assignee_id, status) VALUES (?,?,?,?,?,?)`,
              [title, date, time, cat, assignee, status]);
          });
        }
      });

      // ── Seed Transactions (Dados Reais Jan-Set/2026 = R$ 150.000) ──
      // Faturamento real acumulado Jan-Set/2026: R$ 150.000
      // Projeções para Out-Dez são calculadas matematicamente pelo dashboard
      db.get("SELECT count(*) as count FROM transactions", (err, row) => {
        if (!err && row.count === 0) {
          const revenues = [
            // Janeiro — R$ 8.500 receita real
            ['Contrato Mensal Software Chat','6500','income','Sistemas','2026-01'],
            ['Manutenção de Site Cliente','2000','income','Sites','2026-01'],
            ['Servidor VPS','800','expense','Infraestrutura','2026-01'],
            ['Salários Equipe','6000','expense','Pessoas','2026-01'],
            // Fevereiro — R$ 9.000 receita real
            ['Contrato Mensal Software Chat','6500','income','Sistemas','2026-02'],
            ['Landing Page Conversão','2500','income','Sites','2026-02'],
            ['Servidor VPS','800','expense','Infraestrutura','2026-02'],
            ['Salários Equipe','6000','expense','Pessoas','2026-02'],
            // Março — R$ 12.000 receita real
            ['Contrato Mensal Software Chat','6500','income','Sistemas','2026-03'],
            ['Consultoria Automação','3500','income','Automações','2026-03'],
            ['Novo Cliente Software Chat','2000','income','Sistemas','2026-03'],
            ['Ferramentas SaaS','500','expense','Ferramentas','2026-03'],
            ['Salários Equipe','6000','expense','Pessoas','2026-03'],
            // Abril — R$ 14.500 receita real
            ['Contrato Mensal Software Chat','6500','income','Sistemas','2026-04'],
            ['Integração API Pagamentos','5000','income','Integrações','2026-04'],
            ['Landing Page Cliente','3000','income','Sites','2026-04'],
            ['Marketing Ads','1200','expense','Marketing','2026-04'],
            ['Salários Equipe','7000','expense','Pessoas','2026-04'],
            // Maio — R$ 16.000 receita real
            ['Contrato Mensal Software Chat','7000','income','Sistemas','2026-05'],
            ['Automação Workflows Cliente','5000','income','Automações','2026-05'],
            ['Consultoria IA','4000','income','IA','2026-05'],
            ['Servidor VPS','900','expense','Infraestrutura','2026-05'],
            ['Salários Equipe','7000','expense','Pessoas','2026-05'],
            // Junho — R$ 18.000 receita real
            ['Contrato Mensal Software Chat','8000','income','Sistemas','2026-06'],
            ['Dashboard Analytics Cliente','6000','income','Sistemas','2026-06'],
            ['Agente IA Atendimento','4000','income','IA','2026-06'],
            ['Google Ads','1000','expense','Marketing','2026-06'],
            ['Salários Equipe','7500','expense','Pessoas','2026-06'],
            // Julho — R$ 20.000 receita real
            ['Contrato Mensal Software Chat','8000','income','Sistemas','2026-07'],
            ['Solution Math OS - Licença','7000','income','Sistemas','2026-07'],
            ['Integração CRM','3000','income','Integrações','2026-07'],
            ['Consultoria Tech','2000','income','IA','2026-07'],
            ['Servidor VPS','1000','expense','Infraestrutura','2026-07'],
            ['Salários Equipe','8000','expense','Pessoas','2026-07'],
            // Agosto — R$ 22.000 receita real
            ['Contrato Mensal Software Chat','9000','income','Sistemas','2026-08'],
            ['Solution Math OS - 2 Licenças','10000','income','Sistemas','2026-08'],
            ['Consultoria Automação','3000','income','Automações','2026-08'],
            ['Servidor VPS','1000','expense','Infraestrutura','2026-08'],
            ['Salários Equipe','8500','expense','Pessoas','2026-08'],
            // Setembro — R$ 30.000 receita real (Mês Atual - 15/09/2026)
            ['Contrato Mensal Software Chat','10000','income','Sistemas','2026-09'],
            ['Solution Math OS - 3 Licenças','15000','income','Sistemas','2026-09'],
            ['Agente IA Vendas Cliente','5000','income','IA','2026-09'],
            ['Salários Equipe','9000','expense','Pessoas','2026-09'],
            ['Ferramentas Dev','800','expense','Ferramentas','2026-09']
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

      // ═══════════════════════════════════
      // WORKFLOWS / AUTOMATION TABLES
      // ═══════════════════════════════════
      db.run(`CREATE TABLE IF NOT EXISTS workflows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        trigger_event TEXT NOT NULL,
        condition_rules TEXT,
        actions_json TEXT NOT NULL,
        status TEXT DEFAULT 'Ativo',
        executions_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`);

      // Seed Workflows
      db.get("SELECT count(*) as count FROM workflows", (err, row) => {
        if (!err && row && row.count === 0) {
          const sampleWorkflows = [
            [
              'Notificação de Pedido de Alto Valor',
              'Envia notificação via WhatsApp para o vendedor responsável quando um pedido ultrapassa R$ 10.000',
              'Pedido Aprovado',
              'Valor do pedido > R$ 10.000',
              JSON.stringify(['Localizar vendedor responsável', 'Enviar mensagem WhatsApp', 'Registrar log de auditoria', 'Criar tarefa de acompanhamento em 24h']),
              'Ativo',
              14
            ],
            [
              'Alerta de Estoque Crítico',
              'Dispara e-mail automático para o setor de compras quando o estoque de um produto atinge a quantidade mínima',
              'Estoque Mínimo Atingido',
              'Quantidade em estoque <= Estoque mínimo',
              JSON.stringify(['Identificar fornecedor padrão', 'Gerar ordem de compra em rascunho', 'Notificar gerente de compras via sistema']),
              'Ativo',
              32
            ],
            [
              'Boas-Vindas a Novos Leads no CRM',
              'Agenda tarefa automática para a equipe de vendas entrar em contato em até 2 horas após o cadastro de um novo lead',
              'Novo Lead Cadastrado',
              'Origem = Landing Page ou Formulário',
              JSON.stringify(['Atribuir ao vendedor da fila rodízio', 'Criar tarefa com prioridade Alta', 'Enviar mensagem de boas-vindas']),
              'Ativo',
              89
            ]
          ];
          sampleWorkflows.forEach(([name, desc, trig, cond, actions, status, execs]) => {
            db.run(
              `INSERT INTO workflows (name, description, trigger_event, condition_rules, actions_json, status, executions_count) VALUES (?,?,?,?,?,?,?)`,
              [name, desc, trig, cond, actions, status, execs]
            );
          });
        }
      });

      // ═══════════════════════════════════════════
      // LEADS TABLE (Landing Page Funnel)
      // ═══════════════════════════════════════════
      db.run(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        business_type TEXT,
        plan_interest TEXT,
        status TEXT DEFAULT 'Novo',
        whatsapp_sent INTEGER DEFAULT 0,
        notes TEXT,
        utm_source TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`);

      // ═══════════════════════════════════════════
      // AI CONVERSATIONS TABLE (Lyra Memory)
      // ═══════════════════════════════════════════
      db.run(`CREATE TABLE IF NOT EXISTS ai_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`);

      // ═══════════════════════════════════════════
      // SALES TABLE (Módulo Exclusivo de Vendas)
      // ═══════════════════════════════════════════
      db.run(`CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        product_name TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'PIX',
        channel TEXT DEFAULT 'Manual',
        status TEXT DEFAULT 'Aprovado',
        notes TEXT,
        month TEXT,
        external_id TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`);

      // Garantir integridade e sincronização automática entre sales e transactions
      db.all("SELECT * FROM sales WHERE status != 'Cancelado'", [], (err, allSales) => {
        if (!err && allSales && allSales.length > 0) {
          allSales.forEach(s => {
            db.get("SELECT id FROM transactions WHERE source_id = ? AND (source_type = 'sale_manual' OR source_type = 'sale_webhook')", [s.id], (errTx, txRow) => {
              if (!errTx && !txRow) {
                const desc = s.channel === 'Site / Webhook'
                  ? `Venda Online #${s.external_id || s.id}: ${s.customer_name} (${s.product_name})`
                  : `Venda #${s.id}: ${s.customer_name} (${s.product_name})`;
                const sourceType = s.channel === 'Site / Webhook' ? 'sale_webhook' : 'sale_manual';
                db.run(
                  `INSERT INTO transactions (description, amount, type, category, month, source_type, source_id)
                   VALUES (?, ?, 'income', 'Sistemas', ?, ?, ?)`,
                  [desc, s.amount, s.month, sourceType, s.id]
                );
              }
            });
          });
        }
      });

      // ═══════════════════════════════════════════
      // COMPANY SETTINGS (Metas e Parâmetros)
      // ═══════════════════════════════════════════
      db.run(`CREATE TABLE IF NOT EXISTS company_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )`);

      db.get("SELECT value FROM company_settings WHERE key = 'annual_target_2026'", (err, row) => {
        if (!err && !row) {
          db.run(`INSERT INTO company_settings (key, value) VALUES ('annual_target_2026', '500000')`);
        }
      });

      // ═══════════════════════════════════════════
      // PAYROLL STARTUP SYNC
      // Garante que os salários do mês atual estejam no financeiro
      // ═══════════════════════════════════════════
      const currentMonth = new Date().toISOString().slice(0, 7);
      db.all("SELECT id, name, role, salary, status FROM users WHERE status = 'Ativo' AND salary > 0", [], (err, activeUsers) => {
        if (!err && activeUsers && activeUsers.length > 0) {
          activeUsers.forEach(u => {
            db.get(
              `SELECT id FROM transactions WHERE source_type = 'payroll' AND source_id = ? AND month = ?`,
              [u.id, currentMonth],
              (errTx, existing) => {
                if (!errTx && !existing) {
                  const desc = `Salário: ${u.name} (${u.role})`;
                  db.run(
                    `INSERT INTO transactions (description, amount, type, category, month, source_type, source_id)
                     VALUES (?, ?, 'expense', 'Pessoas', ?, 'payroll', ?)`,
                    [desc, u.salary, currentMonth, u.id]
                  );
                }
              }
            );
          });
        }
      });
    });
  }
});

module.exports = db;
