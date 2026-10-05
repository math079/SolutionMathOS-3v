const db = require('./server/db');

db.serialize(() => {
  db.run("UPDATE users SET name = 'Matheus Saraiva', role = 'CEO & Fundador', email = 'matheus@solutionmath.com' WHERE id = 5 OR role LIKE '%CEO%'", function(err) {
    if (err) console.error(err);
    else console.log('✓ Usuário atualizado para Matheus Saraiva:', this.changes, 'linha(s)');
  });

  db.run("UPDATE financial_budgets SET notes = replace(notes, 'João CEO', 'Matheus Saraiva (CEO)')", function(err) {
    if (err) console.error(err);
    else console.log('✓ Orçamentos atualizados:', this.changes, 'linha(s)');
  });

  db.all("SELECT id, name, role, email FROM users", [], (err, rows) => {
    console.log('Equipe atualizada:', rows);
    process.exit(0);
  });
});
