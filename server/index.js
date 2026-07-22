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
    [name||null, role||null, email||null, phone||null, contract_type||null, salary||null, status||null, req.params.id],
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
  db.all("SELECT * FROM clients", [], (err, rows) => {
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
// DEALS (Kanban CRM)
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
  db.run(
    `INSERT INTO deals (title,client_id,value,stage,assignee_id,notes) VALUES (?,?,?,?,?,?)`,
    [title, client_id||null, value||0, stage||'Novo Lead', assignee_id||null, notes||''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, client_id, value, stage: stage||'Novo Lead', assignee_id, notes });
    }
  );
});
app.put('/api/deals/:id', (req, res) => {
  const { stage, value, notes } = req.body;
  db.run(`UPDATE deals SET stage=COALESCE(?,stage), value=COALESCE(?,value), notes=COALESCE(?,notes) WHERE id=?`,
    [stage||null, value||null, notes||null, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});
app.delete('/api/deals/:id', (req, res) => {
  db.run(`DELETE FROM deals WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════
// FINANCE
// ════════════════════════════════════════════
app.get('/api/finance/summary', (req, res) => {
  db.all(`SELECT
    SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN type='income' THEN amount ELSE -amount END) as net_profit
    FROM transactions`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows[0]);
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
  db.all(`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/finance/transactions', (req, res) => {
  const { description, amount, type, category, month } = req.body;
  db.run(`INSERT INTO transactions (description,amount,type,category,month) VALUES (?,?,?,?,?)`,
    [description, amount, type, category, month], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, description, amount, type, category, month });
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

app.listen(port, () => console.log(`Solution Math OS Backend running on http://localhost:${port}`));
