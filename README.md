# 🚀 Solution Math OS 3.0 — Sistema Operacional Empresarial (ERP + CRM + Lojas & PDV)

Sistema Operacional Empresarial completo focado em pequenos e médios comércios brasileiros. Une CRM, Financeiro, Estoque, PDV, RH, Agenda e Produtos em uma única plataforma integrada com suporte a tema Claro e Escuro.

---

## 📑 SUMÁRIO

1. [Visão Geral & Módulos](#-visão-geral--módulos)
2. [Estrutura do Repositório](#-estrutura-do-repositório)
3. [Tecnologias Utilizadas](#-tecnologias-utilizadas)
4. [Como Rodar Localmente](#-como-rodar-localmente)
5. [Sistema de Autenticação (MVP)](#-sistema-de-autenticação-mvp)
6. [Instruções para Deploy em Produção](#-instruções-para-deploy-em-produção)
7. [Estratégia Comercial & Precificação](#-estratégia-comercial--precificação)

---

## 🌐 VISÃO GERAL & MÓDULOS

- **Landing Page Pública (`/`)**: Página institucional moderna com design Azul + Branco, 14 seções, tabela de planos, comparativos, FAQ e formulário de demonstração.
- **Autenticação (`/login`)**: Login com feedback visual, persistência de sessão e suporte a múltiplos papéis (Admin / Cliente).
- **Dashboard Executivo (OS 1.0 & OS 3.0 Enterprise - `/app`)**:
  - **CRM & Pipeline Deals**: Kanban interativo de negociações e gestão de leads.
  - **Financeiro Completo**: DRE, Fluxo de caixa, relatórios e previsibilidade anual de faturamento.
  - **Módulo Lojas & PDV**: Ponto de venda de caixa com baixa automática no estoque e lançamento automático de receita no financeiro.
  - **Estoque & Produtos**: Cadastro de produtos, calculadora de ticket médio e margem por item.
  - **Agenda de Operações**: Calendário operacional completo do ano.
  - **Equipe (RH)**: Gestão de colaboradores e departamentos.

---

## 📁 ESTRUTURA DO REPOSITÓRIO

```
D:\MVPS ANTIGRAVITY\solution-math-os/
├── server/                         # Backend REST API Node.js / Express
│   ├── database.sqlite             # Banco de dados SQLite relacional
│   ├── index.js                    # Endpoints REST e inicialização das tabelas
│   └── package.json                # Dependências do servidor
├── src/                            # Frontend React + TypeScript
│   ├── components/                 # Componentes reutilizáveis dos módulos
│   │   ├── AgendaCalendarView.tsx  # Agenda de operações
│   │   ├── CEODashboard.tsx        # Dashboard executivo principal
│   │   ├── CRMKanban.tsx           # Pipeline de vendas Drag & Drop
│   │   ├── CRMView.tsx             # Tabela e gestão de leads
│   │   ├── DepartmentWindow.tsx    # Janelas flutuantes do OS
│   │   ├── FinancialDashboard.tsx  # Painel financeiro completo
│   │   ├── HRView.tsx              # Gestão de equipe RH
│   │   ├── OS2Shell.tsx            # Shell do OS 3.0 Enterprise (Sidebar)
│   │   ├── OSShell.tsx             # Shell do OS 1.0 (Desktop)
│   │   ├── ProductsView.tsx        # Cadastro de produtos e margem
│   │   ├── StoreDashboard.tsx      # Dashboard do módulo Lojas
│   │   ├── StoreInventory.tsx      # Controle de estoque de loja
│   │   ├── StoreOrders.tsx         # Histórico de pedidos do PDV
│   │   ├── StorePDV.tsx            # Ponto de venda (Caixa)
│   │   ├── StoreProducts.tsx       # Produtos do catálogo de lojas
│   │   ├── StoreShell.tsx          # Wrapper do módulo Lojas
│   │   ├── Taskbar.tsx             # Barra de tarefas flutuante
│   │   ├── TasksView.tsx           # Gestão de tarefas da equipe
│   │   └── ThemeToggle.tsx         # Alternador de tema Claro / Escuro
│   ├── contexts/                   # Contextos globais React
│   │   ├── AuthContext.tsx         # Autenticação MVP (admin / cliente)
│   │   └── ThemeContext.tsx        # Estado e persistência de tema
│   ├── pages/                      # Páginas da aplicação
│   │   ├── LandingPage.tsx         # Página principal de vendas (Blue/White theme)
│   │   └── LoginPage.tsx           # Tela de login dark/glass
│   ├── App.tsx                     # Roteamento central com React Router (v7)
│   ├── main.tsx                    # Ponto de entrada React com Providers
│   └── index.css                   # Sistema de Design Tokens CSS e utilitários
├── public/                         # Assets estáticos
├── package.json                    # Dependências do projeto Frontend
├── tailwind.config.js              # Configuração do Tailwind CSS
└── vite.config.ts                  # Configuração do Vite
```

---

## 🛠️ TECNOLOGIAS UTILIZADAS

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, @dnd-kit (Kanban), React Router DOM v7.
- **Backend**: Node.js, Express, SQLite (`sqlite3`).

---

## ⚡ COMO RODAR LOCALMENTE

### 1. Iniciar o Backend (Porta 3001)
```bash
cd server
npm install
node index.js
```

### 2. Iniciar o Frontend (Porta 5173)
Em um novo terminal na raiz do projeto:
```bash
npm install
npm run dev
```

Acesse no navegador: **`http://localhost:5173`**

---

## 🔑 SISTEMA DE AUTENTICAÇÃO (MVP)

- **Acesso Administrador**:
  - **Usuário**: `admin`
  - **Senha**: `Admin@123`
- **Acesso Cliente Demo**:
  - **Usuário**: `cliente`
  - **Senha**: `Cliente@123`

---

## 🌐 INSTRUÇÕES PARA DEPLOY EM PRODUÇÃO

### Opção A: Servidor VPS Linux (Ubuntu / PM2 + Nginx)
1. **Compilar o Frontend**:
   ```bash
   npm run build
   ```
   *Os arquivos compilados estarão na pasta `dist/`.*
2. **Rodar o Backend em segundo plano**:
   ```bash
   cd server
   pm2 start index.js --name "smos-backend"
   ```
3. **Configurar o Nginx** para servir a pasta `dist/` no seu domínio e fazer proxy das requisições `/api` para a porta 3001.

### Opção B: Vercel / Render / Railway
- **Frontend (Vercel)**: Apontar repositório Git, usar comando de build `npm run build` e pasta de saída `dist`.
- **Backend (Render / Railway)**: Apontar pasta `/server` e executar `node index.js`.

---

## 💰 ESTRATÉGIA COMERCIAL & PRECIFICAÇÃO

- **Plano Start**: R$ 197/mês (+ Taxa de implantação R$ 697)
- **Plano Growth ⭐ (Mais Popular)**: R$ 347/mês (+ Taxa de implantação R$ 997 / **GRÁTIS no Anual**)
- **Plano Enterprise**: A partir de R$ 799/mês (Projeto sob medida)
- **Garantia**: 7 dias de garantia incondicional em todos os planos.
