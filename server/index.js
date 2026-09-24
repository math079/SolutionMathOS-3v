const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { chatCompletion, getSystemContext } = require('./ai');
const {
  rateLimitMiddleware,
  securityHeadersMiddleware,
  authMiddleware,
  rbacMiddleware,
  auditMiddleware,
  sanitizeResponse,
  createAuditLog,
  getAuditLogs,
} = require('./security');

const app = express();
const port = 3001;

// ════════════════════════════════════════════
// SECURITY MIDDLEWARE STACK
// Regras 2, 3, 5, 7, 13 do Prompt de Segurança
// ════════════════════════════════════════════
app.use(securityHeadersMiddleware);  // Headers de segurança (Regra 3)
app.use(rateLimitMiddleware);         // Rate limiting (Regra 7)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-user', 'x-auth-role'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);              // Autenticação (Regra 5)
app.use(auditMiddleware);             // Auditoria (Regra 13)

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ════════════════════════════════════════════
// USERS (RH) – com sincronização de folha de pagamento no Financeiro
// ════════════════════════════════════════════
app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Endpoint para obter resumo de folha do mês atual
app.get('/api/users/payroll/summary', (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  db.all(
    "SELECT SUM(salary) as total_payroll, COUNT(*) as total_active FROM users WHERE status = 'Ativo'",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ total_payroll: rows[0]?.total_payroll || 0, total_active: rows[0]?.total_active || 0, month: currentMonth });
    }
  );
});

// Helper: sincronizar a folha de pagamento de um usuário em todas as transactions relevantes
function syncPayrollToTransactions(userId, userName, userRole, salary, status, cb) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (status && status !== 'Ativo') {
    // Usuário inativo ou de férias com custo zero — remover lançamentos futuros
    db.run(
      `DELETE FROM transactions WHERE source_type = 'payroll' AND source_id = ? AND month >= ?`,
      [userId, currentMonth],
      cb
    );
    return;
  }

  const desc = `Salário: ${userName} (${userRole || 'Colaborador'})`;
  db.get(
    `SELECT id FROM transactions WHERE source_type = 'payroll' AND source_id = ? AND month = ?`,
    [userId, currentMonth],
    (err, existing) => {
      if (err) { if (cb) cb(err); return; }
      if (existing) {
        // Atualizar se já existe
        db.run(
          `UPDATE transactions SET description = ?, amount = ? WHERE id = ?`,
          [desc, salary, existing.id],
          cb
        );
      } else {
        // Inserir novo lançamento de custo
        db.run(
          `INSERT INTO transactions (description, amount, type, category, month, source_type, source_id)
           VALUES (?, ?, 'expense', 'Pessoas', ?, 'payroll', ?)`,
          [desc, salary, currentMonth, userId],
          cb
        );
      }
    }
  );
}

app.post('/api/users', (req, res) => {
  const { name, role, email, phone, contract_type, salary, status, hired_at, equity_percentage } = req.body;
  const numSalary = parseFloat(salary) || 0;
  const numEquity = parseFloat(equity_percentage) || 0;
  db.run(
    `INSERT INTO users (name, role, email, phone, contract_type, salary, status, hired_at, equity_percentage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      role || 'Colaborador',
      email || '',
      phone || '',
      contract_type || 'PJ',
      numSalary,
      status || 'Ativo',
      hired_at || new Date().toISOString().split('T')[0],
      numEquity
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const newUserId = this.lastID;
      const newStatus = status || 'Ativo';

      // Sincronizar custo de salário com Financeiro do mês atual
      if (numSalary > 0 && newStatus === 'Ativo') {
        syncPayrollToTransactions(newUserId, name, role, numSalary, newStatus, (syncErr) => {
          if (syncErr) console.error('[RH SYNC] Erro ao criar custo de salário:', syncErr);
        });
      }

      res.json({
        id: newUserId, name, role, email, phone, contract_type,
        salary: numSalary, status: newStatus, hired_at, equity_percentage: numEquity
      });
    }
  );
});

app.put('/api/users/:id', (req, res) => {
  const { name, role, email, phone, contract_type, salary, status, equity_percentage } = req.body;
  const userId = req.params.id;
  const numSalary = salary !== undefined ? parseFloat(salary) : null;
  const numEquity = equity_percentage !== undefined ? parseFloat(equity_percentage) : null;

  db.run(
    `UPDATE users SET
      name = COALESCE(?, name),
      role = COALESCE(?, role),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      contract_type = COALESCE(?, contract_type),
      salary = COALESCE(?, salary),
      status = COALESCE(?, status),
      equity_percentage = COALESCE(?, equity_percentage)
     WHERE id = ?`,
    [name||null, role||null, email||null, phone||null, contract_type||null, numSalary, status||null, numEquity, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Buscar dados atualizados para sincronizar folha
      db.get(`SELECT name, role, salary, status FROM users WHERE id = ?`, [userId], (err2, u) => {
        if (!err2 && u && u.salary > 0) {
          syncPayrollToTransactions(parseInt(userId), u.name, u.role, u.salary, u.status, (syncErr) => {
            if (syncErr) console.error('[RH SYNC] Erro ao atualizar custo de salário:', syncErr);
          });
        }
      });

      res.json({ success: true });
    }
  );
});

app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  // Remover lançamentos de folha do mês atual e futuros ao demitir
  db.run(
    `DELETE FROM transactions WHERE source_type = 'payroll' AND source_id = ?`,
    [userId],
    (errTx) => {
      if (errTx) console.error('[RH DELETE] Erro ao remover transações de folha:', errTx);
    }
  );
  db.run(`DELETE FROM users WHERE id=?`, [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// EMPRESAS & PRESTADORES TERCEIRIZADOS (RH -> FINANCEIRO GERAL)
// ════════════════════════════════════════════

function syncContractorToFinance(contractorId, companyName, serviceType, cost, dueDay, status, cb) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const numCost = parseFloat(cost) || 0;

  if (status && status !== 'Ativo') {
    db.run(`DELETE FROM transactions WHERE source_type = 'contractor' AND source_id = ? AND month >= ?`, [contractorId, currentMonth]);
    db.run(`UPDATE financial_recurring SET is_active = 0 WHERE source_type = 'contractor' AND source_id = ?`, [contractorId], cb);
    return;
  }

  const descTx = `Terceirizado: ${companyName} (${serviceType})`;
  const descRec = `Contrato: ${companyName} (${serviceType})`;

  // 1. Transactions (Financeiro Geral / DRE)
  db.get(
    `SELECT id FROM transactions WHERE source_type = 'contractor' AND source_id = ? AND month = ?`,
    [contractorId, currentMonth],
    (err, existing) => {
      if (!err && existing) {
        db.run(
          `UPDATE transactions SET description = ?, amount = ?, department = ? WHERE id = ?`,
          [descTx, numCost, serviceType, existing.id]
        );
      } else if (!err) {
        db.run(
          `INSERT INTO transactions (description, amount, type, category, month, cost_type, department, source_type, source_id)
           VALUES (?, ?, 'expense', 'Terceirizados', ?, 'fixed', ?, 'contractor', ?)`,
          [descTx, numCost, currentMonth, serviceType, contractorId]
        );
      }
    }
  );

  // 2. Financial Recurring (Gastos Recorrentes)
  db.get(
    `SELECT id FROM financial_recurring WHERE source_type = 'contractor' AND source_id = ?`,
    [contractorId],
    (err, existingRec) => {
      if (!err && existingRec) {
        db.run(
          `UPDATE financial_recurring SET description = ?, amount = ?, department = ?, due_day = ?, is_active = 1 WHERE id = ?`,
          [descRec, numCost, serviceType, dueDay || 10, existingRec.id],
          cb
        );
      } else if (!err) {
        db.run(
          `INSERT INTO financial_recurring (description, amount, category_type, department, due_day, payment_method, is_active, source_type, source_id)
           VALUES (?, ?, 'fixed', ?, ?, 'Boleto / TED', 1, 'contractor', ?)`,
          [descRec, numCost, serviceType, dueDay || 10, contractorId],
          cb
        );
      }
    }
  );
}

app.get('/api/hr/contractors', (req, res) => {
  db.all("SELECT * FROM hr_contractors ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/hr/contractors', (req, res) => {
  const { company_name, service_type, monthly_cost, contract_status, due_day, contact_name, contact_email, contact_phone, notes } = req.body;
  const cost = parseFloat(monthly_cost) || 0;
  const status = contract_status || 'Ativo';
  const day = parseInt(due_day) || 10;

  db.run(
    `INSERT INTO hr_contractors (company_name, service_type, monthly_cost, contract_status, due_day, contact_name, contact_email, contact_phone, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [company_name, service_type, cost, status, day, contact_name || '', contact_email || '', contact_phone || '', notes || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const newId = this.lastID;
      syncContractorToFinance(newId, company_name, service_type, cost, day, status, () => {});
      res.json({ id: newId, company_name, service_type, monthly_cost: cost, contract_status: status, due_day: day });
    }
  );
});

app.put('/api/hr/contractors/:id', (req, res) => {
  const { company_name, service_type, monthly_cost, contract_status, due_day, contact_name, contact_email, contact_phone, notes } = req.body;
  const id = req.params.id;
  const cost = parseFloat(monthly_cost) || 0;
  const status = contract_status || 'Ativo';
  const day = parseInt(due_day) || 10;

  db.run(
    `UPDATE hr_contractors SET
      company_name = COALESCE(?, company_name),
      service_type = COALESCE(?, service_type),
      monthly_cost = COALESCE(?, monthly_cost),
      contract_status = COALESCE(?, contract_status),
      due_day = COALESCE(?, due_day),
      contact_name = COALESCE(?, contact_name),
      contact_email = COALESCE(?, contact_email),
      contact_phone = COALESCE(?, contact_phone),
      notes = COALESCE(?, notes)
     WHERE id = ?`,
    [company_name, service_type, cost, status, day, contact_name, contact_email, contact_phone, notes, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      syncContractorToFinance(parseInt(id), company_name, service_type, cost, day, status, () => {});
      res.json({ success: true });
    }
  );
});

app.delete('/api/hr/contractors/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM transactions WHERE source_type = 'contractor' AND source_id = ?`, [id]);
  db.run(`DELETE FROM financial_recurring WHERE source_type = 'contractor' AND source_id = ?`, [id]);
  db.run(`DELETE FROM hr_contractors WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Análise Estatística de Custo de Gestão (CEOs vs Equipe) e Impacto no Caixa
app.get('/api/finance/analytics/management-cost', (req, res) => {
  db.all("SELECT id, name, role, salary, contract_type FROM users WHERE status = 'Ativo'", [], (errUsers, users) => {
    if (errUsers) return res.status(500).json({ error: errUsers.message });

    db.all("SELECT balance, type FROM financial_accounts", [], (errAcc, accounts) => {
      const totalCash = (accounts || []).reduce((acc, a) => acc + (a.balance || 0), 0);
      
      let executiveCost = 0;
      let operationalCost = 0;
      const executiveMembers = [];
      const operationalMembers = [];

      (users || []).forEach(u => {
        const roleLower = (u.role || '').toLowerCase();
        const isExecutive = roleLower.includes('ceo') || 
                            roleLower.includes('diretor') || 
                            roleLower.includes('fundador') || 
                            roleLower.includes('executiv') ||
                            roleLower.includes('sócio') ||
                            u.contract_type === 'Sócio';

        const sal = parseFloat(u.salary) || 0;
        if (isExecutive) {
          executiveCost += sal;
          executiveMembers.push({ name: u.name, role: u.role, salary: sal });
        } else {
          operationalCost += sal;
          operationalMembers.push({ name: u.name, role: u.role, salary: sal });
        }
      });

      const totalPayroll = executiveCost + operationalCost;
      const executiveRatio = totalPayroll > 0 ? (executiveCost / totalPayroll) * 100 : 0;
      const cashBurnPayrollRatio = totalCash > 0 ? (totalPayroll / totalCash) * 100 : 0;

      let diagnosis = 'Saudável';
      let recommendation = 'A relação entre custos de liderança e time operacional está equilibrada.';

      if (executiveRatio > 35) {
        diagnosis = 'Atenção - Gestão Elevada';
        recommendation = `A alta liderança (CEOs/Sócios) consome ${executiveRatio.toFixed(1)}% de toda a folha de pagamento. Em empresas em tração, o ideal recomendado é manter entre 20% e 30%, atrelando retiradas maiores à distribuição de lucros/dividendos.`;
      } else if (executiveRatio > 50) {
        diagnosis = 'Crítico - Sobrecarga de Liderança';
        recommendation = 'Mais de 50% dos recursos de pessoal estão concentrados na diretoria. Risco de subdimensionamento da equipe executora.';
      }

      res.json({
        total_payroll: totalPayroll,
        executive_cost: executiveCost,
        operational_cost: operationalCost,
        executive_ratio: executiveRatio,
        total_cash: totalCash,
        cash_burn_payroll_ratio: cashBurnPayrollRatio,
        executive_members: executiveMembers,
        operational_count: operationalMembers.length,
        diagnosis,
        recommendation
      });
    });
  });
});



// ════════════════════════════════════════════
// CRM CLIENTS
// ════════════════════════════════════════════
app.get('/api/crm/clients', (req, res) => {
  db.all("SELECT * FROM clients ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/crm/clients', (req, res) => {
  const { name, company, email, phone, source, notes, status } = req.body;
  db.run(
    `INSERT INTO clients (name,company,email,phone,source,notes,status) VALUES (?,?,?,?,?,?,?)`,
    [name, company, email, phone||'', source||'', notes||'', status||'Lead'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, company, email, phone, source, notes, status: status||'Lead' });
    }
  );
});
app.put('/api/crm/clients/:id', (req, res) => {
  const { status } = req.body;
  db.run(`UPDATE clients SET status=? WHERE id=?`, [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});
app.delete('/api/crm/clients/:id', (req, res) => {
  db.run(`DELETE FROM clients WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// DEALS (Kanban CRM) + Auto-sync to Finance when 'Ganho'
// ════════════════════════════════════════════
app.get('/api/deals', (req, res) => {
  db.all(`SELECT deals.*, clients.name as client_name, users.name as assignee_name
          FROM deals
          LEFT JOIN clients ON deals.client_id = clients.id
          LEFT JOIN users ON deals.assignee_id = users.id
          ORDER BY deals.created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/deals', (req, res) => {
  const { title, client_id, value, stage, assignee_id, notes } = req.body;
  const numValue = parseFloat(value) || 0;
  const currentMonth = new Date().toISOString().slice(0, 7);

  db.run(
    `INSERT INTO deals (title,client_id,value,stage,assignee_id,notes) VALUES (?,?,?,?,?,?)`,
    [title, client_id||null, numValue, stage||'Novo Lead', assignee_id||null, notes||''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      const newId = this.lastID;

      // Auto-sync to Financial Transactions if deal is Created as 'Ganho'
      if (stage === 'Ganho' && numValue > 0) {
        db.run(
          `INSERT INTO transactions (description, amount, type, category, month) VALUES (?, ?, 'income', 'Sistemas', ?)`,
          [`Venda CRM: ${title}`, numValue, currentMonth]
        );
      }

      res.json({ id: newId, title, client_id, value: numValue, stage: stage||'Novo Lead', assignee_id, notes });
    }
  );
});

app.put('/api/deals/:id', (req, res) => {
  const { stage, value, notes } = req.body;
  const dealId = req.params.id;
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Check previous stage
  db.get(`SELECT * FROM deals WHERE id=?`, [dealId], (err, deal) => {
    if (err || !deal) return res.status(500).json({ error: err ? err.message : 'Deal not found' });

    const prevStage = deal.stage;
    const finalStage = stage || prevStage;
    const finalValue = value !== undefined ? parseFloat(value) : deal.value;

    db.run(
      `UPDATE deals SET stage=COALESCE(?,stage), value=COALESCE(?,value), notes=COALESCE(?,notes) WHERE id=?`,
      [stage||null, value!==undefined ? parseFloat(value) : null, notes||null, dealId],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });

        // Auto-sync: If stage changed to 'Ganho'
        if (finalStage === 'Ganho' && prevStage !== 'Ganho' && finalValue > 0) {
          db.get(`SELECT id FROM transactions WHERE source_type = 'deal' AND source_id = ?`, [dealId], (errTx, txRow) => {
            if (!errTx && !txRow) {
              db.run(
                `INSERT INTO transactions (description, amount, type, category, month, source_type, source_id)
                 VALUES (?, ?, 'income', 'Vendas CRM', ?, 'deal', ?)`,
                [`Deal Fechado: ${deal.title}`, finalValue, currentMonth, dealId]
              );
            }
          });
        } else if (finalStage === 'Perdido' && prevStage !== 'Perdido') {
          db.run(`DELETE FROM transactions WHERE source_type = 'deal' AND source_id = ?`, [dealId]);
        }

        res.json({ success: true, dealId, stage: finalStage, value: finalValue });
      }
    );
  });
});

app.delete('/api/deals/:id', (req, res) => {
  db.run(`DELETE FROM deals WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// FINANCE (Full Year 2026 & Editable)
// ════════════════════════════════════════════
app.get('/api/finance/summary', (req, res) => {
  db.all(`SELECT
    SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN type='income' THEN amount ELSE -amount END) as net_profit
    FROM transactions`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows[0] || { total_revenue: 0, total_expense: 0, net_profit: 0 });
  });
});

app.get('/api/finance/monthly', (req, res) => {
  db.all(`SELECT month,
    SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as revenue,
    SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
    FROM transactions GROUP BY month ORDER BY month`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/finance/by-category', (req, res) => {
  db.all(`SELECT category,
    SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as revenue,
    SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
    FROM transactions WHERE type='income'
    GROUP BY category ORDER BY revenue DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/finance/transactions', (req, res) => {
  db.all(`SELECT * FROM transactions ORDER BY month DESC, id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/finance/transactions', (req, res) => {
  const { description, amount, type, category, month } = req.body;
  const currentMonth = new Date().toISOString().slice(0, 7);
  db.run(`INSERT INTO transactions (description,amount,type,category,month) VALUES (?,?,?,?,?)`,
    [description, parseFloat(amount)||0, type||'income', category||'Sistemas', month||currentMonth],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, description, amount: parseFloat(amount)||0, type, category, month: month||currentMonth });
    }
  );
});

app.put('/api/finance/transactions/:id', (req, res) => {
  const { description, amount, type, category, month } = req.body;
  const numAmount = amount !== undefined ? parseFloat(amount) : null;
  db.run(
    `UPDATE transactions SET
      description = COALESCE(?, description),
      amount = COALESCE(?, amount),
      type = COALESCE(?, type),
      category = COALESCE(?, category),
      month = COALESCE(?, month)
     WHERE id = ?`,
    [description||null, numAmount, type||null, category||null, month||null, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      // Se a transação foi originada de uma venda, atualizar na tabela sales também
      db.get(`SELECT source_type, source_id FROM transactions WHERE id = ?`, [req.params.id], (err2, row) => {
        if (!err2 && row && (row.source_type === 'sale_manual' || row.source_type === 'sale_webhook') && row.source_id) {
          if (numAmount !== null) {
            db.run(`UPDATE sales SET amount = ? WHERE id = ?`, [numAmount, row.source_id]);
          }
        }
      });
      res.json({ success: true });
    }
  );
});

app.delete('/api/finance/transactions/:id', (req, res) => {
  db.get(`SELECT source_type, source_id FROM transactions WHERE id = ?`, [req.params.id], (err, row) => {
    if (!err && row && (row.source_type === 'sale_manual' || row.source_type === 'sale_webhook') && row.source_id) {
      db.run(`DELETE FROM sales WHERE id = ?`, [row.source_id]);
    }
    db.run(`DELETE FROM transactions WHERE id=?`, [req.params.id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

// ════════════════════════════════════════════
// FINANCIAL ADVANCED MODULES & ORÇAMENTOS
// ════════════════════════════════════════════

// 1. Categorias Customizadas de Investimento
app.get('/api/finance/investment-categories', (req, res) => {
  db.all("SELECT * FROM financial_investment_categories ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/finance/investment-categories', (req, res) => {
  const { name, description, color } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
  }
  db.run(
    `INSERT INTO financial_investment_categories (name, description, color) VALUES (?, ?, ?)`,
    [name.trim(), description || '', color || '#14b8a6'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Essa categoria de investimento já existe.' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, name: name.trim(), description: description || '', color: color || '#14b8a6' });
    }
  );
});

app.delete('/api/finance/investment-categories/:id', (req, res) => {
  db.run(`DELETE FROM financial_investment_categories WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 2. Orçamento e Verbas por Setor
app.get('/api/finance/budgets', (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  db.all(
    `SELECT b.*,
      COALESCE((
        SELECT SUM(t.amount) FROM transactions t 
        WHERE t.type = 'expense' 
        AND t.month = b.month 
        AND (t.department = b.sector OR t.category = b.sector)
      ), 0) as spent_amount
     FROM financial_budgets b
     WHERE b.month = ?
     ORDER BY b.allocated_amount DESC`,
    [month],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/finance/budgets', (req, res) => {
  const { sector, allocated_amount, month, notes, category_type } = req.body;
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const numAllocated = parseFloat(allocated_amount) || 0;

  db.run(
    `INSERT INTO financial_budgets (sector, allocated_amount, month, notes, category_type, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(sector, month) DO UPDATE SET
       allocated_amount = excluded.allocated_amount,
       notes = excluded.notes,
       category_type = excluded.category_type,
       updated_at = datetime('now')`,
    [sector, numAllocated, currentMonth, notes || '', category_type || 'investment'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, sector, allocated_amount: numAllocated, month: currentMonth });
    }
  );
});

app.delete('/api/finance/budgets/:id', (req, res) => {
  db.run(`DELETE FROM financial_budgets WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 3. Divisão de Contas e Caixa / Capital de Giro
app.get('/api/finance/accounts', (req, res) => {
  db.all("SELECT * FROM financial_accounts ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/finance/accounts/:id', (req, res) => {
  const { balance, target_amount, description } = req.body;
  db.run(
    `UPDATE financial_accounts SET
      balance = COALESCE(?, balance),
      target_amount = COALESCE(?, target_amount),
      description = COALESCE(?, description),
      updated_at = datetime('now')
     WHERE id = ?`,
    [
      balance !== undefined ? parseFloat(balance) : null,
      target_amount !== undefined ? parseFloat(target_amount) : null,
      description || null,
      req.params.id
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// 4. Custos Recorrentes
app.get('/api/finance/recurring', (req, res) => {
  db.all("SELECT * FROM financial_recurring ORDER BY due_day ASC, id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/finance/recurring', (req, res) => {
  const { description, amount, category_type, department, due_day, payment_method } = req.body;
  db.run(
    `INSERT INTO financial_recurring (description, amount, category_type, department, due_day, payment_method)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      description,
      parseFloat(amount) || 0,
      category_type || 'fixed',
      department || 'Geral',
      parseInt(due_day) || 5,
      payment_method || 'Boleto'
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        description,
        amount: parseFloat(amount) || 0,
        category_type: category_type || 'fixed',
        department: department || 'Geral',
        due_day: parseInt(due_day) || 5,
        payment_method: payment_method || 'Boleto'
      });
    }
  );
});

app.delete('/api/finance/recurring/:id', (req, res) => {
  db.run(`DELETE FROM financial_recurring WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 5. Inteligência e Recomendações de Capital de Giro e Burn Rate
app.get('/api/finance/analytics/cash-flow-health', (req, res) => {
  // Média de custos dos últimos 3 meses
  db.all(
    `SELECT month, SUM(amount) as monthly_expense
     FROM transactions 
     WHERE type = 'expense' 
     GROUP BY month 
     ORDER BY month DESC 
     LIMIT 3`,
    [],
    (err, expenseRows) => {
      if (err) return res.status(500).json({ error: err.message });

      const count = expenseRows.length || 1;
      const totalExpense = expenseRows.reduce((acc, r) => acc + (r.monthly_expense || 0), 0);
      const avgMonthlyBurn = totalExpense / count;

      // Buscar saldos atuais das contas
      db.all("SELECT type, balance FROM financial_accounts", [], (errAcc, accounts) => {
        if (errAcc) return res.status(500).json({ error: errAcc.message });

        let totalCash = 0;
        let workingCapital = 0;
        let emergencyReserve = 0;

        (accounts || []).forEach(a => {
          totalCash += (a.balance || 0);
          if (a.type === 'working_capital') workingCapital += (a.balance || 0);
          if (a.type === 'emergency_reserve') emergencyReserve += (a.balance || 0);
        });

        // Recomendações automáticas
        const recommendedRunwayMonths = 3; // 3 meses de segurança mínima
        const idealWorkingCapital = avgMonthlyBurn * 1.5; // 1.5x custo mensal
        const idealEmergencyReserve = avgMonthlyBurn * 3;  // 3x custo mensal
        const currentRunway = avgMonthlyBurn > 0 ? (totalCash / avgMonthlyBurn).toFixed(1) : '12+';

        res.json({
          avg_monthly_burn: Math.round(avgMonthlyBurn),
          total_cash: totalCash,
          working_capital: workingCapital,
          emergency_reserve: emergencyReserve,
          ideal_working_capital: Math.round(idealWorkingCapital),
          ideal_emergency_reserve: Math.round(idealEmergencyReserve),
          current_runway_months: currentRunway,
          recommendation: avgMonthlyBurn === 0
            ? 'Dados insuficientes de despesas para calcular o Burn Rate. Continue registrando as operações.'
            : totalCash >= idealEmergencyReserve
            ? 'Excelente saúde financeira! O caixa atual cobre mais de 3 meses de operação completa.'
            : 'Atenção recomendada: O capital de giro atual está abaixo do recomendado para 3 meses de operação.'
        });
      });
    }
  );
});

// ════════════════════════════════════════════
// PRODUCTS (Catálogo & Lucro por Ticket)
// ════════════════════════════════════════════
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/products', (req, res) => {
  const { name, ticket_price, cost, category, description } = req.body;
  const priceNum = parseFloat(ticket_price) || 0;
  const costNum  = parseFloat(cost) || 0;
  const profitNum = priceNum - costNum;

  db.run(
    `INSERT INTO products (name, ticket_price, cost, profit, category, description) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, priceNum, costNum, profitNum, category||'Sistemas', description||''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, ticket_price: priceNum, cost: costNum, profit: profitNum, category, description });
    }
  );
});

app.put('/api/products/:id', (req, res) => {
  const { name, ticket_price, cost, category, description } = req.body;
  const priceNum = ticket_price !== undefined ? parseFloat(ticket_price) : undefined;
  const costNum  = cost !== undefined ? parseFloat(cost) : undefined;

  db.get(`SELECT * FROM products WHERE id=?`, [req.params.id], (err, prod) => {
    if (err || !prod) return res.status(500).json({ error: err ? err.message : 'Produto não encontrado' });

    const finalPrice = priceNum !== undefined ? priceNum : prod.ticket_price;
    const finalCost  = costNum !== undefined ? costNum : prod.cost;
    const finalProfit = finalPrice - finalCost;

    db.run(
      `UPDATE products SET name=COALESCE(?,name), ticket_price=?, cost=?, profit=?, category=COALESCE(?,category), description=COALESCE(?,description) WHERE id=?`,
      [name||null, finalPrice, finalCost, finalProfit, category||null, description||null, req.params.id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });
});

app.delete('/api/products/:id', (req, res) => {
  db.run(`DELETE FROM products WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// AGENDA (Calendário de Operações)
// ════════════════════════════════════════════
app.get('/api/agenda', (req, res) => {
  db.all(`SELECT agenda_events.*, users.name as assignee_name
          FROM agenda_events
          LEFT JOIN users ON agenda_events.assignee_id = users.id
          ORDER BY agenda_events.date ASC, agenda_events.time ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/agenda', (req, res) => {
  const { title, date, time, category, assignee_id, status } = req.body;
  db.run(
    `INSERT INTO agenda_events (title, date, time, category, assignee_id, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [title, date, time||'09:00', category||'Geral', assignee_id||null, status||'Agendado'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, date, time, category, assignee_id, status: status||'Agendado' });
    }
  );
});

app.put('/api/agenda/:id', (req, res) => {
  const { title, date, time, category, assignee_id, status } = req.body;
  db.run(
    `UPDATE agenda_events SET
      title = COALESCE(?, title),
      date = COALESCE(?, date),
      time = COALESCE(?, time),
      category = COALESCE(?, category),
      assignee_id = COALESCE(?, assignee_id),
      status = COALESCE(?, status)
     WHERE id = ?`,
    [title||null, date||null, time||null, category||null, assignee_id||null, status||null, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/agenda/:id', (req, res) => {
  db.run(`DELETE FROM agenda_events WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// TASKS
// ════════════════════════════════════════════
app.get('/api/tasks', (req, res) => {
  db.all(`SELECT tasks.*, users.name as assignee_name
          FROM tasks LEFT JOIN users ON tasks.assignee_id = users.id`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/tasks', upload.single('file'), (req, res) => {
  const { title, description, assignee_id, status } = req.body;
  const file_url = req.file ? `/uploads/${req.file.filename}` : null;
  db.run(`INSERT INTO tasks (title,description,assignee_id,status,file_url) VALUES (?,?,?,?,?)`,
    [title, description, assignee_id, status||'Pendente', file_url], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, description, assignee_id, status: status||'Pendente', file_url });
  });
});

app.put('/api/tasks/:id', (req, res) => {
  const { status } = req.body;
  db.run(`UPDATE tasks SET status=? WHERE id=?`, [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.run(`DELETE FROM tasks WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


// ════════════════════════════════════════════
// STORE — PRODUCTS
// ════════════════════════════════════════════
app.get('/api/store/products', (req, res) => {
  db.all("SELECT * FROM store_products ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/store/products', (req, res) => {
  const { name, sku, category, cost_price, sell_price, stock_qty, stock_min } = req.body;
  if (!name || !sell_price) return res.status(400).json({ error: 'name e sell_price são obrigatórios' });
  db.run(
    `INSERT INTO store_products (name, sku, category, cost_price, sell_price, stock_qty, stock_min)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, sku || '', category || 'Geral', parseFloat(cost_price) || 0,
     parseFloat(sell_price), parseInt(stock_qty) || 0, parseInt(stock_min) || 5],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, sku, category, cost_price, sell_price, stock_qty, stock_min });
    }
  );
});

app.put('/api/store/products/:id', (req, res) => {
  const { name, sku, category, cost_price, sell_price, stock_qty, stock_min } = req.body;
  db.run(
    `UPDATE store_products SET
      name = COALESCE(?, name), sku = COALESCE(?, sku), category = COALESCE(?, category),
      cost_price = COALESCE(?, cost_price), sell_price = COALESCE(?, sell_price),
      stock_qty = COALESCE(?, stock_qty), stock_min = COALESCE(?, stock_min)
     WHERE id = ?`,
    [name||null, sku||null, category||null,
     cost_price !== undefined ? parseFloat(cost_price) : null,
     sell_price !== undefined ? parseFloat(sell_price) : null,
     stock_qty !== undefined ? parseInt(stock_qty) : null,
     stock_min !== undefined ? parseInt(stock_min) : null,
     req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/store/products/:id', (req, res) => {
  db.run(`DELETE FROM store_products WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// STORE — ORDERS (PDV finaliza uma venda)
// ════════════════════════════════════════════
app.get('/api/store/orders', (req, res) => {
  db.all(`
    SELECT so.*, c.name as client_name,
           (SELECT COUNT(*) FROM store_order_items WHERE order_id = so.id) as item_count
    FROM store_orders so
    LEFT JOIN clients c ON so.client_id = c.id
    ORDER BY so.created_at DESC
  `, [], (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(orders);
  });
});

app.get('/api/store/orders/:id/items', (req, res) => {
  db.all(`
    SELECT soi.*, sp.name as product_name, sp.sku
    FROM store_order_items soi
    JOIN store_products sp ON soi.product_id = sp.id
    WHERE soi.order_id = ?
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/store/orders', (req, res) => {
  const { client_id, items, discount, payment_method, notes } = req.body;
  // items: [{ product_id, qty, unit_price }]
  if (!items || items.length === 0) return res.status(400).json({ error: 'Nenhum item no pedido' });

  const discountVal = parseFloat(discount) || 0;
  const itemsTotal  = items.reduce((s, i) => s + (i.unit_price * i.qty), 0);
  const total       = Math.max(0, itemsTotal - discountVal);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today        = new Date().toISOString().split('T')[0];

  db.run(
    `INSERT INTO store_orders (client_id, status, total, discount, payment_method, notes)
     VALUES (?, 'Pago', ?, ?, ?, ?)`,
    [client_id || null, total, discountVal, payment_method || 'Dinheiro', notes || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const orderId = this.lastID;

      // Insert order items + deduct stock
      const insertItem = db.prepare(
        `INSERT INTO store_order_items (order_id, product_id, qty, unit_price, total)
         VALUES (?, ?, ?, ?, ?)`
      );
      const deductStock = db.prepare(
        `UPDATE store_products SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ?`
      );
      const insertMove = db.prepare(
        `INSERT INTO store_stock_moves (product_id, type, qty, reason, order_id)
         VALUES (?, 'out', ?, 'Venda PDV', ?)`
      );

      items.forEach(item => {
        insertItem.run(orderId, item.product_id, item.qty, item.unit_price, item.unit_price * item.qty);
        deductStock.run(item.qty, item.product_id);
        insertMove.run(item.product_id, item.qty, orderId);
      });
      insertItem.finalize();
      deductStock.finalize();
      insertMove.finalize();

      // Auto-launch to Financial Dashboard (idempotency: source_type + source_id)
      db.get(
        `SELECT id FROM transactions WHERE source_type='store_order' AND source_id=?`,
        [orderId],
        (err2, existing) => {
          if (!existing) {
            db.run(
              `INSERT INTO transactions (description, amount, type, category, month, source_type, source_id)
               VALUES (?, ?, 'income', 'Loja', ?, 'store_order', ?)`,
              [`Venda PDV #${orderId}`, total, currentMonth, orderId]
            );
          }
        }
      );

      res.json({ id: orderId, total, status: 'Pago', payment_method, item_count: items.length });
    }
  );
});

app.put('/api/store/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.run(`UPDATE store_orders SET status=? WHERE id=?`, [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// STORE — STOCK
// ════════════════════════════════════════════
app.get('/api/store/stock/moves', (req, res) => {
  db.all(`
    SELECT sm.*, sp.name as product_name
    FROM store_stock_moves sm
    JOIN store_products sp ON sm.product_id = sp.id
    ORDER BY sm.created_at DESC LIMIT 100
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/store/stock/adjust', (req, res) => {
  const { product_id, qty, reason } = req.body;
  const qtyNum = parseInt(qty);
  if (!product_id || isNaN(qtyNum)) return res.status(400).json({ error: 'product_id e qty são obrigatórios' });

  const moveType = qtyNum > 0 ? 'in' : 'adjust';
  db.run(
    `UPDATE store_products SET stock_qty = MAX(0, stock_qty + ?) WHERE id = ?`,
    [qtyNum, product_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.run(
        `INSERT INTO store_stock_moves (product_id, type, qty, reason) VALUES (?, ?, ?, ?)`,
        [product_id, moveType, Math.abs(qtyNum), reason || 'Ajuste manual']
      );
      res.json({ success: true });
    }
  );
});

// ════════════════════════════════════════════
// STORE — DASHBOARD
// ════════════════════════════════════════════
app.get('/api/store/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7);

  Promise.all([
    new Promise((resolve, reject) =>
      db.get(`SELECT COALESCE(SUM(total),0) as value FROM store_orders WHERE date(created_at) = ? AND status != 'Cancelado'`, [today], (e, r) => e ? reject(e) : resolve(r?.value || 0))
    ),
    new Promise((resolve, reject) =>
      db.get(`SELECT COALESCE(SUM(total),0) as value FROM store_orders WHERE strftime('%Y-%m', created_at) = ? AND status != 'Cancelado'`, [month], (e, r) => e ? reject(e) : resolve(r?.value || 0))
    ),
    new Promise((resolve, reject) =>
      db.get(`SELECT COALESCE(AVG(total),0) as value FROM store_orders WHERE strftime('%Y-%m', created_at) = ? AND status != 'Cancelado'`, [month], (e, r) => e ? reject(e) : resolve(r?.value || 0))
    ),
    new Promise((resolve, reject) =>
      db.get(`SELECT COUNT(*) as value FROM store_orders WHERE date(created_at) = ? AND status != 'Cancelado'`, [today], (e, r) => e ? reject(e) : resolve(r?.value || 0))
    ),
    new Promise((resolve, reject) =>
      db.all(`SELECT sp.name, SUM(soi.qty) as total_sold FROM store_order_items soi JOIN store_products sp ON soi.product_id = sp.id GROUP BY soi.product_id ORDER BY total_sold DESC LIMIT 5`, [], (e, r) => e ? reject(e) : resolve(r || []))
    ),
    new Promise((resolve, reject) =>
      db.all(`SELECT * FROM store_products WHERE stock_qty <= stock_min ORDER BY stock_qty ASC`, [], (e, r) => e ? reject(e) : resolve(r || []))
    ),
    new Promise((resolve, reject) =>
      db.get(`SELECT COUNT(*) as value FROM store_orders WHERE strftime('%Y-%m', created_at) = ? AND status != 'Cancelado'`, [month], (e, r) => e ? reject(e) : resolve(r?.value || 0))
    ),
  ]).then(([salesDay, salesMonth, ticketAvg, ordersDay, topProducts, lowStock, ordersMonth]) => {
    res.json({ salesDay, salesMonth, ticketAvg, ordersDay, ordersMonth, topProducts, lowStock });
  }).catch(err => res.status(500).json({ error: err.message }));
});

// ════════════════════════════════════════════
// HELPDESK / TICKETS API
// ════════════════════════════════════════════
app.get('/api/tickets', (req, res) => {
  db.all("SELECT * FROM tickets ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/tickets', (req, res) => {
  const { title, description, category, priority, user_name, assigned_to } = req.body;
  db.run(
    `INSERT INTO tickets (title, description, category, priority, status, user_name, assigned_to) VALUES (?, ?, ?, ?, 'Aberto', ?, ?)`,
    [title, description || '', category || 'Geral', priority || 'Média', user_name || 'Cliente', assigned_to || 'Não atribuído'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID, title, description, category: category||'Geral',
        priority: priority||'Média', status: 'Aberto', user_name: user_name||'Cliente',
        assigned_to: assigned_to||'Não atribuído', created_at: new Date().toISOString()
      });
    }
  );
});

app.put('/api/tickets/:id', (req, res) => {
  const { status, assigned_to, priority } = req.body;
  db.run(
    `UPDATE tickets SET status = COALESCE(?, status), assigned_to = COALESCE(?, assigned_to), priority = COALESCE(?, priority), updated_at = datetime('now') WHERE id = ?`,
    [status||null, assigned_to||null, priority||null, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.get('/api/tickets/:id/replies', (req, res) => {
  db.all("SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY id ASC", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/tickets/:id/replies', (req, res) => {
  const { author, role, message } = req.body;
  db.run(
    `INSERT INTO ticket_replies (ticket_id, author, role, message) VALUES (?, ?, ?, ?)`,
    [req.params.id, author || 'Atendente', role || 'funcionario', message],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      // Atualizar ticket para "Em Atendimento" se estiver Aberto
      db.run(`UPDATE tickets SET status = 'Em Atendimento', updated_at = datetime('now') WHERE id = ? AND status = 'Aberto'`, [req.params.id]);
      res.json({ id: this.lastID, ticket_id: req.params.id, author, role, message, created_at: new Date().toISOString() });
    }
  );
});

// ════════════════════════════════════════════
// ADVANCED REPORTS API
// ════════════════════════════════════════════
app.get('/api/reports/financial', (req, res) => {
  Promise.all([
    new Promise((resolve, reject) =>
      db.all(`SELECT month, type, SUM(amount) as total FROM transactions GROUP BY month, type ORDER BY month ASC`, [], (e, r) => e ? reject(e) : resolve(r || []))
    ),
    new Promise((resolve, reject) =>
      db.all(`SELECT category, type, SUM(amount) as total FROM transactions GROUP BY category, type ORDER BY total DESC`, [], (e, r) => e ? reject(e) : resolve(r || []))
    ),
    new Promise((resolve, reject) =>
      db.get(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'`, [], (e, r) => e ? reject(e) : resolve(r?.total || 0))
    ),
    new Promise((resolve, reject) =>
      db.get(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'`, [], (e, r) => e ? reject(e) : resolve(r?.total || 0))
    )
  ]).then(([monthlyBreakdown, categoryBreakdown, totalIncome, totalExpense]) => {
    res.json({ monthlyBreakdown, categoryBreakdown, totalIncome, totalExpense, netProfit: totalIncome - totalExpense });
  }).catch(err => res.status(500).json({ error: err.message }));
});

app.get('/api/reports/sales', (req, res) => {
  Promise.all([
    new Promise((resolve, reject) =>
      db.all(`SELECT date(created_at) as day, COUNT(*) as orders, SUM(total) as revenue FROM store_orders WHERE status != 'Cancelado' GROUP BY date(created_at) ORDER BY day DESC LIMIT 30`, [], (e, r) => e ? reject(e) : resolve(r || []))
    ),
    new Promise((resolve, reject) =>
      db.all(`SELECT sp.name, sp.sku, SUM(soi.qty) as qty_sold, SUM(soi.price * soi.qty) as total_revenue FROM store_order_items soi JOIN store_products sp ON soi.product_id = sp.id GROUP BY soi.product_id ORDER BY total_revenue DESC LIMIT 10`, [], (e, r) => e ? reject(e) : resolve(r || []))
    ),
    new Promise((resolve, reject) =>
      db.get(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total, COALESCE(AVG(total),0) as avg_ticket FROM store_orders WHERE status != 'Cancelado'`, [], (e, r) => e ? reject(e) : resolve(r || {}))
    )
  ]).then(([dailySales, topSellingProducts, summary]) => {
    res.json({ dailySales, topSellingProducts, summary });
  }).catch(err => res.status(500).json({ error: err.message }));
});

app.get('/api/reports/inventory', (req, res) => {
  Promise.all([
    new Promise((resolve, reject) =>
      db.get(`SELECT COUNT(*) as total_items, COALESCE(SUM(stock_qty * price), 0) as total_value, COALESCE(SUM(stock_qty * cost_price), 0) as total_cost FROM store_products`, [], (e, r) => e ? reject(e) : resolve(r || {}))
    ),
    new Promise((resolve, reject) =>
      db.all(`SELECT * FROM store_products WHERE stock_qty <= stock_min ORDER BY stock_qty ASC`, [], (e, r) => e ? reject(e) : resolve(r || []))
    ),
    new Promise((resolve, reject) =>
      db.all(`SELECT category, COUNT(*) as count, SUM(stock_qty * price) as category_value FROM store_products GROUP BY category ORDER BY category_value DESC`, [], (e, r) => e ? reject(e) : resolve(r || []))
    )
  ]).then(([totals, lowStockProducts, categorySummary]) => {
    res.json({ totals, lowStockProducts, categorySummary });
  }).catch(err => res.status(500).json({ error: err.message }));
});

// ════════════════════════════════════════════
// WORKFLOWS & AUTOMATIONS API
// ════════════════════════════════════════════
app.get('/api/workflows', (req, res) => {
  db.all("SELECT * FROM workflows ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = (rows || []).map(r => ({
      ...r,
      actions: JSON.parse(r.actions_json || '[]')
    }));
    res.json(formatted);
  });
});

app.post('/api/workflows', (req, res) => {
  const { name, description, trigger_event, condition_rules, actions } = req.body;
  const actions_json = JSON.stringify(actions || []);

  db.run(
    `INSERT INTO workflows (name, description, trigger_event, condition_rules, actions_json, status, executions_count) VALUES (?, ?, ?, ?, ?, 'Ativo', 0)`,
    [name, description || '', trigger_event, condition_rules || '', actions_json],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID, name, description, trigger_event, condition_rules, actions, status: 'Ativo', executions_count: 0, created_at: new Date().toISOString()
      });
    }
  );
});

app.put('/api/workflows/:id/toggle', (req, res) => {
  db.get("SELECT status FROM workflows WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Workflow não encontrado.' });
    const newStatus = row.status === 'Ativo' ? 'Pausado' : 'Ativo';
    db.run("UPDATE workflows SET status = ?, updated_at = datetime('now') WHERE id = ?", [newStatus, req.params.id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true, status: newStatus });
    });
  });
});

app.delete('/api/workflows/:id', (req, res) => {
  db.run("DELETE FROM workflows WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// AUDIT LOGS API (Regra 13 — somente admin)
// ════════════════════════════════════════════
app.get('/api/audit-logs', (req, res) => {
  const role = req.authUser?.role;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Somente administradores podem visualizar logs de auditoria.' });
  }
  const logs = getAuditLogs(req.query);
  res.json(logs);
});

// ════════════════════════════════════════════
// HEALTH CHECK (Regra 9 — nunca expor internos)
// ════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ════════════════════════════════════════════
// AUTH ENDPOINTS (Login/Logout com auditoria)
// ════════════════════════════════════════════
app.post('/api/auth/login', (req, res) => {
  const { username } = req.body || {};
  createAuditLog({
    action: 'LOGIN_ATTEMPT',
    username: username || 'unknown',
    ip: req.ip,
    resource: '/api/auth/login',
    method: 'POST',
  });
  // Autenticação real deve ser feita no frontend via AuthContext
  res.json({ status: 'received' });
});

app.post('/api/auth/logout', (req, res) => {
  createAuditLog({
    action: 'LOGOUT',
    username: req.authUser?.username || 'unknown',
    ip: req.ip,
    resource: '/api/auth/logout',
    method: 'POST',
  });
  res.json({ status: 'logged_out' });
});

// ════════════════════════════════════════════
// LEADS (Landing Page Funnel)
// ════════════════════════════════════════════

// POST /api/leads — public route (no auth required for landing page)
app.post('/api/leads', (req, res) => {
  const { name, whatsapp, business_type, plan_interest, utm_source } = req.body || {};
  if (!name || !whatsapp) {
    return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios.' });
  }
  db.run(
    `INSERT INTO leads (name, whatsapp, business_type, plan_interest, utm_source) VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), whatsapp.trim(), business_type || '', plan_interest || '', utm_source || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// GET /api/leads — admin only
app.get('/api/leads', (req, res) => {
  if (req.authUser?.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });
  db.all('SELECT * FROM leads ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/leads/count-new — admin only (for badge)
app.get('/api/leads/count-new', (req, res) => {
  if (req.authUser?.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });
  db.get(`SELECT COUNT(*) as count FROM leads WHERE status='Novo'`, [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row?.count || 0 });
  });
});

// PUT /api/leads/:id — admin only
app.put('/api/leads/:id', (req, res) => {
  if (req.authUser?.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });
  const { status, notes, whatsapp_sent } = req.body || {};
  db.run(
    `UPDATE leads SET status=COALESCE(?,status), notes=COALESCE(?,notes), whatsapp_sent=COALESCE(?,whatsapp_sent) WHERE id=?`,
    [status, notes, whatsapp_sent, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// DELETE /api/leads/:id — admin only
app.delete('/api/leads/:id', (req, res) => {
  if (req.authUser?.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });
  db.run('DELETE FROM leads WHERE id=?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// AI CONVERSATION HISTORY (Lyra Memory)
// ════════════════════════════════════════════

// GET /api/ai/history/:userId — get last 40 messages for a user
app.get('/api/ai/history/:userId', (req, res) => {
  const userId = req.params.userId;
  db.all(
    `SELECT role, content, created_at FROM ai_conversations WHERE user_id=? ORDER BY created_at ASC LIMIT 40`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// DELETE /api/ai/history/:userId — clear history
app.delete('/api/ai/history/:userId', (req, res) => {
  db.run('DELETE FROM ai_conversations WHERE user_id=?', [req.params.userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// AI ASSISTANT CHAT API (OpenRouter Integration)
// ════════════════════════════════════════════
app.post('/api/ai/chat', async (req, res) => {
  const { messages, userId } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Lista de mensagens inválida.' });
  }

  try {
    // 1. Busca estatísticas do sistema para enriquecer o contexto
    const systemContext = await getSystemContext(db);

    // 2. Busca histórico persistido do usuário (se userId fornecido)
    let persistedHistory = [];
    if (userId) {
      persistedHistory = await new Promise((resolve) => {
        db.all(
          `SELECT role, content FROM ai_conversations WHERE user_id=? ORDER BY created_at ASC LIMIT 30`,
          [userId],
          (err, rows) => resolve(err ? [] : rows)
        );
      });
    }

    // 3. Chama a API do OpenRouter com histórico persistido
    const reply = await chatCompletion(messages, systemContext, persistedHistory);

    // 4. Salva a última mensagem do usuário e a resposta no histórico
    if (userId) {
      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg && lastUserMsg.role === 'user') {
        db.run(
          `INSERT INTO ai_conversations (user_id, role, content) VALUES (?, ?, ?)`,
          [userId, 'user', lastUserMsg.content]
        );
      }
      db.run(
        `INSERT INTO ai_conversations (user_id, role, content) VALUES (?, ?, ?)`,
        [userId, 'assistant', reply]
      );

      // Manter somente os últimos 100 registros por usuário para não inflar o banco
      db.run(
        `DELETE FROM ai_conversations WHERE user_id=? AND id NOT IN (SELECT id FROM ai_conversations WHERE user_id=? ORDER BY id DESC LIMIT 100)`,
        [userId, userId]
      );
    }

    // 5. Registrar auditoria do uso da IA
    createAuditLog({
      action: 'AI_ASSISTANT_QUERY',
      username: req.authUser?.username || 'user',
      ip: req.ip,
      resource: '/api/ai/chat',
      method: 'POST',
    });

    res.json({ reply });
  } catch (err) {
    console.error('[AI CHAT ERROR]', err.message);
    res.status(500).json({
      error: 'Não foi possível se comunicar com o assistente de IA no momento. Tente novamente em instantes.'
    });
  }
});

// ════════════════════════════════════════════
// MÓDULO EXCLUSIVO DE VENDAS & WEBHOOK DO SITE
// ════════════════════════════════════════════
app.get('/api/sales', (req, res) => {
  const { month, channel, status } = req.query;
  let query = 'SELECT * FROM sales WHERE 1=1';
  const params = [];

  if (month && month !== 'all') {
    query += ' AND month = ?';
    params.push(month);
  }
  if (channel && channel !== 'all') {
    query += ' AND channel = ?';
    params.push(channel);
  }
  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC, id DESC';
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/sales/stats', (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  Promise.all([
    new Promise((resolve, reject) =>
      db.get(`SELECT COUNT(*) as total_count, COALESCE(SUM(amount), 0) as total_revenue, AVG(amount) as avg_ticket FROM sales WHERE status != 'Cancelado'`, [], (e, r) => e ? reject(e) : resolve(r))
    ),
    new Promise((resolve, reject) =>
      db.get(`SELECT COUNT(*) as month_count, COALESCE(SUM(amount), 0) as month_revenue FROM sales WHERE month = ? AND status != 'Cancelado'`, [currentMonth], (e, r) => e ? reject(e) : resolve(r))
    ),
    new Promise((resolve, reject) =>
      db.all(`SELECT channel, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM sales WHERE status != 'Cancelado' GROUP BY channel`, [], (e, r) => e ? reject(e) : resolve(r || []))
    ),
    new Promise((resolve, reject) =>
      db.all(`SELECT payment_method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM sales WHERE status != 'Cancelado' GROUP BY payment_method`, [], (e, r) => e ? reject(e) : resolve(r || []))
    ),
    new Promise((resolve, reject) =>
      db.all(`SELECT month, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM sales WHERE status != 'Cancelado' GROUP BY month ORDER BY month ASC`, [], (e, r) => e ? reject(e) : resolve(r || []))
    )
  ]).then(([total, currentMonthStats, byChannel, byPaymentMethod, monthlyTimeline]) => {
    res.json({
      totalRevenue: total?.total_revenue || 0,
      totalCount: total?.total_count || 0,
      avgTicket: Math.round(total?.avg_ticket || 0),
      monthRevenue: currentMonthStats?.month_revenue || 0,
      monthCount: currentMonthStats?.month_count || 0,
      byChannel,
      byPaymentMethod,
      monthlyTimeline
    });
  }).catch(err => res.status(500).json({ error: err.message }));
});

// Lançamento manual de venda
app.post('/api/sales', (req, res) => {
  const { customer_name, customer_email, customer_phone, product_name, amount, cost, payment_method, notes, sync_finance } = req.body;
  const numAmount = parseFloat(amount) || 0;
  const numCost = parseFloat(cost) || 0;
  if (!customer_name || numAmount <= 0) {
    return res.status(400).json({ error: 'Nome do cliente e valor da venda são obrigatórios.' });
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const externalId = 'MAN-' + Date.now().toString().slice(-6);

  db.run(
    `INSERT INTO sales (customer_name, customer_email, customer_phone, product_name, amount, cost, payment_method, channel, status, notes, month, external_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Manual', 'Aprovado', ?, ?, ?)`,
    [customer_name, customer_email || '', customer_phone || '', product_name || 'Venda Direta', numAmount, numCost, payment_method || 'PIX', notes || '', currentMonth, externalId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const saleId = this.lastID;

      // Integração automática com o Financeiro
      if (sync_finance !== false) {
        db.run(
          `INSERT INTO transactions (description, amount, type, category, month, source_type, source_id)
           VALUES (?, ?, 'income', 'Sistemas', ?, 'sale_manual', ?)`,
          [`Venda #${saleId}: ${customer_name} (${product_name || 'Sistema'})`, numAmount, currentMonth, saleId]
        );
        if (numCost > 0) {
          db.run(
            `INSERT INTO transactions (description, amount, type, category, month, source_type, source_id)
             VALUES (?, ?, 'expense', 'Custo de Venda', ?, 'sale_cost', ?)`,
            [`Custo: ${customer_name} (${product_name || 'Sistema'})`, numCost, currentMonth, saleId]
          );
        }
      }

      res.json({
        id: saleId,
        customer_name,
        amount: numAmount,
        cost: numCost,
        external_id: externalId,
        status: 'Aprovado',
        channel: 'Manual',
        month: currentMonth
      });
    }
  );
});

// Webhook para automação direta do site / checkout (Stripe, Hotmart, Kiwify, Mercado Pago, WooCommerce, etc)
app.post('/api/sales/webhook', (req, res) => {
  const payload = req.body || {};
  // Mapear campos comuns de gateways ou receber formato padronizado do site
  const customer_name = payload.customer_name || payload.name || payload.client_name || payload.buyer_name || 'Cliente Online';
  const customer_email = payload.customer_email || payload.email || payload.buyer_email || '';
  const customer_phone = payload.customer_phone || payload.phone || payload.whatsapp || '';
  const product_name = payload.product_name || payload.product || payload.item_name || 'Assinatura Solution Math';
  const amount = parseFloat(payload.amount || payload.total || payload.value || payload.price || 0);
  const payment_method = payload.payment_method || payload.gateway || payload.payment_type || 'Cartão';
  const external_id = payload.external_id || payload.order_id || payload.transaction_id || ('WEB-' + Date.now().toString().slice(-6));
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (amount <= 0) {
    return res.status(400).json({ error: 'Valor da venda precisa ser maior que zero.' });
  }

  db.run(
    `INSERT INTO sales (customer_name, customer_email, customer_phone, product_name, amount, payment_method, channel, status, notes, month, external_id)
     VALUES (?, ?, ?, ?, ?, ?, 'Site / Webhook', 'Aprovado', ?, ?, ?)`,
    [customer_name, customer_email, customer_phone, product_name, amount, payment_method, 'Venda recebida via automação / webhook do site', currentMonth, external_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const saleId = this.lastID;

      // Auto-integração com fluxo financeiro
      db.run(
        `INSERT INTO transactions (description, amount, type, category, month, source_type, source_id)
         VALUES (?, ?, 'income', 'Sistemas', ?, 'sale_webhook', ?)`,
        [`Venda Online #${external_id}: ${customer_name} (${product_name})`, amount, currentMonth, saleId]
      );

      console.log(`[SALES WEBHOOK] Nova venda registrada com sucesso: #${saleId} - R$ ${amount} (${customer_name})`);
      res.json({
        success: true,
        message: 'Venda registrada e integrada ao financeiro com sucesso!',
        sale_id: saleId,
        external_id
      });
    }
  );
});

// Excluir venda (com remoção em cascata no financeiro)
app.delete('/api/sales/:id', (req, res) => {
  const saleId = req.params.id;
  db.run(
    `DELETE FROM transactions WHERE (source_type = 'sale_manual' OR source_type = 'sale_webhook') AND source_id = ?`,
    [saleId],
    (err) => {
      if (err) console.error('[SALES DELETE] Erro ao excluir transação vinculada:', err);
      db.run(`DELETE FROM sales WHERE id = ?`, [saleId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true });
      });
    }
  );
});

// ════════════════════════════════════════════
// CONFIGURAÇÃO DE METAS (Anual e Mensal)
// ════════════════════════════════════════════
app.get('/api/settings/target', (req, res) => {
  db.all("SELECT key, value FROM company_settings WHERE key IN ('annual_target_2026', 'monthly_target_2026')", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const settingsMap = {};
    (rows || []).forEach(r => { settingsMap[r.key] = r.value; });
    const annual_target = parseFloat(settingsMap['annual_target_2026']) || 500000;
    const monthly_target = parseFloat(settingsMap['monthly_target_2026']) || 45000;
    res.json({ annual_target, monthly_target });
  });
});

app.put('/api/settings/target', (req, res) => {
  const { annual_target, monthly_target } = req.body;
  const numAnnual = parseFloat(annual_target);
  const numMonthly = parseFloat(monthly_target);

  const updates = [];
  if (!isNaN(numAnnual) && numAnnual > 0) {
    updates.push(['annual_target_2026', String(numAnnual)]);
  }
  if (!isNaN(numMonthly) && numMonthly > 0) {
    updates.push(['monthly_target_2026', String(numMonthly)]);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Informe ao menos uma meta válida (anual ou mensal).' });
  }

  const stmt = db.prepare(`
    INSERT INTO company_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  updates.forEach(([k, v]) => stmt.run(k, v));
  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      success: true,
      annual_target: !isNaN(numAnnual) ? numAnnual : undefined,
      monthly_target: !isNaN(numMonthly) ? numMonthly : undefined
    });
  });
});

// 404 handler — nunca revelar estrutura interna (Regra 3)
app.use((req, res) => {
  res.status(404).json({ error: 'Recurso n\u00e3o encontrado.' });
});

// Error handler — nunca vazar stack traces (Regra 3)
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(port, () => console.log(`Solution Math OS Backend running on http://localhost:${port}`));
