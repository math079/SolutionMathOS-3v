# Solution Math OS

## Visão Geral
Sistema Operacional Corporativo da Solution Math — plataforma de gestão empresarial com interface estilo OS.

## Tecnologias
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **Gráficos**: Recharts
- **Drag & Drop**: @dnd-kit
- **Ícones**: Lucide React

## Estrutura do Projeto
```
solution-math-os/
├── src/                    # Frontend React
│   ├── components/         # Componentes do sistema
│   │   ├── OSShell.tsx     # Shell principal (OS 1)
│   │   ├── OS2Shell.tsx    # Shell avançado (OS 2)
│   │   ├── CEODashboard.tsx
│   │   ├── DepartmentWindow.tsx
│   │   ├── Taskbar.tsx
│   │   ├── CRMView.tsx     # CRM com leads
│   │   ├── CRMKanban.tsx   # Pipeline Kanban (Bitrix-style)
│   │   ├── FinancialDashboard.tsx
│   │   ├── TasksView.tsx
│   │   └── HRView.tsx
│   ├── data/
│   │   └── structure.ts    # Estrutura organizacional
│   └── App.tsx
├── server/                 # Backend Node.js
│   ├── index.js            # API Express
│   ├── db.js               # Configuração SQLite
│   └── uploads/            # Arquivos enviados
└── public/
```

## Como Rodar

### Backend (Porta 3001)
```bash
cd server
node index.js
```

### Frontend (Porta 5173)
```bash
npm run dev
```

## Módulos
- **OS 1** — Interface de janelas flutuantes (home)
- **OS 2** — Modo avançado com sidebar (Financeiro, CRM Kanban, RH, Tarefas)
- **Dashboard Financeiro** — Gráficos de receita, ROI, análise de investimento
- **CRM Pipeline** — Kanban arrastável estilo Bitrix24
- **Gestão de Equipe** — Cadastro de funcionários vinculados às tarefas
