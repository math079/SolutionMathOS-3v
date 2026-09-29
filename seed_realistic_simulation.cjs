const db = require('./server/db');

console.log('Populando dados realistas de demonstração B2B & Logística...');

db.serialize(() => {
  const currentMonth = '2026-09';
  const prevMonth1 = '2026-08';
  const prevMonth2 = '2026-07';

  // 1. CLIENTES B2B REAIS (CADASTRO CORPORATIVO)
  const clientsData = [
    ['Braspress Transportes Urgentes Ltda', 'Braspress S/A', 'diretoria@braspress.com.br', '(11) 3478-2000', 'Indicação Associação Comercial', 'Transportadora nacional de cargas fracionadas. 45 filiais.', 'Ativo'],
    ['Jadlog Logística e Encomendas', 'Jadlog S/A', 'comercial@jadlog.com.br', '(11) 3977-8000', 'Outbound B2B', 'Operador logístico e-commerce e entregas expressas.', 'Ativo'],
    ['Grupo GPS Soluções e Facilities', 'GPS Serviços Ltda', 'suprimentos@grupogps.com.br', '(11) 3145-6000', 'Inbound Site', 'Líder em facilities, segurança e logística interna.', 'Ativo'],
    ['Stefanini Consultoria e TI', 'Stefanini IT Solutions', 'parcerias@stefanini.com', '(11) 3045-8800', 'LinkedIn B2B', 'Multinacional de tecnologia e outsourcing.', 'Ativo'],
    ['Patrus Transportes Urgentes', 'Patrus Logística', 'contato@patrus.com.br', '(31) 2191-1000', 'Parceria Logística', 'Transportadora especializada no Sudeste e Nordeste.', 'Ativo'],
    ['Hospital Santa Luzia / Rede D\'Or', 'Rede D\'Or São Luiz', 'compras@rededor.com.br', '(61) 3445-6000', 'Indicação Diretoria', 'Complexo hospitalar privado de alta complexidade.', 'Ativo'],
    ['Rede de Clínicas OdontoCompany', 'OdontoCompany Franchising', 'expansao@odontocompany.com.br', '(17) 3214-8800', 'Google Ads', 'Maior rede de clínicas odontológicas da América Latina.', 'Ativo'],
    ['Distribuidora Aurora Alimentos', 'Aurora Coop', 'b2b@auroraalimentos.com.br', '(49) 3321-3000', 'Inbound Site', 'Cooperativa agroindustrial de alimentos e logística fria.', 'Ativo'],
    ['Jamef Encomendas Urgentes', 'Jamef Transportes', 'operacoes@jamef.com.br', '(31) 2102-8800', 'Associação Comercial', 'Transporte aéreo e rodoviário de cargas de alto valor.', 'Ativo'],
    ['MRV Engenharia & Participações', 'MRV S/A', 'ti.corporativa@mrv.com.br', '(31) 3615-7000', 'Indicação C-Level', 'Maior construtora da América Latina.', 'Ativo']
  ];

  db.run("DELETE FROM clients");
  const insertClient = db.prepare(`INSERT INTO clients (name, company, email, phone, source, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  clientsData.forEach(c => insertClient.run(c));
  insertClient.finalize();
  console.log(`✓ 10 Clientes Corporativos B2B cadastrados`);

  // 2. FUNIL DE LEADS DA LANDING PAGE / SITE (leads table)
  const leadsData = [
    ['Carlos Eduardo Mendes', '11985421099', 'Distribuidora', 'Enterprise', 'Novo', 0, 'Quer automatizar emissão de manifesto e integrar 12 filiais', 'Google Ads B2B', '2026-09-28 14:22:00'],
    ['Fernanda Vasconcelos', '11976214433', 'Materiais de Construção', 'Enterprise', 'Qualificado', 1, 'Agendada demonstração para quarta-feira às 15h', 'Associação Comercial', '2026-09-27 10:15:00'],
    ['Dr. Henrique Guimarães', '31998125544', 'Outro comércio', 'Growth', 'Contactado', 1, 'Rede de 3 clínicas querendo controlar custos operacionais', 'Instagram Ads', '2026-09-26 18:40:00'],
    ['Marcelo Alcantara', '41991238877', 'Distribuidora', 'Enterprise', 'Convertido', 1, 'Fechou plano Enterprise com módulo de logística', 'Indicação de Cliente', '2026-09-24 11:30:00'],
    ['Juliana Prado Faria', '21988456622', 'Papelaria', 'Growth', 'Qualificado', 1, 'Distribuidora de materiais corporativos com 15 vendedores', 'Google Orgânico', '2026-09-28 09:10:00'],
    ['Rodrigo Silveira Ramos', '11993321155', 'Autopeças', 'Enterprise', 'Novo', 0, 'Transportadora com 22 carretas querendo CT-e e MDF-e', 'LinkedIn', '2026-09-29 11:05:00'],
    ['Beatriz Albuquerque', '19982447788', 'Mercado / Mercearia', 'Start', 'Contactado', 1, 'Supermercado regional buscando controle financeiro', 'Site Direto', '2026-09-25 16:00:00'],
    ['Luciano Siqueira', '31987552211', 'Distribuidora', 'Enterprise', 'Novo', 0, 'Distribuidora de medicamentos no atacado', 'Associação Comercial', '2026-09-29 14:18:00']
  ];

  db.run("DELETE FROM leads");
  const insertLead = db.prepare(`INSERT INTO leads (name, whatsapp, business_type, plan_interest, status, whatsapp_sent, notes, utm_source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  leadsData.forEach(l => insertLead.run(l));
  insertLead.finalize();
  console.log(`✓ 8 Leads realistas da Landing Page cadastrados`);

  // 3. VENDAS REALISTAS COM CUSTO DE EXECUÇÃO ALOCADO
  // Limpa vendas anteriores para deixar limpo e profissional
  db.run("DELETE FROM sales");
  db.run("DELETE FROM transactions WHERE source_type IN ('sale_manual', 'sale_cost', 'deal')");

  const salesData = [
    {
      customer_name: 'Braspress Transportes Urgentes',
      customer_email: 'financeiro@braspress.com.br',
      customer_phone: '(11) 3478-2000',
      product_name: 'Solution Math OS — Licença Enterprise + Módulo Logística',
      amount: 85000,
      cost: 16500, // Custo de implantação/infraestrutura
      payment_method: 'TED / Pix PJ',
      channel: 'Parceria Associação Comercial',
      status: 'Aprovado',
      notes: 'Implantação em 45 postos operacionais. Inclui integração CT-e/MDF-e.',
      month: '2026-09',
      external_id: 'ENT-2026-881'
    },
    {
      customer_name: 'Grupo GPS Soluções Corporativas',
      customer_email: 'contas@grupogps.com.br',
      customer_phone: '(11) 3145-6000',
      product_name: 'Solution Math OS — Gestão de 40 Colaboradores + RH Comissões',
      amount: 120000,
      cost: 22000,
      payment_method: 'Boleto Bancário',
      channel: 'Outbound B2B',
      status: 'Aprovado',
      notes: 'Contrato corporativo anual. Módulo de incentivos e PLR para diretores.',
      month: '2026-09',
      external_id: 'ENT-2026-882'
    },
    {
      customer_name: 'Stefanini Consultoria e TI',
      customer_email: 'fiscal@stefanini.com',
      customer_phone: '(11) 3045-8800',
      product_name: 'Solution Math OS — Cockpit Executivo & BI de Margem',
      amount: 65000,
      cost: 12000,
      payment_method: 'TED / Pix PJ',
      channel: 'Inbound Site',
      status: 'Aprovado',
      notes: 'Customização de dashboards e controle de teto de verbas por setor.',
      month: '2026-09',
      external_id: 'ENT-2026-883'
    },
    {
      customer_name: 'Patrus Transportes Urgentes',
      customer_email: 'adm@patrus.com.br',
      customer_phone: '(31) 2191-1000',
      product_name: 'Solution Math OS — Plataforma de Previsibilidade de Caixa',
      amount: 95000,
      cost: 18000,
      payment_method: 'Boleto Bancário',
      channel: 'Indicação C-Level',
      status: 'Aprovado',
      notes: 'Gestão de fluxo de caixa preditivo e ponto de equilíbrio.',
      month: '2026-09',
      external_id: 'ENT-2026-884'
    },
    {
      customer_name: 'Rede OdontoCompany Clínicas',
      customer_email: 'franquias@odontocompany.com.br',
      customer_phone: '(17) 3214-8800',
      product_name: 'Solution Math OS — Growth (3 Licenças Regionais)',
      amount: 42000,
      cost: 7500,
      payment_method: 'Cartão de Crédito PJ',
      channel: 'Google Ads',
      status: 'Aprovado',
      notes: 'Implantação rápida com importação de 8.000 clientes via Excel.',
      month: '2026-09',
      external_id: 'GRO-2026-501'
    },
    {
      customer_name: 'Distribuidora Aurora Alimentos',
      customer_email: 'controladoria@auroraalimentos.com.br',
      customer_phone: '(49) 3321-3000',
      product_name: 'Solution Math OS — Enterprise Anual + Suporte 24/7',
      amount: 110000,
      cost: 19500,
      payment_method: 'TED / Pix PJ',
      channel: 'Inbound Site',
      status: 'Aprovado',
      notes: 'Controle de custos fixos e variáveis com sincronização contábil.',
      month: '2026-08',
      external_id: 'ENT-2026-775'
    },
    {
      customer_name: 'Hospital Santa Luzia / Rede D\'Or',
      customer_email: 'faturamento@rededor.com.br',
      customer_phone: '(61) 3445-6000',
      product_name: 'Solution Math OS — Customização Hospitalar e Helpdesk',
      amount: 135000,
      cost: 25000,
      payment_method: 'Boleto Bancário',
      channel: 'Indicação Diretoria',
      status: 'Aprovado',
      notes: 'Módulo de Helpdesk com 10 atendentes e relatórios executivos em PDF.',
      month: '2026-08',
      external_id: 'ENT-2026-776'
    }
  ];

  salesData.forEach(s => {
    db.run(
      `INSERT INTO sales (customer_name, customer_email, customer_phone, product_name, amount, cost, payment_method, channel, status, notes, month, external_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.customer_name, s.customer_email, s.customer_phone, s.product_name, s.amount, s.cost, s.payment_method, s.channel, s.status, s.notes, s.month, s.external_id],
      function(err) {
        if (!err && this.lastID) {
          const saleId = this.lastID;
          // Registra receita no financeiro
          db.run(
            `INSERT INTO transactions (description, amount, type, category, month, cost_type, department, source_type, source_id)
             VALUES (?, ?, 'income', 'Sistemas', ?, 'variable', 'Comercial & Vendas', 'sale_manual', ?)`,
            [`Venda #${saleId}: ${s.customer_name} (${s.product_name})`, s.amount, s.month, saleId]
          );
          // Registra custo no financeiro
          if (s.cost > 0) {
            db.run(
              `INSERT INTO transactions (description, amount, type, category, month, cost_type, department, source_type, source_id)
               VALUES (?, ?, 'expense', 'Custo de Venda', ?, 'variable', 'Operações & Entrega', 'sale_cost', ?)`,
              [`Custo Execução #${saleId}: ${s.customer_name}`, s.cost, s.month, saleId]
            );
          }
        }
      }
    );
  });
  console.log(`✓ 7 Vendas Enterprise de alto valor cadastradas e sincronizadas ao Financeiro`);

  // 4. CRM DEALS (PIPELINE KANBAN ESTRATÉGICO)
  db.run("DELETE FROM deals");
  const dealsData = [
    ['Jamef Encomendas — Implantação Enterprise + MDF-e', 9, 110000, 'Novo Lead', 6, 'Interesse forte no manifesto eletrônico para 35 caminhões.'],
    ['Loggi Tecnologia — Automação de Comissões e Vendas', 2, 78000, 'Novo Lead', 6, 'Apresentado pitch inicial. Querem agendar demo técnica.'],
    ['Sonda IT — Sistema de Gestão Operacional & Tarefas OS', 4, 90000, 'Qualificação', 6, 'Time de operações avaliando substituição de sistema antigo.'],
    ['MRV Participações — Orçamento C-Level por Departamento', 10, 145000, 'Proposta Enviada', 5, 'Proposta comercial enviada para o Diretor Financeiro (CFO).'],
    ['Directlog — Previsibilidade de Caixa e Simulador', 2, 88000, 'Negociação', 5, 'Em ajustes finais de minutas contratuais. Fechamento previsto para quinta-feira.'],
    ['Braspress Transportes — Licença Enterprise Nacional', 1, 85000, 'Ganho', 5, 'Contrato assinado e primeira parcela liquidada.'],
    ['Grupo GPS Soluções — Gestão de Equipe e Comissões', 3, 120000, 'Ganho', 6, 'Contrato anual fechado com sucesso.'],
    ['Stefanini Consultoria — BI Executivo e Margem', 4, 65000, 'Ganho', 5, 'Implantado com sucesso via importação de dados por Excel.']
  ];

  const insertDeal = db.prepare(`INSERT INTO deals (title, client_id, value, stage, assignee_id, notes) VALUES (?, ?, ?, ?, ?, ?)`);
  dealsData.forEach(d => insertDeal.run(d));
  insertDeal.finalize();
  console.log(`✓ 8 Negócios (Deals) cadastrados no CRM Pipeline`);

  // 5. ATUALIZAR CATÁLOGO DE PRODUTOS COM TICKETS REALISTAS
  db.run("DELETE FROM products");
  const productsData = [
    ['Solution Math OS — Licença Start (Anual)', 4680, 750, 3930, 'Software SaaS', 'Plano essencial para pequenas operações e prestadores autônomos'],
    ['Solution Math OS — Licença Growth (Anual)', 10680, 1800, 8880, 'Software SaaS', 'Plano completo com RH, Comissões automáticas e Previsibilidade'],
    ['Solution Math OS — Licença Enterprise (Anual)', 16800, 2400, 14400, 'Software SaaS', 'Plano corporativo com emissor fiscal ilimitado e PLR de sócios'],
    ['Pacote Setup & Implantação VIP Express (48h)', 8500, 1500, 7000, 'Serviço de Implantação', 'Parametrização, migração de dados antigos via Excel e treinamento executivo'],
    ['Módulo de Logística Avançada (CT-e + MDF-e)', 12000, 2200, 9800, 'Add-on Corporativo', 'Automação de manifestos de transporte e conhecimentos de frete'],
    ['Agente IA Lyra Executivo Dedicado', 6000, 900, 5100, 'Inteligência Artificial', 'Assistente executivo com leitura em tempo real de banco de dados e caixa']
  ];

  const insertProd = db.prepare(`INSERT INTO products (name, ticket_price, cost, profit, category, description) VALUES (?, ?, ?, ?, ?, ?)`);
  productsData.forEach(p => insertProd.run(p));
  insertProd.finalize();
  console.log(`✓ 6 Produtos & Planos de alto ticket cadastrados no catálogo`);

  // 6. ATUALIZAR CONTAS DE CAIXA PARA VALORES REALISTAS DE MÉDIA EMPRESA
  db.run(`UPDATE financial_accounts SET balance = 148500, target_amount = 120000 WHERE type = 'operational'`);
  db.run(`UPDATE financial_accounts SET balance = 95000, target_amount = 100000 WHERE type = 'working_capital'`);
  db.run(`UPDATE financial_accounts SET balance = 82000, target_amount = 80000 WHERE type = 'emergency_reserve'`);
  db.run(`UPDATE financial_accounts SET balance = 65000, target_amount = 60000 WHERE type = 'investment_fund'`);
  console.log(`✓ Contas bancárias e reservas de caixa atualizadas para patamar corporativo`);

  setTimeout(() => {
    console.log('🎉 TODOS OS DADOS REALISTAS FORAM POPULADOS COM SUCESSO!');
    process.exit(0);
  }, 1000);
});
