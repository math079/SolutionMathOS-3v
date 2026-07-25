const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ════════════════════════════════════════════
// USERS (RH)
// ════════════════════════════════════════════
app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { name, role, email, phone, contract_type, salary, status, hired_at } = req.body;
  db.run(
    `INSERT INTO users (name, role, email, phone, contract_type, salary, status, hired_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      role || 'Colaborador',
      email || '',
      phone || '',
      contract_type || 'PJ',
      parseFloat(salary) || 0,
      status || 'Ativo',
      hired_at || new Date().toISOString().split('T')[0]
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID, name, role, email, phone, contract_type,
        salary: parseFloat(salary) || 0, status: status || 'Ativo', hired_at
      });
    }
  );
});

app.put('/api/users/:id', (req, res) => {
  const { name, role, email, phone, contract_type, salary, status } = req.body;
  db.run(
    `UPDATE users SET
      name = COALESCE(?, name),
      role = COALESCE(?, role),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      contract_type = COALESCE(?, contract_type),
      salary = COALESCE(?, salary),
      status = COALESCE(?, status)
     WHERE id = ?`,
    [name||null, role||null, email||null, phone||null, contract_type||null, salary !== undefined ? parseFloat(salary) : null, status||null, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/users/:id', (req, res) => {
  db.run(`DELETE FROM users WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
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
  const currentMonth = '2026-07';

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
  const currentMonth = '2026-07';

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

        // Auto-sync: If stage changed to 'Ganho' (and wasn't Ganho before)
        if (finalStage === 'Ganho' && prevStage !== 'Ganho' && finalValue > 0) {
          db.run(
            `INSERT INTO transactions (description, amount, type, category, month) VALUES (?, ?, 'income', 'Sistemas', ?)`,
            [`Venda CRM: ${deal.title}`, finalValue, currentMonth]
          );
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
  db.run(`INSERT INTO transactions (description,amount,type,category,month) VALUES (?,?,?,?,?)`,
    [description, parseFloat(amount)||0, type||'income', category||'Sistemas', month||'2026-07'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, description, amount: parseFloat(amount)||0, type, category, month });
    }
  );
});

app.put('/api/finance/transactions/:id', (req, res) => {
  const { description, amount, type, category, month } = req.body;
  db.run(
    `UPDATE transactions SET
      description = COALESCE(?, description),
      amount = COALESCE(?, amount),
      type = COALESCE(?, type),
      category = COALESCE(?, category),
      month = COALESCE(?, month)
     WHERE id = ?`,
    [description||null, amount !== undefined ? parseFloat(amount) : null, type||null, category||null, month||null, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/finance/transactions/:id', (req, res) => {
  db.run(`DELETE FROM transactions WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
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
  const currentMonth = '2026-07';
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

app.listen(port, () => console.log(`Solution Math OS Backend running on http://localhost:${port}`));
